import { ethers } from "ethers";
import dotenv from "dotenv";
dotenv.config();

async function main() {
    const RPC_URL = process.env.RPC_URL || "https://forno.celo-sepolia.celo-testnet.org";
    const TOKEN_ADDRESS = process.env.TOKEN_ADDRESS; // not required for requestJoin; loaded per request
    const POOL_ADDRESS = process.env.POOL_ADDRESS;
    const PV1 = process.env.PV1;
    const PV2 = process.env.PV2;

    if (!POOL_ADDRESS || !PV1 || !PV2) {
        console.error("Missing env. Required: POOL_ADDRESS, PV1, PV2. Optional: TOKEN_ADDRESS");
        process.exit(1);
    }

    const provider = new ethers.JsonRpcProvider(RPC_URL);

    const poolAbi = [
        "function requestJoin()",
        "function getStatus() view returns (uint8)",
        "function getMembers() view returns (address[])"
    ];

    // Wallets
    const w1 = new ethers.Wallet(PV1, provider);
    const w2 = new ethers.Wallet(PV2, provider);
    console.log("pv1:", w1.address);
    console.log("pv2:", w2.address);

    // Basic sanity
    const net = await provider.getNetwork();
    console.log("chainId:", Number(net.chainId));
    const code = await provider.getCode(POOL_ADDRESS);
    if (!code || code === "0x") {
        console.error("POOL_ADDRESS has no contract code:", POOL_ADDRESS);
        process.exit(1);
    }

    const pool1 = new ethers.Contract(POOL_ADDRESS, poolAbi, w1);
    const pool2 = new ethers.Contract(POOL_ADDRESS, poolAbi, w2);

    // Submit join requests sequentially for clearer logs
    try {
        console.log("pv1 -> requestJoin()...");
        const tx1 = await pool1.requestJoin({ gasLimit: 300000n });
        console.log("tx1:", tx1.hash);
        await tx1.wait();
        console.log("pv1 requestJoin confirmed");
    } catch (e) {
        console.error("pv1 requestJoin error:", e?.reason || e?.shortMessage || e?.message);
    }

    try {
        console.log("pv2 -> requestJoin()...");
        const tx2 = await pool2.requestJoin({ gasLimit: 300000n });
        console.log("tx2:", tx2.hash);
        await tx2.wait();
        console.log("pv2 requestJoin confirmed");
    } catch (e) {
        console.error("pv2 requestJoin error:", e?.reason || e?.shortMessage || e?.message);
    }

    // Optional: show members after
    try {
        const poolRead = new ethers.Contract(POOL_ADDRESS, poolAbi, provider);
        const members = await poolRead.getMembers();
        console.log("current members (may still be empty until creator approves):", members);
    } catch (_) {}
}

main().then(() => process.exit(0)).catch((err) => {
    console.error(err);
    process.exit(1);
});


