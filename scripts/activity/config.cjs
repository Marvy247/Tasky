// Shared config for Celo activity scripts
const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

const envContent = fs.readFileSync(path.join(__dirname, "../../.env"), "utf8");
const PRIVATE_KEY = envContent.match(/PRIVATE_KEY=(.+)/)[1].trim();
const MNEMONIC = envContent.match(/MNEMONIC=(.+)/)?.[1]?.trim();

const CHAIN_ID = 42220;
const NUM_ACCOUNTS = 100;

const RPCS = [
  "https://forno.celo.org",
  "https://rpc.ankr.com/celo",
  "https://celo.drpc.org",
  "https://1rpc.io/celo",
];

function getProvider() {
  return new ethers.JsonRpcProvider(RPCS[0], CHAIN_ID);
}

async function getWorkingProvider() {
  for (const url of RPCS) {
    try {
      const p = new ethers.JsonRpcProvider(url, CHAIN_ID);
      await p.getBlockNumber();
      return p;
    } catch {}
  }
  throw new Error("All RPCs unreachable");
}

// Wraps a provider call with per-RPC fallback on transient errors
async function withRpcFallback(fn) {
  for (const url of RPCS) {
    try {
      const p = new ethers.JsonRpcProvider(url, CHAIN_ID);
      return await fn(p);
    } catch (e) {
      const msg = e.message ?? '';
      if (msg.includes('Temporary') || msg.includes('timeout') || msg.includes('ETIMEDOUT')) continue;
      throw e; // non-transient error, don't retry
    }
  }
  throw new Error("All RPCs failed");
}

const CONTRACT_ADDRESSES = {
  BSTToken:          "0x6cD3F87568F742A8211bDabe9FC9bf0c078Fab37",
  CoreMarketPlace:   "0xc15522d3DE1654D67342F47f8E45c59Cf622eD55",
  EscrowService:     "0xB85F9C01f5557BA8E4e78859Ec37C8b5f41cbc21",
  DisputeResolution: "0x6eb97d321176F25A8661F67C285B277EC5cbc7F5",
  UserProfile:       "0x57A20C3C4BC8C01aF6ed7288574e972d889420c0",
};

const ABIS = {
  UserProfile: [
    "function registerUser(string,string,string) external",
    "function updateProfile(string,string) external",
    "function rateUser(address,uint256) external",
    "function calculateReputation(address) external",
    "function registered(address) view returns (bool)",
  ],
  CoreMarketPlace: [
    "function createListing(string,string,uint256,uint256) external returns (uint256)",
    "function updateListing(uint256,uint256,string) external",
  ],
  EscrowService: [
    "function createEscrow(address) external payable returns (uint256)",
  ],
};

function deriveAccounts(provider) {
  if (!MNEMONIC) throw new Error("MNEMONIC not set in .env");
  const accounts = [];
  for (let i = 0; i < NUM_ACCOUNTS; i++) {
    const wallet = ethers.HDNodeWallet.fromMnemonic(
      ethers.Mnemonic.fromPhrase(MNEMONIC),
      `m/44'/60'/0'/0/${i}`
    ).connect(provider);
    accounts.push(wallet);
  }
  return accounts;
}

function getMasterWallet(provider) {
  return new ethers.Wallet(PRIVATE_KEY, provider);
}

function rand() {
  return Math.random().toString(36).slice(2, 8);
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

module.exports = { getProvider, getWorkingProvider, withRpcFallback, deriveAccounts, getMasterWallet, CONTRACT_ADDRESSES, ABIS, NUM_ACCOUNTS, rand, sleep };
