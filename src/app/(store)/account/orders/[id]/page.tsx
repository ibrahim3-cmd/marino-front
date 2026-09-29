"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { OrderStatusBadge } from "@/components/ui/order-status-badge"
import { useOrdersStore } from "@/store/orders"
import { formatDate, formatPrice } from "@/lib/utils"

export default function AccountOrderDetailPage() {
  const params = useParams()
  const id = String(params?.id || "")
  const getOrderById = useOrdersStore((s) => s.getOrderById)
  const order = id ? getOrderById(id) : undefined

  if (!order) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <h1 className="text-2xl font-bold">Order not found</h1>
        <Link href="/account/orders">
          <Button className="mt-6">Back to orders</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Order</p>
          <h1 className="text-3xl font-bold tracking-tight">{order.orderNumber}</h1>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Order Items</CardTitle>
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
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p><span className="text-muted-foreground">Placed:</span> {formatDate(order.createdAt)}</p>
            <p><span className="text-muted-foreground">Customer:</span> {order.customerName}</p>
            <p><span className="text-muted-foreground">Email:</span> {order.customerEmail}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
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

      <div className="mt-8">
        <Link href="/account/orders">
          <Button variant="outline">Back to orders</Button>
        </Link>
      </div>
    </div>
  )
}
