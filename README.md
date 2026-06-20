# Tasky

**Decentralized bounty platform on Celo Mainnet** — post tasks funded with CELO or G$, work gets done. Funds held in escrow with smart contract guarantees.

![License](https://img.shields.io/badge/license-MIT-green)
![Solidity](https://img.shields.io/badge/Solidity-0.8.24-blue)
![Celo](https://img.shields.io/badge/Celo-Mainnet-green)
![Status](https://img.shields.io/badge/status-Live-success)

---

## Overview

Tasky connects bounty posters with workers through a trustless on-chain protocol. Instead of relying on a middleman, every bounty is backed by a smart contract that escrows funds, enforces deadlines, and releases payment only when the poster approves the work.

| Role | Action | Outcome |
|------|--------|---------|
| Poster | Posts bounty + funds escrow | Work completed, fee collected |
| Worker | Claims bounty + submits proof | Reward received minus referral bonus |
| Referrer | Refers a worker | 0.5% bonus on completion |

---

## Smart Contracts

Deployed on **Celo Mainnet**:

| Contract | Address | Explorer |
|----------|---------|----------|
| **BountyBoard** | `0xFD955eA61C556D6dA2F7542f5bC618345b0EaddA` | [View](https://explorer.celo.org/mainnet/address/0xFD955eA61C556D6dA2F7542f5bC618345b0EaddA) |
| **G$ Token** | `0x62B8B11039FcfE5aB0C56E502b1C372A3d2a9c7A` | [View](https://explorer.celo.org/mainnet/token/0x62B8B11039FcfE5aB0C56E502b1C372A3d2a9c7A) |

---

## Architecture

```
                         ┌──────────────────────┐
                         │    BountyBoard.sol    │
                         │  (Escrow + Dispatch)  │
                         └──────┬───────┬───────┘
                                │       │
                   ┌────────────┘       └────────────┐
                   ▼                                  ▼
          ┌─────────────────┐              ┌──────────────────┐
          │   CELO (native)  │              │   G$ (ERC-20)    │
          │  msg.value flow  │              │ approve + spend  │
          └─────────────────┘              └──────────────────┘
```

The contract handles all state transitions:

```
Post (Open) ──► Claim (Assigned) ──► SubmitProof (Assigned)
                                        │
                                        ▼
                                   Approve (Completed)

Cancel ──► Refund (Cancelled)  (anytime before completion)
```

---

## Key Features

- **Escrow on-chain** — reward + 2.5% fee locked in contract at post time
- **Dual currency** — native CELO and G$ (ERC-20) treated as first-class rewards
- **Fee model** — 2.5% platform fee paid by poster, refunded if cancelled before work starts
- **Referral system** — 0.5% of reward goes to referrer on completion (drives growth)
- **Deadline enforcement** — if a claimed bounty exceeds its deadline, the poster can cancel and reclaim funds
- **Complete lifecycle** — post → browse → claim → submit proof → approve → complete

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Smart Contract** | Solidity 0.8.24, OpenZeppelin |
| **Chain** | Celo Mainnet |
| **Frontend** | Vite + React + TypeScript |
| **Styling** | Tailwind CSS v4 + Framer Motion |
| **Blockchain Client** | viem |
| **Wallet** | MetaMask / Celo-compatible wallets |
| **Reward Token** | GoodDollar (G$) |

---

## Seed Bounties

The contract is live with **8 open bounties** (0.85 CELO total reward pool):

| Bounty | Reward |
|--------|--------|
| Design a modern logo for my brand | 0.08 CELO |
| Write 3 SEO-optimized blog posts | 0.15 CELO |
| Fix responsive layout bug on landing page | 0.05 CELO |
| Create 30-second product explainer video | 0.12 CELO |
| Translate landing page to Spanish (LatAm) | 0.04 CELO |
| Build custom Tailwind component library | 0.25 CELO |
| Record voiceover for product walkthrough | 0.06 CELO |
| Write competitor market analysis report | 0.10 CELO |

---

## Design Decisions

1. **Poster pays fee upfront** — aligns incentives; poster only pays if serious
2. **Fee refunded on cancel** — no risk to poster if no worker is suitable
3. **Referral bonus from reward, not fee** — sustainable, fee stays fixed at 2.5%
4. **One worker per bounty** — simpler trust model, no multi-worker coordination
5. **Deadline as block number** — deterministic, no oracle dependency

---

## Local Development

### Prerequisites

- Node.js 18+
- MetaMask
- A `.env` file with `PRIVATE_KEY` (Celo mainnet deployer)

### Contract

```bash
git clone https://github.com/Marvy247/Tasky.git
cd Tasky
npm install
npx hardhat compile
npx hardhat run scripts/deploy.cjs --network celo
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

---

## License

MIT
