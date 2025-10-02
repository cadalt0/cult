import { ethers } from "ethers";
import dotenv from "dotenv";
dotenv.config();

async function main() {
  const RPC_URL = process.env.RPC_URL || "https://forno.celo-sepolia.celo-testnet.org";
  const POOL_ADDRESS = process.env.POOL_ADDRESS;
  const PRIVATE_KEY = process.env.PRIVATE_KEY;

  if (!POOL_ADDRESS || !PRIVATE_KEY) {
    console.error("Missing env: POOL_ADDRESS, PRIVATE_KEY");
    process.exit(1);
  }

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  console.log("sender:", wallet.address);

  const poolAbi = [
    "function currentCycle() view returns (uint256)",
    "function closeBids(uint256 cycleId)",
    "function settle(uint256 cycleId)"
  ];
  const pool = new ethers.Contract(POOL_ADDRESS, poolAbi, wallet);

  const cycleId = await pool.currentCycle();
  console.log("currentCycle:", cycleId.toString());

  // Close bids (will revert if window not finished)
  try {
    console.log("closeBids(...) ...");
    const tx = await pool.closeBids(cycleId, { gasLimit: 400000n });
    console.log("closeBids tx:", tx.hash);
    await tx.wait();
    console.log("closeBids confirmed");
  } catch (e) {
    console.error("closeBids error:", e?.reason || e?.shortMessage || e?.message);
    console.error("If it's 'too early', wait until the bid window closes and retry.");
    process.exit(1);
  }

  // Settle (requires: contribution phase ended, not settled)
  try {
    console.log("settle(...) ...");
    const tx = await pool.settle(cycleId, { gasLimit: 900000n });
    console.log("settle tx:", tx.hash);
    await tx.wait();
    console.log("settle confirmed");
  } catch (e) {
    console.error("settle error:", e?.reason || e?.shortMessage || e?.message);
    console.error("If it's 'cycle not ended', wait until cycleDuration has passed and retry.");
    process.exit(1);
  }
}

main().then(()=>process.exit(0)).catch((e)=>{console.error(e);process.exit(1);});


