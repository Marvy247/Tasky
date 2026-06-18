# Stracel — Decentralized Marketplace on Celo

## What is Stracel?

Stracel is a fully decentralized peer-to-peer marketplace built on the Celo blockchain. It enables anyone to list, buy, and sell goods and services using CELO or G$ (GoodDollar) — with no middlemen, no platform fees, and no censorship.

Smart contracts handle payments directly between buyers and sellers, with every transaction recorded on-chain for full transparency.

## G$ Integration

Stracel natively supports G$ as a payment currency alongside CELO. Sellers can price listings in G$, and buyers can purchase using either CELO or G$ — including cross-currency purchases (e.g., buying a G$-priced item with CELO). The smart contract handles G$ transfers via `safeTransferFrom` with a full approval flow in the frontend.

This makes Stracel a direct driver of G$ usage and circulation on Celo, turning everyday commerce into a vector for GoodDollar adoption.

## How It Works

1. **Connect** your Celo wallet (MetaMask or any EVM-compatible wallet)
2. **List** an item — set a name, description, price (in CELO or G$), and duration
3. **Buy** — payment is sent directly to the seller via smart contract. Track your order in My Orders with a verifiable transaction on Celo Explorer
4. **Manage** — sellers can edit or remove their listings at any time

## Smart Contracts (Celo Mainnet)

| Contract | Address |
|---|---|
| CoreMarketPlace | `0x0Db0b61bd15B642305faDC91e3bBd6cD45ecf179` |
| EscrowService | `0xc30e7A642E150d392FfC7D4AE56C87b549Ed3500` |
| DisputeResolution | `0xA54B034b0cECD0877cc2d43fe3D1E1EB3A5cD561` |
| UserProfile | `0x7DaE559f4acE0579121C22de722d1E97A6957069` |
| G$ Token | `0x62B8B11039FcfE5aB0C56E502b1C372A3d2a9c7A` |

All contracts are live on Celo mainnet and actively receiving transactions.

## Tech Stack

- **Solidity 0.8.24** — smart contracts with OpenZeppelin
- **Celo Blockchain** — fast, mobile-first, low-fee EVM chain
- **Next.js + viem** — frontend with direct Celo contract interaction
- **G$ (GoodDollar)** — integrated as native payment currency with cross-currency support

## What's the Current State of the Project?

### Progress Made

Stracel is live on Celo mainnet with 5 core smart contracts deployed:

- **CoreMarketPlace** — fully functional with dual-currency support (CELO + G$). Sellers can price listings in either currency, buyers can purchase with either currency. Cross-currency purchases supported.
- **EscrowService** — trustless escrow for high-value transactions.
- **DisputeResolution** — community arbitration contract.
- **UserProfile** — on-chain registration and reputation scoring.
- **Frontend** — Next.js marketplace UI built with viem, connected directly to Celo mainnet contracts. Wallet connect, listing creation, purchasing (with G$ approval flow), cancellation, editing, order history, transaction tracking, search, filter, and pagination all functional.

### Milestones Completed

- ✅ All contracts deployed to Celo mainnet
- ✅ G$ integration: contract supports G$ listings, G$ purchases, cross-currency (buy G$ items with CELO)
- ✅ G$ approval flow in frontend — allowance check + approve + purchaseListingGD
- ✅ Frontend: Next.js with full marketplace UI
- ✅ Listing detail page with confirm dialog, "already bought" detection, order tracking
- ✅ Persistent transaction tracker with real-time polling
- ✅ Push notification system for purchase and listing events
- ✅ Wallet balances (CELO + G$) in header
- ✅ Gas estimation shown before confirm
- ✅ Search, filter (currency + price range), sorting, pagination
- ✅ Edit/Remove listings for sellers
- ✅ Order history with on-chain verification links

### What We've Been Up To

The last sprint focused on two things: getting G$ working end-to-end, and fixing the UX issues identified in testing feedback.

**G$ Integration:**
- Deployed a new CoreMarketPlace with currency checks removed so buyers can purchase G$-denominated listings with CELO (cross-currency)
- Added approval flow (allowance check → approve → purchaseListingGD) so G$ purchases work correctly
- Currency selector in both marketplace and detail-page confirm dialogs lets buyers choose payment currency

**UX Overhaul:**
- Added a confirm dialog on the listing detail page showing a clear breakdown of the purchase (item, price, seller, where money goes)
- "Already bought" detection prevents double-purchases and shows a green confirmation banner
- Order history page now explains where money went and links to Celo Explorer for on-chain verification
- Transaction tracker (bottom-right panel) polls every 3s so users see real-time status of their purchases
- Notification system (bell icon) alerts on purchase, listing creation, and cancellation events

### Current Status

The marketplace currently has **12 active listings** across CELO and G$ — including electronics, collectibles, home goods, and a Digital Art NFT priced in G$. All are real, buyable listings on Celo mainnet.

### What We're Working On Next

- **Frontend deployment** to a public URL for easy access
- **Mobile optimization** for Celo's mobile-first user base
- **Escrow integration** in the CoreMarketPlace UI for optional buyer protection
- **Community growth** — getting real users listing and trading on the platform

## Why Stracel for GoodBuilders?

G$ is a universal basic income token — Stracel gives it a place to be spent. Every listing priced in G$, every cross-currency purchase that uses G$, is a real-world use case that gives the token economic utility beyond holding. We're building the commerce layer that G$ needs.

## Links

- GitHub: https://github.com/Marvy247/StraCel
- Explorer: https://explorer.celo.org/mainnet/address/0x0Db0b61bd15B642305faDC91e3bBd6cD45ecf179
