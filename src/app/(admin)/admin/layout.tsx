"use client"

import Link from "next/link"
import { useState } from "react"
import { FolderTree, LayoutDashboard, Menu, Palette, Package, ShoppingBag, Tag, Users } from "lucide-react"
import { useAuthGuard } from "@/hooks/use-auth-guard"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

const adminNav = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Products", href: "/admin/products", icon: ShoppingBag },
  { name: "Categories", href: "/admin/categories", icon: FolderTree },
  { name: "Brands", href: "/admin/brands", icon: Tag },
  { name: "Customization", href: "/admin/customization", icon: Palette },
  { name: "Orders", href: "/admin/orders", icon: Package },
  { name: "Customers", href: "/admin/customers", icon: Users },
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, isReady } = useAuthGuard()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  if (!isReady) return null

  if (user?.role !== "admin") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Access Denied</h1>
          <p className="mt-2 text-muted-foreground">
            You need admin privileges to access this page.
          </p>
          <Link href="/" className="mt-4 inline-block text-sm underline">
            Go Home
          </Link>
        </div>
      </div>
    )
  }

  const navLinks = (
    <nav className="space-y-1 p-4">
      {adminNav.map((item) => (
        <Link
          key={item.name}
          href={item.href}
          className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-white hover:text-foreground"
          onClick={() => setMobileMenuOpen(false)}
        >
          <item.icon className="h-4 w-4" />
          {item.name}
        </Link>
      ))}
    </nav>
  )

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <header className="flex items-center justify-between border-b bg-white px-4 py-3 lg:hidden">
        <Link href="/admin" className="text-lg font-semibold">
          Admin
        </Link>

        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger className="inline-flex h-10 w-10 items-center justify-center rounded-md border hover:bg-accent" aria-label="Open admin menu">
            <Menu className="h-5 w-5" />
          </SheetTrigger>
          <SheetContent side="left" className="w-[85vw] max-w-sm p-0" showCloseButton={false}>
            <div className="flex h-16 items-center justify-between border-b px-4">
              <Link href="/admin" className="text-lg font-semibold" onClick={() => setMobileMenuOpen(false)}>
                Admin
              </Link>
              <button
                type="button"
                className="text-sm text-muted-foreground hover:text-foreground"
                onClick={() => setMobileMenuOpen(false)}
              >
                Close
              </button>
            </div>
            {navLinks}
            <div className="border-t p-4">
              <Link
                href="/"
                className="text-sm text-muted-foreground hover:text-foreground"
                onClick={() => setMobileMenuOpen(false)}
              >
                &larr; Back to Store
              </Link>
            </div>
          </SheetContent>
        </Sheet>
      </header>

      {/* Sidebar */}
      <aside className="hidden w-64 border-r bg-neutral-50 lg:flex lg:flex-col">
        <div className="flex h-16 items-center border-b px-6">
          <Link href="/admin" className="text-lg font-semibold">
            Admin
          </Link>
        </div>
        {navLinks}
        <div className="mt-auto border-t p-4">
          <Link
            href="/"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            &larr; Back to Store
          </Link>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
    </div>
  )
}
