#!/usr/bin/env node
/**
 * Fund 99 derived accounts evenly from master wallet (account 0).
 * Keeps 2 CELO on master for gas, splits the rest equally.
 * Usage: node scripts/activity/fund-accounts.cjs
 */
const { ethers } = require("ethers");
const { getWorkingProvider, withRpcFallback, deriveAccounts, getMasterWallet, NUM_ACCOUNTS, sleep } = require("./config.cjs");

const MASTER_RESERVE = ethers.parseEther("2");
const MIN_TOPUP = ethers.parseEther("0.001"); // skip dust top-ups

async function getBalance(address) {
  return withRpcFallback(p => p.getBalance(address));
}

async function main() {
  const provider = await getWorkingProvider();
  const master = getMasterWallet(provider);
  const accounts = deriveAccounts(provider);

  const masterBal = await getBalance(master.address);
  console.log(`Master: ${master.address} — ${ethers.formatEther(masterBal)} CELO\n`);

  const targets = accounts.slice(1); // accounts 1–99

  let existingTotal = 0n;
  const balances = [];
  for (const acc of targets) {
    const bal = await getBalance(acc.address);
    balances.push(bal);
    existingTotal += bal;
    await sleep(100);
  }

  const distributable = masterBal + existingTotal - MASTER_RESERVE;
  const targetPerAccount = distributable / BigInt(targets.length);

  console.log(`Distributable: ${ethers.formatEther(distributable)} CELO`);
  console.log(`Target per account: ${ethers.formatEther(targetPerAccount)} CELO (~${(Number(ethers.formatEther(targetPerAccount))).toFixed(4)} CELO)\n`);

  let nonce = await provider.getTransactionCount(master.address);

  for (let i = 0; i < targets.length; i++) {
    const addr = targets[i].address;
    const current = balances[i];
    if (current >= targetPerAccount) {      console.log(`Account ${i + 1}: ${addr} — ${ethers.formatEther(current)} CELO OK`);
      continue;
    }
    const topUp = targetPerAccount - current;
    if (topUp < MIN_TOPUP) {
      console.log(`Account ${i + 1}: ${addr} — skipping dust top-up (${ethers.formatEther(topUp)} CELO)`);
      continue;
    }
    const tx = await master.sendTransaction({ to: addr, value: topUp, nonce: nonce++ });
    console.log(`✅ Account ${i + 1}: ${addr} — +${ethers.formatEther(topUp)} CELO → ${tx.hash}`);
    await sleep(300);
  }

  const finalBal = await getBalance(master.address);
  const totalSent = masterBal - finalBal;
  console.log(`\nTotal sent: ${ethers.formatEther(totalSent)} CELO`);
  console.log(`Master remaining: ${ethers.formatEther(finalBal)} CELO\nDone!`);
}

main().catch(e => { console.error(e.message); process.exit(1); });
