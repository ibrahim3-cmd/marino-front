import type { Brand } from "@/types"
import data from "@/data/products.json"

const fallbackBrands = (data as { brands: Brand[] }).brands
const backendBaseUrl = process.env.NEXT_PUBLIC_LOCAL_BACKEND_URL || "http://localhost:5000"

export const jsonBrandRepository = {
  async list(): Promise<Brand[]> {
    try {
      const response = await fetch(`${backendBaseUrl}/api/brands`, { cache: "no-store" })
      if (!response.ok) return fallbackBrands
      const payload = await response.json()
      if (!Array.isArray(payload)) return fallbackBrands
      return payload.map((brand) => ({
        id: String(brand.id || "brand"),
        name: String(brand.name || "Brand"),
        slug: String(brand.slug || brand.name || "brand"),
        description: String(brand.description || ""),
      }))
    } catch {
      return fallbackBrands
    }
  },

  async getBySlug(slug: string): Promise<Brand | null> {
    const brands = await this.list()
    return brands.find((b) => b.slug === slug) ?? null
  },

  async getById(id: string): Promise<Brand | null> {
    const brands = await this.list()
    return brands.find((b) => b.id === id) ?? null
  },
}
