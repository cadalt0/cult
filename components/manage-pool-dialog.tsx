"use client"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle, XCircle, Play, Gavel, DollarSign, Users, Loader2 } from "lucide-react"
import { useState } from "react"
import { getJoinRequestsByPoolId, getContributionsByPoolId, getBidsByPoolId, approveAllJoinRequestsForPool, getPendingJoinRequestsForPool, updatePoolStatus, type Pool, type JoinRequest } from "@/lib/mock-data"

interface ManagePoolDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  pool: Pool
}

export function ManagePoolDialog({ open, onOpenChange, pool }: ManagePoolDialogProps) {
  const [isApprovingAll, setIsApprovingAll] = useState(false)
  const [isStartingPool, setIsStartingPool] = useState(false)
  const [error, setError] = useState("")
  
  const joinRequests = getJoinRequestsByPoolId(pool.id)
  const contributions = getContributionsByPoolId(pool.id)
  const bids = getBidsByPoolId(pool.id)
  const pendingRequests = getPendingJoinRequestsForPool(pool.id)

  const handleApprove = (requestId: string) => {
    console.log("Approving request:", requestId)
    alert("Member approved! (Mock action)")
  }

  const handleReject = (requestId: string) => {
    console.log("Rejecting request:", requestId)
    alert("Member rejected! (Mock action)")
  }

  const handleStartPool = async () => {
    if (!pool.poolAddress) {
      setError("Pool address not available")
      return
    }

    setIsStartingPool(true)
    setError("")

    try {
      // Call API route to start pool on blockchain
      const response = await fetch('/api/start-pool', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          poolAddress: pool.poolAddress
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to start pool')
      }

      if (result.success) {
        // Update pool status to bidding (directly after starting)
        updatePoolStatus(pool.id, "bidding")
        
        alert(`Pool started successfully!\nTransaction: ${result.transactionHash}\nStatus: ${result.statusBefore} → ${result.statusAfter}\nCurrent Cycle: ${result.currentCycle}\n\nPool is now in bidding phase!`)
        
        // Refresh the page to show updated data
        window.location.reload()
      }
    } catch (error) {
      console.error("Error starting pool:", error)
      setError(error instanceof Error ? error.message : "Failed to start pool")
    } finally {
      setIsStartingPool(false)
    }
  }


  const handleSettlePool = async () => {
    if (!pool.poolAddress) {
      setError("Pool address not available")
      return
    }

    setIsStartingPool(true)
    setError("")

    try {
      const response = await fetch('/api/settle-pool', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          poolAddress: pool.poolAddress
        })
      })

      const blockchainResult = await response.json()

      if (!response.ok) {
        throw new Error(blockchainResult.error || 'Failed to settle pool')
      }

      if (blockchainResult.success) {
        // Update pool status to completed
        updatePoolStatus(pool.id, "completed")
        
        alert(`Pool settled successfully!\nCycle: ${blockchainResult.cycleId}\nClose Bids TX: ${blockchainResult.closeBidsTransactionHash}\nSettle TX: ${blockchainResult.settleTransactionHash}`)
        
        // Close dialog
        onOpenChange(false)
      }
    } catch (error) {
      console.error("Error settling pool:", error)
      setError(error instanceof Error ? error.message : "Failed to settle pool")
    } finally {
      setIsStartingPool(false)
    }
  }

  const handleApproveAll = async () => {
    if (!pool.poolAddress) {
      setError("Pool address not available")
      return
    }

    setIsApprovingAll(true)
    setError("")

    try {
      // Call API route to approve all joins on blockchain
      const response = await fetch('/api/approve-all-joins', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          poolAddress: pool.poolAddress
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to approve all joins')
      }

      if (result.success) {
        // Update mock database
        approveAllJoinRequestsForPool(pool.id)
        
        alert(`All join requests approved successfully!\nTransaction: ${result.transactionHash}\nApproved: ${result.pendingCount} requests`)
        
        // Refresh the page to show updated data
        window.location.reload()
      }
    } catch (error) {
      console.error("Error approving all joins:", error)
      setError(error instanceof Error ? error.message : "Failed to approve all joins")
    } finally {
      setIsApprovingAll(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-2xl">{pool.name}</DialogTitle>
              <DialogDescription className="mt-1">{pool.description}</DialogDescription>
            </div>
            <Badge
              className={
                pool.status === "active"
                  ? "bg-chart-2 text-white"
                  : pool.status === "bidding"
                    ? "bg-chart-4 text-white"
                    : "bg-muted text-muted-foreground"
              }
            >
              {pool.status}
            </Badge>
          </div>
        </DialogHeader>

        {/* Pool Actions */}
        <div className="space-y-3 py-4 border-y border-border">
          {/* Approve All Joins Button */}
          {pendingRequests.length > 0 && (
            <div className="flex items-center justify-between p-3 bg-chart-2/10 rounded-lg">
              <div>
                <p className="font-medium text-foreground">Approve All Join Requests</p>
                <p className="text-sm text-muted-foreground">
                  {pendingRequests.length} pending request{pendingRequests.length !== 1 ? 's' : ''} waiting for approval
                </p>
              </div>
              <Button 
                onClick={handleApproveAll} 
                disabled={isApprovingAll || !pool.poolAddress}
                className="bg-chart-2 hover:bg-chart-2/90"
              >
                {isApprovingAll ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Approving...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approve All
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* Pool Status Actions */}
          <div className="flex gap-2">
            {pool.status === "pending" && (
              <Button 
                onClick={handleStartPool} 
                className="flex-1"
                disabled={isStartingPool || !pool.poolAddress}
              >
                {isStartingPool ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Starting...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Start Pool & Bidding
                  </>
                )}
              </Button>
            )}
            {(pool.status === "active" || pool.status === "bidding") && (
              <Button 
                onClick={handleSettlePool} 
                className="flex-1"
                disabled={isStartingPool || !pool.poolAddress}
              >
                {isStartingPool ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Settling...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Settle Pool
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        <Tabs defaultValue="requests" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="requests">
              Requests ({joinRequests.filter((r) => r.status === "pending").length})
            </TabsTrigger>
            <TabsTrigger value="contributions">Contributions ({contributions.length})</TabsTrigger>
            <TabsTrigger value="bids">Bids ({bids.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="requests" className="space-y-3 mt-4">
            {joinRequests.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No join requests yet</div>
            ) : (
              joinRequests.map((request) => (
                <Card key={request.id} className="border-border">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-10 h-10 bg-accent rounded-full flex items-center justify-center">
                          <Users className="w-5 h-5 text-accent-foreground" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-foreground">{request.memberName}</p>
                          <p className="text-sm text-muted-foreground">ID: {request.memberId}</p>
                          {request.memberAddress && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Address: {request.memberAddress}
                            </p>
                          )}
                          {request.transactionHash && (
                            <div className="mt-2 p-2 bg-muted/50 rounded-md">
                              <p className="text-xs text-muted-foreground mb-1">Join Transaction:</p>
                              <p className="text-xs font-mono text-foreground break-all">
                                {request.transactionHash}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {request.status === "pending" ? (
                          <>
                            <Button size="sm" variant="outline" onClick={() => handleApprove(request.id)}>
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Approve
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleReject(request.id)}>
                              <XCircle className="w-4 h-4 mr-1" />
                              Reject
                            </Button>
                          </>
                        ) : (
                          <Badge variant={request.status === "approved" ? "default" : "destructive"}>
                            {request.status}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="contributions" className="space-y-3 mt-4">
            {contributions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No contributions yet</div>
            ) : (
              contributions.map((contribution) => (
                <Card key={contribution.id} className="border-border">
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-chart-2/10 rounded-full flex items-center justify-center">
                        <DollarSign className="w-5 h-5 text-chart-2" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{contribution.memberName}</p>
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
              ))
            )}
          </TabsContent>

          <TabsContent value="bids" className="space-y-3 mt-4">
            {bids.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No bids yet</div>
            ) : (
              bids.map((bid) => (
                <Card key={bid.id} className="border-border">
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-chart-4/10 rounded-full flex items-center justify-center">
                        <Gavel className="w-5 h-5 text-chart-4" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{bid.memberName}</p>
                        <p className="text-sm text-muted-foreground">{new Date(bid.bidAt).toLocaleDateString()}</p>
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
              ))
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
