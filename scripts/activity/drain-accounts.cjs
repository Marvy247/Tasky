#!/usr/bin/env node
// Drain all 100 accounts back to master wallet
// Usage: node scripts/activity/drain-accounts.cjs
const { ethers } = require("ethers");
const { withRpcFallback, deriveAccounts, getMasterWallet, NUM_ACCOUNTS, sleep } = require("./config.cjs");

const GAS_LIMIT = 21000n;

async function main() {
  const provider = await withRpcFallback(p => p.getBlockNumber().then(() => p));
  const master = getMasterWallet(provider);
  const accounts = deriveAccounts(provider);

  const block = await provider.getBlock("latest");
  const gasPrice = (block.baseFeePerGas ?? ethers.parseUnits("200", "gwei")) * 2n;
  const gasCost = GAS_LIMIT * gasPrice;

  console.log(`Draining ${NUM_ACCOUNTS} accounts → ${master.address}`);
  console.log(`Gas price: ${ethers.formatUnits(gasPrice, "gwei")} gwei\n`);

  for (let i = 1; i < NUM_ACCOUNTS; i++) { // skip account 0 (master)
    const wallet = accounts[i].connect(provider);
    const bal = await provider.getBalance(wallet.address);
    const sendAmount = bal - gasCost;

    if (sendAmount <= 0n) {
      console.log(`Account ${i}: skipped (${ethers.formatEther(bal)} CELO)`);
      continue;
    }

    try {
      const tx = await wallet.sendTransaction({
        to: master.address,
        value: sendAmount,
        gasLimit: GAS_LIMIT,
        gasPrice,
      });
      console.log(`✅ Account ${i}: drained ${ethers.formatEther(sendAmount)} CELO → ${tx.hash}`);
    } catch (e) {
      console.error(`❌ Account ${i}: ${e.message?.slice(0, 80)}`);
    }
    await sleep(300);
  }

  const finalBal = await provider.getBalance(master.address);
  console.log(`\nMaster balance: ${ethers.formatEther(finalBal)} CELO\nDone!`);
}

main().catch(e => { console.error(e.message); process.exit(1); });
