# Riff

**Investment ideas, built to be shared.**

Riff turns an investment thesis into an allocation people can understand, buy, and remix. Instead of sharing a list of tickers, a creator publishes a point of view with a portfolio behind it. Every remix preserves the idea it came from.

[Open Riff](https://riffbase.vercel.app)

## The product

Traditional brokerages make individual assets executable. Riff makes the **investment idea itself** executable and composable.

```text
CREATE → DISCOVER → BUY → REMIX → SHARE
```

Someone can publish **THE AI STACK** with a clear thesis and a 100% allocation. Another person can buy the complete allocation in one Base smart-wallet batch, or change the weights and publish a permanently linked remix.

## Why Base

Tokenized equities on Base provide programmable financial building blocks. Riff adds the consumer layer around them:

- Base Account sign-in without passwords or custody
- Coinbase-issued tokenized-stock contracts from a verified local registry
- Live Base mainnet quotes against USDC
- Atomic smart-wallet basket execution
- Builder Code attribution in the transaction data suffix
- Portable Idea provenance and remix lineage

## What works today

- Responsive discovery, Idea details, search, sorting and sharing
- Base Account authentication with server-verified SIWE proofs
- Durable creator profiles and creator/Idea follows
- Durable Idea publishing with exact 100% allocation validation
- Immutable parent-child remix lineage
- Live Base mainnet basket quoting for supported assets
- Atomic `wallet_sendCalls` purchase preparation and receipt tracking
- Eligibility, unsupported-asset and failed-transaction states
- Base Mini App manifest

Sample performance and market-activity data are labelled in the interface. Riff never presents sample balances, transaction hashes, confirmations or unsupported assets as real.

## Mainnet safety

Riff is configured for Base mainnet. A purchase is never marked complete until the wallet reports confirmed receipts for every allocation leg. The application does not request private keys, seed phrases or custody of user assets.

Tokenized-stock access remains subject to Coinbase transfer policies, account eligibility and jurisdiction restrictions. The interface currently asks users to confirm that they are outside the United States before requesting a quote.

## Architecture

```text
Product UI
  ├─ Ideas / discovery / remix
  ├─ Base Account authentication
  └─ Transaction state machine

Application services
  ├─ Idea publishing and lineage
  ├─ Profile and follow graph
  ├─ Eligibility-aware stock registry
  └─ Basket quote construction

Infrastructure
  ├─ Base mainnet + Coinbase Tokenized Stocks
  ├─ Aerodrome quote and swap contracts
  ├─ Cloudflare D1 for indexed application state
  └─ Vercel production gateway
```

UI, application logic, blockchain execution, market assets, persistence and configuration remain separate so transaction code is not scattered through components.

## Data integrity

Published Ideas are append-only records. The server preserves:

- creator and publication timestamp
- canonical allocation hash
- exact allocation weights
- parent Idea and version
- complete lineage snapshot

D1 triggers prevent published Ideas and allocations from being edited or deleted. Client request IDs make retries idempotent, while rate limits and duplicate detection protect discovery quality.

## Local development

Requirements:

- Node.js 22.13 or newer
- npm

```bash
npm install
npm run dev
```

Create an ignored `.env.local` from `.env.example` and provide the required public application URL, Base RPC URL and official Builder Code.

Quality checks:

```bash
npm test
npm run lint
npx tsc --noEmit
npm run build
```

## Builder Code

Builder attribution has one integration point: `config/base.ts`. The configured code is converted into the Base transaction data suffix in `lib/blockchain/wagmi.ts` and supplied to `wallet_sendCalls`.

`[BUILDERS_CODE]` remains an explicit placeholder until the official code is generated for the final production domain. It must never be invented or silently replaced.

## One-minute demo

1. Publish **THE AI STACK** with a clear thesis and allocation.
2. Discover the Idea from another account.
3. Request and confirm a $100 Base mainnet basket purchase.
4. Remix the allocation into a more concentrated version.
5. Publish the remix and reveal the preserved lineage.

The result should be immediately clear: **an investment thesis can now be created, bought and remixed.**

## Current milestone

The consumer product, durable social graph and mainnet quote/execution pipeline are implemented. Before the final Builder Quest submission, the remaining milestones are the official Builder Code, Base deployment of the provenance registry, a recorded mainnet purchase, Mini App account association, and the public demo video.

---

Riff is a hackathon-stage financial application. Nothing in the product or repository is investment advice or a promise of future performance.
