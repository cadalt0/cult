"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { UserPlus, DollarSign, Gavel, Search } from "lucide-react"
import { mockPools, type Pool, getContributionsByMemberId } from "@/lib/mock-data"

interface PoolBrowserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  memberId: string
  onContribute: (pool: Pool) => void
  onBid: (pool: Pool) => void
}

export function PoolBrowserDialog({ open, onOpenChange, memberId, onContribute, onBid }: PoolBrowserDialogProps) {
  const [searchTerm, setSearchTerm] = useState("")

  const filteredPools = mockPools.filter(
    (pool) =>
      pool.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pool.description.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleJoinRequest = (poolId: string) => {
    console.log("Requesting to join pool:", poolId, "Member:", memberId)
    alert("Join request sent! (Mock action)")
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Browse Investment Pools</DialogTitle>
          <DialogDescription>Discover and join pools that match your investment interests.</DialogDescription>
        </DialogHeader>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search pools..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="space-y-4">
          {filteredPools.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No pools found</div>
          ) : (
            filteredPools.map((pool) => {
              const progress = (pool.contributedAmount / pool.totalAmount) * 100

              return (
                <Card key={pool.id} className="border-border hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{pool.name}</CardTitle>
                        <CardDescription className="text-sm mt-1">{pool.description}</CardDescription>
                        <p className="text-xs text-muted-foreground mt-2">Led by {pool.leaderName}</p>
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

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Target</p>
                        <p className="text-sm font-bold text-foreground">${pool.totalAmount.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Members</p>
                        <p className="text-sm font-bold text-foreground">
                          {pool.memberCount}/{pool.maxMembers}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Status</p>
                        <p className="text-sm font-bold text-foreground capitalize">{pool.status}</p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      {pool.status === "pending" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleJoinRequest(pool.id)}
                          className="flex-1"
                        >
                          <UserPlus className="w-4 h-4 mr-1" />
                          Request to Join
                        </Button>
                      )}
                      {pool.status === "active" && (
                        <>
                          <Button size="sm" variant="outline" onClick={() => handleJoinRequest(pool.id)}>
                            <UserPlus className="w-4 h-4 mr-1" />
                            Join
                          </Button>
                          <Button size="sm" onClick={() => onContribute(pool)} className="flex-1">
                            <DollarSign className="w-4 h-4 mr-1" />
                            Contribute
                          </Button>
                        </>
                      )}
                      {pool.status === "bidding" && (() => {
                        const memberContributions = getContributionsByMemberId(memberId)
                        const hasContributed = memberContributions.some(c => c.poolId === pool.id)
                        
                        return hasContributed ? (
                          <Button size="sm" onClick={() => onBid(pool)} className="flex-1">
                            <Gavel className="w-4 h-4 mr-1" />
                            Place Bid
                          </Button>
                        ) : (
                          <Button size="sm" onClick={() => onContribute(pool)} className="flex-1">
                            <DollarSign className="w-4 h-4 mr-1" />
                            Contribute
                          </Button>
                        )
                      })()}
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
