"use client"

import {
  mockPools,
  mockJoinRequests,
  mockContributions,
  mockBids,
  type Pool,
  type JoinRequest,
  type Contribution,
  type Bid,
} from "./mock-data"

// Pool Management Actions
export function createPool(poolData: Omit<Pool, "id" | "createdAt" | "contributedAmount" | "memberCount">) {
  const newPool: Pool = {
    ...poolData,
    id: `P${String(mockPools.length + 1).padStart(3, "0")}`,
    contributedAmount: 0,
    memberCount: 0,
    createdAt: new Date().toISOString(),
  }

  mockPools.push(newPool)
  return newPool
}

export function updatePoolStatus(poolId: string, status: Pool["status"]) {
  const pool = mockPools.find((p) => p.id === poolId)
  if (pool) {
    pool.status = status
    if (status === "active" && !pool.startDate) {
      pool.startDate = new Date().toISOString()
    }
    if (status === "bidding" && !pool.biddingEndDate) {
      const endDate = new Date()
      endDate.setDate(endDate.getDate() + 30)
      pool.biddingEndDate = endDate.toISOString()
    }
  }
  return pool
}

// Join Request Actions
export function createJoinRequest(poolId: string, poolName: string, memberId: string, memberName: string) {
  const newRequest: JoinRequest = {
    id: `JR${String(mockJoinRequests.length + 1).padStart(3, "0")}`,
    poolId,
    poolName,
    memberId,
    memberName,
    status: "pending",
    requestedAt: new Date().toISOString(),
  }

  mockJoinRequests.push(newRequest)
  return newRequest
}

export function approveJoinRequest(requestId: string) {
  const request = mockJoinRequests.find((r) => r.id === requestId)
  if (request) {
    request.status = "approved"
    const pool = mockPools.find((p) => p.id === request.poolId)
    if (pool) {
      pool.memberCount += 1
    }
  }
  return request
}

export function rejectJoinRequest(requestId: string) {
  const request = mockJoinRequests.find((r) => r.id === requestId)
  if (request) {
    request.status = "rejected"
  }
  return request
}

// Contribution Actions
export function createContribution(
  poolId: string,
  poolName: string,
  memberId: string,
  memberName: string,
  amount: number,
) {
  const newContribution: Contribution = {
    id: `C${String(mockContributions.length + 1).padStart(3, "0")}`,
    poolId,
    poolName,
    memberId,
    memberName,
    amount,
    contributedAt: new Date().toISOString(),
  }

  mockContributions.push(newContribution)

  // Update pool contributed amount
  const pool = mockPools.find((p) => p.id === poolId)
  if (pool) {
    pool.contributedAmount += amount
  }

  return newContribution
}

// Bid Actions
export function createBid(poolId: string, poolName: string, memberId: string, memberName: string, amount: number) {
  const newBid: Bid = {
    id: `B${String(mockBids.length + 1).padStart(3, "0")}`,
    poolId,
    poolName,
    memberId,
    memberName,
    amount,
    bidAt: new Date().toISOString(),
    status: "active",
  }

  mockBids.push(newBid)
  return newBid
}

export function settlePool(poolId: string, winningBidId?: string) {
  const pool = mockPools.find((p) => p.id === poolId)
  if (pool) {
    pool.status = "settled"

    // Mark winning bid
    if (winningBidId) {
      const bids = mockBids.filter((b) => b.poolId === poolId)
      bids.forEach((bid) => {
        bid.status = bid.id === winningBidId ? "won" : "lost"
      })
    }
  }
  return pool
}

// Analytics
export function getPoolAnalytics(poolId: string) {
  const pool = mockPools.find((p) => p.id === poolId)
  if (!pool) return null

  const contributions = mockContributions.filter((c) => c.poolId === poolId)
  const bids = mockBids.filter((b) => b.poolId === poolId)
  const joinRequests = mockJoinRequests.filter((r) => r.poolId === poolId)

  return {
    pool,
    totalContributions: contributions.reduce((sum, c) => sum + c.amount, 0),
    contributionCount: contributions.length,
    highestBid: bids.length > 0 ? Math.max(...bids.map((b) => b.amount)) : 0,
    bidCount: bids.length,
    pendingRequests: joinRequests.filter((r) => r.status === "pending").length,
    approvedMembers: joinRequests.filter((r) => r.status === "approved").length,
  }
}
