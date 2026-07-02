// app/customers/page.tsx
import { db } from "../../src/db";
import { customers, orders, receipts } from "../../src/db/schema";
import { desc } from "drizzle-orm";
import CustomerClient from "./CustomerClient";

// 🔥 BỘ 3 BÙA CHÚ CHỐNG CACHE: Ép Netlify phải lấy dữ liệu tươi (Live Data) 100%
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

export default async function CustomersPage() {
  const allCustomers = await db.select().from(customers).orderBy(desc(customers.id));
  const allOrders = await db.select().from(orders);
  const allReceipts = await db.select().from(receipts);

  const normalize = (s: string | null) => (s || "").trim().toLowerCase();

  const customersWithStats = allCustomers.map((customer) => {
    const targetName = normalize(customer.name);

    const customerOrders = allOrders.filter(o => normalize(o.customer_name) === targetName);
    const customerReceipts = allReceipts.filter(r => normalize(r.customer_name) === targetName);

    // 1. Lọc đá văng đơn "Đã Hủy" ra khỏi hệ thống tính toán
    const validOrders = customerOrders.filter(o => {
      const s = String(o.status || "").trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      return !(s.includes("huy") || s.includes("cancel"));
    });

    // 2. BỌC THÉP LOGIC TÌM ĐƠN NỢ (Tránh nhầm lẫn chữ "Chưa thanh toán" và "Đã thanh toán")
    const unpaidOrders = validOrders.filter(o => {
      const s = String(o.status || "").trim().toLowerCase();
      const isPaid = !s.includes('chưa') && !s.includes('nợ') && (s.includes('đã thanh toán') || s.includes('hoàn thành') || s.includes('đủ') || s.includes('paid') || s === '1' || s === 'true' || s === 'success');
      return !isPaid; // Nếu không đạt chuẩn Đã trả đủ -> Auto là đơn nợ
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