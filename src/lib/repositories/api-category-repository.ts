import type { Category, CategoryRepository } from "@/types"
import data from "@/data/products.json"

const fallbackCategories = (data.categories ?? []) as Category[]
const backendBaseUrl = process.env.NEXT_PUBLIC_LOCAL_BACKEND_URL || "http://localhost:5000"

async function fetchCategoriesFromBackend(): Promise<Category[]> {
  try {
    const response = await fetch(`${backendBaseUrl}/api/categories`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    })

    if (!response.ok) {
      return fallbackCategories
    }

    const payload = await response.json()
    if (!Array.isArray(payload)) {
      return fallbackCategories
    }

    return payload
      .filter((category) => category.isVisible !== false)
      .map((category, index) => ({
        id: String(category.id || `cat-${index + 1}`),
        name: String(category.name || "Category"),
        slug: String(category.slug || category.name || `category-${index + 1}`),
        description: String(category.description || "Marino collection."),
        image: {
          url: String(category.image || category.bannerImage || "/images/products/placeholder.svg"),
          alt: String(category.name || "Category"),
        },
        bannerImage: {
          url: String(category.bannerImage || category.image || "/images/products/placeholder.svg"),
          alt: String(category.name || "Category"),
        },
        order: Number(category.order ?? index + 1),
        isVisible: category.isVisible !== false,
        featured: Boolean(category.featured ?? false),
      }))
  } catch {
    return fallbackCategories
  }
}

export const apiCategoryRepository: CategoryRepository & {
  getChildren(parentId: string): Promise<Category[]>
  getTopLevel(): Promise<Category[]>
  getAncestors(categoryId: string): Promise<Category[]>
} = {
  async list() {
    const categories = await fetchCategoriesFromBackend()
    return [...categories].sort((a, b) => a.order - b.order)
  },

  async getBySlug(slug) {
    const categories = await fetchCategoriesFromBackend()
    return categories.find((category) => category.slug === slug) ?? null
  },

  async getById(id) {
    const categories = await fetchCategoriesFromBackend()
    return categories.find((category) => category.id === id) ?? null
  },

  async getChildren(parentId) {
    const categories = await fetchCategoriesFromBackend()
    return categories
      .filter((category) => category.parentId === parentId)
      .sort((a, b) => a.order - b.order)
  },

  async getTopLevel() {
    const categories = await fetchCategoriesFromBackend()
    return categories
      .filter((category) => !category.parentId)
      .sort((a, b) => a.order - b.order)
  },

  async getAncestors(categoryId) {
    const categories = await fetchCategoriesFromBackend()
    const chain: Category[] = []
    let current = categories.find((category) => category.id === categoryId)

    while (current) {
      chain.unshift(current)
      current = current.parentId
        ? categories.find((category) => category.id === current!.parentId)
        : undefined
    }

    return chain
  },
}
