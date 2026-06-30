// app/categories/page.tsx
import { db } from "../../src/db";
import { categories, products } from "../../src/db/schema";
import { desc } from "drizzle-orm";
import CategoryClient from "./CategoryClient";

export default async function CategoriesPage() {
  const allCategories = await db.select().from(categories).orderBy(desc(categories.id));
  const allProducts = await db.select().from(products);

  // Đếm số lượng sản phẩm trong từng danh mục
  const enrichedCategories = allCategories.map(cat => {
    const count = allProducts.filter(p => p.category === cat.name).length;
    return { ...cat, productCount: count };
  });

  return <CategoryClient initialCategories={enrichedCategories} allProducts={allProducts} />;
}