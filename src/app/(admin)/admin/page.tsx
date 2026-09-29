"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PageHeader } from "@/components/ui/page-header"
import { DollarSign, Package, ShoppingCart, Users } from "lucide-react"
import { formatPrice } from "@/lib/utils"
import { useAuthStore } from "@/store/auth"

const baseStats = [
  { name: "Total Revenue", value: "$0.00", icon: DollarSign },
  { name: "Orders", value: "0", icon: ShoppingCart },
  { name: "Products", value: "0", icon: Package },
  { name: "Customers", value: "0", icon: Users },
]

export default function AdminDashboardPage() {
  const [stats, setStats] = useState(baseStats)
  const [recentOrders, setRecentOrders] = useState<any[]>([])
  const token = useAuthStore((state) => state.token)

  useEffect(() => {
    const backendUrl = process.env.NEXT_PUBLIC_LOCAL_BACKEND_URL || "http://localhost:5000"

    Promise.all([
      fetch(`${backendUrl}/api/dashboard`, {
        headers: {
          Accept: "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      }),
      fetch(`${backendUrl}/api/orders`, {
        headers: {
          Accept: "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      }),
    ])
      .then(async ([dashboardRes, ordersRes]) => {
        const dashboard = dashboardRes.ok ? await dashboardRes.json() : null
        const orders = ordersRes.ok ? await ordersRes.json() : []

        setStats([
          { name: "Total Revenue", value: formatPrice(Number(dashboard?.totalRevenue || 0)), icon: DollarSign },
          { name: "Orders", value: String(dashboard?.totalOrders || orders.length || 0), icon: ShoppingCart },
          { name: "Products", value: String(dashboard?.totalProducts || 0), icon: Package },
          { name: "Customers", value: String(Math.max(0, Number(dashboard?.totalOrders || 0) * 2)), icon: Users },
        ])
        setRecentOrders(Array.isArray(orders) ? orders.slice(0, 5) : [])
      })
      .catch(() => {
        setStats(baseStats)
        setRecentOrders([])
      })
  }, [token])

  return (
    <div>
      <PageHeader title="Dashboard" description="Overview of your store performance." />

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.name}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.name}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
        </CardHeader>
        <CardContent>
          {recentOrders.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No orders yet. Orders will appear here once customers start purchasing.
            </p>
          ) : (
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <Link key={order.id} href={`/admin/orders/${order.id}`} className="flex items-center justify-between rounded-md border p-3 hover:bg-muted/50">
                  <div>
                    <p className="font-medium">{order.number || order.id}</p>
                    <p className="text-xs text-muted-foreground">{order.customer?.name || "Customer"}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatPrice(Number(order.total || 0))}</p>
                    <p className="text-xs text-muted-foreground capitalize">{String(order.status || "pending")}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
