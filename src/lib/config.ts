// ============================================================================
// Store Configuration — Single source of truth for all store-wide settings.
// Edit this file to customize the store name, contact info, social links, etc.
// ============================================================================

export const siteConfig = {
  // Branding
  name: "Marino",
  tagline: "Modern essentials for everyday living.",
  description:
    "Marino is a modern storefront for everyday essentials, premium basics, and curated lifestyle products.",

  // Announcement bar (set to "" to hide)
  announcement: "Free shipping on all orders over $75 — Shop Marino!",

  // URLs
  url: process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000",

  // Contact
  contact: {
    email: "hello@marino.store",
    phone: "+1 (555) 010-2026",
    address: {
      street: "128 Harbor Lane",
      suite: "Suite 200",
      city: "Miami",
      state: "FL",
      zip: "33131",
    },
  },

  // Social links (set to "" to hide)
  social: {
    twitter: "https://x.com/marino",
    instagram: "https://instagram.com/marino",
    facebook: "https://facebook.com/marino",
    youtube: "",
    tiktok: "",
  },

  // Shipping
  freeShippingThreshold: 7500, // in cents ($75.00)
  taxRate: 0.08, // 8%

  // Currency & locale
  currency: "USD",
  locale: "en-US",

  // Legal
  copyrightYear: new Date().getFullYear(),
} as const

export type SiteConfig = typeof siteConfig
