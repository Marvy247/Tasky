#!/usr/bin/env node
/**
 * Celo Activity Generator — interacts with deployed Stracel contracts
 * One wallet per run, rotated by minute across 100 derived accounts.
 * Usage: node scripts/activity/generate-activity.cjs
 * Requires MNEMONIC in .env
 */
const { ethers } = require("ethers");
const { deriveAccounts, getMasterWallet, CONTRACT_ADDRESSES, ABIS, NUM_ACCOUNTS, rand, sleep } = require("./config.cjs");

const RPCS = ["https://forno.celo.org", "https://rpc.ankr.com/celo", "https://celo.drpc.org", "https://1rpc.io/celo"];
const BATCH_SIZE = 10; // wallets per run
const EXPLORER = "https://explorer.celo.org/mainnet/tx";

async function withRetry(fn) {
  for (const rpc of RPCS) {
    try { return await fn(rpc); } catch (e) {
      console.warn(`  ⚠ ${rpc}: ${e.shortMessage ?? e.message?.slice(0, 60)}`);
    }
  }
  throw new Error("All RPCs failed");
}

async function sendTx(wallet, contractName, fn, args, value) {
  const contract = new ethers.Contract(CONTRACT_ADDRESSES[contractName], ABIS[contractName], wallet);
  console.log(`[${wallet.address.slice(0, 10)}] ${contractName}.${fn}`);
  try {
    const overrides = value ? { value } : {};
    const tx = await contract[fn](...args, overrides);
    console.log(`  ✅ ${EXPLORER}/${tx.hash}`);
    await sleep(2000);
  } catch (e) {
    const msg = e.message ?? '';
    if (msg.includes('nonce has already been used')) {
      console.log(`  ✅ (tx already mined)`);
      return;
    }
    console.error(`  ❌ [${contractName}.${fn}] ${e.shortMessage ?? msg.slice(0, 80)}`);
  }
}

async function runWallet(accounts, idx) {
  const provider = new ethers.JsonRpcProvider(RPCS[0], 42220);
  const wallet = accounts[idx].connect(provider);

  console.log(`\n[${new Date().toISOString()}] Wallet [${idx}]: ${wallet.address}`);

  let balance;
  try {
    balance = await withRetry(rpc =>
      new ethers.JsonRpcProvider(rpc, 42220).getBalance(wallet.address)
    );
  } catch (e) {
    console.error(`  ❌ Could not fetch balance: ${e.message?.slice(0, 60)}`);
    return;
  }

  console.log(`  Balance: ${ethers.formatEther(balance)} CELO`);
  if (balance < ethers.parseEther("0.01")) {
    console.log(`  ⚠️  Low balance — skipping`);
    return;
  }

  const isReg = await withRetry(rpc =>
    new ethers.Contract(CONTRACT_ADDRESSES.UserProfile, ABIS.UserProfile, new ethers.JsonRpcProvider(rpc, 42220))
      .registered(wallet.address)
  );
  if (!isReg) {
    const contract = new ethers.Contract(CONTRACT_ADDRESSES.UserProfile, ABIS.UserProfile, wallet);
    console.log(`[${wallet.address.slice(0, 10)}] UserProfile.registerUser`);
    try {
      const tx = await contract.registerUser(`user${rand()}`, `Bio ${rand()}`, `${rand()}@test.com`);
      console.log(`  ✅ ${EXPLORER}/${tx.hash}`);
      await tx.wait();
    } catch (e) {
      const msg = e.message ?? '';
      if (!msg.includes('AlreadyRegistered') && !msg.includes('nonce has already been used')) {
        console.error(`  ❌ ${e.shortMessage ?? msg.slice(0, 80)}`);
        return;
      }
    }
  }

  const neighbor = accounts[(idx + 1) % NUM_ACCOUNTS].address;
  const actions = [
    () => sendTx(wallet, "UserProfile", "updateProfile", [`Bio ${rand()}`, `${rand()}@test.com`]),
    () => sendTx(wallet, "CoreMarketPlace", "createListing", [`Item ${rand()}`, `Desc ${rand()}`, ethers.parseEther("0.01"), 1000n]),
    () => sendTx(wallet, "UserProfile", "rateUser", [neighbor, BigInt(Math.floor(Math.random() * 5) + 1)]),
    () => sendTx(wallet, "UserProfile", "calculateReputation", [wallet.address]),
    () => sendTx(wallet, "EscrowService", "createEscrow", [neighbor], ethers.parseEther("0.005")),
  ];
  await actions[idx % actions.length]();
}

async function main() {
  const provider = new ethers.JsonRpcProvider(RPCS[0], 42220);
  const accounts = deriveAccounts(provider);

  // Run a batch of BATCH_SIZE wallets, offset rotating by run
  const startIndex = (Math.floor(Date.now() / 1000 / 60) * BATCH_SIZE) % NUM_ACCOUNTS;
  const indices = Array.from({ length: BATCH_SIZE }, (_, i) => (startIndex + i) % NUM_ACCOUNTS);

  console.log(`Running wallets [${indices[0]}–${indices[indices.length - 1]}] of ${NUM_ACCOUNTS}`);
  for (const idx of indices) {
    await runWallet(accounts, idx);
    await sleep(500);
  }
  console.log(`\nDone! ${indices.length} wallets processed.`);
}

main().catch(e => { console.error(e.message); process.exit(1); });
