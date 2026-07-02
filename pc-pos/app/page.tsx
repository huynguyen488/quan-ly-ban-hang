// app/page.tsx
import { unstable_noStore as noStore } from 'next/cache';
import { db } from "../src/db"; // 💡 Sửa thành "../../src/db" nếu file của sếp nằm trong thư mục app/dashboard/
import { orders, customers, products, receipts } from "../src/db/schema";
import { desc } from "drizzle-orm";
import DashboardClient from "./DashboardClient";

// BÙA CHÚ CHỐNG CACHE TRÊN NETLIFY
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

export default async function DashboardPage() {
  noStore(); 

  // Kéo toàn bộ dữ liệu cần thiết
  const allOrders = await db.select().from(orders).orderBy(desc(orders.id));
  const allCustomers = await db.select().from(customers);
  const allProducts = await db.select().from(products).orderBy(desc(products.stock));
  const allReceipts = await db.select().from(receipts);

  return (
    <DashboardClient 
      orders={allOrders} 
      customers={allCustomers} 
      products={allProducts} 
      receipts={allReceipts} 
    />
  );
}