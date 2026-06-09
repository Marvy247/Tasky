# StraCel — Strade Marketplace on Celo

Strade decentralized marketplace smart contracts deployed on the Celo blockchain.

## Deployed Contracts (Celo Mainnet)

| Contract | Address |
|----------|---------|
| BSTToken | [`0x0dbFcf01d067A075b12c8CFd05dAA2D4071e1003`](https://explorer.celo.org/mainnet/address/0x0dbFcf01d067A075b12c8CFd05dAA2D4071e1003) |
| CoreMarketPlace | [`0x01FAD87943D1303E0083391eF4E43Cee8dB06A72`](https://explorer.celo.org/mainnet/address/0x01FAD87943D1303E0083391eF4E43Cee8dB06A72) |
| EscrowService | [`0x983AB59ab1Ae967E34d72d57E3fF65b411Ad0D5B`](https://explorer.celo.org/mainnet/address/0x983AB59ab1Ae967E34d72d57E3fF65b411Ad0D5B) |
| DisputeResolution | [`0xA54B034b0cECD0877cc2d43fe3D1E1EB3A5cD561`](https://explorer.celo.org/mainnet/address/0xA54B034b0cECD0877cc2d43fe3D1E1EB3A5cD561) |
| UserProfile | [`0x7DaE559f4acE0579121C22de722d1E97A6957069`](https://explorer.celo.org/mainnet/address/0x7DaE559f4acE0579121C22de722d1E97A6957069) |

**G$ Token:** [`0x62b8B11039FCFe5Ab0c56E502B1c372A3d462a4b`](https://explorer.celo.org/mainnet/address/0x62b8B11039FCFe5Ab0c56E502B1c372A3d462a4b)

## Deployed Contracts with G$ Integration (Celo Mainnet)

| Contract | Address |
|----------|---------|
| CoreMarketPlace | [`0x01FAD87943D1303E0083391eF4E43Cee8dB06A72`](https://explorer.celo.org/mainnet/address/0x01FAD87943D1303E0083391eF4E43Cee8dB06A72) |
| EscrowService | [`0x983AB59ab1Ae967E34d72d57E3fF65b411Ad0D5B`](https://explorer.celo.org/mainnet/address/0x983AB59ab1Ae967E34d72d57E3fF65b411Ad0D5B) |

**Deployer:** `0x27A2dD1823D883935c9824fbaC0a018cE8e891E5`

## Contracts

- **BSTToken** — ERC-20 token (BST), 1 trillion supply, 6 decimals, pausable
- **CoreMarketPlace** — Create, update, cancel and purchase listings with native CELO
- **EscrowService** — Trustless escrow (~7 day duration), buyer/owner release or refund
- **DisputeResolution** — Arbitrator voting system, 24h voting period, min 3 votes
- **UserProfile** — User registration, 5-star ratings, reputation scoring

## Development

```bash
npm install
npx hardhat compile
```

## Deploy

```bash
cp .env.example .env
# Add your PRIVATE_KEY to .env

npx hardhat run scripts/deploy.ts --network celo
```

## Activity Scripts (100 Accounts)

Requires `MNEMONIC` in `.env` — derives 100 accounts via HD path `m/44'/60'/0'/0/i`.

```bash
# 1. Fund all 100 accounts from master wallet (0.05 CELO each)
node scripts/activity/fund-accounts.cjs

# 2. Generate contract interactions across all accounts
node scripts/activity/generate-activity.cjs

# 3. Drain all accounts back to master
node scripts/activity/drain-accounts.cjs
```

## Tech Stack

- Solidity 0.8.24
- Hardhat
- OpenZeppelin Contracts
- Celo Blockchain
