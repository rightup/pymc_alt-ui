'use client';

import { useState, memo, useMemo, useCallback } from 'react';
import { Treemap, ResponsiveContainer } from 'recharts';
import { getPacketTypeShortLabel } from '@/lib/constants';
import { useChartColorArray } from '@/lib/hooks/useThemeColors';

interface PacketTypeData {
  name: string;
  value: number;
}

interface PacketTypesChartProps {
  data: PacketTypeData[];
}

interface TreemapNodeProps {
  x: number;
  y: number;
  width: number;
  height: number;
  name: string;
  value: number;
  index: number;
  colors: string[];
  depth: number;
  hoveredIndex: number | null;
  onHover: (index: number | null) => void;
  total: number;
}

/** Custom content renderer for treemap cells */
function TreemapCell({
  x,
  y,
  width,
  height,
  name,
  value,
  index,
  colors,
  depth,
  hoveredIndex,
  onHover,
  total,
}: TreemapNodeProps) {
  // Only render leaf nodes (depth === 1)
  if (depth !== 1) return null;
  
  const percent = ((value / total) * 100).toFixed(1);
  const isHovered = hoveredIndex === index;
  const isDimmed = hoveredIndex !== null && !isHovered;
  const color = colors[index % colors.length];
  
  // Only show label if cell is large enough
  const showLabel = width > 40 && height > 30;
  const showPercent = width > 50 && height > 45;
  
  return (
    <g
      onMouseEnter={() => onHover(index)}
      onMouseLeave={() => onHover(null)}
      style={{ cursor: 'default' }}
    >
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={color}
        opacity={isDimmed ? 0.4 : 1}
        stroke="rgba(0,0,0,0.3)"
        strokeWidth={1}
        rx={4}
        style={{ transition: 'opacity 150ms ease' }}
      />
      {showLabel && (
        <text
          x={x + width / 2}
          y={y + height / 2 - (showPercent ? 6 : 0)}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="rgba(0,0,0,0.8)"
          fontSize={11}
          fontWeight={600}
          fontFamily="var(--font-mono)"
          style={{ textTransform: 'uppercase', pointerEvents: 'none' }}
        >
          {getPacketTypeShortLabel(name)}
        </text>
      )}
      {showPercent && (
        <text
          x={x + width / 2}
          y={y + height / 2 + 10}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="rgba(0,0,0,0.6)"
          fontSize={10}
          fontFamily="var(--font-mono)"
          style={{ pointerEvents: 'none' }}
        >
          {percent}%
        </text>
      )}
    </g>
  );
}

/**
 * Treemap chart for packet type distribution
 * Features: hover highlighting, color-coded cells, theme-aware colors
 */
function PacketTypesChartComponent({ data }: PacketTypesChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const chartColors = useChartColorArray();

  const { treemapData, total } = useMemo(() => {
    const total = data.reduce((sum, e) => sum + e.value, 0);
    const sorted = [...data].sort((a, b) => b.value - a.value);
    // Filter out very small values (<0.5%)
    const filtered = sorted.filter((e) => total > 0 && (e.value / total) * 100 >= 0.5);
    // Format for Recharts Treemap
    const treemapData = filtered.map((item, index) => ({
      name: item.name,
      size: item.value,
      index,
    }));
    return { treemapData, total };
  }, [data]);

  const handleHover = useCallback((index: number | null) => {
    setHoveredIndex(index);
  }, []);

  if (data.length === 0 || total === 0) {
    return (
      <div className="h-56 flex items-center justify-center text-text-muted">
        No packet type data available
      </div>
    );
  }

  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <Treemap
          data={treemapData}
          dataKey="size"
          aspectRatio={4 / 3}
          stroke="none"
          isAnimationActive={false}
          content={(
            <TreemapCell
              x={0}
              y={0}
              width={0}
              height={0}
              name=""
              value={0}
              index={0}
              colors={chartColors}
              depth={0}
              hoveredIndex={hoveredIndex}
              onHover={handleHover}
              total={total}
            />
          )}
        />
      </ResponsiveContainer>
    </div>
  );
}

export const PacketTypesChart = memo(PacketTypesChartComponent);
