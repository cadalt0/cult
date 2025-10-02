"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { ArrowRight, TrendingUp, Users, Shield } from "lucide-react"
import Link from "next/link"

export default function HomePage() {
  const router = useRouter()
  const { isAuthenticated, user } = useAuth()

  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === "leader") {
        router.push(`/leader/${user.name.toLowerCase().replace(" ", "-")}`)
      } else {
        router.push(`/member/${user.id}`)
      }
    }
  }, [isAuthenticated, user, router])

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold text-foreground">Cult Finance</span>
          </div>
          <Link href="/login">
            <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground">
              Login
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 md:py-32">
        <div className="max-w-4xl mx-auto text-center animate-fade-in">
          <div className="inline-flex items-center gap-2 bg-accent/10 text-accent px-4 py-2 rounded-full text-sm font-medium mb-6">
            <span className="w-2 h-2 bg-accent rounded-full animate-pulse"></span>
            Collaborative Investment Platform
          </div>
          <h1 className="text-5xl md:text-7xl font-bold text-foreground mb-6 text-balance">
            Finance without the middleman
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 text-pretty max-w-2xl mx-auto">
            Join investment pools, contribute collectively, and participate in transparent bidding processes. The future
            of collaborative finance is here.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/login">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground text-lg px-8 py-6">
                Get Started
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20 bg-muted/30">
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <div className="bg-card p-8 rounded-xl border border-border animate-slide-in hover:shadow-lg transition-shadow">
            <div className="w-14 h-14 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
              <Users className="w-7 h-7 text-accent" />
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-3">Pool Management</h3>
            <p className="text-muted-foreground leading-relaxed">
              Leaders create and manage investment pools. Members join, contribute, and participate in collective
              decision-making.
            </p>
          </div>

          <div
            className="bg-card p-8 rounded-xl border border-border animate-slide-in hover:shadow-lg transition-shadow"
            style={{ animationDelay: "0.1s" }}
          >
            <div className="w-14 h-14 bg-chart-2/10 rounded-lg flex items-center justify-center mb-4">
              <TrendingUp className="w-7 h-7 text-chart-2" />
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-3">Transparent Bidding</h3>
            <p className="text-muted-foreground leading-relaxed">
              Fair and transparent bidding system where members compete for investment opportunities with full
              visibility.
            </p>
          </div>

          <div
            className="bg-card p-8 rounded-xl border border-border animate-slide-in hover:shadow-lg transition-shadow"
            style={{ animationDelay: "0.2s" }}
          >
            <div className="w-14 h-14 bg-chart-4/10 rounded-lg flex items-center justify-center mb-4">
              <Shield className="w-7 h-7 text-chart-4" />
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-3">Secure Settlements</h3>
            <p className="text-muted-foreground leading-relaxed">
              Leaders can settle pools with complete transparency, ensuring fair distribution and accountability.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto bg-primary text-primary-foreground rounded-2xl p-12 text-center animate-scale-in">
          <h2 className="text-4xl font-bold mb-4 text-balance">Ready to start investing collectively?</h2>
          <p className="text-xl mb-8 text-primary-foreground/90 text-pretty">
            Join as a leader to create pools or as a member to participate in investment opportunities.
          </p>
          <Link href="/login">
            <Button size="lg" variant="secondary" className="text-lg px-8 py-6">
              Login Now
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card/50 py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>&copy; 2025 Cult Finance. Collaborative investment platform.</p>
        </div>
      </footer>
    </div>
  )
}
