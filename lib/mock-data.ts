export interface User {
  id: string
  name: string
  role: "leader" | "member"
  email: string
  avatar?: string
}

export interface Pool {
  id: string
  name: string
  description: string
  leaderId: string
  leaderName: string
  totalAmount: number
  contributedAmount: number
  memberCount: number
  maxMembers: number
  contributionAmount: number // Individual contribution amount from blockchain
  status: "pending" | "active" | "bidding" | "settled"
  startDate?: string
  biddingEndDate?: string
  createdAt: string
  poolAddress?: string // Blockchain contract address
  transactionHash?: string // Creation transaction hash
  blockNumber?: number // Block number where pool was created
}

export interface JoinRequest {
  id: string
  poolId: string
  poolName: string
  memberId: string
  memberName: string
  memberAddress?: string // Blockchain wallet address
  poolAddress?: string // Pool contract address
  status: "pending" | "approved" | "rejected"
  requestedAt: string
  transactionHash?: string // Join request transaction hash
  blockNumber?: number // Block number where request was made
}

export interface Contribution {
  id: string
  poolId: string
  poolName: string
  memberId: string
  memberName: string
  amount: number
  contributedAt: string
}

export interface Bid {
  id: string
  poolId: string
  poolName: string
  memberId: string
  memberName: string
  amount: number
  bidAt: string
  status: "active" | "won" | "lost"
  poolAddress?: string
  transactionHash?: string
  blockNumber?: number
}

export const mockUsers: User[] = [
  {
    id: "L001",
    name: "Sarah Chen",
    role: "leader",
    email: "sarah.chen@cultfinance.com",
  },
  {
    id: "M001",
    name: "Alex Thompson",
    role: "member",
    email: "alex.t@email.com",
  },
  {
    id: "M002",
    name: "Jamie Park",
    role: "member",
    email: "jamie.park@email.com",
  },
]

// Default pools data
const defaultPools: Pool[] = [
  {
    id: "P001",
    name: "Tech Innovators Pool",
    description: "Investment pool for emerging tech startups and innovation projects",
    leaderId: "L001",
    leaderName: "Sarah Chen",
    totalAmount: 100000,
    contributedAmount: 75000,
    memberCount: 8,
    maxMembers: 10,
    contributionAmount: 100, // Individual contribution amount
    status: "bidding",
    startDate: "2025-01-15",
    biddingEndDate: "2025-02-15",
    createdAt: "2025-01-01",
  },
  {
    id: "P002",
    name: "Real Estate Ventures",
    description: "Collaborative pool for real estate investment opportunities",
    leaderId: "L001",
    leaderName: "Sarah Chen",
    totalAmount: 250000,
    contributedAmount: 180000,
    memberCount: 12,
    maxMembers: 15,
    contributionAmount: 150, // Individual contribution amount
    status: "bidding",
    startDate: "2025-01-10",
    biddingEndDate: "2025-02-10",
    createdAt: "2024-12-20",
  },
]

// Load pools from localStorage or use default
const loadPools = (): Pool[] => {
  if (typeof window === 'undefined') {
    console.log('Server-side rendering: using default pools')
    return defaultPools // Server-side rendering
  }
  
  try {
    const stored = localStorage.getItem('cult-finance-pools')
    console.log('Loading pools from localStorage:', stored ? 'Found data' : 'No data found')
    
    if (stored) {
      const parsed = JSON.parse(stored)
      if (Array.isArray(parsed)) {
        console.log(`Loaded ${parsed.length} pools from localStorage`)
        return parsed
      } else {
        console.warn('Invalid pools data in localStorage, using defaults')
        return defaultPools
      }
    }
  } catch (error) {
    console.error('Error loading pools from localStorage:', error)
  }
  
  console.log('Using default pools (no localStorage data)')
  return defaultPools
}

// Save pools to localStorage
const savePools = (pools: Pool[]) => {
  if (typeof window === 'undefined') {
    console.log('Server-side rendering: skipping save')
    return // Server-side rendering
  }
  
  try {
    const dataToSave = JSON.stringify(pools)
    localStorage.setItem('cult-finance-pools', dataToSave)
    console.log(`Saved ${pools.length} pools to localStorage`)
    
    // Verify the save worked
    const verification = localStorage.getItem('cult-finance-pools')
    if (verification === dataToSave) {
      console.log('✅ Pools saved successfully to localStorage')
    } else {
      console.error('❌ Failed to save pools to localStorage')
    }
  } catch (error) {
    console.error('Error saving pools to localStorage:', error)
  }
}

// Initialize pools with persistence
export let mockPools: Pool[] = loadPools()

// Update the reference when pools change
const updatePools = (newPools: Pool[]) => {
  mockPools = newPools
  savePools(newPools)
}

// Add event listener to save data before page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    console.log('💾 Page unloading - ensuring data is saved...')
    savePools(mockPools)
    saveJoinRequests(mockJoinRequests)
    saveContributions(mockContributions)
    saveBids(mockBids)
  })
  
  // Also save on page visibility change (when switching tabs)
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      console.log('💾 Page hidden - saving data...')
      savePools(mockPools)
      saveJoinRequests(mockJoinRequests)
      saveContributions(mockContributions)
      saveBids(mockBids)
    }
  })
}

// Default join requests data - EMPTY (real join requests only)
const defaultJoinRequests: JoinRequest[] = []

// Load join requests from localStorage or use default
const loadJoinRequests = (): JoinRequest[] => {
  if (typeof window === 'undefined') {
    console.log('Server-side rendering: using default join requests')
    return defaultJoinRequests // Server-side rendering
  }
  
  try {
    const stored = localStorage.getItem('cult-finance-join-requests')
    console.log('Loading join requests from localStorage:', stored ? 'Found data' : 'No data found')
    
    if (stored) {
      const parsed = JSON.parse(stored)
      if (Array.isArray(parsed)) {
        console.log(`Loaded ${parsed.length} join requests from localStorage`)
        return parsed
      } else {
        console.warn('Invalid join requests data in localStorage, using defaults')
        return defaultJoinRequests
      }
    }
  } catch (error) {
    console.error('Error loading join requests from localStorage:', error)
  }
  
  console.log('Using default join requests (no localStorage data)')
  return defaultJoinRequests
}

// Save join requests to localStorage
const saveJoinRequests = (joinRequests: JoinRequest[]) => {
  if (typeof window === 'undefined') {
    console.log('Server-side rendering: skipping join requests save')
    return // Server-side rendering
  }
  
  try {
    const dataToSave = JSON.stringify(joinRequests)
    localStorage.setItem('cult-finance-join-requests', dataToSave)
    console.log(`Saved ${joinRequests.length} join requests to localStorage`)
    
    // Verify the save worked
    const verification = localStorage.getItem('cult-finance-join-requests')
    if (verification === dataToSave) {
      console.log('✅ Join requests saved successfully to localStorage')
    } else {
      console.error('❌ Failed to save join requests to localStorage')
    }
  } catch (error) {
    console.error('Error saving join requests to localStorage:', error)
  }
}

// Initialize join requests with persistence
export let mockJoinRequests: JoinRequest[] = loadJoinRequests()

// Update the reference when join requests change
const updateJoinRequests = (newJoinRequests: JoinRequest[]) => {
  mockJoinRequests = newJoinRequests
  saveJoinRequests(newJoinRequests)
}

// Default contributions data - EMPTY (real contributions only)
const defaultContributions: Contribution[] = []

// Load contributions from localStorage or use default
const loadContributions = (): Contribution[] => {
  if (typeof window === 'undefined') {
    console.log('Server-side rendering: using default contributions')
    return defaultContributions // Server-side rendering
  }
  
  try {
    const stored = localStorage.getItem('cult-finance-contributions')
    console.log('Loading contributions from localStorage:', stored ? 'Found data' : 'No data found')
    
    if (stored) {
      const parsed = JSON.parse(stored)
      if (Array.isArray(parsed)) {
        console.log(`Loaded ${parsed.length} contributions from localStorage`)
        return parsed
      } else {
        console.warn('Invalid contributions data in localStorage, using defaults')
        return defaultContributions
      }
    }
  } catch (error) {
    console.error('Error loading contributions from localStorage:', error)
  }
  
  console.log('Using default contributions (no localStorage data)')
  return defaultContributions
}

// Save contributions to localStorage
const saveContributions = (contributions: Contribution[]) => {
  if (typeof window === 'undefined') {
    console.log('Server-side rendering: skipping contributions save')
    return // Server-side rendering
  }
  
  try {
    const dataToSave = JSON.stringify(contributions)
    localStorage.setItem('cult-finance-contributions', dataToSave)
    console.log(`Saved ${contributions.length} contributions to localStorage`)
    
    // Verify the save worked
    const verification = localStorage.getItem('cult-finance-contributions')
    if (verification === dataToSave) {
      console.log('✅ Contributions saved successfully to localStorage')
    } else {
      console.error('❌ Failed to save contributions to localStorage')
    }
  } catch (error) {
    console.error('Error saving contributions to localStorage:', error)
  }
}

// Initialize contributions with persistence
export let mockContributions: Contribution[] = loadContributions()

// Update the reference when contributions change
const updateContributions = (newContributions: Contribution[]) => {
  mockContributions = newContributions
  saveContributions(newContributions)
}

// Default bids data - EMPTY (real bids only)
const defaultBids: Bid[] = []

// Load bids from localStorage or use default
const loadBids = (): Bid[] => {
  if (typeof window === 'undefined') {
    console.log('Server-side rendering: using default bids')
    return defaultBids // Server-side rendering
  }
  
  try {
    const stored = localStorage.getItem('cult-finance-bids')
    console.log('Loading bids from localStorage:', stored ? 'Found data' : 'No data found')
    
    if (stored) {
      const parsed = JSON.parse(stored)
      if (Array.isArray(parsed)) {
        console.log(`Loaded ${parsed.length} bids from localStorage`)
        return parsed
      } else {
        console.warn('Invalid bids data in localStorage, using defaults')
        return defaultBids
      }
    }
  } catch (error) {
    console.error('Error loading bids from localStorage:', error)
  }
  
  console.log('Using default bids (no localStorage data)')
  return defaultBids
}

// Save bids to localStorage
const saveBids = (bids: Bid[]) => {
  if (typeof window === 'undefined') {
    console.log('Server-side rendering: skipping bids save')
    return // Server-side rendering
  }
  
  try {
    const dataToSave = JSON.stringify(bids)
    localStorage.setItem('cult-finance-bids', dataToSave)
    console.log(`Saved ${bids.length} bids to localStorage`)
    
    // Verify the save worked
    const verification = localStorage.getItem('cult-finance-bids')
    if (verification === dataToSave) {
      console.log('✅ Bids saved successfully to localStorage')
    } else {
      console.error('❌ Failed to save bids to localStorage')
    }
  } catch (error) {
    console.error('Error saving bids to localStorage:', error)
  }
}

// Initialize bids with persistence
export let mockBids: Bid[] = loadBids()

// Update the reference when bids change
const updateBids = (newBids: Bid[]) => {
  mockBids = newBids
  saveBids(newBids)
}

// Helper functions
export function getUserById(id: string): User | undefined {
  return mockUsers.find((user) => user.id === id)
}

export function getPoolsByLeaderId(leaderId: string): Pool[] {
  return mockPools.filter((pool) => pool.leaderId === leaderId)
}

export function getPoolById(poolId: string): Pool | undefined {
  return mockPools.find((pool) => pool.id === poolId)
}

export function getJoinRequestsByPoolId(poolId: string): JoinRequest[] {
  return mockJoinRequests.filter((request) => request.poolId === poolId)
}

export function getJoinRequestsByMemberId(memberId: string): JoinRequest[] {
  return mockJoinRequests.filter((request) => request.memberId === memberId)
}

export function getContributionsByMemberId(memberId: string): Contribution[] {
  return mockContributions.filter((contribution) => contribution.memberId === memberId)
}

export function getContributionsByPoolId(poolId: string): Contribution[] {
  return mockContributions.filter((contribution) => contribution.poolId === poolId)
}

export function getBidsByMemberId(memberId: string): Bid[] {
  return mockBids.filter((bid) => bid.memberId === memberId)
}

export function getBidsByPoolId(poolId: string): Bid[] {
  return mockBids.filter((bid) => bid.poolId === poolId)
}

// Function to add a new pool to the mock database
export function addPoolToMockDB(pool: Pool): void {
  const newPools = [...mockPools, pool]
  updatePools(newPools)
}

// Function to generate a unique pool ID
export function generatePoolId(): string {
  const existingIds = mockPools.map(p => p.id)
  let newId = `P${String(mockPools.length + 1).padStart(3, '0')}`
  while (existingIds.includes(newId)) {
    const num = parseInt(newId.substring(1)) + 1
    newId = `P${String(num).padStart(3, '0')}`
  }
  return newId
}

// Function to add a new join request to the mock database
export function addJoinRequestToMockDB(joinRequest: JoinRequest): void {
  const newJoinRequests = [...mockJoinRequests, joinRequest]
  updateJoinRequests(newJoinRequests)
}

// Function to generate a unique join request ID
export function generateJoinRequestId(): string {
  const existingIds = mockJoinRequests.map(r => r.id)
  let newId = `JR${String(mockJoinRequests.length + 1).padStart(3, '0')}`
  while (existingIds.includes(newId)) {
    const num = parseInt(newId.substring(2)) + 1
    newId = `JR${String(num).padStart(3, '0')}`
  }
  return newId
}

// Function to approve all pending join requests for a pool
export function approveAllJoinRequestsForPool(poolId: string): void {
  const updatedJoinRequests = mockJoinRequests.map(request => {
    if (request.poolId === poolId && request.status === "pending") {
      return { ...request, status: "approved" as const }
    }
    return request
  })
  updateJoinRequests(updatedJoinRequests)
}

// Function to get pending join requests for a pool
export function getPendingJoinRequestsForPool(poolId: string): JoinRequest[] {
  return mockJoinRequests.filter(request => 
    request.poolId === poolId && request.status === "pending"
  )
}

// Function to update pool status
export function updatePoolStatus(poolId: string, newStatus: Pool['status']): void {
  const updatedPools = mockPools.map(pool => {
    if (pool.id === poolId) {
      return { ...pool, status: newStatus }
    }
    return pool
  })
  updatePools(updatedPools)
}

// Function to add a new contribution to the mock database
export function addContributionToMockDB(contribution: Contribution): void {
  const newContributions = [...mockContributions, contribution]
  updateContributions(newContributions)
}

// Function to generate a unique contribution ID
export function generateContributionId(): string {
  const existingIds = mockContributions.map(c => c.id)
  let newId = `C${String(mockContributions.length + 1).padStart(3, '0')}`
  while (existingIds.includes(newId)) {
    const num = parseInt(newId.substring(1)) + 1
    newId = `C${String(num).padStart(3, '0')}`
  }
  return newId
}

// Function to add a new bid to the mock database
export function addBidToMockDB(bid: Bid): void {
  const newBids = [...mockBids, bid]
  updateBids(newBids)
}

// Function to generate a unique bid ID
export function generateBidId(): string {
  const existingIds = mockBids.map(b => b.id)
  let newId = `B${String(mockBids.length + 1).padStart(3, '0')}`
  while (existingIds.includes(newId)) {
    const num = parseInt(newId.substring(1)) + 1
    newId = `B${String(num).padStart(3, '0')}`
  }
  return newId
}

// Function to refresh data from localStorage (useful for components)
export function refreshMockData(): void {
  if (typeof window !== 'undefined') {
    console.log('🔄 Refreshing mock data from localStorage...')
    mockPools = loadPools()
    mockJoinRequests = loadJoinRequests()
    mockContributions = loadContributions()
    mockBids = loadBids()
    console.log('✅ Mock data refreshed successfully')
  }
}

// Function to check localStorage status (for debugging)
export function checkLocalStorageStatus(): void {
  if (typeof window === 'undefined') {
    console.log('❌ Not in browser environment - cannot check localStorage')
    return
  }

  console.log('🔍 Checking localStorage status...')
  
  // Check pools
  const poolsData = localStorage.getItem('cult-finance-pools')
  console.log('Pools in localStorage:', poolsData ? `${poolsData.length} characters` : 'Not found')
  
  // Check join requests
  const joinRequestsData = localStorage.getItem('cult-finance-join-requests')
  console.log('Join requests in localStorage:', joinRequestsData ? `${joinRequestsData.length} characters` : 'Not found')
  
  // Check contributions
  const contributionsData = localStorage.getItem('cult-finance-contributions')
  console.log('Contributions in localStorage:', contributionsData ? `${contributionsData.length} characters` : 'Not found')
  
  // Check bids
  const bidsData = localStorage.getItem('cult-finance-bids')
  console.log('Bids in localStorage:', bidsData ? `${bidsData.length} characters` : 'Not found')
  
  // Check available space
  try {
    const testData = 'test'
    localStorage.setItem('test', testData)
    localStorage.removeItem('test')
    console.log('✅ localStorage is working properly')
  } catch (error) {
    console.error('❌ localStorage error:', error)
  }
}

// Function to clear all data (for testing)
export function clearAllData(): void {
  if (typeof window === 'undefined') return
  
  console.log('🗑️ Clearing all data from localStorage...')
  localStorage.removeItem('cult-finance-pools')
  localStorage.removeItem('cult-finance-join-requests')
  localStorage.removeItem('cult-finance-contributions')
  localStorage.removeItem('cult-finance-bids')
  console.log('✅ All data cleared')
  
  // Reset to defaults
  mockPools = [...defaultPools]
  mockJoinRequests = [...defaultJoinRequests]
  mockContributions = [...defaultContributions]
  mockBids = [...defaultBids]
}
