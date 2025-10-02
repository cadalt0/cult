"use client"

import type React from "react"
import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Gavel } from "lucide-react"
import { type Pool, getBidsByPoolId, addBidToMockDB, generateBidId } from "@/lib/mock-data"

interface BidDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  pool: Pool
  memberId: string
  onBidPlaced?: () => void
}

export function BidDialog({ open, onOpenChange, pool, memberId, onBidPlaced }: BidDialogProps) {
  const [bidPercent, setBidPercent] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const bids = getBidsByPoolId(pool.id)
  const highestBid = bids.length > 0 ? Math.max(...bids.map((b) => b.amount)) : 0

  // Calculate bid amount based on percentage
  const contributionAmount = pool.contributionAmount || 0
  const bidAmount = bidPercent ? (contributionAmount * parseFloat(bidPercent)) / 100 : 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const response = await fetch('/api/place-bid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          poolAddress: pool.poolAddress,
          memberId: memberId,
          bidPercent: parseFloat(bidPercent)
        })
      })

      const blockchainResult = await response.json()

      if (!response.ok) {
        throw new Error(blockchainResult.error || 'Failed to place bid')
      }

      if (blockchainResult.success) {
        // Add bid to mock database
        const newBid = {
          id: generateBidId(),
          poolId: pool.id,
          poolName: pool.name,
          memberId: memberId,
          memberName: `Member ${memberId}`,
          amount: bidAmount,
          bidAt: new Date().toISOString(),
          status: "active" as const,
          poolAddress: pool.poolAddress,
          transactionHash: blockchainResult.transactionHash,
          blockNumber: blockchainResult.blockNumber
        }
        
        addBidToMockDB(newBid)
        
        if (onBidPlaced) {
          onBidPlaced()
        }
        
        setBidPercent("")
        onOpenChange(false)
        alert(`Bid placed successfully!\nBid: ${bidPercent}% (${blockchainResult.bidAmount} tokens)\nTransaction: ${blockchainResult.transactionHash}`)
      }
    } catch (error) {
      console.error("Error placing bid:", error)
      setError(error instanceof Error ? error.message : "Failed to place bid")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="text-2xl">Place Your Bid</DialogTitle>
          <DialogDescription>{pool.name}</DialogDescription>
        </DialogHeader>

        <div className="bg-muted/50 p-4 rounded-lg space-y-2 my-4">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Contribution Amount:</span>
            <span className="font-medium text-foreground">{contributionAmount.toLocaleString()} tokens</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Current Highest Bid:</span>
            <span className="font-bold text-chart-4">${highestBid.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Total Bids:</span>
            <span className="font-medium text-foreground">{bids.length}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Pool Status:</span>
            <span className="font-medium text-foreground">{pool.status}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="bidPercent">Bid Percentage (60% - 95%)</Label>
            <Input
              id="bidPercent"
              type="number"
              placeholder="Enter bid percentage"
              value={bidPercent}
              onChange={(e) => setBidPercent(e.target.value)}
              required
              min={60}
              max={95}
              step={1}
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              Bid amount: {bidAmount.toFixed(2)} tokens ({bidPercent}% of {contributionAmount} tokens)
            </p>
            <p className="text-xs text-muted-foreground">
              Must be between 60% and 95% of your contribution amount
            </p>
          </div>

          {error && (
            <div className="text-sm text-red-500 bg-red-50 p-2 rounded">
              {error}
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
              type="submit" 
              className="flex-1"
              disabled={isLoading || !bidPercent || parseFloat(bidPercent) < 60 || parseFloat(bidPercent) > 95}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Placing Bid...
                </>
              ) : (
                <>
                  <Gavel className="w-4 h-4 mr-2" />
                  Place Bid
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
