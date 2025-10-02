import { ethers } from "ethers";
import dotenv from "dotenv";
dotenv.config();

async function main() {
    const RPC_URL = process.env.RPC_URL || "https://forno.celo-sepolia.celo-testnet.org";
    const POOL_ADDRESS = process.env.POOL_ADDRESS;
    const PRIVATE_KEY = process.env.PRIVATE_KEY; // creator key

    if (!POOL_ADDRESS || !PRIVATE_KEY) {
        console.error("Missing env. Required: POOL_ADDRESS, PRIVATE_KEY");
        process.exit(1);
    }

    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const creator = new ethers.Wallet(PRIVATE_KEY, provider);
    console.log("creator:", creator.address);

    const poolAbi = [
        "function start()",
        "function getStatus() view returns (uint8)",
        "function getMembers() view returns (address[])",
        "function currentCycle() view returns (uint256)"
    ];

    const pool = new ethers.Contract(POOL_ADDRESS, poolAbi, creator);

    try {
        const status = await pool.getStatus();
        const members = await pool.getMembers();
        console.log("status (0 Created, 1 Active):", Number(status));
        console.log("members:", members.length);
    } catch (_) {}

    try {
        console.log("start() ...");
        const tx = await pool.start({ gasLimit: 400000n });
        console.log("tx:", tx.hash);
        const rc = await tx.wait();
        console.log("start confirmed in block:", rc.blockNumber);
    } catch (e) {
        console.error("start() error:", e?.reason || e?.shortMessage || e?.message);
        process.exit(1);
    }

    try {
        const cycle = await pool.currentCycle();
        const status2 = await pool.getStatus();
        console.log("currentCycle:", cycle.toString());
        console.log("status now:", Number(status2));
    } catch (_) {}
}

main().then(() => process.exit(0)).catch((err) => {
    console.error(err);
    process.exit(1);
});


