import { NextRequest, NextResponse } from 'next/server'
import { ethers } from "ethers"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { poolAddress, memberId, amount } = body

    // Validate input
    if (!poolAddress || !memberId || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields: poolAddress, memberId, amount' },
        { status: 400 }
      )
    }

    // Load from environment variables
    const RPC_URL = process.env.RPC_URL || "https://forno.celo-sepolia.celo-testnet.org"
    const TOKEN_ADDRESS = process.env.NEXT_PUBLIC_TOKEN_ADDRESS
    const DECIMALS = process.env.DECIMALS ? Number(process.env.DECIMALS) : 6

    if (!TOKEN_ADDRESS) {
      return NextResponse.json(
        { error: 'Missing required environment variable: TOKEN_ADDRESS' },
        { status: 500 }
      )
    }

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
    
    console.log(`Member ${memberId} (${wallet.address}) contributing to pool ${poolAddress}`)

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

    // Contract ABIs
    const erc20Abi = [
      "function approve(address spender, uint256 amount) returns (bool)",
      "function decimals() view returns (uint8)",
      "function balanceOf(address) view returns (uint256)"
    ]
    
    const poolAbi = [
      "function getConfig() view returns (tuple(address token,uint256 contributionAmount,uint256 cycleDuration,uint256 minMembers,uint256 maxMembers,address creator))",
      "function currentCycle() view returns (uint256)",
      "function contribute(uint256 cycleId)"
    ]

    const token = new ethers.Contract(TOKEN_ADDRESS, erc20Abi, wallet)
    const pool = new ethers.Contract(poolAddress, poolAbi, wallet)

    try {
      // Read contribution amount from pool config
      const config = await pool.getConfig()
      const requiredAmount = config.contributionAmount
      const cycleId = await pool.currentCycle()
      
      console.log(`Required amount: ${ethers.formatUnits(requiredAmount, DECIMALS)} tokens`)
      console.log(`Current cycle: ${cycleId.toString()}`)

      // Check if provided amount matches required amount
      const providedAmount = ethers.parseUnits(amount.toString(), DECIMALS)
      if (providedAmount !== requiredAmount) {
        return NextResponse.json(
          { error: `Amount mismatch. Required: ${ethers.formatUnits(requiredAmount, DECIMALS)}, Provided: ${amount}` },
          { status: 400 }
        )
      }

      // Check token balance
      const balance = await token.balanceOf(wallet.address)
      if (balance < requiredAmount) {
        return NextResponse.json(
          { error: `Insufficient token balance. Required: ${ethers.formatUnits(requiredAmount, DECIMALS)}, Available: ${ethers.formatUnits(balance, DECIMALS)}` },
          { status: 400 }
        )
      }

      console.log(`Balance check passed: ${ethers.formatUnits(balance, DECIMALS)} tokens available`)

      // Step 1: Approve tokens
      console.log("Approving tokens...")
      const approveTx = await token.approve(poolAddress, requiredAmount, { gasLimit: BigInt(300000) })
      console.log("Approve transaction hash:", approveTx.hash)
      
      const approveReceipt = await approveTx.wait()
      console.log("Approve confirmed in block:", approveReceipt.blockNumber)

      // Step 2: Contribute to pool
      console.log("Contributing to pool...")
      const contributeTx = await pool.contribute(cycleId, { gasLimit: BigInt(400000) })
      console.log("Contribute transaction hash:", contributeTx.hash)
      
      const contributeReceipt = await contributeTx.wait()
      console.log("Contribute confirmed in block:", contributeReceipt.blockNumber)

      console.log(`Member ${memberId} contributed for cycle ${cycleId.toString()}`)

      return NextResponse.json({
        success: true,
        memberId: memberId,
        memberAddress: wallet.address,
        poolAddress: poolAddress,
        amount: ethers.formatUnits(requiredAmount, DECIMALS),
        cycleId: cycleId.toString(),
        approveTransactionHash: approveTx.hash,
        contributeTransactionHash: contributeTx.hash,
        contributeBlockNumber: contributeReceipt.blockNumber
      })

    } catch (error: any) {
      console.error(`Member ${memberId} contribute error:`, error?.reason || error?.shortMessage || error?.message)
      return NextResponse.json(
        { error: `Failed to contribute: ${error?.reason || error?.shortMessage || error?.message}` },
        { status: 400 }
      )
    }

  } catch (error: any) {
    console.error("Error in contribute:", error.message)
    return NextResponse.json(
      { error: 'Failed to process contribute: ' + error.message },
      { status: 500 }
    )
  }
}
