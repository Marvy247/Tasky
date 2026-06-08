#!/usr/bin/env node
/**
 * Celo Activity Generator — interacts with deployed Strade contracts
 * Rotates through 100 accounts making contract calls each run
 * Usage: node scripts/activity/generate-activity.cjs
 * Requires MNEMONIC in .env
 */
const { ethers } = require("ethers");
const { getProvider, deriveAccounts, CONTRACT_ADDRESSES, ABIS, NUM_ACCOUNTS, rand, sleep } = require("./config.cjs");

const DRY_RUN = false;
const GAS_PRICE = ethers.parseUnits("10", "gwei"); // elevated for Talent Protocol ranking

async function sendTx(wallet, contractName, fn, args, value = 0n) {
  const contract = new ethers.Contract(CONTRACT_ADDRESSES[contractName], ABIS[contractName], wallet);
  console.log(`[${wallet.address.slice(0,8)}] ${contractName}.${fn}`);
  if (DRY_RUN) { console.log("  DRY-RUN: skipped"); return; }
  try {
    const tx = await contract[fn](...args, { gasPrice: GAS_PRICE, ...(value ? { value } : {}) });
    console.log(`  ✅ ${tx.hash}`);
  } catch (e) {
    console.error(`  ❌ ${e.message?.slice(0, 80)}`);
  }
}

async function main() {
  const provider = getProvider();
  const accounts = deriveAccounts(provider);

  // Check balances and filter usable accounts
  console.log("Checking accounts...\n");
  const active = [];
  for (let i = 0; i < NUM_ACCOUNTS; i++) {
    const bal = await provider.getBalance(accounts[i].address);
    if (bal >= ethers.parseEther("0.01")) active.push(accounts[i]);
    await sleep(200);
  }
  console.log(`Using ${active.length}/${NUM_ACCOUNTS} funded accounts\nDRY_RUN=${DRY_RUN}\n`);
  if (active.length === 0) { console.log("No funded accounts. Run fund-accounts.cjs first."); return; }

  // One call per account, rotating through different contract functions
  const calls = [
    (w, i) => sendTx(w, "UserProfile", "updateProfile", [`Bio ${rand()}`, `${rand()}@test.com`]),
    (w, i) => sendTx(w, "CoreMarketPlace", "createListing", [`Item ${rand()}`, `Desc ${rand()}`, ethers.parseEther("0.01"), 1000n]),
    (w, i) => sendTx(w, "CoreMarketPlace", "updateListing", [1n, ethers.parseEther("0.02"), `Updated ${rand()}`]),
    (w, i) => sendTx(w, "UserProfile", "rateUser", [active[(i + 1) % active.length].address, BigInt(Math.floor(Math.random() * 5) + 1)]),
    (w, i) => sendTx(w, "UserProfile", "calculateReputation", [w.address]),
    (w, i) => sendTx(w, "EscrowService", "createEscrow", [active[(i + 1) % active.length].address], ethers.parseEther("0.005")),
  ];

  // Ensure all accounts are registered first
  const userProfile = new ethers.Contract(CONTRACT_ADDRESSES.UserProfile, ABIS.UserProfile, provider);
  for (let i = 0; i < active.length; i++) {
    const isReg = await userProfile.registered(active[i].address);
    if (!isReg) {
      await sendTx(active[i], "UserProfile", "registerUser", [`user${rand()}`, `Bio ${rand()}`, `${rand()}@test.com`]);
      await sleep(1000);
    }
  }

  for (let i = 0; i < active.length; i++) {
    await calls[i % calls.length](active[i], i);
    await sleep(500);
  }

  console.log("\nDone!");
}

main().catch(e => { console.error(e.message); process.exit(1); });
