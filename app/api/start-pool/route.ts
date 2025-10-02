import { NextRequest, NextResponse } from 'next/server'
import { ethers } from "ethers"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { poolAddress } = body

    // Validate input
    if (!poolAddress) {
      return NextResponse.json(
        { error: 'Missing required field: poolAddress' },
        { status: 400 }
      )
    }

    // Load from environment variables
    const RPC_URL = process.env.RPC_URL || "https://forno.celo-sepolia.celo-testnet.org"
    const PRIVATE_KEY = process.env.PRIVATE_KEY

    if (!PRIVATE_KEY) {
      return NextResponse.json(
        { error: 'Missing required environment variable: PRIVATE_KEY' },
        { status: 500 }
      )
    }

    const provider = new ethers.JsonRpcProvider(RPC_URL)
    const creator = new ethers.Wallet(PRIVATE_KEY, provider)
    
    console.log("Creator:", creator.address, "starting pool:", poolAddress)

    // Basic sanity checks
    const net = await provider.getNetwork()
    console.log("chainId:", Number(net.chainId))
    
    const code = await provider.getCode(poolAddress)
    if (!code || code === "0x") {
      return NextResponse.json(
        { error: 'Pool address has no contract code: ' + poolAddress },
        { status: 400 }
      )
    }

    // Pool ABI for starting pool
    const poolAbi = [
      "function start()",
      "function getStatus() view returns (uint8)",
      "function getMembers() view returns (address[])",
      "function currentCycle() view returns (uint256)"
    ]

    const pool = new ethers.Contract(poolAddress, poolAbi, creator)

    try {
      // Check current status and members before starting
      let statusBefore = 0
      let membersBefore: string[] = []
      
      try {
        statusBefore = Number(await pool.getStatus())
        membersBefore = await pool.getMembers()
        console.log("Status before (0 Created, 1 Active):", statusBefore)
        console.log("Members before:", membersBefore.length)
      } catch (e) {
        console.log("Could not fetch initial status:", e)
      }

      if (statusBefore === 1) {
        return NextResponse.json(
          { error: 'Pool is already active' },
          { status: 400 }
        )
      }

      console.log("Starting pool...")
      const tx = await pool.start({ gasLimit: BigInt(400000) })
      console.log("Transaction hash:", tx.hash)
      
      const receipt = await tx.wait()
      console.log("Pool started in block:", receipt.blockNumber)

      // Check status and cycle after starting
      let statusAfter = 0
      let currentCycle = 0
      let membersAfter: string[] = []
      
      try {
        statusAfter = Number(await pool.getStatus())
        currentCycle = Number(await pool.currentCycle())
        membersAfter = await pool.getMembers()
        console.log("Status after:", statusAfter)
        console.log("Current cycle:", currentCycle)
        console.log("Members after:", membersAfter.length)
      } catch (e) {
        console.log("Could not fetch final status:", e)
      }

      return NextResponse.json({
        success: true,
        poolAddress: poolAddress,
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber,
        statusBefore: statusBefore,
        statusAfter: statusAfter,
        currentCycle: currentCycle,
        membersCount: membersAfter.length
      })

    } catch (error: any) {
      console.error("start() error:", error?.reason || error?.shortMessage || error?.message)
      return NextResponse.json(
        { error: `Failed to start pool: ${error?.reason || error?.shortMessage || error?.message}` },
        { status: 400 }
      )
    }

  } catch (error: any) {
    console.error("Error in start pool:", error.message)
    return NextResponse.json(
      { error: 'Failed to process start pool: ' + error.message },
      { status: 500 }
    )
  }
}
