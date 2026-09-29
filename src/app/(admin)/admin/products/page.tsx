"use client"

import { useEffect, useMemo, useState } from "react"
import { Package, Pencil, Save, Trash2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PageHeader } from "@/components/ui/page-header"
import { Textarea } from "@/components/ui/textarea"
import { useAuthStore } from "@/store/auth"

interface ProductRecord {
  id: string
  name: string
  slug: string
  sku: string
  price: number
  compareAtPrice?: number
  stock: number
  description: string
  image: string
  images: string[]
  brand?: string
  colors?: string[]
  sizes?: string[]
  categories: string[]
  isPublished: boolean
  featured?: boolean
}

const emptyForm = {
  name: "",
  sku: "",
  price: "",
  discount: "",
  stock: "",
  description: "",
  image: "",
  images: [] as string[],
  brand: "",
  colors: "",
  sizes: "",
  categories: [] as string[],
  isPublished: true,
  featured: false,
}

function parseOptionList(value: string) {
  return value
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function buildOptionVariants({
  colors,
  sizes,
  price,
  compareAtPrice,
  stock,
  imageList,
}: {
  colors: string[]
  sizes: string[]
  price: number
  compareAtPrice: number
  stock: number
  imageList: string[]
}) {
  const normalizedColors = [...new Set(colors)]
  const normalizedSizes = [...new Set(sizes)]

  if (!normalizedColors.length && !normalizedSizes.length) {
    return [{
      id: `variant-default`,
      sku: "SKU-DEFAULT",
      name: "Default",
      price,
      compareAtPrice,
      inventory: { quantity: stock, trackInventory: true, allowBackorder: false },
      options: [],
      images: imageList.length ? imageList : ["https://placehold.co/800x800?text=Marino"],
    }]
  }

  const combos: Array<Array<{ name: string; value: string }>> = []

  if (normalizedColors.length && normalizedSizes.length) {
    normalizedColors.forEach((color) => {
      normalizedSizes.forEach((size) => {
        combos.push([
          { name: "Color", value: color },
          { name: "Size", value: size },
        ])
      })
    })
  } else if (normalizedColors.length) {
    normalizedColors.forEach((color) => {
      combos.push([{ name: "Color", value: color }])
    })
  } else {
    normalizedSizes.forEach((size) => {
      combos.push([{ name: "Size", value: size }])
    })
  }

  return combos.map((options, index) => ({
    id: `variant-${index + 1}`,
    sku: `SKU-${index + 1}`,
    name: options.map((option) => option.value).join(" / ") || "Option",
    price,
    compareAtPrice,
    inventory: { quantity: stock, trackInventory: true, allowBackorder: false },
    options,
    images: imageList.length ? imageList : ["https://placehold.co/800x800?text=Marino"],
  }))
}

export default function AdminProductsPage() {
  const token = useAuthStore((state) => state.token)
  const [products, setProducts] = useState<ProductRecord[]>([])
  const [categories, setCategories] = useState<Array<{ id: string; name: string; slug: string }>>([])
  const [brands, setBrands] = useState<Array<{ id: string; name: string; slug: string }>>([])
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)

  const sortedProducts = useMemo(
    () => [...products].sort((a, b) => a.name.localeCompare(b.name)),
    [products],
  )

  const backendUrl = process.env.NEXT_PUBLIC_LOCAL_BACKEND_URL || "http://localhost:5000"

  const fetchCatalog = async () => {
    if (!token) return

    try {
      const [productsRes, categoriesRes, brandsRes] = await Promise.all([
        fetch(`${backendUrl}/api/products`, {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        }),
        fetch(`${backendUrl}/api/categories`, {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        }),
        fetch(`${backendUrl}/api/brands`, {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        }),
      ])

      if (productsRes.ok) {
        const productData = await productsRes.json()
        setProducts(Array.isArray(productData) ? productData : [])
      }

      if (categoriesRes.ok) {
        const categoryData = await categoriesRes.json()
        setCategories(Array.isArray(categoryData) ? categoryData : [])
      }

      if (brandsRes.ok) {
        const brandData = await brandsRes.json()
        setBrands(Array.isArray(brandData) ? brandData : [])
      }
    } catch (error) {
      console.error("Failed to load products", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchCatalog()
  }, [token])

  function updateField<K extends keyof typeof emptyForm>(key: K, value: (typeof emptyForm)[K]) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function toggleCategory(categoryName: string) {
    setForm((current) => {
      const selected = current.categories.includes(categoryName)
      return {
        ...current,
        categories: selected
          ? current.categories.filter((value) => value !== categoryName)
          : [...current.categories, categoryName],
      }
    })
  }

  function resetForm() {
    setForm(emptyForm)
    setEditingId(null)
  }

  async function handleImageUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? [])
    if (!files.length || !token) return

    setUploadingImage(true)
    const uploadedUrls: string[] = []

    try {
      for (const file of files) {
        const formData = new FormData()
        formData.append("image", file)

        const response = await fetch(`${backendUrl}/api/upload`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        })

        const data = await response.json().catch(() => ({}))
        if (!response.ok) throw new Error(data.error || "Image upload failed")
        if (data.url) uploadedUrls.push(String(data.url))
      }

      if (uploadedUrls.length > 0) {
        setForm((current) => {
          const mergedImages = [...new Set([...(current.images || []), ...uploadedUrls])]
          return {
            ...current,
            image: current.image || mergedImages[0],
            images: mergedImages,
          }
        })
      }
    } catch (error) {
      console.error(error)
      alert(error instanceof Error ? error.message : "Image upload failed")
    } finally {
      setUploadingImage(false)
      event.target.value = ""
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!token) return

    setSaving(true)
    const price = Number(form.price || 0)
    const discountValue = Number(form.discount || 0)
    const compareAtPrice = discountValue > 0 && price > 0 ? price / (1 - discountValue / 100) : price
    const colorList = parseOptionList(form.colors)
    const sizeList = parseOptionList(form.sizes)
    const finalImages = [...new Set([...(form.images || []), ...(form.image ? [form.image] : [])].filter(Boolean))]
    const variants = buildOptionVariants({
      colors: colorList,
      sizes: sizeList,
      price,
      compareAtPrice,
      stock: Number(form.stock || 0),
      imageList: finalImages,
    })

    const payload = {
      name: form.name,
      sku: form.sku,
      price,
      compareAtPrice,
      stock: Number(form.stock || 0),
      description: form.description,
      brand: form.brand,
      colors: colorList,
      sizes: sizeList,
      image: finalImages[0] || "https://placehold.co/800x800?text=Marino",
      images: finalImages,
      categories: form.categories,
      isPublished: form.isPublished,
      featured: form.featured,
      variants,
    }

    try {
      const request = editingId
        ? fetch(`${backendUrl}/api/products/${editingId}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(payload),
          })
        : fetch(`${backendUrl}/api/products`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(payload),
          })

      const response = await request
      if (!response.ok) {
        throw new Error("Unable to save product")
      }

      resetForm()
      await fetchCatalog()
    } catch (error) {
      console.error(error)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(productId: string) {
    if (!token) return

    try {
      const response = await fetch(`${backendUrl}/api/products/${productId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        await fetchCatalog()
      }
    } catch (error) {
      console.error(error)
    }
  }

  function handleEdit(product: ProductRecord) {
    setEditingId(product.id)
    const price = Number(product.price || 0)
    const compareAtPrice = Number(product.compareAtPrice || 0)
    const discount = compareAtPrice > price && price > 0 ? Math.round((1 - price / compareAtPrice) * 100) : 0
    const images = Array.isArray(product.images) && product.images.length ? product.images : product.image ? [product.image] : []
    const colors = Array.isArray(product.colors) ? product.colors.join(", ") : ""
    const sizes = Array.isArray(product.sizes) ? product.sizes.join(", ") : ""

    setForm({
      name: product.name,
      sku: product.sku,
      price: String(product.price),
      discount: String(discount),
      stock: String(product.stock),
      description: product.description,
      image: product.image || images[0] || "",
      images,
      brand: String(product.brand || ""),
      colors,
      sizes,
      categories: product.categories,
      isPublished: product.isPublished,
      featured: Boolean(product.featured),
    })
  }

  if (!token) {
    return (
      <div>
        <PageHeader title="Products" description="Manage your catalog and stock." />
        <div className="mt-8 rounded-lg border p-8 text-center text-sm text-muted-foreground">
          Sign in as admin to manage products.
        </div>
      </div>
    )
  }

  return (
    <div>
      <PageHeader title="Products" description="Manage your catalog and stock." />

      <div className="mt-8 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? "Edit product" : "Add new product"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="name">Product name</Label>
                  <Input
                    id="name"
                    value={form.name}
                    onChange={(event) => updateField("name", event.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sku">SKU</Label>
                  <Input
                    id="sku"
                    value={form.sku}
                    onChange={(event) => updateField("sku", event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price">Price</Label>
                  <Input
                    id="price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.price}
                    onChange={(event) => updateField("price", event.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="discount">Discount (%)</Label>
                  <Input
                    id="discount"
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    value={form.discount ?? ""}
                    onChange={(event) => updateField("discount", event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stock">Stock</Label>
                  <Input
                    id="stock"
                    type="number"
                    min="0"
                    value={form.stock}
                    onChange={(event) => updateField("stock", event.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="brand">Brand</Label>
                  <select
                    id="brand"
                    value={form.brand}
                    onChange={(event) => updateField("brand", event.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="">No brand</option>
                    {brands.map((brand) => (
                      <option key={brand.id} value={brand.name}>{brand.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="colors">Colors (optional)</Label>
                  <Input
                    id="colors"
                    value={form.colors}
                    onChange={(event) => updateField("colors", event.target.value)}
                    placeholder="White, Black, Beige"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sizes">Sizes (optional)</Label>
                  <Input
                    id="sizes"
                    value={form.sizes}
                    onChange={(event) => updateField("sizes", event.target.value)}
                    placeholder="XS, S, M, L, XL"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="image">Main image URL</Label>
                  <Input
                    id="image"
                    value={form.image}
                    onChange={(event) => updateField("image", event.target.value)}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="image-urls">Additional image URLs</Label>
                  <Textarea
                    id="image-urls"
                    value={form.images.join("\n")}
                    onChange={(event) =>
                      updateField("images", event.target.value
                        .split(/\n|,/)
                        .map((item) => item.trim())
                        .filter(Boolean))
                    }
                    rows={3}
                    placeholder="Add one URL per line"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="product-upload">Upload product images to Cloudinary</Label>
                  <div className="flex items-center gap-3">
                    <Input
                      id="product-upload"
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                    />
                    {uploadingImage && <span className="text-xs text-muted-foreground">Uploading…</span>}
                  </div>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={form.description}
                    onChange={(event) => updateField("description", event.target.value)}
                    rows={4}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Categories</Label>
                <div className="flex flex-wrap gap-2">
                  {categories.length === 0 ? (
                    <span className="text-sm text-muted-foreground">No categories available.</span>
                  ) : (
                    categories.map((category) => (
                      <button
                        key={category.id}
                        type="button"
                        onClick={() => toggleCategory(category.name)}
                        className={`rounded-full border px-3 py-1 text-xs font-medium ${
                          form.categories.includes(category.name)
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

              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 text-sm text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={form.isPublished}
                    onChange={(event) => updateField("isPublished", event.target.checked)}
                  />
                  Published
                </label>
                <label className="flex items-center gap-2 text-sm text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={form.featured}
                    onChange={(event) => updateField("featured", event.target.checked)}
                  />
                  Featured product
                </label>
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={saving}>
                  {saving ? "Saving..." : editingId ? <><Save className="mr-2 h-4 w-4" /> Save</> : <><Package className="mr-2 h-4 w-4" /> Add product</>}
                </Button>
                {editingId && (
                  <Button type="button" variant="outline" onClick={resetForm}>
                    <X className="mr-2 h-4 w-4" /> Cancel
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Current catalog</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading products...</p>
            ) : sortedProducts.length === 0 ? (
              <p className="text-sm text-muted-foreground">No products yet.</p>
            ) : (
              sortedProducts.map((product) => (
                <div key={product.id} className="rounded-lg border p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {product.stock} in stock · {product.categories.join(", ") || "No category"}
                      </p>
                    </div>
                    <span className="text-sm font-medium">${Number(product.price).toFixed(2)}</span>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => handleEdit(product)}>
                      <Pencil className="mr-1 h-3.5 w-3.5" /> Edit
                    </Button>
                    <Button type="button" variant="destructive" size="sm" onClick={() => handleDelete(product.id)}>
                      <Trash2 className="mr-1 h-3.5 w-3.5" /> Delete
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
