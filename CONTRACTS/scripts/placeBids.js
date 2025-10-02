import { ethers } from "ethers";
import dotenv from "dotenv";
dotenv.config();

async function bidWith(pk, label, percent) {
  const RPC_URL = process.env.RPC_URL || "https://forno.celo-sepolia.celo-testnet.org";
  const POOL_ADDRESS = process.env.POOL_ADDRESS;
  const DECIMALS = process.env.DECIMALS ? Number(process.env.DECIMALS) : 6;
  if (!POOL_ADDRESS) throw new Error("Missing env: POOL_ADDRESS");

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(pk, provider);
  console.log(`${label}:`, wallet.address, `bid: ${percent}%`);

  const poolAbi = [
    "function getConfig() view returns (tuple(address token,uint256 contributionAmount,uint256 cycleDuration,uint256 minMembers,uint256 maxMembers,address creator))",
    "function currentCycle() view returns (uint256)",
    "function placeBid(uint256 cycleId, uint256 amount)",
    "function hasPaid(uint256 cycleId, address user) view returns (bool)"
  ];
  const pool = new ethers.Contract(POOL_ADDRESS, poolAbi, wallet);

  const cfg = await pool.getConfig();
  const cycleId = await pool.currentCycle();
  const contributed = await pool.hasPaid(cycleId, wallet.address);
  if (!contributed) throw new Error(`${label} has not contributed in cycle ${cycleId}`);

  const contributionAmount = cfg.contributionAmount; // in base units
  const bidAmount = (contributionAmount * BigInt(percent)) / 100n;
  console.log(`${label} bidding amount:`, ethers.formatUnits(bidAmount, DECIMALS));

  const tx = await pool.placeBid(cycleId, bidAmount, { gasLimit: 400000n });
  console.log(`${label} bid tx:`, tx.hash);
  await tx.wait();
  console.log(`${label} bid confirmed`);
}

async function main() {
  const PV1 = process.env.PV1;
  const PV2 = process.env.PV2;
  if (!PV1 || !PV2) throw new Error("Provide PV1 and PV2 in env");
  // pv1 -> 65%, pv2 -> 81%
  await bidWith(PV1, "pv1", 65);
  await bidWith(PV2, "pv2", 81);
}

main().then(()=>process.exit(0)).catch((e)=>{console.error(e);process.exit(1);});


