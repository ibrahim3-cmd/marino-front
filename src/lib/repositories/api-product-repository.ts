import type {
  PaginatedResult,
  PaginationParams,
  Product,
  ProductFilters,
  ProductRepository,
  SortOption,
} from "@/types"
import data from "@/data/products.json"

const fallbackProducts = (data.products ?? []) as Product[]
const backendBaseUrl = process.env.NEXT_PUBLIC_LOCAL_BACKEND_URL || "http://localhost:5000"

function normalizePrice(value: number | string | undefined): number {
  const parsed = Number(value ?? 0)
  return Number.isFinite(parsed) ? parsed : 0
}

function createProductFromBackend(item: any, categoryLookup: Record<string, string>): Product {
  const productName = String(item.name || "Untitled product")
  const productCategories = Array.isArray(item.categories)
    ? item.categories
    : typeof item.category === "string"
      ? [item.category]
      : []

  const categoryIds = productCategories
    .map((categoryName: string) => {
      const normalizedName = String(categoryName || "").trim()
      if (!normalizedName) return null
      return categoryLookup[normalizedName.toLowerCase()] ?? null
    })
    .filter(Boolean) as string[]

  const defaultPrice = normalizePrice(item.price)
  const defaultCompareAtPrice = normalizePrice(item.compareAtPrice ?? item.originalPrice ?? item.price)
  const rawImages = Array.isArray(item.images) && item.images.length
    ? item.images
    : typeof item.image === "string" && item.image
      ? [item.image]
      : ["/images/products/placeholder.svg"]

  const images = rawImages.map((image: string) => ({
    url: String(image || "/images/products/placeholder.svg"),
    alt: productName,
    width: 800,
    height: 800,
  }))

  const variantData = Array.isArray(item.variants) && item.variants.length
    ? item.variants
    : [{
        id: String(item.id || `var-${Date.now()}`),
        sku: String(item.sku || "SKU-DEFAULT"),
        name: "Default",
        price: defaultPrice,
        compareAtPrice: defaultCompareAtPrice || defaultPrice,
        inventory: { quantity: Number(item.stock ?? 0), trackInventory: true, allowBackorder: false },
        options: [],
        images: rawImages,
      }]

  const variants = variantData.map((variant: any, index: number) => {
    const variantPrice = normalizePrice(variant.price ?? defaultPrice)
    const variantCompareAt = normalizePrice(variant.compareAtPrice ?? defaultCompareAtPrice ?? variantPrice)
    const variantImages = Array.isArray(variant.images) && variant.images.length
      ? variant.images
      : rawImages

    return {
      id: String(variant.id || `${item.id || `prod-${Date.now()}`}-variant-${index + 1}`),
      productId: String(item.id || `prod-${Date.now()}`),
      sku: String(variant.sku || item.sku || "SKU-DEFAULT"),
      name: String(variant.name || "Default"),
      price: variantPrice * 100,
      compareAtPrice: variantCompareAt > 0 ? variantCompareAt * 100 : undefined,
      currency: "USD",
      inventory: {
        quantity: Number(variant.inventory?.quantity ?? item.stock ?? 0),
        trackInventory: Boolean(variant.inventory?.trackInventory ?? true),
        allowBackorder: Boolean(variant.inventory?.allowBackorder ?? false),
      },
      options: Array.isArray(variant.options) ? variant.options.map((option: any) => ({
        name: String(option.name || "Option"),
        value: String(option.value || ""),
      })) : [],
      images: variantImages.map((image: string) => ({
        url: String(image || "/images/products/placeholder.svg"),
        alt: productName,
        width: 800,
        height: 800,
      })),
    }
  })

  const tags = [...new Set(productCategories.map((category: string) => String(category).trim()).filter(Boolean) as string[])]

  return {
    id: String(item.id || `prod-${Date.now()}`),
    name: productName,
    slug: String(item.slug || productName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "product"),
    description: String(item.description || "Marino product."),
    body: String(item.description || "Marino product."),
    images,
    status: Boolean(item.isPublished ?? true) ? "active" : "draft",
    brandId: "brand-1",
    categoryIds,
    tags,
    variants,
    rating: 4.8,
    reviewCount: Math.max(5, Math.min(120, Number(item.salesCount ?? item.views ?? 12) || 12)),
    featured: Boolean(item.featured ?? item.isPublished ?? true),
    createdAt: String(item.createdAt || new Date().toISOString()),
    updatedAt: String(item.updatedAt || item.createdAt || new Date().toISOString()),
  }
}

async function fetchCategoriesFromBackend(): Promise<Array<{ id: string; name: string; slug: string }>> {
  try {
    const response = await fetch(`${backendBaseUrl}/api/categories`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    })

    if (!response.ok) {
      return []
    }

    const payload = await response.json()
    if (!Array.isArray(payload)) {
      return []
    }

    return payload.map((category, index) => ({
      id: String(category.id || `cat-${index + 1}`),
      name: String(category.name || "Category"),
      slug: String(category.slug || category.name || `category-${index + 1}`),
    }))
  } catch {
    return []
  }
}

async function fetchProductsFromBackend(): Promise<Product[]> {
  try {
    const [productsResponse, categories] = await Promise.all([
      fetch(`${backendBaseUrl}/api/products`, {
        headers: { Accept: "application/json" },
        cache: "no-store",
      }),
      fetchCategoriesFromBackend(),
    ])

    if (!productsResponse.ok) {
      return fallbackProducts
    }

    const payload = await productsResponse.json()
    if (!Array.isArray(payload)) {
      return fallbackProducts
    }

    const categoryLookup = Object.fromEntries(
      categories.map((category) => [category.name.toLowerCase(), category.id]),
    )

    return payload.map((item) => createProductFromBackend(item, categoryLookup))
  } catch {
    return fallbackProducts
  }
}

function applyFilters(items: Product[], filters?: ProductFilters): Product[] {
  if (!filters) return items

  let result = items.filter((product) => product.status === "active")

  if (filters.category) {
    const categorySlug = String(filters.category).toLowerCase()
    result = result.filter((product) =>
      product.categoryIds.some((id) => id.toLowerCase().includes(categorySlug)) ||
      product.tags.some((tag) => tag.toLowerCase() === categorySlug) ||
      product.slug.toLowerCase() === categorySlug,
    )
  }

  if (filters.search) {
    const query = filters.search.toLowerCase()
    result = result.filter(
      (product) =>
        product.name.toLowerCase().includes(query) ||
        product.description.toLowerCase().includes(query) ||
        product.tags.some((tag) => tag.toLowerCase().includes(query)),
    )
  }

  return result
}

function applySort(items: Product[], sort?: SortOption): Product[] {
  if (!sort) return items

  const sorted = [...items]

  switch (sort.field) {
    case "price":
      sorted.sort((a, b) => (a.variants[0]?.price ?? 0) - (b.variants[0]?.price ?? 0))
      break
    case "name":
      sorted.sort((a, b) => a.name.localeCompare(b.name))
      break
    case "createdAt":
      sorted.sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      )
      break
    default:
      break
  }

  if (sort.order === "desc") {
    sorted.reverse()
  }

  return sorted
}

function paginate<T>(items: T[], pagination?: PaginationParams): PaginatedResult<T> {
  const page = pagination?.page ?? 1
  const limit = pagination?.limit ?? 12
  const total = items.length
  const totalPages = Math.max(1, Math.ceil(total / limit))
  const offset = (page - 1) * limit

  return {
    items: items.slice(offset, offset + limit),
    pagination: {
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  }
}

export const apiProductRepository: ProductRepository = {
  async list(filters, sort, pagination) {
    const items = await fetchProductsFromBackend()
    const filtered = applyFilters(items, filters)
    const sorted = applySort(filtered, sort)
    return paginate(sorted, pagination)
  },

  async getBySlug(slug) {
    const items = await fetchProductsFromBackend()
    return items.find((product) => product.slug === slug && product.status === "active") ?? null
  },

  async getById(id) {
    const items = await fetchProductsFromBackend()
    return items.find((product) => product.id === id) ?? null
  },

  async getFeatured(limit = 4) {
    const items = await fetchProductsFromBackend()
    const settingsResponse = await fetch(`${backendBaseUrl}/api/site-settings`, { cache: "no-store" })
    const settings = settingsResponse.ok ? await settingsResponse.json() : null
    const featuredIds = Array.isArray(settings?.featuredProductIds) ? settings.featuredProductIds : []

    const pinned = featuredIds.length > 0
      ? items.filter((product) => featuredIds.includes(product.id) && product.status === "active")
      : []

    const featured = items.filter((product) => product.featured && product.status === "active")
    const merged = [...pinned, ...featured.filter((product) => !pinned.some((item) => item.id === product.id))]
    return merged.slice(0, limit)
  },

  async getByCategory(categorySlug, pagination) {
    const items = await fetchProductsFromBackend()
    const category = categorySlug.toLowerCase()
    const categoryProducts = items.filter(
      (product) =>
        product.status === "active" &&
        (product.categoryIds.some((id) => id.toLowerCase().includes(category)) ||
          product.tags.some((tag) => tag.toLowerCase() === category) ||
          product.slug.toLowerCase() === category),
    )
    return paginate(categoryProducts, pagination)
  },

  async search(query, pagination) {
    const items = await fetchProductsFromBackend()
    const filtered = applyFilters(items, { search: query })
    return paginate(filtered, pagination)
  },
}
