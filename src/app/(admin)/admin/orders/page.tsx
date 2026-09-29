"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { Package } from "lucide-react"
import { PageHeader } from "@/components/ui/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { OrderStatusBadge } from "@/components/ui/order-status-badge"
import { formatDate, formatPrice } from "@/lib/utils"
import { useAuthStore } from "@/store/auth"
import type { Order } from "@/types"

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const token = useAuthStore((state) => state.token)

  useEffect(() => {
    const backendUrl = process.env.NEXT_PUBLIC_LOCAL_BACKEND_URL || "http://localhost:5000"
    fetch(`${backendUrl}/api/orders`, {
      headers: {
        Accept: "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    })
      .then(async (res) => {
        if (!res.ok) throw new Error("Orders not available")
        const data = await res.json()
        setOrders(
          data.map((order: any) => ({
            id: order.id,
            orderNumber: order.number || order.id,
            items: (order.items || []).map((item: any) => ({
              id: String(item.id || item.name),
              productId: String(item.id || item.name),
              variantId: String(item.id || item.name),
              name: item.name || "Product",
              variantName: item.name || "Default",
              sku: item.sku || "",
              image: item.image ? { url: item.image, alt: item.name || "Product image" } : { url: "", alt: item.name || "Product image" },
              price: Number(item.price || 0),
              quantity: Number(item.qty || 1),
              total: Number(item.price || 0) * Number(item.qty || 1),
            })),
            status: (String(order.status || "pending").toLowerCase() === "completed" ? "delivered" : String(order.status || "pending").toLowerCase()) as Order["status"],
            paymentStatus: "captured",
            subtotal: Number(order.total || 0),
            tax: 0,
            shipping: 0,
            total: Number(order.total || 0),
            currency: "USD",
            shippingAddress: {
              id: "address",
              type: "shipping",
              firstName: order.customer?.name || "Customer",
              lastName: "",
              line1: "",
              city: "",
              state: "",
              postalCode: "",
              country: "US",
              isDefault: true,
            },
            customerEmail: order.customer?.email || "",
            customerName: order.customer?.name || "Customer",
            createdAt: order.createdAt || new Date().toISOString(),
            updatedAt: order.updatedAt || new Date().toISOString(),
          }))
        )
      })
      .catch(() => setOrders([]))
      .finally(() => setLoading(false))
  }, [token])

  if (loading) {
    return <div className="p-6 text-sm text-muted-foreground">Loading orders…</div>
  }

  return (
    <div>
      <PageHeader title="Orders" description="Manage and track customer orders." />

      {orders.length === 0 ? (
        <div className="mt-8 rounded-lg border p-8 text-center">
          <Package className="mx-auto h-10 w-10 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">No orders yet</h3>
          <p className="mt-2 text-sm text-muted-foreground">Orders will appear here once customers start purchasing.</p>
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          {orders.map((order) => (
            <Link key={order.id} href={`/admin/orders/${order.id}`}>
              <Card className="transition-colors hover:bg-muted/50">
                <CardContent className="pt-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-medium">{order.orderNumber}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(order.createdAt)}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <OrderStatusBadge status={order.status} />
                      <span className="text-sm font-medium">{formatPrice(order.total)}</span>
                    </div>
                  </div>
                  <div className="mt-4 text-sm text-muted-foreground">
                    {order.items.map((item) => (
                      <span key={item.id} className="mr-3">
                        {item.name} × {item.quantity}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
