# Tasky — Project Status

**Decentralized bounty platform on Celo Mainnet**
**Live**: https://tasky-olive-nine.vercel.app/
**Contract**: `0xFD955eA61C556D6dA2F7542f5bC618345b0EaddA`

---

## Overview

Tasky is an on-chain bounty protocol where anyone can post tasks funded with CELO or G$, and workers complete them for payment. Funds are held in escrow, released only when the poster approves the work. The platform charges a 2.5% fee and offers a 0.5% referral bonus.

---

## Live Deployments

| Component | Status | Link |
|-----------|--------|------|
| Smart Contract | Deployed & Verified | [Celo Explorer](https://explorer.celo.org/mainnet/address/0xFD955eA61C556D6dA2F7542f5bC618345b0EaddA) |
| Web Frontend | Live | [tasky-olive-nine.vercel.app](https://tasky-olive-nine.vercel.app/) |
| Source Code | GitHub | [github.com/Marvy247/Tasky](https://github.com/Marvy247/Tasky) |

---

## Milestones Completed

- Smart contract written in Solidity 0.8.24 with OpenZeppelin, deployed and verified on Celo Mainnet
- Full bounty lifecycle: post, claim, submit proof, approve, cancel
- Dual-currency support: native CELO and G$ (ERC-20) as first-class reward currencies
- G$ integration includes full approval flow (allowance check, approve, spend)
- 2.5% platform fee paid upfront by poster, refunded on pre-claim cancellation
- 0.5% referral bonus paid to referrer on completion
- Deadline enforcement with block-based expiration
- Frontend built with Vite, React, TypeScript, Tailwind CSS v4, Framer Motion, and viem
- Wallet connection with MetaMask and Celo-compatible wallets
- G$ and CELO balance display in navigation header
- Wallet dropdown with address copy, balances, and disconnect
- Dark mode toggle persisted to localStorage
- Real-time countdown timers on bounty cards and detail pages
- Confetti animation on bounty completion
- Search bar and sort controls (newest, highest reward, deadline)
- Mobile-responsive bottom navigation bar
- Activity feed grouped by date with color-coded event types
- Dashboard statistics cards (total bounties, open count, reward pool, accumulated fees)
- Transaction progress modal with step indicators for multi-step operations
- Referral parameter detection from URL (`?ref=0x...`) auto-fills referrer field
- Deadline date estimation displayed alongside block input on post form
- Auto-refresh: homepage polls every 30 seconds, balances poll every 15 seconds
- First-visit onboarding welcome card
- Custom SVG illustrations for empty states
- TypeScript compiles with zero errors
- Production Vite build passes with zero warnings

---

## Seed Bounties

8 open bounties with 30-day deadlines, 0.85 CELO total reward pool:

| Bounty | Reward |
|--------|--------|
| Design a modern logo for my brand | 0.08 CELO |
| Write 3 SEO-optimized blog posts for a SaaS tool | 0.15 CELO |
| Fix responsive layout bug on landing page | 0.05 CELO |
| Create a 30-second product explainer video | 0.12 CELO |
| Translate landing page to Spanish (LatAm) | 0.04 CELO |
| Build a custom Tailwind component library | 0.25 CELO |
| Record voiceover for product walkthrough | 0.06 CELO |
| Write competitor market analysis report | 0.10 CELO |

---

## Blockers

- No subgraph or indexer deployed -- activity feed reads directly from contract state; adequate at current scale but will not scale past a few hundred bounties
- No G$ faucet integrated into the application -- users must obtain G$ externally via claim.gooddollar.org
- No multi-language or internationalization support
- No smart contract upgrade mechanism -- new deployments require state migration
- No analytics or error monitoring on the frontend deployment
- Frontend hash router handles navigation but URL-based referral links require the full URL path to be preserved on page load

---

## Recent Activity

- Renovated expired seed bounties: cancelled 8 expired bounties (original 3-day deadlines), reposted all 8 with 30-day deadlines
- Implemented dark mode using CSS custom properties with `.dark` class scoping (replaced broken Tailwind v4 `@variant dark` approach)
- Added 9 UX/UI upgrades in a single iteration: countdown timers, confetti, search/sort, mobile navigation, activity feed, statistics dashboard, referral sharing button, transaction progress modal, and onboarding tooltip
- Deployed frontend to Vercel
- Updated git remote from legacy StraCel repository to new Tasky repository
- Rewrote README and submission documentation with professional formatting, architecture diagrams, and seed bounty tables
- Removed submission document from GitHub tracking (local only)
