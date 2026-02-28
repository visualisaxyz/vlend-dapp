# vLend Dapp

A decentralized application for the [vLend](https://github.com/visualisaxyz/vlend) lending protocol on **MegaETH** (Chain ID 4326).

## Overview

vLend enables users to deposit collateral (WETH) and mint **vUSD**, a decentralized stablecoin. This dapp provides:

- **Dashboard** — Protocol overview, TVL, stats, and quick actions
- **Borrow** — Unified vault dashboard: create vaults, manage existing vaults (deposit, withdraw, borrow, repay), view health factors and collateral ratios
- **Stability Pool** — Deposit vUSD to backstop liquidations; earn collateral and VLEND rewards; Cashback Pool for vUSD staking rewards
- **Redemptions** — Redeem vUSD for collateral from healthy vaults (HF ≥ 1.5)
- **Auctions** — Dutch auctions for collateral from liquidated vaults (HF < 1); bid on WETH at decaying prices
- **Stabilizer** — Mint or burn vUSD against USDm with configurable fees
- **VLEND Staking** — Stake VLEND for protocol rewards

## Tech Stack

- Next.js 14
- wagmi + Web3Modal
- TanStack Query
- Tailwind CSS + Radix UI

## Setup

```bash
npm install
cp .env.example .env
```

Edit `.env`:

```
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=https://api.vlend.visualisa.xyz
```

## Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Build

```bash
npm run build
npm start
```

## API

The dapp fetches protocol data from the [vlend-api](https://github.com/visualisaxyz/vlend-api): ABIs, vaults, protocol stats, prices, stability pool, yields, and TVL.

## License

MIT
