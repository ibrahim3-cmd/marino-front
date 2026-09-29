"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { User, Address } from "@/types"

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  token: string | null

  login: (email: string, password: string) => Promise<boolean>
  register: (data: { firstName: string; lastName: string; email: string; password: string }) => Promise<boolean>
  logout: () => void
  updateProfile: (data: Partial<Pick<User, "firstName" | "lastName" | "email">>) => void
  addAddress: (address: Omit<Address, "id">) => void
  removeAddress: (id: string) => void
}

const BACKEND_URL = process.env.NEXT_PUBLIC_LOCAL_BACKEND_URL || "http://localhost:5000"

// Demo users — in production, this comes from your auth provider
const DEMO_USERS: Array<User & { password: string }> = [
  {
    id: "user-1",
    email: "admin@example.com",
    firstName: "Admin",
    lastName: "User",
    role: "admin",
    addresses: [],
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2025-01-01T00:00:00Z",
    password: "password123",
  },
  {
    id: "user-2",
    email: "demo@example.com",
    firstName: "Jane",
    lastName: "Smith",
    role: "customer",
    addresses: [
      {
        id: "addr-demo-1",
        type: "shipping",
        firstName: "Jane",
        lastName: "Smith",
        line1: "123 Main Street",
        city: "San Francisco",
        state: "CA",
        postalCode: "94105",
        country: "US",
        isDefault: true,
      },
    ],
    createdAt: "2025-01-15T00:00:00Z",
    updatedAt: "2025-01-15T00:00:00Z",
    password: "password123",
  },
]

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      token: null,

      login: async (email, password) => {
        const backendLogin = await fetch(`${BACKEND_URL}/api/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        })

        if (backendLogin.ok) {
          const data = await backendLogin.json()
          const user: User = {
            id: "admin-marino",
            email: data.user?.email || email,
            firstName: "Marino",
            lastName: "Admin",
            role: "admin",
            addresses: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
          set({ user, isAuthenticated: true, token: data.token || null })
          return true
        }

        const found = DEMO_USERS.find(
          (u) => u.email === email && u.password === password
        )
        if (found) {
          const { password: _, ...user } = found
          set({ user, isAuthenticated: true, token: null })
          return true
        }
        return false
      },

      register: async (data) => {
        const backendRegister = await fetch(`${BACKEND_URL}/api/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        })

        if (backendRegister.ok) {
          const result = await backendRegister.json()
          const user: User = {
            id: result.user?.id || `user-${Date.now()}`,
            email: result.user?.email || data.email,
            firstName: result.user?.firstName || data.firstName,
            lastName: result.user?.lastName || data.lastName,
            role: "customer",
            addresses: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
          set({ user, isAuthenticated: true, token: null })
          return true
        }

        const exists = DEMO_USERS.some((u) => u.email === data.email)
        if (exists) return false

        const newUser: User = {
          id: `user-${Date.now()}`,
          email: data.email,
          firstName: data.firstName,
          lastName: data.lastName,
          role: "customer",
          addresses: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }

        set({ user: newUser, isAuthenticated: true })
        return true
      },

      logout: () => set({ user: null, isAuthenticated: false, token: null }),

      updateProfile: (data) => {
        const user = get().user
        if (!user) return
        set({
          user: {
            ...user,
            ...data,
            updatedAt: new Date().toISOString(),
          },
        })
      },

      addAddress: (address) => {
        const user = get().user
        if (!user) return
        const newAddress: Address = {
          ...address,
          id: `addr-${Date.now()}`,
        }
        set({
          user: {
            ...user,
            addresses: [...user.addresses, newAddress],
          },
        })
      },

      removeAddress: (id) => {
        const user = get().user
        if (!user) return
        set({
          user: {
            ...user,
            addresses: user.addresses.filter((a) => a.id !== id),
          },
        })
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated, token: state.token }),
    }
  )
)
