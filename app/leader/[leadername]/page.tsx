"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, LogOut, Plus, Users, DollarSign, Play, Gavel, CheckCircle, ArrowUpRight } from "lucide-react"
import {
  getPoolsByLeaderId,
  getJoinRequestsByPoolId,
  getContributionsByPoolId,
  getBidsByPoolId,
  refreshMockData,
  checkLocalStorageStatus,
  type Pool,
} from "@/lib/mock-data"
import { CreatePoolDialog } from "@/components/create-pool-dialog"
import { ManagePoolDialog } from "@/components/manage-pool-dialog"

export default function LeaderDashboard() {
  const { user, logout, isAuthenticated } = useAuth()
  const router = useRouter()
  const [pools, setPools] = useState<Pool[]>([])
  const [selectedPool, setSelectedPool] = useState<Pool | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isManageDialogOpen, setIsManageDialogOpen] = useState(false)

  const refreshPools = () => {
    if (user) {
      const userPools = getPoolsByLeaderId(user.id)
      setPools(userPools)
    }
  }

  useEffect(() => {
    if (!isAuthenticated || !user || user.role !== "leader") {
      router.push("/login")
      return
    }

    // Refresh data from localStorage on mount
    refreshMockData()
    refreshPools()
  }, [isAuthenticated, user, router])

  const handlePoolCreated = (newPool: Pool) => {
    refreshPools()
  }

  const handleCheckStorage = () => {
    checkLocalStorageStatus()
  }

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  const handleManagePool = (pool: Pool) => {
    setSelectedPool(pool)
    setIsManageDialogOpen(true)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-chart-2 text-white"
      case "bidding":
        return "bg-chart-4 text-white"
      case "settled":
        return "bg-chart-1 text-white"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  const totalPoolValue = pools.reduce((sum, pool) => sum + pool.contributedAmount, 0)
  const totalMembers = pools.reduce((sum, pool) => sum + pool.memberCount, 0)
  const activePools = pools.filter((p) => p.status === "active" || p.status === "bidding").length

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
              <p className="text-sm text-muted-foreground">Leader Dashboard</p>
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
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Pool Value</CardTitle>
              <DollarSign className="w-5 h-5 text-chart-1" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">${totalPoolValue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">Across all pools</p>
            </CardContent>
          </Card>

          <Card className="border-border animate-slide-in" style={{ animationDelay: "0.1s" }}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Pools</CardTitle>
              <Play className="w-5 h-5 text-chart-2" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{activePools}</div>
              <p className="text-xs text-muted-foreground mt-1">Currently running</p>
            </CardContent>
          </Card>

          <Card className="border-border animate-slide-in" style={{ animationDelay: "0.2s" }}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Members</CardTitle>
              <Users className="w-5 h-5 text-chart-4" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{totalMembers}</div>
              <p className="text-xs text-muted-foreground mt-1">Participating members</p>
            </CardContent>
          </Card>
        </div>

        {/* Pools Management */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-bold text-foreground">Your Pools</h2>
          <div className="flex gap-3">
            <Button onClick={handleCheckStorage} variant="outline" size="sm">
              🔍 Check Storage
            </Button>
            <Button onClick={() => setIsCreateDialogOpen(true)} size="lg" className="animate-scale-in">
              <Plus className="w-5 h-5 mr-2" />
              Create Pool
            </Button>
          </div>
        </div>

        {/* Pool Addresses Summary */}
        {pools.some(p => p.poolAddress) && (
          <Card className="mb-6 border-border">
            <CardHeader>
              <CardTitle className="text-lg">Pool Addresses</CardTitle>
              <CardDescription>Blockchain contract addresses for your pools</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pools.filter(p => p.poolAddress).map((pool) => (
                  <div key={pool.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div>
                      <p className="font-medium text-foreground">{pool.name}</p>
                      <p className="text-sm text-muted-foreground">Status: {pool.status}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-mono text-foreground break-all max-w-xs">
                        {pool.poolAddress}
                      </p>
                      {pool.transactionHash && (
                        <p className="text-xs text-muted-foreground mt-1">
                          TX: {pool.transactionHash.slice(0, 10)}...
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {pools.length === 0 ? (
          <Card className="border-border border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <TrendingUp className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">No pools yet</h3>
              <p className="text-muted-foreground mb-6 text-center max-w-md">
                Create your first investment pool to start managing contributions and bidding.
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)} size="lg">
                <Plus className="w-5 h-5 mr-2" />
                Create Your First Pool
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {pools.map((pool, index) => {
              const joinRequests = getJoinRequestsByPoolId(pool.id)
              const pendingRequests = joinRequests.filter((r) => r.status === "pending").length
              const contributions = getContributionsByPoolId(pool.id)
              const bids = getBidsByPoolId(pool.id)
              const progress = (pool.contributedAmount / pool.totalAmount) * 100

              return (
                <Card
                  key={pool.id}
                  className="border-border hover:shadow-lg transition-all animate-slide-in cursor-pointer"
                  style={{ animationDelay: `${index * 0.1}s` }}
                  onClick={() => handleManagePool(pool)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-xl mb-2">{pool.name}</CardTitle>
                        <CardDescription className="text-sm">{pool.description}</CardDescription>
                        {pool.poolAddress && (
                          <div className="mt-2 p-2 bg-muted/50 rounded-md">
                            <p className="text-xs text-muted-foreground mb-1">Pool Address:</p>
                            <p className="text-xs font-mono text-foreground break-all">
                              {pool.poolAddress}
                            </p>
                          </div>
                        )}
                      </div>
                      <Badge className={getStatusColor(pool.status)}>{pool.status}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Progress Bar */}
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium text-foreground">{progress.toFixed(0)}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-chart-2 h-full transition-all duration-500 rounded-full"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-4 pt-2">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Contributed</p>
                        <p className="text-lg font-bold text-foreground">${pool.contributedAmount.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Target</p>
                        <p className="text-lg font-bold text-foreground">${pool.totalAmount.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Members</p>
                        <p className="text-lg font-bold text-foreground">
                          {pool.memberCount}/{pool.maxMembers}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Pending</p>
                        <p className="text-lg font-bold text-chart-4">{pendingRequests}</p>
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="flex gap-2 pt-2">
                      {pool.status === "pending" && (
                        <Button size="sm" variant="outline" className="flex-1 bg-transparent">
                          <Play className="w-4 h-4 mr-1" />
                          Start Pool & Bidding
                        </Button>
                      )}
                      {(pool.status === "active" || pool.status === "bidding") && (
                        <Button size="sm" variant="outline" className="flex-1 bg-transparent">
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Settle Pool
                        </Button>
                      )}
                      <Button size="sm" variant="outline">
                        <ArrowUpRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      <CreatePoolDialog 
        open={isCreateDialogOpen} 
        onOpenChange={setIsCreateDialogOpen} 
        leaderId={user.id} 
        leaderName={user.name}
        onPoolCreated={handlePoolCreated}
      />
      {selectedPool && (
        <ManagePoolDialog open={isManageDialogOpen} onOpenChange={setIsManageDialogOpen} pool={selectedPool} />
      )}
    </div>
  )
}
