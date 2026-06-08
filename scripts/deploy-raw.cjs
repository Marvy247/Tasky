// Raw deploy script — bypasses dotenvx by reading .env directly
const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

// Load private key directly
const envContent = fs.readFileSync(path.join(__dirname, "../.env"), "utf8");
const privateKey = envContent.match(/PRIVATE_KEY=(.+)/)[1].trim();

// Load compiled artifacts
function getArtifact(name) {
  const artifactPath = path.join(__dirname, `../artifacts/contracts/${name}.sol/${name}.json`);
  return JSON.parse(fs.readFileSync(artifactPath, "utf8"));
}

async function deploy(signer, name, ...args) {
  const artifact = getArtifact(name);
  const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, signer);
  const contract = await factory.deploy(...args);
  await contract.waitForDeployment();
  const address = await contract.getAddress();
  console.log(`${name.padEnd(20)} ${address}`);
  return address;
}

async function main() {
  const provider = new ethers.JsonRpcProvider("https://forno.celo.org", 42220);
  const wallet = new ethers.Wallet(privateKey, provider);
  
  console.log(`Deployer: ${wallet.address}`);
  const balance = await provider.getBalance(wallet.address);
  console.log(`Balance:  ${ethers.formatEther(balance)} CELO\n`);

  if (balance === 0n) {
    console.error("No balance! Fund the address at https://faucet.celo.org/alfajores");
    process.exit(1);
  }

  await deploy(wallet, "BSTToken");
  await deploy(wallet, "CoreMarketPlace");
  await deploy(wallet, "EscrowService");
  await deploy(wallet, "DisputeResolution");
  await deploy(wallet, "UserProfile");

  console.log("\nAll contracts deployed on Alfajores!");
}

main().catch(e => { console.error(e.message); process.exit(1); });
