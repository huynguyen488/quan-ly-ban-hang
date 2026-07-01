// app/customers/page.tsx
import { db } from "../../src/db";
import { customers, orders, receipts } from "../../src/db/schema";
import { desc } from "drizzle-orm";
import CustomerClient from "./CustomerClient";

export const revalidate = 0;

export default async function CustomersPage() {
  // 1. Kéo toàn bộ dữ liệu từ Turso
  const allCustomers = await db.select().from(customers).orderBy(desc(customers.id));
  const allOrders = await db.select().from(orders);
  const allReceipts = await db.select().from(receipts);

  const normalize = (s: string | null) => (s || "").trim().toLowerCase();

  // 2. TÍNH TOÁN BỌC THÉP CHO TỪNG KHÁCH HÀNG (Đồng bộ với trang chi tiết)
  const customersWithStats = allCustomers.map((customer) => {
    const targetName = normalize(customer.name);

    const customerOrders = allOrders.filter(o => normalize(o.customer_name) === targetName);
    const customerReceipts = allReceipts.filter(r => normalize(r.customer_name) === targetName);

    // 🔥 MÀNG LỌC 1: Đá bay các đơn "Đã hủy" ra chuồng gà
    const validOrders = customerOrders.filter(o => {
      const s = String(o.status || "").trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      return !(s.includes("huy") || s.includes("cancel"));
    });

    // 🔥 MÀNG LỌC 2: Chỉ lấy các đơn "Ghi nợ / Chưa thanh toán"
    const unpaidOrders = validOrders.filter(o => {
      const s = String(o.status || "").trim().toLowerCase();
      const isPaid = s.includes('đã thanh toán') || s.includes('hoàn thành') || s.includes('paid') || s === '1' || s === 'true' || s === 'success';
      return !isPaid;
    });

    // 3. Tiến hành cộng trừ nhân chia
    const totalSpent = validOrders.reduce((sum, o) => sum + (o.total_price || 0), 0);
    const totalUnpaidMoney = unpaidOrders.reduce((sum, o) => sum + (o.total_price || 0), 0);
    const totalPaidThroughReceipts = customerReceipts.reduce((sum, r) => sum + (r.amount || 0), 0);

    // Dư nợ = Tổng nợ mua chịu - Tổng tiền đã trả qua phiếu thu
    const currentDebt = totalUnpaidMoney - totalPaidThroughReceipts;

    return {
      ...customer,
      totalOrders: validOrders.length,
      totalSpent: totalSpent,
      currentDebt: currentDebt > 0 ? currentDebt : 0
    };
  });

  return <CustomerClient initialCustomers={customersWithStats} />;
}