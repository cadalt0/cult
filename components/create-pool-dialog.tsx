"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Loader2 } from "lucide-react"
// Removed direct blockchain import - now using API route
import { addPoolToMockDB, generatePoolId, type Pool } from "@/lib/mock-data"

interface CreatePoolDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  leaderId: string
  leaderName: string
  onPoolCreated?: (pool: Pool) => void
}

export function CreatePoolDialog({ open, onOpenChange, leaderId, leaderName, onPoolCreated }: CreatePoolDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    contributionAmount: "",
    maxMembers: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      // Call API route to create pool on blockchain
      const response = await fetch('/api/create-pool', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contributionAmount: parseFloat(formData.contributionAmount),
          maxMembers: parseInt(formData.maxMembers)
        })
      })

      const blockchainResult = await response.json()

      if (!response.ok) {
        throw new Error(blockchainResult.error || 'Failed to create pool')
      }

      if (blockchainResult.success) {
        // Create pool object for mock database
        const newPool: Pool = {
          id: generatePoolId(),
          name: formData.name,
          description: formData.description,
          leaderId: leaderId,
          leaderName: leaderName,
          totalAmount: parseFloat(formData.contributionAmount) * parseInt(formData.maxMembers), // Calculate total
          contributedAmount: 0,
          memberCount: 0,
          maxMembers: parseInt(formData.maxMembers),
          contributionAmount: parseFloat(formData.contributionAmount),
          status: "pending",
          createdAt: new Date().toISOString(),
          poolAddress: blockchainResult.poolAddress,
          transactionHash: blockchainResult.transactionHash,
          blockNumber: blockchainResult.blockNumber
        }

        // Add to mock database
        addPoolToMockDB(newPool)

        // Notify parent component
        if (onPoolCreated) {
          onPoolCreated(newPool)
        }

        // Reset form and close dialog
        setFormData({ name: "", description: "", contributionAmount: "", maxMembers: "" })
        onOpenChange(false)
        
        alert(`Pool created successfully!\nPool Address: ${blockchainResult.poolAddress}\nTransaction: ${blockchainResult.transactionHash}`)
      }
    } catch (error) {
      console.error("Error creating pool:", error)
      setError(error instanceof Error ? error.message : "Failed to create pool")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-2xl">Create New Pool</DialogTitle>
          <DialogDescription>Set up a new investment pool for members to join and contribute.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="name">Pool Name</Label>
            <Input
              id="name"
              placeholder="e.g., Tech Innovators Pool"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe the investment focus and goals..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contributionAmount">Contribution Amount ($)</Label>
              <Input
                id="contributionAmount"
                type="number"
                step="0.01"
                placeholder="100"
                value={formData.contributionAmount}
                onChange={(e) => setFormData({ ...formData, contributionAmount: e.target.value })}
                required
              />
              <p className="text-xs text-muted-foreground">Amount each member contributes</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxMembers">Max Members</Label>
              <Input
                id="maxMembers"
                type="number"
                min="2"
                placeholder="10"
                value={formData.maxMembers}
                onChange={(e) => setFormData({ ...formData, maxMembers: e.target.value })}
                required
              />
              <p className="text-xs text-muted-foreground">Min: 2, Max: 5</p>
            </div>
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
            <Button type="submit" className="flex-1" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Pool
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

