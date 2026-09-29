// Use the live backend API as the default data source for the shop.
// The static JSON repositories remain available as a fallback for offline/demo use.

export { apiProductRepository as productRepository } from "./api-product-repository"
export { apiCategoryRepository as categoryRepository } from "./api-category-repository"
export { jsonBrandRepository as brandRepository } from "./json-brand-repository"
export { jsonPageRepository as pageRepository } from "./json-page-repository"
export { jsonBlogRepository as blogRepository } from "./json-blog-repository"
