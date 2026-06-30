// app/products/page.tsx
import { db } from "../../src/db";
import { products } from "../../src/db/schema";
import { desc } from "drizzle-orm";
import ProductClient from "./ProductClient";

export default async function ProductsPage() {
  // Server Component: Kéo dữ liệu 1 lần lúc mới tải trang
  const allProducts = await db.select().from(products).orderBy(desc(products.id));

  // Ném toàn bộ cục data sang cho Client Component hiển thị & tìm kiếm
  return <ProductClient initialProducts={allProducts} />;
}