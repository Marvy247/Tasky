# StraCel — Strade Marketplace on Celo

Strade decentralized marketplace smart contracts deployed on the Celo blockchain.

## Deployed Contracts (Celo Mainnet)

| Contract | Address |
|----------|---------|
| BSTToken | [`0x6cD3F87568F742A8211bDabe9FC9bf0c078Fab37`](https://explorer.celo.org/mainnet/address/0x6cD3F87568F742A8211bDabe9FC9bf0c078Fab37) |
| CoreMarketPlace | [`0xc15522d3DE1654D67342F47f8E45c59Cf622eD55`](https://explorer.celo.org/mainnet/address/0xc15522d3DE1654D67342F47f8E45c59Cf622eD55) |
| EscrowService | [`0xB85F9C01f5557BA8E4e78859Ec37C8b5f41cbc21`](https://explorer.celo.org/mainnet/address/0xB85F9C01f5557BA8E4e78859Ec37C8b5f41cbc21) |
| DisputeResolution | [`0x6eb97d321176F25A8661F67C285B277EC5cbc7F5`](https://explorer.celo.org/mainnet/address/0x6eb97d321176F25A8661F67C285B277EC5cbc7F5) |
| UserProfile | [`0x57A20C3C4BC8C01aF6ed7288574e972d889420c0`](https://explorer.celo.org/mainnet/address/0x57A20C3C4BC8C01aF6ed7288574e972d889420c0) |

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

## Tech Stack

- Solidity 0.8.24
- Hardhat
- OpenZeppelin Contracts
- Celo Blockchain
