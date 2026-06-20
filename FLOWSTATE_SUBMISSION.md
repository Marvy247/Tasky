# Tasky — Decentralized Bounties on Celo

## What is Tasky?

Tasky is a decentralized bounty platform on Celo where anyone can post tasks funded with CELO or G$ and workers can complete them for payment. Funds are held in escrow, released only when the poster approves the work.

## G$ Integration

G$ is a first-class reward currency alongside CELO. Posters fund bounties in G$, workers earn G$ for completed work. The frontend handles the full ERC20 approval flow. A 0.5% referral bonus paid in the same currency incentivizes user acquisition. G$ flows through every part of the product — posting, earning, referring.

## How It Works

1. **Post** a bounty — title, description, reward (CELO or G$), deadline. Funds + 2.5% fee held in escrow.
2. **Claim** — workers browse open bounties and claim one at a time.
3. **Work & submit proof** — worker submits proof (IPFS hash, link, text).
4. **Approve** — poster reviews and approves. Reward minus 0.5% referral bonus goes to worker. Fee stays in contract.
5. **Cancel** — poster cancels anytime before completion; funds refunded in full.

## Why This Isn't Trivial

- **Escrow-based** — funds locked in contract, not just passed through
- **Dual-currency** — CELO + G$ with full ERC20 approval flow
- **Fee model** — 2.5% platform fee, sustainable business
- **Referral system** — 0.5% bonus for referrers, drives growth
- **Deadline enforcement** — bounties expire, posters can reclaim funds
- **Complete UX** — browse, filter, post, claim, proof, approve — full lifecycle

## Smart Contracts (Celo Mainnet)

| Contract | Address |
|---|---|
| BountyBoard | `0xFD955eA61C556D6dA2F7542f5bC618345b0EaddA` |
| G$ Token | `0x62B8B11039FcfE5aB0C56E502b1C372A3d2a9c7A` |

## Tech Stack

Solidity 0.8.24 + OpenZeppelin, Celo mainnet, Next.js + viem, G$ (GoodDollar).

## Current State

### Progress

- BountyBoard deployed and verified on Celo mainnet
- Frontend built with Vite + React + Tailwind v4 + Framer Motion
- All pages functional: browse, post, detail (claim/proof/approve/cancel), my bounties
- Wallet connect (MetaMask/Celo), Celo mainnet switching
- G$ approval flow (allowance check → approve → post/earn)
- Transaction tracking with real-time receipt polling
- Fee calculation display, deadline estimation

### Milestones Completed

- ✅ BountyBoard.sol — escrow, dual-currency, fees, referral, deadlines
- ✅ Frontend with all 4 pages + wallet + G$ approval
- ✅ Platform fee (2.5%) + referral bonus (0.5%) embedded in contract
- ✅ Clean, premium UI with glassmorphism, animations, responsive
- ✅ Deployed to Celo mainnet (`0xFD955eA61C556D6dA2F7542f5bC618345b0EaddA`)
- ✅ 8 seed bounties with 0.85 CELO total reward pool

### What's Next

- Public frontend deployment
- Mobile optimization
- Community launch on Celo Signal / GoodDollar channels

## Links

- GitHub: https://github.com/Marvy247/Tasky
- Explorer: https://explorer.celo.org/mainnet/address/0xFD955eA61C556D6dA2F7542f5bC618345b0EaddA
