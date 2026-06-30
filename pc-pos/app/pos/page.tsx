// app/pos/page.tsx
import { db } from "../../src/db";
import { products, customers } from "../../src/db/schema"; // Import thêm bảng customers
import { desc } from "drizzle-orm";
import PosClient from "./PosClient";

export default async function PosPage() {
  // Kéo cả Sản phẩm và Khách hàng từ Database về
  const allProducts = await db.select().from(products).orderBy(desc(products.id));
  const allCustomers = await db.select().from(customers).orderBy(desc(customers.id));

  return (
    <div className="h-full bg-gray-100">
      {/* Ném thêm cục data initialCustomers vào đây */}
      <PosClient initialProducts={allProducts} initialCustomers={allCustomers} />
    </div>
  );
}