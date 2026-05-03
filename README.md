# Flow

AI-powered financial planning and decision-support platform.

## What It Does

Flow is not about tracking money — it’s about **understanding what your money is doing and what it should be doing instead**.

- Builds a complete financial profile (income, expenses, assets, liabilities)
- Identifies hidden gaps (under-investing, idle cash, tax inefficiencies)
- Projects retirement outcomes and compares scenarios
- Surfaces personalized recommendations and relevant resources
- Provides an in-app AI advisor to explain insights in simple language

## Stack

- React + TypeScript + Vite
- Tailwind CSS + shadcn-ui
- Node.js + Express (API server)
- Anthropic Claude SDK (AI advisor)

## Run

```sh
npm install          # first time only
cp .env.example .env # then add your ANTHROPIC_API_KEY
npm run dev          # starts frontend (localhost:5173) + API (localhost:3001)
```

**Individual servers:**
```sh
npm run dev:frontend   # frontend only
npm run dev:server     # API server only
```

## Environment Setup

Copy `.env.example` to `.env` and fill in:
- `ANTHROPIC_API_KEY` — required for AI advisor chat
- `API_PORT` — optional, defaults to 3001

## Key Files

```
src/
├── pages/                      # 13 pages
│   ├── Landing.tsx             # entry point
│   ├── Dashboard.tsx
│   ├── Planner.tsx             # 8-step wizard
│   ├── Advisor.tsx             # AI chat advisor
│   ├── Goals.tsx
│   ├── Insights.tsx
│   ├── Scenarios.tsx
│   ├── ScenarioCompare.tsx
│   ├── Business.tsx
│   ├── Resources.tsx
│   └── Settings.tsx
├── components/
│   ├── planner/                # 8 wizard steps
│   │   ├── StepWelcome.tsx
│   │   ├── StepProfile.tsx
│   │   ├── StepIncome.tsx
│   │   ├── StepAssets.tsx
│   │   ├── StepLiabilities.tsx
│   │   ├── StepGoals.tsx
│   │   ├── StepAssumptions.tsx
│   │   └── LiveSummaryPanel.tsx
│   └── FloatingAdvisor.tsx
├── lib/                        # business logic
│   ├── calculations.ts
│   ├── canadianRules.ts
│   ├── scoring.ts
│   ├── recommendations.ts
│   └── sampleData.ts
├── store/planStore.ts          # global state
└── types/financial.ts

server/
├── index.ts                    # Express server entry
├── routes/                     # API routes
└── lib/                        # server utilities
```

## Other Commands

```sh
npm run build        # production build
npm run test         # unit tests (vitest)
npm run test:e2e     # end-to-end tests (playwright)
npm run lint         # ESLint
```

## Disclaimer

Flow is a financial education and planning tool. It does not provide regulated financial, tax, or investment advice.

## Status

Demo-ready prototype with scenario-based outputs and guided advisor experience.