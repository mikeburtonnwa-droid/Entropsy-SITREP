# Morning Brief Content Swarm

## What This Is
Fully automated multi-agent pipeline producing ~48 AI news content pieces daily across 3 industry verticals (Professional Services, Financial Services, Retail & E-Commerce). Runs at 5:00 AM CST.

## Architecture
- **pnpm workspace monorepo** with 2 packages: `packages/agents` (pipeline engine) and `packages/feed` (Next.js UI)
- **12 agents in 5 tiers**: Orchestrator → Harvesters (×3) → Curators (×3) → Writers (×3) → QA Gate → Publisher
- **Supabase** as sole inter-agent communication — agents write to tables, orchestrator reads statuses
- **Railway** for agent process (long-running), **Vercel** for feed UI

## Model Assignments
- Orchestrator + Harvesters: `claude-haiku-4` (scheduling/dedup only)
- Curators + Writers + QA Gate: `claude-sonnet-4-6` (editorial judgment + writing)
- Publisher: No LLM (deterministic)

## Key Patterns
- One LLM call per story in Writer — all 6 formats in single structured JSON response
- Zod validation on every LLM output before DB write
- `Promise.allSettled` for parallel tiers — one industry failure doesn't cascade
- Source registry in code (44 sources), synced to Supabase via seed script
- Exponential backoff on rate limits: 1s, 2s, 4s — max 3 attempts

## Commands
```bash
pnpm pipeline          # Run full pipeline manually
pnpm seed              # Seed source registry to Supabase
pnpm build             # Build all packages
pnpm test              # Run all tests
```

## Important Files
- `packages/agents/src/config.ts` — Central model assignments + runtime config
- `packages/agents/src/agents/base-agent.ts` — Foundation class all agents extend
- `packages/agents/src/db/migrations/` — Database schema (source of truth)
- `packages/agents/src/sources/registry.ts` — All 44 news sources
- `packages/agents/src/prompts/` — All LLM prompts (curator, writer, QA)
