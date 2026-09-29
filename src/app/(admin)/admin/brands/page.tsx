"use client"

import { useEffect, useState } from "react"
import { Pencil, Plus, Tag, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PageHeader } from "@/components/ui/page-header"
import { Textarea } from "@/components/ui/textarea"
import { useAuthStore } from "@/store/auth"

interface BrandRecord {
  id: string
  name: string
  slug: string
  description: string
}

const emptyForm = { name: "", slug: "", description: "" }

export default function AdminBrandsPage() {
  const token = useAuthStore((state) => state.token)
  const backendUrl = process.env.NEXT_PUBLIC_LOCAL_BACKEND_URL || "http://localhost:5000"
  const [brands, setBrands] = useState<BrandRecord[]>([])
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchBrands = async () => {
    if (!token) return

    try {
      const response = await fetch(`${backendUrl}/api/brands`, {
        headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
      })
      if (!response.ok) throw new Error("Failed to fetch brands")
      const payload = await response.json()
      setBrands(Array.isArray(payload) ? payload : [])
    } catch (error) {
      console.error(error)
      setBrands([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchBrands()
  }, [token])

  function resetForm() {
    setForm(emptyForm)
    setEditingId(null)
  }

  async function saveBrand() {
    if (!token) return

    const payload = {
      name: form.name,
      slug: form.slug || form.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "brand",
      description: form.description,
    }

    const method = editingId ? "PUT" : "POST"
    const url = editingId ? `${backendUrl}/api/brands/${editingId}` : `${backendUrl}/api/brands`

    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Unable to save brand" }))
      throw new Error(error.error || "Unable to save brand")
    }

    resetForm()
    await fetchBrands()
  }

  async function handleDelete(id: string) {
    if (!token) return
    const response = await fetch(`${backendUrl}/api/brands/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    })
    if (response.ok) await fetchBrands()
  }

  function handleEdit(brand: BrandRecord) {
    setEditingId(brand.id)
    setForm({ name: brand.name, slug: brand.slug, description: brand.description || "" })
  }

  return (
    <div>
      <PageHeader title="Brands" description="Manage the labels and collections behind your products." />

      <div className="mt-6 rounded-lg border bg-background p-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="brand-name">Brand name</Label>
            <Input
              id="brand-name"
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="brand-slug">Slug</Label>
            <Input
              id="brand-slug"
              value={form.slug}
              onChange={(event) => setForm((current) => ({ ...current, slug: event.target.value }))}
            />
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <Label htmlFor="brand-description">Description</Label>
          <Textarea
            id="brand-description"
            value={form.description}
            onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
            rows={3}
          />
        </div>

        <div className="mt-4 flex gap-2">
          <Button onClick={() => void saveBrand()}>
            {editingId ? "Save brand" : <><Plus className="mr-2 h-4 w-4" /> Add brand</>}
          </Button>
          {editingId && (
            <Button variant="outline" onClick={resetForm}>
              Cancel
            </Button>
          )}
        </div>
      </div>

      <div className="mt-8 rounded-lg border">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="flex items-center gap-2 font-medium">
            <Tag className="h-4 w-4 text-muted-foreground" />
            Brand list
          </div>
          <span className="text-sm text-muted-foreground">{brands.length} brands</span>
        </div>

        {loading ? (
          <div className="p-6 text-sm text-muted-foreground">Loading brands…</div>
        ) : brands.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">No brands yet.</div>
        ) : (
          <div className="divide-y">
            {brands.map((brand) => (
              <div key={brand.id} className="flex items-center justify-between gap-3 p-4">
                <div>
                  <p className="font-medium">{brand.name}</p>
                  <p className="text-xs text-muted-foreground">/{brand.slug}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(brand)}>
                    <Pencil className="mr-2 h-4 w-4" /> Edit
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => void handleDelete(brand.id)}>
                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
