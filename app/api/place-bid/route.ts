import { NextRequest, NextResponse } from 'next/server'
import { ethers } from "ethers"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { poolAddress, memberId, bidPercent } = body

    // Validate input
    if (!poolAddress || !memberId || !bidPercent) {
      return NextResponse.json(
        { error: 'Missing required fields: poolAddress, memberId, bidPercent' },
        { status: 400 }
      )
    }

    // Validate bid percentage
    if (bidPercent < 60 || bidPercent > 95) {
      return NextResponse.json(
        { error: 'Bid percentage must be between 60% and 95%' },
        { status: 400 }
      )
    }

    // Load from environment variables
    const RPC_URL = process.env.RPC_URL || "https://forno.celo-sepolia.celo-testnet.org"
    const DECIMALS = process.env.DECIMALS ? Number(process.env.DECIMALS) : 6

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
    
    console.log(`Member ${memberId} (${wallet.address}) placing bid of ${bidPercent}% on pool ${poolAddress}`)

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

    // Pool ABI for bidding
    const poolAbi = [
      "function getConfig() view returns (tuple(address token,uint256 contributionAmount,uint256 cycleDuration,uint256 minMembers,uint256 maxMembers,address creator))",
      "function currentCycle() view returns (uint256)",
      "function placeBid(uint256 cycleId, uint256 amount)",
      "function hasPaid(uint256 cycleId, address user) view returns (bool)"
    ]

    const pool = new ethers.Contract(poolAddress, poolAbi, wallet)

    try {
      // Get pool configuration and current cycle
      const config = await pool.getConfig()
      const cycleId = await pool.currentCycle()
      const contributionAmount = config.contributionAmount
      
      console.log(`Current cycle: ${cycleId.toString()}`)
      console.log(`Contribution amount: ${ethers.formatUnits(contributionAmount, DECIMALS)} tokens`)

      // Check if member has contributed to current cycle
      const hasContributed = await pool.hasPaid(cycleId, wallet.address)
      if (!hasContributed) {
        return NextResponse.json(
          { error: `Member ${memberId} has not contributed to cycle ${cycleId.toString()}. Must contribute before bidding.` },
          { status: 400 }
        )
      }

      console.log(`Member ${memberId} has contributed to cycle ${cycleId.toString()}`)

      // Calculate bid amount based on percentage
      const bidAmount = (contributionAmount * BigInt(bidPercent)) / 100n
      const bidAmountFormatted = ethers.formatUnits(bidAmount, DECIMALS)
      
      console.log(`Bidding ${bidPercent}% of contribution amount: ${bidAmountFormatted} tokens`)

      // Place the bid
      console.log("Placing bid...")
      const tx = await pool.placeBid(cycleId, bidAmount, { gasLimit: BigInt(400000) })
      console.log("Bid transaction hash:", tx.hash)
      
      const receipt = await tx.wait()
      console.log("Bid confirmed in block:", receipt.blockNumber)

      console.log(`Member ${memberId} bid confirmed for cycle ${cycleId.toString()}`)

      return NextResponse.json({
        success: true,
        memberId: memberId,
        memberAddress: wallet.address,
        poolAddress: poolAddress,
        cycleId: cycleId.toString(),
        bidPercent: bidPercent,
        bidAmount: bidAmountFormatted,
        contributionAmount: ethers.formatUnits(contributionAmount, DECIMALS),
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber
      })

    } catch (error: any) {
      console.error(`Member ${memberId} bid error:`, error?.reason || error?.shortMessage || error?.message)
      return NextResponse.json(
        { error: `Failed to place bid: ${error?.reason || error?.shortMessage || error?.message}` },
        { status: 400 }
      )
    }

  } catch (error: any) {
    console.error("Error in place bid:", error.message)
    return NextResponse.json(
      { error: 'Failed to process place bid: ' + error.message },
      { status: 500 }
    )
  }
}
