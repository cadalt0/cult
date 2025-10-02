import { ethers } from "ethers";
import dotenv from "dotenv";
dotenv.config();

async function main() {
    // Load from environment variables
    const TOKEN_ADDRESS = process.env.TOKEN_ADDRESS;
    const FACTORY_ADDRESS = process.env.FACTORY_ADDRESS;
    const PRIVATE_KEY = process.env.PRIVATE_KEY;

    if (!TOKEN_ADDRESS || !FACTORY_ADDRESS || !PRIVATE_KEY) {
        console.error("Missing required environment variables:");
        console.error("- TOKEN_ADDRESS");
        console.error("- FACTORY_ADDRESS");
        console.error("- PRIVATE_KEY");
        process.exit(1);
    }

    // Use public Celo Sepolia RPC
    const provider = new ethers.JsonRpcProvider("https://forno.celo-sepolia.celo-testnet.org");
    
    // Create wallet from private key
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    console.log("Using wallet:", wallet.address);

    // Network + sanity checks
    const net = await provider.getNetwork();
    console.log("Network chainId:", Number(net.chainId));
    if (!ethers.isAddress(TOKEN_ADDRESS)) {
        console.error("Invalid TOKEN_ADDRESS format:", TOKEN_ADDRESS);
        process.exit(1);
    }
    if (!ethers.isAddress(FACTORY_ADDRESS)) {
        console.error("Invalid FACTORY_ADDRESS format:", FACTORY_ADDRESS);
        process.exit(1);
    }

    // Minimal ABI just for encoding/decoding; no local artifacts.
    const abi = [
        // Named tuple components so we can pass an object (matches Remix behavior)
        "function createPool((address token,uint256 contributionAmount,uint256 cycleDuration,uint256 minMembers,uint256 maxMembers,address creator)) returns (address)",
        "event PoolCreated(address indexed creator, address pool, (address token,uint256 contributionAmount,uint256 cycleDuration,uint256 minMembers,uint256 maxMembers,address creator) config)"
    ];
    const factory = new ethers.Contract(FACTORY_ADDRESS, abi, wallet);

    // Preflight: ensure factory address has code
    const code = await provider.getCode(FACTORY_ADDRESS);
    console.log("Factory code length:", (code?.length || 0));
    if (!code || code === "0x") {
        console.error("Factory address has no contract code. Check FACTORY_ADDRESS.");
        process.exit(1);
    }
    const tokenCode = await provider.getCode(TOKEN_ADDRESS);
    console.log("Token code length:", (tokenCode?.length || 0), tokenCode === "0x" ? "(no code)" : "");

    // Build config object (named fields) – this is exactly what Remix encodes
    const poolConfig = {
        token: TOKEN_ADDRESS,
        contributionAmount: ethers.parseUnits("100", 6),
        cycleDuration: 300,
        minMembers: 2,
        maxMembers: 5,
        creator: wallet.address
    };

    console.log("Creating pool with config:");
    console.log("- Token:", poolConfig.token);
    console.log("- Contribution Amount:", ethers.formatUnits(poolConfig.contributionAmount, 6), "tokens");
    console.log("- Cycle Duration:", poolConfig.cycleDuration, "seconds");
    console.log("- Min Members:", poolConfig.minMembers);
    console.log("- Max Members:", poolConfig.maxMembers);
    console.log("- Creator:", poolConfig.creator);

    try {
        // Create pool
        console.log("\nCreating pool...");
        
        // Dry-run to capture revert reason (no state change)
        try {
            await factory.createPool.staticCall(poolConfig);
            console.log("staticCall passed (no revert)");
        } catch (e) {
            console.error("staticCall revert:", e?.reason || e?.shortMessage || e?.message);
        }

        // Send using Contract with named tuple (mirrors Remix encoding)
        const tx = await factory.createPool(poolConfig, { gasLimit: 4000000n });
        console.log("Transaction hash:", tx.hash);
        
        // Wait for confirmation
        const receipt = await tx.wait();
        console.log("Transaction confirmed in block:", receipt.blockNumber);

        // Parse PoolCreated event
        let poolAddress = null;
        for (const log of receipt.logs) {
            if (log.address.toLowerCase() !== FACTORY_ADDRESS.toLowerCase()) continue;
            try {
                const parsed = factory.interface.parseLog(log);
                if (parsed && parsed.name === "PoolCreated") {
                    poolAddress = parsed.args.pool;
                    break;
                }
            } catch (_) {}
        }

        if (poolAddress) {
            console.log("\n✅ Pool created successfully!");
            console.log("Pool Address:", poolAddress);
        } else {
            console.log("Pool created but couldn't extract address from event");
        }

    } catch (error) {
        console.error("Error creating pool:", error.message);
        process.exit(1);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
