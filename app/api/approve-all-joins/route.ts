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
    
    console.log("Creator:", creator.address, "approving all joins for pool:", poolAddress)

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

    // Pool ABI for approve all joins
    const poolAbi = [
      "function approveAllJoins()",
      "function getPendingJoinRequests() view returns (address[])",
      "function getMembers() view returns (address[])"
    ]

    const pool = new ethers.Contract(poolAddress, poolAbi, creator)

    try {
      // Check pending requests first
      let pendingRequests: string[] = []
      try {
        pendingRequests = await pool.getPendingJoinRequests()
        console.log("Pending requests:", pendingRequests)
      } catch (e) {
        console.log("Could not fetch pending requests:", e)
      }

      if (pendingRequests.length === 0) {
        return NextResponse.json({
          success: true,
          message: "No pending join requests to approve",
          poolAddress: poolAddress,
          pendingCount: 0,
          membersAfter: []
        })
      }

      console.log("approveAllJoins()...")
      const tx = await pool.approveAllJoins({ gasLimit: BigInt(400000) })
      console.log("Transaction hash:", tx.hash)
      
      const receipt = await tx.wait()
      console.log("approveAllJoins confirmed in block:", receipt.blockNumber)

      // Get members after approval
      let membersAfter: string[] = []
      try {
        membersAfter = await pool.getMembers()
        console.log("Members after approval:", membersAfter)
      } catch (e) {
        console.log("Could not fetch members after approval:", e)
      }

      return NextResponse.json({
        success: true,
        poolAddress: poolAddress,
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber,
        pendingCount: pendingRequests.length,
        membersAfter: membersAfter
      })

    } catch (error: any) {
      console.error("approveAllJoins error:", error?.reason || error?.shortMessage || error?.message)
      return NextResponse.json(
        { error: `Failed to approve all joins: ${error?.reason || error?.shortMessage || error?.message}` },
        { status: 400 }
      )
    }

  } catch (error: any) {
    console.error("Error in approve all joins:", error.message)
    return NextResponse.json(
      { error: 'Failed to process approve all joins: ' + error.message },
      { status: 500 }
    )
  }
}
