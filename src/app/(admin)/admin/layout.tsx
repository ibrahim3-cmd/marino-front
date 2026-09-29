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
    <nav className="space-y-1.5 p-3 sm:p-4">
      {adminNav.map((item) => (
        <Link
          key={item.name}
          href={item.href}
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          onClick={() => setMobileMenuOpen(false)}
        >
          <item.icon className="h-4 w-4" />
          {item.name}
        </Link>
      ))}
    </nav>
  )

  return (
    <div className="flex min-h-screen flex-col bg-muted/20 lg:flex-row">
      <header className="sticky top-0 z-20 flex items-center justify-between border-b bg-background/95 px-4 py-3 backdrop-blur-sm lg:hidden">
        <Link href="/admin" className="text-lg font-semibold tracking-tight">
          Admin
        </Link>

        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-border bg-background text-foreground shadow-sm transition hover:bg-accent" aria-label="Open admin menu">
            <Menu className="h-5 w-5" />
          </SheetTrigger>
          <SheetContent side="left" className="w-[85vw] max-w-sm border-r bg-background p-0" showCloseButton={false}>
            <div className="flex h-16 items-center justify-between border-b px-4">
              <Link href="/admin" className="text-lg font-semibold tracking-tight" onClick={() => setMobileMenuOpen(false)}>
                Admin
              </Link>
              <button
                type="button"
                className="rounded-md px-2 py-1 text-sm text-muted-foreground transition hover:bg-accent hover:text-foreground"
                onClick={() => setMobileMenuOpen(false)}
              >
                Close
              </button>
            </div>
            {navLinks}
            <div className="border-t p-4">
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground"
                onClick={() => setMobileMenuOpen(false)}
              >
                &larr; Back to Store
              </Link>
            </div>
          </SheetContent>
        </Sheet>
      </header>

      {/* Sidebar */}
      <aside className="hidden w-64 border-r border-border bg-background lg:flex lg:flex-col">
        <div className="flex h-16 items-center border-b px-6">
          <Link href="/admin" className="text-lg font-semibold tracking-tight">
            Admin
          </Link>
        </div>
        {navLinks}
        <div className="mt-auto border-t p-4">
          <Link
            href="/"
            className="text-sm text-muted-foreground transition hover:text-foreground"
          >
            &larr; Back to Store
          </Link>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 px-3 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">{children}</main>
    </div>
  )
}
