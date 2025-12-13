# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

pymc_console is a Next.js dashboard and monitoring stack for [pyMC_Repeater](https://github.com/rightup/pyMC_Repeater), a LoRa mesh network repeater. It provides real-time monitoring of packet traffic, neighbors, system stats, and radio configuration.

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS 4
- **State Management**: Zustand
- **Charts**: Recharts
- **Maps**: Leaflet / react-leaflet
- **Monitoring**: Grafana + Prometheus (Docker)

## Development Commands

```bash
# Frontend development (from frontend/)
cd frontend
npm install        # Install dependencies
npm run dev        # Start dev server at http://localhost:3000
npm run build      # Production build (uses --webpack flag)
npm run lint       # Run ESLint

# Full stack with Docker
docker-compose up -d                    # Start backend, frontend, Prometheus, Grafana
docker-compose up -d prometheus grafana # Monitoring only
```

## Architecture

### Frontend Structure (`frontend/src/`)

```
src/
├── app/                    # Next.js App Router pages
│   ├── page.tsx           # Dashboard home
│   ├── packets/           # Packet history & filtering
│   ├── neighbors/         # Neighbor map & list
│   ├── statistics/        # Charts & metrics
│   ├── logs/              # System logs
│   ├── settings/          # Radio configuration
│   └── system/            # Hardware stats
├── components/
│   ├── charts/            # Recharts visualizations
│   ├── controls/          # ControlPanel for mode/duty cycle
│   ├── layout/            # Sidebar, Header, BackgroundProvider
│   ├── neighbors/         # NeighborMap (Leaflet)
│   ├── packets/           # PacketRow, PacketDetailModal, RecentPackets
│   ├── shared/            # TimeRangeSelector, BackgroundSelector
│   ├── stats/             # StatsCard
│   └── ui/                # HashBadge, etc.
├── lib/
│   ├── api.ts             # All API client functions
│   ├── constants.ts       # App constants
│   ├── format.ts          # Formatting utilities
│   ├── packet-utils.ts    # Packet processing helpers
│   ├── hooks/             # usePolling, useDebounce, useThemeColors
│   └── stores/useStore.ts # Zustand store (stats, packets, logs, UI state)
└── types/api.ts           # TypeScript interfaces for API responses
```

### Key Patterns

**API Client** (`src/lib/api.ts`): All backend communication goes through typed functions here. The base URL comes from `NEXT_PUBLIC_API_URL` env var.

**Global State** (`src/lib/stores/useStore.ts`): Zustand store with granular selectors to prevent unnecessary re-renders:
```typescript
// Use specific selectors, not the full store
const stats = useStats();           // Good
const { stats } = useStore();       // Avoid - causes extra re-renders
```

**Polling**: Use `usePolling` hook from `src/lib/hooks/` for live data updates.

### Backend API

The frontend connects to pyMC_Repeater's API (default port 8000). Key endpoints:
- `/api/stats` - System statistics, neighbors, config
- `/api/recent_packets` - Recent packet history
- `/api/packet_by_hash` - Single packet lookup
- `/api/bucketed_stats` - Aggregated stats for charts
- `/api/utilization` - Airtime utilization data
- `/api/hardware_stats` - CPU, memory, disk, temperature
- `/api/send_advert` - Trigger advert broadcast (POST)
- `/api/set_mode` - Set forward/monitor mode (POST)
- `/api/update_radio_config` - Update radio settings (POST)

### Docker Services

| Service | Port | Description |
|---------|------|-------------|
| backend | 8000 | pyMC_Repeater API |
| frontend | 3000 | Next.js dashboard |
| prometheus | 9090 | Metrics collection |
| grafana | 3002 | Visualization (admin/admin) |

## Configuration

**Frontend API URL**: Set in `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000      # Local
NEXT_PUBLIC_API_URL=http://192.168.1.100:8000  # Remote
```

**Path alias**: Use `@/` to import from `src/`:
```typescript
import { useStats } from '@/lib/stores/useStore';
import type { Packet } from '@/types/api';
```

## Type Definitions

Packet and stats types are in `src/types/api.ts`. Notable constants:
- `PAYLOAD_TYPES` - Maps packet type numbers to names (REQ, RESPONSE, TXT_MSG, ACK, ADVERT, etc.)
- `ROUTE_TYPES` - Maps route types (UNKNOWN, DIRECT, FLOOD, TRANSPORT, etc.)
