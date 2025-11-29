# ScrumKit

## Project Structure

Monorepo using bun workspaces:
- `packages/frontend` - Vue + Vite app
- `packages/backend` - Colyseus server
- `packages/models` - Shared types (@colyseus/schema)

## Development

Use pm2 for process management:
```bash
bun run dev      # Start all with pm2
bun run stop     # Stop all processes
bun run logs     # View logs (non-blocking)
bun run status   # Check process status
```

Individual processes:
```bash
pm2 logs scrumkit-frontend --nostream --lines 50
pm2 logs scrumkit-backend --nostream --lines 50
pm2 restart scrumkit-backend
```

Ports:
- Frontend: 7000
- Backend: 7001 (Colyseus WebSocket)

## UI Design

This project follows a **polished card style** design system:

### Core Principles
- **Rounded corners** (`8-12px` border-radius)
- **Top-light effect** - lighter border/gradient on top edge to mimic 3D lighting
- **Soft shadows** (`0 4px 12px -2px`, never hard offset)
- **Subtle gradients** (145deg diagonal, lighter → darker)
- **Thin borders** (`1px`, subtle colors)

### Light Effect Pattern
```css
/* Standard element */
border: 1px solid oklch(50% 0.02 260);
border-top-color: oklch(100% 0 0 / 0.15);
box-shadow: 0 2px 8px -2px oklch(10% 0.01 260),
            inset 0 1px 0 oklch(100% 0 0 / 0.1);

/* Primary/active element (yellow) */
background: linear-gradient(145deg, oklch(78% 0.18 85), oklch(72% 0.18 85));
border-top-color: oklch(85% 0.12 85);
```

### Interactions
- Hover: lift up (`translateY(-2px)`) + stronger shadow
- Active: press down (`translateY(1px)`) + reduced shadow
- Transitions: `150ms ease`

### Color Palette
- Background: `oklch(25-32% 0.02 260)` (dark blues)
- Primary (yellow): `oklch(72-78% 0.18 85)`
- Light effect: `oklch(100% 0 0 / 0.1-0.25)`

Components are in `packages/frontend/src/components/ui/`.

## Active Technologies
- TypeScript ~5.9.3, Bun runtime (ESNext target) + Vue 3.5, Colyseus 0.16, @colyseus/schema 3.0, Vite (Rolldown) (001-retro-room)
- In-memory (Colyseus state) - no persistence (001-retro-room)

## Recent Changes
- 001-retro-room: Added TypeScript ~5.9.3, Bun runtime (ESNext target) + Vue 3.5, Colyseus 0.16, @colyseus/schema 3.0, Vite (Rolldown)
