const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("==================================================");
  console.log(" Deploying IntraVote Blockchain Smart Contract...");
  console.log("==================================================");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contract with account:", deployer.address);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(balance), "ETH");

  const IntraVote = await hre.ethers.getContractFactory("IntraVote");
  const intraVote = await IntraVote.deploy();
  await intraVote.waitForDeployment();

  const contractAddress = await intraVote.getAddress();
  console.log(">>> IntraVote Contract successfully deployed to:", contractAddress);

  // Read the compiled contract artifact to extract the ABI
  const artifactPath = path.join(__dirname, "..", "artifacts", "contracts", "IntraVote.sol", "IntraVote.json");
  let abi = [];
  if (fs.existsSync(artifactPath)) {
    const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
    abi = artifact.abi;
  }

  // Export config to frontend
  const outputDir = path.join(__dirname, "..", "src", "contracts");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const configData = {
    address: contractAddress,
    network: hre.network.name,
    chainId: hre.network.config.chainId || 31337,
    deployedAt: new Date().toISOString(),
    abi: abi
  };

  const outputPath = path.join(outputDir, "contractConfig.json");
  fs.writeFileSync(outputPath, JSON.stringify(configData, null, 2));
  console.log(">>> Contract config & ABI saved to:", outputPath);
  console.log("==================================================");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error during deployment:", error);
    process.exit(1);
  });
