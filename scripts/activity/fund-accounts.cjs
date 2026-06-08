#!/usr/bin/env node
/**
 * Fund 100 derived accounts from master wallet
 * Usage: node scripts/activity/fund-accounts.cjs
 * Requires MNEMONIC in .env
 */
const { ethers } = require("ethers");
const { getProvider, deriveAccounts, getMasterWallet, NUM_ACCOUNTS, sleep } = require("./config.cjs");

const FUND_AMOUNT = ethers.parseEther("0.05"); // 0.05 CELO each = 5 CELO total
const MIN_BALANCE = ethers.parseEther("0.02");

async function main() {
  const provider = getProvider();
  const master = getMasterWallet(provider);
  const accounts = deriveAccounts(provider);

  const masterBal = await provider.getBalance(master.address);
  console.log(`Master: ${master.address} — ${ethers.formatEther(masterBal)} CELO\n`);

  let nonce = await provider.getTransactionCount(master.address);

  for (let i = 0; i < NUM_ACCOUNTS; i++) {
    const addr = accounts[i].address;
    const bal = await provider.getBalance(addr);
    if (bal >= MIN_BALANCE) {
      console.log(`Account ${i}: ${addr} — ${ethers.formatEther(bal)} CELO OK`);
      continue;
    }

    const tx = await master.sendTransaction({
      to: addr,
      value: FUND_AMOUNT,
      nonce: nonce++,
    });
    console.log(`✅ Account ${i}: ${addr} — funded 0.05 CELO (${tx.hash})`);
    await sleep(500);
  }
  console.log("\nDone!");
}

main().catch(e => { console.error(e.message); process.exit(1); });
