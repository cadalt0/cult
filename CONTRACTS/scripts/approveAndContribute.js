import { ethers } from "ethers";
import dotenv from "dotenv";
dotenv.config();

async function contributeWith(pk, label) {
  const RPC_URL = process.env.RPC_URL || "https://forno.celo-sepolia.celo-testnet.org";
  const TOKEN_ADDRESS = process.env.TOKEN_ADDRESS;
  const POOL_ADDRESS = process.env.POOL_ADDRESS;
  const DECIMALS = process.env.DECIMALS ? Number(process.env.DECIMALS) : 6;

  if (!TOKEN_ADDRESS || !POOL_ADDRESS) {
    throw new Error("Missing env: TOKEN_ADDRESS, POOL_ADDRESS");
  }

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(pk, provider);
  console.log(`${label}:`, wallet.address);

  const erc20Abi = [
    "function approve(address spender, uint256 amount) returns (bool)",
    "function decimals() view returns (uint8)",
    "function balanceOf(address) view returns (uint256)"
  ];
  const poolAbi = [
    "function getConfig() view returns (tuple(address token,uint256 contributionAmount,uint256 cycleDuration,uint256 minMembers,uint256 maxMembers,address creator))",
    "function currentCycle() view returns (uint256)",
    "function contribute(uint256 cycleId)"
  ];

  const token = new ethers.Contract(TOKEN_ADDRESS, erc20Abi, wallet);
  const pool = new ethers.Contract(POOL_ADDRESS, poolAbi, wallet);

  // Read contributionAmount from pool
  const cfg = await pool.getConfig();
  const amount = cfg.contributionAmount;
  const cycleId = await pool.currentCycle();
  console.log(`${label} target cycle:`, cycleId.toString(), `amount:`, ethers.formatUnits(amount, DECIMALS));

  // Ensure balance
  const bal = await token.balanceOf(wallet.address);
  if (bal < amount) {
    throw new Error(`${label} insufficient token balance`);
  }

  // Approve then contribute
  const tx1 = await token.approve(POOL_ADDRESS, amount, { gasLimit: 300000n });
  console.log(`${label} approve tx:`, tx1.hash);
  await tx1.wait();

  const tx2 = await pool.contribute(cycleId, { gasLimit: 400000n });
  console.log(`${label} contribute tx:`, tx2.hash);
  await tx2.wait();
  console.log(`${label} contributed for cycle`, cycleId.toString());
}

async function main() {
  const PV1 = process.env.PV1;
  const PV2 = process.env.PV2;
  if (!PV1 && !PV2) throw new Error("Provide PV1 or PV2 in env");
  if (PV1) await contributeWith(PV1, "pv1");
  if (PV2) await contributeWith(PV2, "pv2");
}

main().then(()=>process.exit(0)).catch((e)=>{console.error(e);process.exit(1);});


