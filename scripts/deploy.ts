import { ethers } from "hardhat";

const G_DOLLAR = "0x62b8B11039FCFe5Ab0c56E502B1c372A3d462a4b"; // G$ on Celo mainnet

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log(`Deploying with: ${deployer.address}`);
  console.log(`Balance: ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} CELO\n`);

  const BSTToken = await ethers.deployContract("BSTToken");
  await BSTToken.waitForDeployment();
  console.log(`BSTToken:          ${await BSTToken.getAddress()}`);

  const CoreMarketPlace = await ethers.deployContract("CoreMarketPlace", [G_DOLLAR]);
  await CoreMarketPlace.waitForDeployment();
  console.log(`CoreMarketPlace:   ${await CoreMarketPlace.getAddress()}`);

  const EscrowService = await ethers.deployContract("EscrowService", [G_DOLLAR]);
  await EscrowService.waitForDeployment();
  console.log(`EscrowService:     ${await EscrowService.getAddress()}`);

  const DisputeResolution = await ethers.deployContract("DisputeResolution");
  await DisputeResolution.waitForDeployment();
  console.log(`DisputeResolution: ${await DisputeResolution.getAddress()}`);

  const UserProfile = await ethers.deployContract("UserProfile");
  await UserProfile.waitForDeployment();
  console.log(`UserProfile:       ${await UserProfile.getAddress()}`);

  console.log("\nAll contracts deployed!");
  console.log(`G$ integration: ${G_DOLLAR}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
