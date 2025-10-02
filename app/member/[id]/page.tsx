"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, LogOut, Search, DollarSign, Gavel, Clock } from "lucide-react"
import { getJoinRequestsByMemberId, getContributionsByMemberId, getBidsByMemberId, mockPools, refreshMockData, type Pool, type JoinRequest } from "@/lib/mock-data"
import { PoolBrowserDialog } from "@/components/pool-browser-dialog"
import { ContributeDialog } from "@/components/contribute-dialog"
import { BidDialog } from "@/components/bid-dialog"
import { JoinPoolDialog } from "@/components/join-pool-dialog"

export default function MemberDashboard() {
  const { user, logout, isAuthenticated } = useAuth()
  const router = useRouter()
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([])
  const [contributions, setContributions] = useState<any[]>([])
  const [bids, setBids] = useState<any[]>([])
  const [isBrowserOpen, setIsBrowserOpen] = useState(false)
  const [isJoinDialogOpen, setIsJoinDialogOpen] = useState(false)
  const [selectedPool, setSelectedPool] = useState<Pool | null>(null)
  const [isContributeOpen, setIsContributeOpen] = useState(false)
  const [isBidOpen, setIsBidOpen] = useState(false)

  const refreshJoinRequests = () => {
    if (user) {
      const userRequests = getJoinRequestsByMemberId(user.id)
      setJoinRequests(userRequests)
    }
  }

  const refreshBids = () => {
    if (user) {
      const userBids = getBidsByMemberId(user.id)
      setBids(userBids)
    }
  }

  useEffect(() => {
    if (!isAuthenticated || !user || user.role !== "member") {
      router.push("/login")
      return
    }

    // Refresh data from localStorage on mount
    refreshMockData()
    refreshJoinRequests()
    
    // Refresh contributions after data is loaded
    const userContributions = getContributionsByMemberId(user.id)
    const userBids = getBidsByMemberId(user.id)

    setContributions(userContributions)
    setBids(userBids)
  }, [isAuthenticated, user, router])

  const handleJoinRequested = (joinRequest: JoinRequest) => {
    refreshJoinRequests()
  }

  const handleContributionMade = (contribution: any) => {
    // Refresh contributions
    const userContributions = getContributionsByMemberId(user.id)
    setContributions(userContributions)
  }

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  const handleContribute = (pool: Pool) => {
    setSelectedPool(pool)
    setIsContributeOpen(true)
  }

  const handleBid = (pool: Pool) => {
    setSelectedPool(pool)
    setIsBidOpen(true)
  }

  const totalContributed = contributions.reduce((sum, c) => sum + c.amount, 0)
  const totalBids = bids.length
  const pendingRequests = joinRequests.filter((r) => r.status === "pending").length

  if (!user) return null

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <span className="text-2xl font-bold text-foreground">Cult Finance</span>
              <p className="text-sm text-muted-foreground">Member Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-foreground">{user.name}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-border animate-slide-in">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Contributed</CardTitle>
              <DollarSign className="w-5 h-5 text-chart-2" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">${totalContributed.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">Across {contributions.length} pools</p>
            </CardContent>
          </Card>

          <Card className="border-border animate-slide-in" style={{ animationDelay: "0.1s" }}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Bids</CardTitle>
              <Gavel className="w-5 h-5 text-chart-4" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{totalBids}</div>
              <p className="text-xs text-muted-foreground mt-1">Participating in bidding</p>
            </CardContent>
          </Card>

          <Card className="border-border animate-slide-in" style={{ animationDelay: "0.2s" }}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending Requests</CardTitle>
              <Clock className="w-5 h-5 text-chart-1" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{pendingRequests}</div>
              <p className="text-xs text-muted-foreground mt-1">Awaiting approval</p>
            </CardContent>
          </Card>
        </div>

        {/* Browse Pools CTA */}
        <Card className="border-border mb-8 bg-gradient-to-br from-primary/5 to-chart-2/5 animate-scale-in">
          <CardContent className="flex flex-col md:flex-row items-center justify-between p-8 gap-4">
            <div>
              <h3 className="text-2xl font-bold text-foreground mb-2">Discover Investment Pools</h3>
              <p className="text-muted-foreground">
                Browse available pools, request to join, and start your investment journey.
              </p>
            </div>
            <div className="flex gap-3">
              <Button size="lg" onClick={() => setIsJoinDialogOpen(true)} className="whitespace-nowrap">
                <Clock className="w-5 h-5 mr-2" />
                Join Pool
              </Button>
              <Button size="lg" onClick={() => setIsBrowserOpen(true)} className="whitespace-nowrap" variant="outline">
                <Search className="w-5 h-5 mr-2" />
                Browse Pools
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Bid on Pools CTA - Only show if member has contributions */}
        {contributions.length > 0 && (
          <Card className="border-border mb-8 bg-gradient-to-br from-chart-4/5 to-chart-3/5 animate-scale-in">
            <CardContent className="flex flex-col md:flex-row items-center justify-between p-8 gap-4">
              <div>
                <h3 className="text-2xl font-bold text-foreground mb-2">Place Your Bids</h3>
                <p className="text-muted-foreground">
                  Bid on active pools you've contributed to. Place bids between 60% and 95% of your contribution amount.
                </p>
              </div>
              <div className="flex gap-3">
                <Button 
                  size="lg" 
                  onClick={() => {
                    // Find pools the member has contributed to and are active/bidding
                    const contributedPools = mockPools.filter(pool => 
                      (pool.status === "active" || pool.status === "bidding") && 
                      contributions.some(c => c.poolId === pool.id)
                    )
                    if (contributedPools.length > 0) {
                      setSelectedPool(contributedPools[0])
                      setIsBidOpen(true)
                    } else {
                      alert("No active pools available for bidding. You need to contribute to a pool first.")
                    }
                  }} 
                  className="whitespace-nowrap"
                >
                  <Gavel className="w-5 h-5 mr-2" />
                  Place Bid
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* My Activity */}
        <div className="space-y-6">
          {/* Join Requests */}
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-4">My Join Requests</h2>
            {joinRequests.length === 0 ? (
              <Card className="border-border border-dashed">
                <CardContent className="text-center py-8 text-muted-foreground">
                  No join requests yet. Browse pools to get started!
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {joinRequests.map((request, index) => (
                  <Card
                    key={request.id}
                    className="border-border animate-slide-in"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg">{request.poolName}</CardTitle>
                          <CardDescription className="text-sm mt-1">
                            Requested {new Date(request.requestedAt).toLocaleDateString()}
                          </CardDescription>
                          {request.transactionHash && (
                            <div className="mt-2 p-2 bg-muted/50 rounded-md">
                              <p className="text-xs text-muted-foreground mb-1">Transaction:</p>
                              <p className="text-xs font-mono text-foreground break-all">
                                {request.transactionHash}
                              </p>
                            </div>
                          )}
                        </div>
                        <Badge
                          variant={
                            request.status === "approved"
                              ? "default"
                              : request.status === "pending"
                                ? "secondary"
                                : "destructive"
                          }
                        >
                          {request.status}
                        </Badge>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Contributions */}
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-4">My Contributions</h2>
            {contributions.length === 0 ? (
              <Card className="border-border border-dashed">
                <CardContent className="text-center py-8 text-muted-foreground">
                  No contributions yet. Join a pool to start contributing!
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {contributions.map((contribution, index) => (
                  <Card
                    key={contribution.id}
                    className="border-border animate-slide-in"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <CardContent className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-chart-2/10 rounded-full flex items-center justify-center">
                          <DollarSign className="w-5 h-5 text-chart-2" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{contribution.poolName}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(contribution.contributedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-chart-2">${contribution.amount.toLocaleString()}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Available Pools for Bidding */}
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-4">Available for Bidding</h2>
            {(() => {
              const availablePools = mockPools.filter(pool => 
                (pool.status === "active" || pool.status === "bidding") && 
                contributions.some(c => c.poolId === pool.id)
              )
              
              // Debug logging
              console.log('Available pools for bidding:', {
                allPools: mockPools.map(p => ({ id: p.id, name: p.name, status: p.status })),
                contributions: contributions.map(c => ({ poolId: c.poolId, memberId: c.memberId })),
                availablePools: availablePools.map(p => ({ id: p.id, name: p.name, status: p.status }))
              })
              
              if (availablePools.length === 0) {
                return (
                  <Card className="border-border border-dashed">
                    <CardContent className="text-center py-8 text-muted-foreground">
                      <div className="space-y-2">
                        <p>No pools available for bidding.</p>
                        <p className="text-sm">You need to:</p>
                        <ol className="text-sm text-left max-w-xs mx-auto space-y-1">
                          <li>1. Join a pool</li>
                          <li>2. Contribute to the pool</li>
                          <li>3. Wait for pool to become active</li>
                        </ol>
                      </div>
                    </CardContent>
                  </Card>
                )
              }
              
              return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {availablePools.map((pool, index) => (
                    <Card
                      key={pool.id}
                      className="border-border animate-slide-in"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg">{pool.name}</CardTitle>
                            <CardDescription className="mt-1">{pool.description}</CardDescription>
                          </div>
                          <Badge variant="default" className="ml-2">
                            {pool.status}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Contribution Amount:</span>
                            <span className="font-medium">{pool.contributionAmount?.toLocaleString()} tokens</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Members:</span>
                            <span className="font-medium">{pool.memberCount}/{pool.maxMembers}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Total Value:</span>
                            <span className="font-medium">${pool.totalAmount.toLocaleString()}</span>
                          </div>
                          {pool.poolAddress && (
                            <div className="mt-2 p-2 bg-muted/50 rounded-md">
                              <p className="text-xs text-muted-foreground mb-1">Pool Address:</p>
                              <p className="text-xs font-mono text-foreground break-all">
                                {pool.poolAddress}
                              </p>
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2 mt-4">
                          <Button 
                            size="sm" 
                            onClick={() => {
                              setSelectedPool(pool)
                              setIsBidOpen(true)
                            }}
                            className="flex-1"
                          >
                            <Gavel className="w-4 h-4 mr-2" />
                            Place Bid
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )
            })()}
          </div>

          {/* Bids */}
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-4">My Bids</h2>
            {bids.length === 0 ? (
              <Card className="border-border border-dashed">
                <CardContent className="text-center py-8 text-muted-foreground">
                  No bids yet. Participate in bidding when pools are active!
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {bids.map((bid, index) => (
                  <Card
                    key={bid.id}
                    className="border-border animate-slide-in"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <CardContent className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-chart-4/10 rounded-full flex items-center justify-center">
                          <Gavel className="w-5 h-5 text-chart-4" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{bid.poolName}</p>
                          <p className="text-sm text-muted-foreground">{new Date(bid.bidAt).toLocaleDateString()}</p>
                          {bid.transactionHash && (
                            <p className="text-xs text-muted-foreground font-mono">
                              TX: {bid.transactionHash.substring(0, 10)}...
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-chart-4">${bid.amount.toLocaleString()}</p>
                        <Badge variant={bid.status === "won" ? "default" : "secondary"} className="mt-1">
                          {bid.status}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <JoinPoolDialog
        open={isJoinDialogOpen}
        onOpenChange={setIsJoinDialogOpen}
        memberId={user.id}
        memberName={user.name}
        availablePools={mockPools.filter(p => p.status === "active" || p.status === "pending")}
        onJoinRequested={handleJoinRequested}
      />
      <PoolBrowserDialog
        open={isBrowserOpen}
        onOpenChange={setIsBrowserOpen}
        memberId={user.id}
        onContribute={handleContribute}
        onBid={handleBid}
      />
      {selectedPool && (
        <>
          <ContributeDialog
            open={isContributeOpen}
            onOpenChange={setIsContributeOpen}
            pool={selectedPool}
            memberId={user.id}
            onContributionMade={handleContributionMade}
          />
          <BidDialog 
            open={isBidOpen} 
            onOpenChange={setIsBidOpen} 
            pool={selectedPool} 
            memberId={user.id}
            onBidPlaced={refreshBids}
          />
        </>
      )}
    </div>
  )
}
