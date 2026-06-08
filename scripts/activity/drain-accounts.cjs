#!/usr/bin/env node
/**
 * Drain all 100 accounts back to master wallet
 * Usage: node scripts/activity/drain-accounts.cjs
 * Requires MNEMONIC in .env
 */
const { ethers } = require("ethers");
const { getProvider, deriveAccounts, getMasterWallet, NUM_ACCOUNTS, sleep } = require("./config.cjs");

const GAS_LIMIT = 21000n;
const GAS_PRICE = ethers.parseUnits("1", "gwei");
const GAS_COST = GAS_LIMIT * GAS_PRICE;

async function main() {
  const provider = getProvider();
  const master = getMasterWallet(provider);
  const accounts = deriveAccounts(provider);

  console.log(`Draining ${NUM_ACCOUNTS} accounts → ${master.address}\n`);

  for (let i = 0; i < NUM_ACCOUNTS; i++) {
    const wallet = accounts[i];
    const bal = await provider.getBalance(wallet.address);
    const sendAmount = bal - GAS_COST;

    if (sendAmount <= 0n) {
      console.log(`Account ${i}: ${wallet.address} — skipped (${ethers.formatEther(bal)} CELO)`);
      continue;
    }

    try {
      const tx = await wallet.sendTransaction({
        to: master.address,
        value: sendAmount,
        gasLimit: GAS_LIMIT,
        gasPrice: GAS_PRICE,
      });
      console.log(`✅ Account ${i}: ${wallet.address} — drained ${ethers.formatEther(sendAmount)} CELO (${tx.hash})`);
    } catch (e) {
      console.error(`❌ Account ${i}: ${wallet.address} — ${e.message?.slice(0, 60)}`);
    }
    await sleep(500);
  }
  console.log("\nDone!");
}

main().catch(e => { console.error(e.message); process.exit(1); });
