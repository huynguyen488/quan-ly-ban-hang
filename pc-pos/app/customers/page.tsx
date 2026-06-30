// app/customers/page.tsx
import { db } from "../../src/db";
import { customers, orders, receipts } from "../../src/db/schema";
import { desc } from "drizzle-orm";
import CustomerClient from "./CustomerClient";

export const revalidate = 0;

export default async function CustomersPage() {
  const allCustomers = await db.select().from(customers).orderBy(desc(customers.id));
  const allOrders = await db.select().from(orders);
  const allReceipts = await db.select().from(receipts);

  // Hàm chuẩn hóa chuỗi chống sai lệch dấu, chữ hoa, khoảng trắng
  const normalize = (s: string | null) => (s || "").trim().toLowerCase();

  const enrichedCustomers = allCustomers.map((cus) => {
    const targetName = normalize(cus.name);

    // 1. Lọc tất cả đơn hàng của khách
    const cusOrders = allOrders.filter(o => normalize(o.customer_name) === targetName);

    // 2. Lọc đơn nợ (Chỉ tính các đơn chưa thanh toán)
    const unpaidOrders = cusOrders.filter(o => {
      const s = normalize(o.status);
      const isPaid = s.includes('đã thanh toán') || s.includes('hoàn thành') || s.includes('paid') || s === '1' || s === 'true' || s === 'success';
      return !isPaid;
    });

    // 3. Lọc phiếu thu
    const cusReceipts = allReceipts.filter(r => normalize(r.customer_name) === targetName);

    // 4. Tính toán
    const totalOrders = cusOrders.length;
    const totalSpent = cusOrders.reduce((sum, o) => sum + (o.total_price || 0), 0);
    const totalUnpaid = unpaidOrders.reduce((sum, o) => sum + (o.total_price || 0), 0);
    const totalPaidReceipts = cusReceipts.reduce((sum, r) => sum + (r.amount || 0), 0);

    const totalDebt = totalUnpaid - totalPaidReceipts;

    return {
      ...cus,
      totalOrders,
      totalSpent,
      totalDebt: totalDebt > 0 ? totalDebt : 0
    };
  });

  return <CustomerClient initialCustomers={enrichedCustomers} />;
}