import type { Order, OrderStatus } from "@/types"

export type BackendOrder = {
  id?: string
  number?: string
  customer?: {
    name?: string
    email?: string
    phone?: string
  }
  items?: Array<{
    id?: string
    productId?: string
    name?: string
    qty?: number
    quantity?: number
    price?: number
    image?: string
    sku?: string
  }>
  total?: number
  subtotal?: number
  shipping?: number
  tax?: number
  status?: string
  paymentMethod?: string
  note?: string
  createdAt?: string
  updatedAt?: string
  customerEmail?: string
  customerName?: string
}

const backendBaseUrl = process.env.NEXT_PUBLIC_LOCAL_BACKEND_URL || "http://localhost:5000"

export function normalizeOrderStatus(status?: string): OrderStatus {
  const normalized = String(status || "pending").toLowerCase()
  const map: Record<string, OrderStatus> = {
    pending: "pending",
    processing: "processing",
    shipped: "shipped",
    completed: "delivered",
    delivered: "delivered",
    cancelled: "cancelled",
    refunded: "refunded",
  }

  return map[normalized] || "pending"
}

export function mapOrderFromBackend(order: BackendOrder, fallback?: Partial<Order>): Order {
  const items = (order.items || []).map((item, index) => ({
    id: item.id || `${order.id || "order"}-${index}`,
    productId: item.productId || item.id || `${order.id || "order"}-${index}`,
    variantId: item.id || `${order.id || "order"}-${index}`,
    name: item.name || "Product",
    variantName: item.name || "Default",
    sku: item.sku || "",
    image: item.image ? { url: item.image, alt: item.name || "Product image" } : { url: "", alt: "Product image" },
    price: Number(item.price || 0),
    quantity: Number(item.qty ?? item.quantity ?? 1),
    total: Number(item.price || 0) * Number(item.qty ?? item.quantity ?? 1),
  }))

  const subtotal = Number(order.subtotal ?? items.reduce((sum, item) => sum + item.total, 0))
  const shipping = Number(order.shipping ?? 0)
  const tax = Number(order.tax ?? 0)
  const total = Number(order.total ?? subtotal + shipping + tax)

  return {
    id: order.id || fallback?.id || `ORD-${Date.now().toString(36).toUpperCase()}`,
    orderNumber: order.number || fallback?.orderNumber || order.id || `ORD-${Date.now().toString(36).toUpperCase()}`,
    items,
    status: normalizeOrderStatus(order.status),
    paymentStatus: "captured",
    subtotal,
    tax,
    shipping,
    total,
    currency: "USD",
    shippingAddress: fallback?.shippingAddress || {
      id: "addr-backend",
      type: "shipping",
      firstName: "Customer",
      lastName: "",
      line1: "",
      city: "",
      state: "",
      postalCode: "",
      country: "US",
      isDefault: true,
    },
    customerEmail: order.customer?.email || order.customerEmail || fallback?.customerEmail || "",
    customerName: order.customer?.name || order.customerName || fallback?.customerName || "Customer",
    createdAt: order.createdAt || new Date().toISOString(),
    updatedAt: order.updatedAt || new Date().toISOString(),
  }
}

export async function fetchBackendOrders() {
  const response = await fetch(`${backendBaseUrl}/api/orders`, {
    headers: { Accept: "application/json" },
  })

  if (!response.ok) {
    throw new Error("Unable to load orders")
  }

  const data = await response.json()
  return Array.isArray(data) ? data.map((order) => mapOrderFromBackend(order)) : []
}

export async function fetchBackendOrderById(id: string) {
  const response = await fetch(`${backendBaseUrl}/api/orders/${id}`, {
    headers: { Accept: "application/json" },
  })

  if (!response.ok) {
    throw new Error("Unable to load order details")
  }

  return mapOrderFromBackend(await response.json())
}
