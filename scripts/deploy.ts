import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log(`Deploying with: ${deployer.address}`);
  console.log(`Balance: ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} CELO\n`);

  const BSTToken = await ethers.deployContract("BSTToken");
  await BSTToken.waitForDeployment();
  console.log(`BSTToken:          ${await BSTToken.getAddress()}`);

  const CoreMarketPlace = await ethers.deployContract("CoreMarketPlace");
  await CoreMarketPlace.waitForDeployment();
  console.log(`CoreMarketPlace:   ${await CoreMarketPlace.getAddress()}`);

  const EscrowService = await ethers.deployContract("EscrowService");
  await EscrowService.waitForDeployment();
  console.log(`EscrowService:     ${await EscrowService.getAddress()}`);

  const DisputeResolution = await ethers.deployContract("DisputeResolution");
  await DisputeResolution.waitForDeployment();
  console.log(`DisputeResolution: ${await DisputeResolution.getAddress()}`);

  const UserProfile = await ethers.deployContract("UserProfile");
  await UserProfile.waitForDeployment();
  console.log(`UserProfile:       ${await UserProfile.getAddress()}`);

  console.log("\nAll contracts deployed!");
}

main().catch((e) => { console.error(e); process.exit(1); });
