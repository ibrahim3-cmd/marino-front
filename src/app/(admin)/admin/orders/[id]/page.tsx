"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { OrderStatusBadge } from "@/components/ui/order-status-badge"
import { fetchBackendOrderById } from "@/lib/backend-orders"
import { formatDate, formatPrice } from "@/lib/utils"
import type { Order } from "@/types"

export default function AdminOrderDetailPage() {
  const params = useParams()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const id = String(params?.id || "")
    if (!id) {
      setLoading(false)
      return
    }

    fetchBackendOrderById(id)
      .then((data) => setOrder(data))
      .catch(() => setOrder(null))
      .finally(() => setLoading(false))
  }, [params])

  if (loading) {
    return <div className="p-6 text-sm text-muted-foreground">Loading order…</div>
  }

  if (!order) {
    return (
      <div className="space-y-4 p-6">
        <h1 className="text-2xl font-bold">Order not found</h1>
        <Link href="/admin/orders">
          <Button variant="outline">Back to Orders</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Order</p>
          <h1 className="text-3xl font-bold tracking-tight">{order.orderNumber}</h1>
        </div>
        <div className="flex items-center gap-3">
          <OrderStatusBadge status={order.status} />
          <Link href="/admin/orders">
            <Button variant="outline">Back to Orders</Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Items</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-4 rounded-lg border p-3">
                <div className="flex items-center gap-4">
                  {item.image?.url ? (
                    <img src={item.image.url} alt={item.name} className="h-16 w-16 rounded-md object-cover" />
                  ) : null}
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                  </div>
                </div>
                <p className="font-medium">{formatPrice(item.total)}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Customer</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p><span className="text-muted-foreground">Name:</span> {order.customerName}</p>
            <p><span className="text-muted-foreground">Email:</span> {order.customerEmail}</p>
            <p><span className="text-muted-foreground">Placed:</span> {formatDate(order.createdAt)}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between"><span>Subtotal</span><span>{formatPrice(order.subtotal)}</span></div>
          <div className="flex justify-between"><span>Shipping</span><span>{order.shipping === 0 ? "Free" : formatPrice(order.shipping)}</span></div>
          <div className="flex justify-between"><span>Tax</span><span>{formatPrice(order.tax)}</span></div>
          <div className="flex justify-between font-semibold"><span>Total</span><span>{formatPrice(order.total)}</span></div>
        </CardContent>
      </Card>
    </div>
  )
}
