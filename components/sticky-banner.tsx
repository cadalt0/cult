"use client"

import { Card } from "@/components/ui/card"

export function StickyBanner() {
  return (
    <div className="sticky top-0 z-50 w-full bg-gradient-to-r from-primary/90 to-chart-2/90 backdrop-blur-sm border-b border-primary/20">
      <Card className="border-0 bg-transparent shadow-none rounded-none">
        <div className="overflow-hidden whitespace-nowrap">
          <div className="inline-block animate-snake-scroll">
            <div className="flex items-center gap-12 text-lg font-bold text-primary-foreground py-3">
              <span>🚀 BACKEND IS LOADED WITH KEY AND TEST TOKEN</span>
              <span>•</span>
              <span>TEST DIRECTLY</span>
              <span>•</span>
              <span>NO WALLET CONNECTION NEEDED</span>
              <span>•</span>
              <span>🚀 BACKEND IS LOADED WITH KEY AND TEST TOKEN</span>
              <span>•</span>
              <span>TEST DIRECTLY</span>
              <span>•</span>
              <span>NO WALLET CONNECTION NEEDED</span>
              <span>•</span>
              <span>🚀 BACKEND IS LOADED WITH KEY AND TEST TOKEN</span>
              <span>•</span>
              <span>TEST DIRECTLY</span>
              <span>•</span>
              <span>NO WALLET CONNECTION NEEDED</span>
              <span>•</span>
              <span>🚀 BACKEND IS LOADED WITH KEY AND TEST TOKEN</span>
              <span>•</span>
              <span>TEST DIRECTLY</span>
              <span>•</span>
              <span>NO WALLET CONNECTION NEEDED</span>
              <span>•</span>
              <span>🚀 BACKEND IS LOADED WITH KEY AND TEST TOKEN</span>
              <span>•</span>
              <span>TEST DIRECTLY</span>
              <span>•</span>
              <span>NO WALLET CONNECTION NEEDED</span>
              <span>•</span>
              <span>🚀 BACKEND IS LOADED WITH KEY AND TEST TOKEN</span>
              <span>•</span>
              <span>TEST DIRECTLY</span>
              <span>•</span>
              <span>NO WALLET CONNECTION NEEDED</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
