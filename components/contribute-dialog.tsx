"use client"

import type React from "react"
import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DollarSign, Loader2 } from "lucide-react"
import { addContributionToMockDB, generateContributionId, type Pool, type Contribution } from "@/lib/mock-data"

interface ContributeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  pool: Pool
  memberId: string
  onContributionMade?: (contribution: Contribution) => void
}

export function ContributeDialog({ open, onOpenChange, pool, memberId, onContributionMade }: ContributeDialogProps) {
  const [amount, setAmount] = useState(pool.contributionAmount.toString())
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!pool.poolAddress) {
      setError("Pool address not available")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      // Call API route to contribute to pool on blockchain
      const response = await fetch('/api/contribute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          poolAddress: pool.poolAddress,
          memberId: memberId,
          amount: parseFloat(amount)
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to contribute')
      }

      if (result.success) {
        // Create contribution object for mock database
        const newContribution: Contribution = {
          id: generateContributionId(),
          poolId: pool.id,
          poolName: pool.name,
          memberId: memberId,
          memberName: `Member ${memberId}`, // You might want to get this from user context
          amount: parseFloat(amount),
          contributedAt: new Date().toISOString()
        }

        // Add to mock database
        addContributionToMockDB(newContribution)

        // Notify parent component
        if (onContributionMade) {
          onContributionMade(newContribution)
        }

        // Reset form and close dialog
        setAmount("")
        onOpenChange(false)
        
        alert(`Contribution successful!\nAmount: $${amount}\nApprove TX: ${result.approveTransactionHash}\nContribute TX: ${result.contributeTransactionHash}`)
      }
    } catch (error) {
      console.error("Error contributing:", error)
      setError(error instanceof Error ? error.message : "Failed to contribute")
    } finally {
      setIsLoading(false)
    }
  }

  const remainingAmount = pool.totalAmount - pool.contributedAmount

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="text-2xl">Contribute to Pool</DialogTitle>
          <DialogDescription>{pool.name}</DialogDescription>
        </DialogHeader>

        <div className="bg-muted/50 p-4 rounded-lg space-y-2 my-4">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Required Contribution:</span>
            <span className="font-bold text-chart-2">${pool.contributionAmount}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Pool Status:</span>
            <span className="font-medium text-foreground capitalize">{pool.status}</span>
          </div>
          {pool.poolAddress && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Pool Address:</span>
              <span className="font-mono text-xs text-foreground">{pool.poolAddress.slice(0, 10)}...</span>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Contribution Amount ($)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              min="0.01"
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              Required amount: ${pool.contributionAmount} (must match exactly)
            </p>
          </div>

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
              type="submit" 
              className="flex-1"
              disabled={isLoading || !pool.poolAddress}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Contributing...
                </>
              ) : (
                <>
                  <DollarSign className="w-4 h-4 mr-2" />
                  Contribute
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
