import { NextRequest, NextResponse } from 'next/server'
import { ethers } from "ethers"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { contributionAmount, maxMembers } = body

    // Validate input
    if (!contributionAmount || !maxMembers) {
      return NextResponse.json(
        { error: 'Missing required fields: contributionAmount, maxMembers' },
        { status: 400 }
      )
    }

    // Load from environment variables
    const TOKEN_ADDRESS = process.env.NEXT_PUBLIC_TOKEN_ADDRESS
    const FACTORY_ADDRESS = process.env.NEXT_PUBLIC_FACTORY_ADDRESS
    const PRIVATE_KEY = process.env.PRIVATE_KEY

    if (!TOKEN_ADDRESS || !FACTORY_ADDRESS || !PRIVATE_KEY) {
      return NextResponse.json(
        { error: 'Missing required environment variables: TOKEN_ADDRESS, FACTORY_ADDRESS, PRIVATE_KEY' },
        { status: 500 }
      )
    }

    // Use public Celo Sepolia RPC
    const provider = new ethers.JsonRpcProvider("https://forno.celo-sepolia.celo-testnet.org")
    
    // Create wallet from private key
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider)
    console.log("Using wallet:", wallet.address)

    // Network + sanity checks
    const net = await provider.getNetwork()
    console.log("Network chainId:", Number(net.chainId))
    
    if (!ethers.isAddress(TOKEN_ADDRESS)) {
      return NextResponse.json(
        { error: 'Invalid TOKEN_ADDRESS format: ' + TOKEN_ADDRESS },
        { status: 400 }
      )
    }
    if (!ethers.isAddress(FACTORY_ADDRESS)) {
      return NextResponse.json(
        { error: 'Invalid FACTORY_ADDRESS format: ' + FACTORY_ADDRESS },
        { status: 400 }
      )
    }

    // Minimal ABI just for encoding/decoding
    const abi = [
      "function createPool((address token,uint256 contributionAmount,uint256 cycleDuration,uint256 minMembers,uint256 maxMembers,address creator)) returns (address)",
      "event PoolCreated(address indexed creator, address pool, (address token,uint256 contributionAmount,uint256 cycleDuration,uint256 minMembers,uint256 maxMembers,address creator) config)"
    ]
    const factory = new ethers.Contract(FACTORY_ADDRESS, abi, wallet)

    // Preflight: ensure factory address has code
    const code = await provider.getCode(FACTORY_ADDRESS)
    console.log("Factory code length:", (code?.length || 0))
    if (!code || code === "0x") {
      return NextResponse.json(
        { error: 'Factory address has no contract code. Check FACTORY_ADDRESS.' },
        { status: 400 }
      )
    }

    // Build config object with data from UI
    const poolConfig = {
      token: TOKEN_ADDRESS,
      contributionAmount: ethers.parseUnits(contributionAmount.toString(), 6), // Convert to 6 decimals
      cycleDuration: 300, // Hardcoded: 5 minutes
      minMembers: 2, // Hardcoded minimum
      maxMembers: parseInt(maxMembers), // From UI
      creator: wallet.address
    }

    console.log("Creating pool with config:")
    console.log("- Token:", poolConfig.token)
    console.log("- Contribution Amount:", ethers.formatUnits(poolConfig.contributionAmount, 6), "tokens")
    console.log("- Cycle Duration:", poolConfig.cycleDuration, "seconds")
    console.log("- Min Members:", poolConfig.minMembers)
    console.log("- Max Members:", poolConfig.maxMembers)
    console.log("- Creator:", poolConfig.creator)

    // Create pool
    console.log("\nCreating pool...")
    
    // Dry-run to capture revert reason (no state change)
    try {
      await factory.createPool.staticCall(poolConfig)
      console.log("staticCall passed (no revert)")
    } catch (e: any) {
      console.error("staticCall revert:", e?.reason || e?.shortMessage || e?.message)
      return NextResponse.json(
        { error: 'Transaction would fail: ' + (e?.reason || e?.shortMessage || e?.message) },
        { status: 400 }
      )
    }

    // Send transaction
    const tx = await factory.createPool(poolConfig, { gasLimit: BigInt(4000000) })
    console.log("Transaction hash:", tx.hash)
    
    // Wait for confirmation
    const receipt = await tx.wait()
    console.log("Transaction confirmed in block:", receipt.blockNumber)

    // Parse PoolCreated event
    let poolAddress = null
    for (const log of receipt.logs) {
      if (log.address.toLowerCase() !== FACTORY_ADDRESS.toLowerCase()) continue
      try {
        const parsed = factory.interface.parseLog(log)
        if (parsed && parsed.name === "PoolCreated") {
          poolAddress = parsed.args.pool
          break
        }
      } catch (_) {}
    }

    if (poolAddress) {
      console.log("\n✅ Pool created successfully!")
      console.log("Pool Address:", poolAddress)
      return NextResponse.json({
        success: true,
        poolAddress: poolAddress,
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber
      })
    } else {
      return NextResponse.json(
        { error: 'Pool created but couldn\'t extract address from event' },
        { status: 500 }
      )
    }

  } catch (error: any) {
    console.error("Error creating pool:", error.message)
    return NextResponse.json(
      { error: 'Failed to create pool: ' + error.message },
      { status: 500 }
    )
  }
}
