"use client"

import { useEffect, useState } from "react"
import { ImagePlus, Palette, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PageHeader } from "@/components/ui/page-header"
import { Textarea } from "@/components/ui/textarea"
import { useAuthStore } from "@/store/auth"

interface LinkEntry {
  name: string
  href: string
}

const emptySettings = {
  announcement: "",
  heroImage: "",
  logo: "",
  heroTitle: "",
  heroSubtitle: "",
  navbarCategorySlugs: [] as string[],
  featuredProductIds: [] as string[],
  footerCompanyLinks: [] as LinkEntry[],
  footerLegalLinks: [] as LinkEntry[],
}

export default function AdminCustomizationPage() {
  const token = useAuthStore((state) => state.token)
  const backendUrl = process.env.NEXT_PUBLIC_LOCAL_BACKEND_URL || "http://localhost:5000"
  const [categories, setCategories] = useState<Array<{ id: string; name: string; slug: string }>>([])
  const [products, setProducts] = useState<Array<{ id: string; name: string }>>([])
  const [settings, setSettings] = useState(emptySettings)
  const [saving, setSaving] = useState(false)
  const [fileUploading, setFileUploading] = useState(false)

  const loadData = async () => {
    if (!token) return

    const [categoriesRes, productsRes, settingsRes] = await Promise.all([
      fetch(`${backendUrl}/api/categories`, {
        headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
      }),
      fetch(`${backendUrl}/api/products`, {
        headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
      }),
      fetch(`${backendUrl}/api/site-settings`, {
        headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
      }),
    ])

    if (categoriesRes.ok) {
      const categoriesData = await categoriesRes.json()
      setCategories(Array.isArray(categoriesData) ? categoriesData : [])
    }

    if (productsRes.ok) {
      const productsData = await productsRes.json()
      setProducts(Array.isArray(productsData) ? productsData : [])
    }

    if (settingsRes.ok) {
      const payload = await settingsRes.json()
      setSettings({
        announcement: payload.announcement || "",
        heroImage: payload.heroImage || "",
        logo: payload.logo || "",
        heroTitle: payload.heroTitle || "",
        heroSubtitle: payload.heroSubtitle || "",
        navbarCategorySlugs: Array.isArray(payload.navbarCategorySlugs) ? payload.navbarCategorySlugs : [],
        featuredProductIds: Array.isArray(payload.featuredProductIds) ? payload.featuredProductIds : [],
        footerCompanyLinks: Array.isArray(payload.footerCompanyLinks) ? payload.footerCompanyLinks : [],
        footerLegalLinks: Array.isArray(payload.footerLegalLinks) ? payload.footerLegalLinks : [],
      })
    }
  }

  useEffect(() => {
    void loadData()
  }, [token])

  function toggleCategory(slug: string) {
    setSettings((current) => ({
      ...current,
      navbarCategorySlugs: current.navbarCategorySlugs.includes(slug)
        ? current.navbarCategorySlugs.filter((item) => item !== slug)
        : [...current.navbarCategorySlugs, slug],
    }))
  }

  function toggleFeaturedProduct(id: string) {
    setSettings((current) => ({
      ...current,
      featuredProductIds: current.featuredProductIds.includes(id)
        ? current.featuredProductIds.filter((item) => item !== id)
        : [...current.featuredProductIds, id],
    }))
  }

  function updateLinks(key: "footerCompanyLinks" | "footerLegalLinks", value: string) {
    const rows = value
      .split(/\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [name, ...rest] = line.split("|")
        return {
          name: (name || "Link").trim(),
          href: (rest.join("|") || "/").trim(),
        }
      })
    setSettings((current) => ({ ...current, [key]: rows }))
  }

  async function handleUpload(event: React.ChangeEvent<HTMLInputElement>, field: "heroImage" | "logo") {
    const file = event.target.files?.[0]
    if (!file || !token) return

    setFileUploading(true)
    const formData = new FormData()
    formData.append("image", file)

    try {
      const response = await fetch(`${backendUrl}/api/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || "Upload failed")
      setSettings((current) => ({ ...current, [field]: data.url || current[field] }))
    } catch (error) {
      console.error(error)
    } finally {
      setFileUploading(false)
      event.target.value = ""
    }
  }

  async function saveSettings() {
    if (!token) return

    setSaving(true)
    try {
      const response = await fetch(`${backendUrl}/api/site-settings`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          announcement: settings.announcement,
          heroTitle: settings.heroTitle,
          heroSubtitle: settings.heroSubtitle,
          heroImage: settings.heroImage,
          logo: settings.logo,
          navbarCategorySlugs: settings.navbarCategorySlugs,
          featuredProductIds: settings.featuredProductIds,
          footerCompanyLinks: settings.footerCompanyLinks,
          footerLegalLinks: settings.footerLegalLinks,
        }),
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => ({ error: "Unable to save" }))
        throw new Error(payload.error || "Unable to save")
      }

      await loadData()
      alert("Store settings saved")
    } catch (error) {
      console.error(error)
      alert(error instanceof Error ? error.message : "Unable to save settings")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <PageHeader title="Customization" description="Control the navbar, hero, featured items, and footer links." />

      <div className="mt-8 grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Sparkles className="h-4 w-4" /> Storefront</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="announcement">Announcement text</Label>
              <Input
                id="announcement"
                value={settings.announcement}
                onChange={(event) => setSettings((current) => ({ ...current, announcement: event.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hero-title">Hero title</Label>
              <Input
                id="hero-title"
                value={settings.heroTitle}
                onChange={(event) => setSettings((current) => ({ ...current, heroTitle: event.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hero-subtitle">Hero subtitle</Label>
              <Textarea
                id="hero-subtitle"
                value={settings.heroSubtitle}
                onChange={(event) => setSettings((current) => ({ ...current, heroSubtitle: event.target.value }))}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hero-image">Hero image URL</Label>
              <Input
                id="hero-image"
                value={settings.heroImage}
                onChange={(event) => setSettings((current) => ({ ...current, heroImage: event.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hero-upload">Hero image upload</Label>
              <div className="flex items-center gap-2">
                <Input id="hero-upload" type="file" accept="image/*" onChange={(event) => handleUpload(event, "heroImage")} />
                {fileUploading && <span className="text-xs text-muted-foreground">Uploading…</span>}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="logo-url">Navbar logo URL</Label>
              <Input
                id="logo-url"
                value={settings.logo}
                onChange={(event) => setSettings((current) => ({ ...current, logo: event.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="logo-upload">Navbar logo upload</Label>
              <div className="flex items-center gap-2">
                <Input id="logo-upload" type="file" accept="image/*" onChange={(event) => handleUpload(event, "logo")} />
                {fileUploading && <span className="text-xs text-muted-foreground">Uploading…</span>}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Palette className="h-4 w-4" /> Navbar & Featured</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label>Categories in navbar</Label>
              <div className="mt-3 flex flex-wrap gap-2">
                {categories.length === 0 ? (
                  <span className="text-sm text-muted-foreground">No categories available.</span>
                ) : (
                  categories.map((category) => (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => toggleCategory(category.slug)}
                      className={`rounded-full border px-3 py-1 text-xs font-medium ${
                        settings.navbarCategorySlugs.includes(category.slug)
                          ? "border-foreground bg-foreground text-background"
                          : "border-border bg-background text-foreground"
                      }`}
                    >
                      {category.name}
                    </button>
                  ))
                )}
              </div>
            </div>

            <div>
              <Label>Featured products</Label>
              <div className="mt-3 flex flex-wrap gap-2">
                {products.length === 0 ? (
                  <span className="text-sm text-muted-foreground">No products available.</span>
                ) : (
                  products.map((product) => (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => toggleFeaturedProduct(product.id)}
                      className={`rounded-full border px-3 py-1 text-xs font-medium ${
                        settings.featuredProductIds.includes(product.id)
                          ? "border-foreground bg-foreground text-background"
                          : "border-border bg-background text-foreground"
                      }`}
                    >
                      {product.name}
                    </button>
                  ))
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Footer company links</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={settings.footerCompanyLinks.map((link) => `${link.name} | ${link.href}`).join("\n")}
              onChange={(event) => updateLinks("footerCompanyLinks", event.target.value)}
              rows={8}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Footer legal links</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={settings.footerLegalLinks.map((link) => `${link.name} | ${link.href}`).join("\n")}
              onChange={(event) => updateLinks("footerLegalLinks", event.target.value)}
              rows={8}
            />
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 flex justify-end">
        <Button onClick={() => void saveSettings()} disabled={saving}>
          {saving ? "Saving..." : <><ImagePlus className="mr-2 h-4 w-4" /> Save customization</>}
        </Button>
      </div>
    </div>
  )
}
