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
        { error: 'Missing environment variable: PRIVATE_KEY' },
        { status: 500 }
      )
    }

    const provider = new ethers.JsonRpcProvider(RPC_URL)
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider)
    
    console.log(`Settling pool ${poolAddress} with wallet ${wallet.address}`)

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

    // Pool ABI for settling
    const poolAbi = [
      "function currentCycle() view returns (uint256)",
      "function closeBids(uint256 cycleId)",
      "function settle(uint256 cycleId)",
      "function getStatus() view returns (uint8)",
      "function getConfig() view returns (tuple(address token,uint256 contributionAmount,uint256 cycleDuration,uint256 minMembers,uint256 maxMembers,address creator))"
    ]

    const pool = new ethers.Contract(poolAddress, poolAbi, wallet)

    try {
      // Get current cycle and status
      const cycleId = await pool.currentCycle()
      const status = await pool.getStatus()
      const config = await pool.getConfig()
      
      console.log(`Current cycle: ${cycleId.toString()}`)
      console.log(`Pool status: ${status}`)
      console.log(`Cycle duration: ${config.cycleDuration} seconds`)

      // Step 1: Close bids (will revert if window not finished)
      let closeBidsTxHash = null
      try {
        console.log("Closing bids...")
        const closeBidsTx = await pool.closeBids(cycleId, { gasLimit: BigInt(400000) })
        console.log("Close bids transaction hash:", closeBidsTx.hash)
        await closeBidsTx.wait()
        console.log("Close bids confirmed")
        closeBidsTxHash = closeBidsTx.hash
      } catch (e: any) {
        console.error("Close bids error:", e?.reason || e?.shortMessage || e?.message)
        return NextResponse.json(
          { 
            error: `Failed to close bids: ${e?.reason || e?.shortMessage || e?.message}. If it's 'too early', wait until the bid window closes and retry.`,
            step: 'closeBids'
          },
          { status: 400 }
        )
      }

      // Step 2: Settle (requires: contribution phase ended, not settled)
      let settleTxHash = null
      try {
        console.log("Settling pool...")
        const settleTx = await pool.settle(cycleId, { gasLimit: BigInt(900000) })
        console.log("Settle transaction hash:", settleTx.hash)
        await settleTx.wait()
        console.log("Settle confirmed")
        settleTxHash = settleTx.hash
      } catch (e: any) {
        console.error("Settle error:", e?.reason || e?.shortMessage || e?.message)
        return NextResponse.json(
          { 
            error: `Failed to settle: ${e?.reason || e?.shortMessage || e?.message}. If it's 'cycle not ended', wait until cycleDuration has passed and retry.`,
            step: 'settle'
          },
          { status: 400 }
        )
      }

      console.log(`Pool ${poolAddress} settled successfully for cycle ${cycleId.toString()}`)

      return NextResponse.json({
        success: true,
        poolAddress: poolAddress,
        cycleId: cycleId.toString(),
        status: status.toString(),
        closeBidsTransactionHash: closeBidsTxHash,
        settleTransactionHash: settleTxHash,
        cycleDuration: config.cycleDuration.toString()
      })

    } catch (error: any) {
      console.error(`Pool ${poolAddress} settle error:`, error?.reason || error?.shortMessage || error?.message)
      return NextResponse.json(
        { error: `Failed to settle pool: ${error?.reason || error?.shortMessage || error?.message}` },
        { status: 400 }
      )
    }

  } catch (error: any) {
    console.error("Error in settle pool:", error.message)
    return NextResponse.json(
      { error: 'Failed to process settle pool: ' + error.message },
      { status: 500 }
    )
  }
}
