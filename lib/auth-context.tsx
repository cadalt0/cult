"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { type User, getUserById } from "./mock-data"

interface AuthContextType {
  user: User | null
  login: (userId: string, role: "leader" | "member") => void
  logout: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    // Check for stored auth
    const storedUserId = localStorage.getItem("userId")
    const storedRole = localStorage.getItem("userRole")

    if (storedUserId && storedRole) {
      const foundUser = getUserById(storedUserId)
      if (foundUser && foundUser.role === storedRole) {
        setUser(foundUser)
      }
    }
  }, [])

  const login = (userId: string, role: "leader" | "member") => {
    const foundUser = getUserById(userId)
    if (foundUser && foundUser.role === role) {
      setUser(foundUser)
      localStorage.setItem("userId", userId)
      localStorage.setItem("userRole", role)
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("userId")
    localStorage.removeItem("userRole")
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>{children}</AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
