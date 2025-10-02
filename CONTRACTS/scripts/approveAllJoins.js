import { ethers } from "ethers";
import dotenv from "dotenv";
dotenv.config();

async function main() {
    const RPC_URL = process.env.RPC_URL || "https://forno.celo-sepolia.celo-testnet.org";
    const POOL_ADDRESS = process.env.POOL_ADDRESS;
    const PRIVATE_KEY = process.env.PRIVATE_KEY; // creator's key

    if (!POOL_ADDRESS || !PRIVATE_KEY) {
        console.error("Missing env. Required: POOL_ADDRESS, PRIVATE_KEY");
        process.exit(1);
    }

    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const creator = new ethers.Wallet(PRIVATE_KEY, provider);
    console.log("creator:", creator.address);

    // Minimal ABI
    const poolAbi = [
        "function approveAllJoins()",
        "function getPendingJoinRequests() view returns (address[])",
        "function getMembers() view returns (address[])"
    ];

    const pool = new ethers.Contract(POOL_ADDRESS, poolAbi, creator);

    // Check pending
    try {
        const pending = await pool.getPendingJoinRequests();
        console.log("pending requests:", pending);
    } catch (_) {}

    try {
        console.log("approveAllJoins()...");
        const tx = await pool.approveAllJoins({ gasLimit: 400000n });
        console.log("tx:", tx.hash);
        await tx.wait();
        console.log("approveAllJoins confirmed");
    } catch (e) {
        console.error("approveAllJoins error:", e?.reason || e?.shortMessage || e?.message);
        process.exit(1);
    }

    try {
        const members = await pool.getMembers();
        console.log("members:", members);
    } catch (_) {}
}

main().then(() => process.exit(0)).catch((err) => {
    console.error(err);
    process.exit(1);
});


