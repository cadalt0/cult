import { NextRequest, NextResponse } from 'next/server'
import { ethers } from "ethers"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { poolAddress, memberId } = body

    // Validate input
    if (!poolAddress || !memberId) {
      return NextResponse.json(
        { error: 'Missing required fields: poolAddress, memberId' },
        { status: 400 }
      )
    }

    // Load from environment variables
    const RPC_URL = process.env.RPC_URL || "https://forno.celo-sepolia.celo-testnet.org"
    
    // Map member IDs to private keys
    const memberPrivateKeys: { [key: string]: string } = {
      'M001': process.env.NEXT_PUBLIC_PV1 || '',
      'M002': process.env.NEXT_PUBLIC_PV2 || '',
      // Add more members as needed
    }

    const privateKey = memberPrivateKeys[memberId]
    if (!privateKey) {
      return NextResponse.json(
        { error: `No private key found for member ${memberId}` },
        { status: 400 }
      )
    }

    const provider = new ethers.JsonRpcProvider(RPC_URL)
    const wallet = new ethers.Wallet(privateKey, provider)
    
    console.log(`Member ${memberId} (${wallet.address}) requesting to join pool ${poolAddress}`)

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

    // Pool ABI for join requests
    const poolAbi = [
      "function requestJoin()",
      "function getStatus() view returns (uint8)",
      "function getMembers() view returns (address[])"
    ]

    const pool = new ethers.Contract(poolAddress, poolAbi, wallet)

    try {
      console.log(`${memberId} -> requestJoin()...`)
      const tx = await pool.requestJoin({ gasLimit: BigInt(300000) })
      console.log("Transaction hash:", tx.hash)
      
      const receipt = await tx.wait()
      console.log(`${memberId} requestJoin confirmed in block:`, receipt.blockNumber)

      // Get current members to verify
      try {
        const poolRead = new ethers.Contract(poolAddress, poolAbi, provider)
        const members = await poolRead.getMembers()
        console.log("Current members:", members)
      } catch (e) {
        console.log("Could not fetch members:", e)
      }

      return NextResponse.json({
        success: true,
        memberId: memberId,
        memberAddress: wallet.address,
        poolAddress: poolAddress,
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber
      })

    } catch (error: any) {
      console.error(`${memberId} requestJoin error:`, error?.reason || error?.shortMessage || error?.message)
      return NextResponse.json(
        { error: `Failed to join pool: ${error?.reason || error?.shortMessage || error?.message}` },
        { status: 400 }
      )
    }

  } catch (error: any) {
    console.error("Error in join pool:", error.message)
    return NextResponse.json(
      { error: 'Failed to process join request: ' + error.message },
      { status: 500 }
    )
  }
}
