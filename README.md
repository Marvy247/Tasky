# Tasky — Decentralized Bounties on Celo

Post tasks, fund with CELO or G$, get work done. Funds held in escrow, 2.5% platform fee, 0.5% referral bonus.

## Smart Contracts (Celo Mainnet)

| Contract | Address |
|---|---|
| BountyBoard | `0xFD955eA61C556D6dA2F7542f5bC618345b0EaddA` |
| G$ Token | `0x62B8B11039FcfE5aB0C56E502b1C372A3d2a9c7A` |

## Deploy

```bash
cd backend
npx hardhat run scripts/deploy-bountyboard.cjs --network celo
```

## Frontend

```bash
cd frontend
npm run dev
```

Update `frontend/src/lib/celo.ts` with the deployed BountyBoard address.

## Architecture

- **Escrow**: poster funds reward + 2.5% fee upfront. Cancelled bounties refund everything.
- **Completion**: poster approves → worker gets reward minus 0.5% referral bonus (if any), fee stays in contract.
- **Referral**: optional referrer address gets 0.5% of reward when bounty completes.
- **Deadlines**: if claimed bounty passes deadline, poster can cancel and get refund.

## Key Design Decisions

1. Poster pays fee upfront (not worker) — incentives align
2. Fee refunded if cancelled before work starts — no risk to poster
3. Referral bonus comes from reward, not from fee — sustainable
4. One worker per bounty — simple, clear, no coordination overhead
