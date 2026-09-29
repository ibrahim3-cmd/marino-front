"use client"

import { useEffect, useState } from "react"
import { FolderTree, Pencil, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PageHeader } from "@/components/ui/page-header"
import { Textarea } from "@/components/ui/textarea"
import { useAuthStore } from "@/store/auth"

interface CategoryRecord {
  id: string
  name: string
  slug: string
  description: string
  image?: string
  bannerImage?: string
  isVisible?: boolean
}

const emptyForm = {
  name: "",
  description: "",
  image: "",
  bannerImage: "",
  isVisible: true,
}

export default function AdminCategoriesPage() {
  const token = useAuthStore((state) => state.token)
  const backendUrl = process.env.NEXT_PUBLIC_LOCAL_BACKEND_URL || "http://localhost:5000"
  const [categories, setCategories] = useState<CategoryRecord[]>([])
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploadingImage, setUploadingImage] = useState(false)

  const fetchCategories = async () => {
    if (!token) return

    try {
      const response = await fetch(`${backendUrl}/api/categories`, {
        headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
      })
      if (!response.ok) throw new Error("Failed to fetch categories")
      const data = await response.json()
      setCategories(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error(error)
      setCategories([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchCategories()
  }, [token])

  function resetForm() {
    setForm(emptyForm)
    setEditingId(null)
  }

  async function handleImageUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file || !token) return

    setUploadingImage(true)
    const formData = new FormData()
    formData.append("image", file)

    try {
      const response = await fetch(`${backendUrl}/api/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })

      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || "Image upload failed")

      setForm((current) => ({
        ...current,
        image: data.url || current.image,
        bannerImage: data.url || current.bannerImage || data.url,
      }))
    } catch (error) {
      console.error(error)
      alert(error instanceof Error ? error.message : "Image upload failed")
    } finally {
      setUploadingImage(false)
      event.target.value = ""
    }
  }

  async function saveCategory() {
    if (!token) return

    const payload = {
      name: form.name,
      description: form.description,
      image: form.image || "https://placehold.co/800x800?text=Marino",
      bannerImage: form.bannerImage || form.image || "https://placehold.co/1200x400?text=Marino",
      isVisible: form.isVisible,
    }

    const url = editingId ? `${backendUrl}/api/categories/${editingId}` : `${backendUrl}/api/categories`
    const method = editingId ? "PUT" : "POST"

    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Unable to save category" }))
      throw new Error(error.error || "Unable to save category")
    }

    resetForm()
    await fetchCategories()
  }

  async function handleDelete(id: string) {
    if (!token) return
    const response = await fetch(`${backendUrl}/api/categories/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    })
    if (response.ok) await fetchCategories()
  }

  function handleEdit(category: CategoryRecord) {
    setEditingId(category.id)
    setForm({
      name: category.name,
      description: category.description || "",
      image: category.image || "",
      bannerImage: category.bannerImage || "",
      isVisible: category.isVisible ?? true,
    })
  }

  return (
    <div>
      <PageHeader title="Categories" description="Organize your storefront sections." />

      <div className="mt-6 rounded-lg border bg-background p-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-end">
          <div className="flex-1 space-y-2">
            <Label htmlFor="category-name">Category name</Label>
            <Input
              id="category-name"
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              placeholder="e.g. Home Office"
            />
          </div>
          <div className="flex-1 space-y-2">
            <Label htmlFor="category-image">Image URL</Label>
            <Input
              id="category-image"
              value={form.image}
              onChange={(event) => setForm((current) => ({ ...current, image: event.target.value }))}
              placeholder="https://..."
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={() => void saveCategory()}>
              {editingId ? "Save" : <><Plus className="mr-2 h-4 w-4" /> Add</>}
            </Button>
            {editingId && (
              <Button variant="outline" onClick={resetForm}>
                Cancel
              </Button>
            )}
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <Label htmlFor="category-upload">Upload image to Cloudinary</Label>
          <div className="flex items-center gap-3">
            <Input
              id="category-upload"
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
            />
            {uploadingImage && <span className="text-xs text-muted-foreground">Uploading…</span>}
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <Label htmlFor="category-description">Description</Label>
          <Textarea
            id="category-description"
            value={form.description}
            onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
            rows={3}
          />
        </div>

        <label className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            checked={form.isVisible}
            onChange={(event) => setForm((current) => ({ ...current, isVisible: event.target.checked }))}
          />
          Visible in storefront
        </label>
      </div>

      <div className="mt-8 rounded-lg border">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="flex items-center gap-2 font-medium">
            <FolderTree className="h-4 w-4 text-muted-foreground" />
            Category list
          </div>
          <span className="text-sm text-muted-foreground">{categories.length} items</span>
        </div>

        {loading ? (
          <div className="p-6 text-sm text-muted-foreground">Loading categories…</div>
        ) : categories.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">No categories yet.</div>
        ) : (
          <div className="divide-y">
            {categories.map((category) => (
              <div key={category.id} className="flex items-center justify-between gap-3 p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 overflow-hidden rounded-md bg-muted">
                    {category.image ? (
                      <img src={category.image} alt={category.name} className="h-full w-full object-cover" />
                    ) : null}
                  </div>
                  <div>
                    <p className="font-medium">{category.name}</p>
                    <p className="text-xs text-muted-foreground">/{category.slug}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(category)}>
                    <Pencil className="mr-2 h-4 w-4" /> Edit
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => void handleDelete(category.id)}>
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
