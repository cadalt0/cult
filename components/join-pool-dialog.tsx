"use client"

import type React from "react"
import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, DollarSign, Clock, Loader2, ExternalLink } from "lucide-react"
import { addJoinRequestToMockDB, generateJoinRequestId, type Pool, type JoinRequest } from "@/lib/mock-data"

interface JoinPoolDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  memberId: string
  memberName: string
  availablePools: Pool[]
  onJoinRequested?: (joinRequest: JoinRequest) => void
}

export function JoinPoolDialog({ 
  open, 
  onOpenChange, 
  memberId, 
  memberName, 
  availablePools,
  onJoinRequested 
}: JoinPoolDialogProps) {
  const [selectedPoolId, setSelectedPoolId] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const selectedPool = availablePools.find(p => p.id === selectedPoolId)

  const handleJoin = async () => {
    if (!selectedPool) return

    setIsLoading(true)
    setError("")

    try {
      // Call API route to join pool on blockchain
      const response = await fetch('/api/join-pool', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          poolAddress: selectedPool.poolAddress,
          memberId: memberId
        })
      })

      const blockchainResult = await response.json()

      if (!response.ok) {
        throw new Error(blockchainResult.error || 'Failed to join pool')
      }

      if (blockchainResult.success) {
        // Create join request object for mock database
        const newJoinRequest: JoinRequest = {
          id: generateJoinRequestId(),
          poolId: selectedPool.id,
          poolName: selectedPool.name,
          memberId: memberId,
          memberName: memberName,
          memberAddress: blockchainResult.memberAddress,
          poolAddress: blockchainResult.poolAddress,
          status: "pending",
          requestedAt: new Date().toISOString(),
          transactionHash: blockchainResult.transactionHash,
          blockNumber: blockchainResult.blockNumber
        }

        // Add to mock database
        addJoinRequestToMockDB(newJoinRequest)

        // Notify parent component
        if (onJoinRequested) {
          onJoinRequested(newJoinRequest)
        }

        // Reset form and close dialog
        setSelectedPoolId("")
        onOpenChange(false)
        
        alert(`Join request submitted successfully!\nPool: ${selectedPool.name}\nTransaction: ${blockchainResult.transactionHash}`)
      }
    } catch (error) {
      console.error("Error joining pool:", error)
      setError(error instanceof Error ? error.message : "Failed to join pool")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-2xl">Join Investment Pool</DialogTitle>
          <DialogDescription>Request to join an available investment pool.</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Pool Selection */}
          <div className="space-y-2">
            <Label htmlFor="pool">Select Pool</Label>
            <Select value={selectedPoolId} onValueChange={setSelectedPoolId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a pool to join..." />
              </SelectTrigger>
              <SelectContent>
                {availablePools.map((pool) => (
                  <SelectItem key={pool.id} value={pool.id}>
                    {pool.name} - {pool.leaderName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Selected Pool Details */}
          {selectedPool && (
            <Card className="border-border">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{selectedPool.name}</CardTitle>
                    <CardDescription>{selectedPool.description}</CardDescription>
                  </div>
                  <Badge className="bg-chart-2 text-white">{selectedPool.status}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Contribution</p>
                      <p className="font-medium">${selectedPool.contributionAmount}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Members</p>
                      <p className="font-medium">{selectedPool.memberCount}/{selectedPool.maxMembers}</p>
                    </div>
                  </div>
                </div>
                
                {selectedPool.poolAddress && (
                  <div className="p-2 bg-muted/50 rounded-md">
                    <p className="text-xs text-muted-foreground mb-1">Pool Address:</p>
                    <p className="text-xs font-mono text-foreground break-all">
                      {selectedPool.poolAddress}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)} 
              className="flex-1"
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleJoin} 
              className="flex-1" 
              disabled={!selectedPool || isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Joining...
                </>
              ) : (
                <>
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Request to Join
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
