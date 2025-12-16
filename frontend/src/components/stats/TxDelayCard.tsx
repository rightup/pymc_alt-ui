'use client';

import { useMemo } from 'react';
import { Timer } from 'lucide-react';
import type { Stats } from '@/types/api';

export interface TxDelayCardProps {
  stats: Stats | null;
}

/**
 * Calculate recommended TX delay factors based on network stats.
 * 
 * Based on the txdelay.py calculator logic:
 * - Higher duplicate rate => increase tx_delay_factor
 * - Higher TX utilization => increase tx_delay_factor
 * - More zero-hop neighbors => can use lower delays
 */
function calculateTxDelays(stats: Stats | null): {
  txDelayFactor: number;
  directTxDelayFactor: number;
  duplicateRate: number;
  txUtilization: number;
  zeroHopCount: number;
} {
  if (!stats) {
    return {
      txDelayFactor: 1.0,
      directTxDelayFactor: 0.5,
      duplicateRate: 0,
      txUtilization: 0,
      zeroHopCount: 0,
    };
  }

  // Count duplicates from duplicate_cache_size (approximate)
  // In the real script, this would come from specific flood packet counts
  const rxCount = stats.rx_count || 1;
  const droppedCount = stats.dropped_count || 0;
  
  // Estimate duplicate rate from dropped packets (most drops are duplicates)
  // This is an approximation since we don't have route-specific counts
  const duplicateRate = (droppedCount / (rxCount + droppedCount)) * 100;
  
  // TX utilization = airtime used / uptime
  const uptimeMs = (stats.uptime_seconds || 1) * 1000;
  const airtimeUsedMs = stats.total_airtime_ms || stats.airtime_used_ms || 0;
  const txUtilization = (airtimeUsedMs / uptimeMs) * 100;
  
  // Count zero-hop neighbors (direct links)
  const neighbors = stats.neighbors || {};
  const zeroHopCount = Object.values(neighbors).filter(n => n.zero_hop === true).length;
  
  // Base factors from config (if available)
  const configTxDelay = stats.config?.delays?.tx_delay_factor ?? 1.0;
  const configDirectDelay = stats.config?.delays?.direct_tx_delay_factor ?? 0.5;
  
  // Calculate recommended tx_delay_factor
  // Start with a base value and adjust based on metrics
  let txDelayFactor = 0.8; // Start conservative
  
  // Adjust based on duplicate rate
  // Target: 5-8% duplicate rate
  if (duplicateRate < 3) {
    txDelayFactor -= 0.1; // Can be more aggressive
  } else if (duplicateRate > 10) {
    txDelayFactor += 0.1; // Need more delay
  } else if (duplicateRate > 15) {
    txDelayFactor += 0.2;
  }
  
  // Adjust based on TX utilization
  // Higher utilization means we're busy, add delay
  if (txUtilization > 1) {
    txDelayFactor += 0.05;
  }
  if (txUtilization > 5) {
    txDelayFactor += 0.1;
  }
  
  // Adjust based on zero-hop neighbors
  // More direct neighbors = busier local area, might need more delay
  if (zeroHopCount > 5) {
    txDelayFactor += 0.05;
  }
  if (zeroHopCount > 10) {
    txDelayFactor += 0.05;
  }
  
  // Clamp to reasonable range
  txDelayFactor = Math.max(0.5, Math.min(1.5, txDelayFactor));
  
  // Direct TX delay is typically 30-50% of the flood delay
  // Lower because direct packets are targeted, less collision risk
  const directTxDelayFactor = txDelayFactor * 0.35;
  
  // Round to 2 decimal places
  txDelayFactor = Math.round(txDelayFactor * 100) / 100;
  const directRounded = Math.round(directTxDelayFactor * 100) / 100;
  
  return {
    txDelayFactor,
    directTxDelayFactor: directRounded,
    duplicateRate: Math.round(duplicateRate * 100) / 100,
    txUtilization: Math.round(txUtilization * 100) / 100,
    zeroHopCount,
  };
}

export function TxDelayCard({ stats }: TxDelayCardProps) {
  const calc = useMemo(() => calculateTxDelays(stats), [stats]);
  
  // Get current config values for comparison
  const currentTxDelay = stats?.config?.delays?.tx_delay_factor ?? null;
  const currentDirectDelay = stats?.config?.delays?.direct_tx_delay_factor ?? null;
  
  // Determine if recommendation differs significantly from current
  const txDiff = currentTxDelay !== null ? Math.abs(calc.txDelayFactor - currentTxDelay) : 0;
  const directDiff = currentDirectDelay !== null ? Math.abs(calc.directTxDelayFactor - currentDirectDelay) : 0;
  const hasSignificantDiff = txDiff > 0.1 || directDiff > 0.1;

  return (
    <div className="data-card flex flex-col min-h-[180px]">
      {/* Top section: Icon + Title */}
      <div className="flex items-center gap-2 mb-3">
        <Timer className="w-4 h-4 text-[var(--metric-transmitted)]" />
        <span className="data-card-title">TX DELAY</span>
        {hasSignificantDiff && (
          <span className="pill-tag bg-accent-warning/20 text-accent-warning border-accent-warning/30">
            Adjust
          </span>
        )}
      </div>
      
      {/* Main recommendation values */}
      <div className="flex items-baseline gap-4">
        <div>
          <div className="type-data-lg tabular-nums text-[var(--metric-transmitted)]">
            {calc.txDelayFactor.toFixed(2)}
          </div>
          <div className="type-data-xs text-text-muted">tx_delay</div>
        </div>
        <div>
          <div className="type-data-lg tabular-nums text-[var(--metric-forwarded)]">
            {calc.directTxDelayFactor.toFixed(2)}
          </div>
          <div className="type-data-xs text-text-muted">direct_delay</div>
        </div>
      </div>
      
      {/* Diagnostics */}
      <div className="flex-1 mt-4 space-y-1.5">
        <div className="flex justify-between text-xs">
          <span className="text-text-muted">Dup Rate</span>
          <span className={`tabular-nums ${calc.duplicateRate > 10 ? 'text-accent-warning' : 'text-text-secondary'}`}>
            {calc.duplicateRate.toFixed(1)}%
          </span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-text-muted">TX Util</span>
          <span className="tabular-nums text-text-secondary">
            {calc.txUtilization.toFixed(2)}%
          </span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-text-muted">Zero-hop</span>
          <span className="tabular-nums text-text-secondary">
            {calc.zeroHopCount}
          </span>
        </div>
      </div>
      
      {/* Current config comparison */}
      <div className="data-card-secondary border-t border-border-subtle pt-3 mt-2">
        {currentTxDelay !== null ? (
          <span>
            Current: {currentTxDelay.toFixed(2)} / {currentDirectDelay?.toFixed(2) ?? '—'}
          </span>
        ) : (
          <span>Recommended delays</span>
        )}
      </div>
    </div>
  );
}
