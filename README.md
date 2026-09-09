# Riff

Investment ideas, built to be shared.

Riff turns a creator’s market thesis into a tokenized-stock allocation people can understand, buy and remix. Every version keeps its creator and history attached, so ideas can evolve while creators build a visible track record.

[Open the live product](https://riffbase.vercel.app)

## The idea

Brokerages make stocks executable. Riff makes the investment idea itself executable and composable.

Create → Discover → Buy → Remix → Share

A creator publishes a thesis and the allocation behind it. Another person can buy the supported allocation through one Base smart-wallet confirmation, or change the weights and publish a linked version without altering the original.

## Why Base

Base provides the programmable tokenized-stock infrastructure. Riff adds the consumer and social layer:

- Base Account sign-in
- Coinbase-issued tokenized-stock contracts
- live Base mainnet quotes against USDC
- atomic smart-wallet basket execution
- permanent creator attribution and remix lineage
- Builder Code attribution through the transaction data suffix

## What works

- Responsive discovery, search, Idea pages, profiles and activity
- Durable profiles, follows, publishing and remix lineage
- Exact 100% allocation validation and deterministic purchase splits
- Live mainnet quotes for supported tokenized stocks
- Wallet rejection, failed transaction and unsupported-asset states
- Base Mini App manifest and domain verification

Sample market metrics are clearly labelled. Riff never invents balances, confirmations or transaction hashes, and never marks a purchase complete before confirmed wallet receipts.

## Run locally

```bash
npm install
npm run dev
```

Copy `.env.example` to an ignored `.env.local` and configure the public app URL, Base RPC URL and official Builder Code.

```bash
npm test
npm run lint
npx tsc --noEmit
npm run build
```

## Submission status

The product and Base mainnet execution pipeline are implemented. Final submission setup still requires the official Builder Code, Mini App account association, provenance-registry deployment and a recorded eligible mainnet purchase.

Riff is experimental software. Nothing in this repository is investment advice or a promise of future performance.
