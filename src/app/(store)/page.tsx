import type { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { siteConfig } from "@/lib/config"
import { formatPrice } from "@/lib/utils"
import { ProductGrid } from "@/components/products/product-grid"
import { NewsletterForm } from "@/components/layout/newsletter-form"
import { PLACEHOLDER_IMAGE } from "@/lib/constants"
import { productRepository, categoryRepository } from "@/lib/repositories"

async function getStoreSettings() {
  const backendBaseUrl = process.env.NEXT_PUBLIC_LOCAL_BACKEND_URL || "http://localhost:5000"

  try {
    const response = await fetch(`${backendBaseUrl}/api/site-settings`, { cache: "no-store" })
    if (!response.ok) return null
    return await response.json()
  } catch {
    return null
  }
}

export const metadata: Metadata = {
  title: "Marino | Modern Everyday Essentials",
  description:
    "Shop Marino for modern essentials, premium basics, and curated lifestyle products.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Marino | Modern Everyday Essentials",
    description:
      "Shop Marino for modern essentials, premium basics, and curated lifestyle products.",
    type: "website",
    url: siteConfig.url,
  },
  keywords: [
    "nextjs ecommerce starter",
    "next.js ecommerce template",
    "nextjs store template",
    "react ecommerce starter",
    "tailwind ecommerce template",
    "shadcn ecommerce",
    "free ecommerce template",
    "open source ecommerce",
    "nextjs shopping cart",
    "ecommerce starter kit",
  ],
}

export default async function HomePage() {
  const categories = await categoryRepository.list()
  const featuredProducts = await productRepository.getFeatured(4)
  const settings = await getStoreSettings()
  const announcement = settings?.announcement || siteConfig.announcement
  const heroTitle = settings?.heroTitle || siteConfig.name
  const heroSubtitle = settings?.heroSubtitle || siteConfig.tagline
  const heroImage = settings?.heroImage || "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1600&q=80"
  const heroButtonText = settings?.heroButtonText || "Shop Now"
  const heroButtonHref = settings?.heroButtonHref || "/shop"

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative flex h-[650px] items-center justify-center overflow-hidden bg-neutral-50">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-black/25" />
          <img src={heroImage} alt={heroTitle} className="h-full w-full object-cover" />
        </div>
        <div className="relative z-10 mx-auto max-w-3xl px-4 text-center text-white">
          <Badge variant="secondary" className="mb-4 bg-white text-neutral-900">
            {announcement}
          </Badge>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            {heroTitle}
          </h1>
          <p className="mt-6 text-lg text-white/90">
            {heroSubtitle}
          </p>
          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Button size="lg" asChild className="bg-white text-neutral-900 hover:bg-neutral-100">
              <Link href={heroButtonHref}>
                {heroButtonText}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto w-full max-w-[1440px] px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight">
            Shop by Category
          </h2>
          <Link
            href="/shop"
            className="text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            View all
          </Link>
        </div>
        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          {categories.map((category) => (
            <Link key={category.id} href={`/${category.slug}`} className="group">
              <div className="relative aspect-square overflow-hidden rounded-lg bg-neutral-100">
                <Image
                  src={category.image?.url ?? PLACEHOLDER_IMAGE}
                  alt={category.image?.alt ?? category.name}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                  sizes="(max-width: 768px) 50vw, 16vw"
                />
              </div>
              <div className="mt-3 text-center">
                <h3 className="text-sm font-medium group-hover:underline">
                  {category.name}
                </h3>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="mx-auto w-full max-w-[1440px] px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight">
            Featured Products
          </h2>
          <Link
            href="/shop"
            className="text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            View all
          </Link>
        </div>
        <div className="mt-8">
          <ProductGrid products={featuredProducts} />
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="bg-neutral-900 text-white">
        <div className="mx-auto flex max-w-[1440px] flex-col items-center px-4 py-16 text-center sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Join our newsletter
          </h2>
          <p className="mt-4 text-neutral-400">
            Get updates on new arrivals and exclusive offers.
          </p>
          <NewsletterForm />
        </div>
      </section>
    </div>
  )
}
