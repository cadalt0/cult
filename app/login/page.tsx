"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TrendingUp, ArrowRight } from "lucide-react"
import Link from "next/link"
import { mockUsers } from "@/lib/mock-data"

export default function LoginPage() {
  const [userId, setUserId] = useState("")
  const [role, setRole] = useState<"leader" | "member" | "">("")
  const [error, setError] = useState("")
  const router = useRouter()
  const { login } = useAuth()

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!userId || !role) {
      setError("Please enter your ID and select a role")
      return
    }

    const user = mockUsers.find((u) => u.id === userId && u.role === role)

    if (!user) {
      setError("Invalid ID or role. Please check your credentials.")
      return
    }

    login(userId, role)

    // Redirect based on role
    if (role === "leader") {
      router.push(`/leader/${user.name.toLowerCase().replace(" ", "-")}`)
    } else {
      router.push(`/member/${userId}`)
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold text-foreground">Cult Finance</span>
          </Link>
        </div>
      </header>

      {/* Login Form */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md animate-fade-in">
          <Card className="border-border shadow-lg">
            <CardHeader className="space-y-1">
              <CardTitle className="text-3xl font-bold text-center">Welcome Back</CardTitle>
              <CardDescription className="text-center text-base">
                Enter your credentials to access your dashboard
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="userId" className="text-base font-medium">
                    User ID
                  </Label>
                  <Input
                    id="userId"
                    type="text"
                    placeholder="Enter your ID (e.g., L001, M001)"
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    className="h-12 text-base"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role" className="text-base font-medium">
                    Role
                  </Label>
                  <Select value={role} onValueChange={(value: "leader" | "member") => setRole(value)}>
                    <SelectTrigger className="h-12 text-base">
                      <SelectValue placeholder="Select your role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="leader">Leader</SelectItem>
                      <SelectItem value="member">Member</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {error && (
                  <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-lg text-sm animate-shake">
                    {error}
                  </div>
                )}

                <Button type="submit" className="w-full h-12 text-base" size="lg">
                  Login
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </form>

              {/* Demo Credentials */}
              <div className="mt-8 pt-6 border-t border-border">
                <p className="text-sm font-medium text-muted-foreground mb-3">Demo Credentials:</p>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex justify-between items-center bg-muted/50 px-3 py-2 rounded">
                    <span className="font-medium">Leader:</span>
                    <span className="font-mono">L001</span>
                  </div>
                  <div className="flex justify-between items-center bg-muted/50 px-3 py-2 rounded">
                    <span className="font-medium">Member:</span>
                    <span className="font-mono">M001, M002</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
