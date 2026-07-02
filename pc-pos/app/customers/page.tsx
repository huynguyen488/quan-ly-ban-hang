// app/customers/page.tsx
import { unstable_noStore as noStore } from 'next/cache';
import { db } from "../../src/db";
import { customers, orders, receipts } from "../../src/db/schema";
import { desc } from "drizzle-orm";
import CustomerClient from "./CustomerClient";

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

export default async function CustomersPage() {
  noStore(); // Cấm mọi hình thức lưu đệm của Next.js

  const allCustomers = await db.select().from(customers).orderBy(desc(customers.id));
  const allOrders = await db.select().from(orders);
  const allReceipts = await db.select().from(receipts);

  const normalize = (s: string | null) => String(s || "").trim().toLowerCase();

  const customersWithStats = allCustomers.map((customer) => {
    const targetName = normalize(customer.name);

    // Kéo toàn bộ đơn hàng & phiếu thu của khách này
    const customerOrders = allOrders.filter(o => normalize(o.customer_name) === targetName);
    const customerReceipts = allReceipts.filter(r => normalize(r.customer_name) === targetName);

    let totalSpent = 0;
    let totalUnpaid = 0;
    let validOrdersCount = 0;

    // 🔥 LOGIC BỌC THÉP: Copy y hệt 100% từ trang Chi Tiết [id] sang
    customerOrders.forEach(o => {
       const s = String(o.status || "").trim().toLowerCase();
       
       // Bỏ qua đơn hủy
       const sNoAccent = s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
       if (sNoAccent.includes("huy") || s.includes("cancel")) return;

       validOrdersCount++;
       const price = Number(o.total_price) || 0;
       totalSpent += price;

       // Lọc chuẩn xác: Không chứa các chữ này => Mặc định là Nợ
       const isPaid = s.includes('đã thanh toán') || s.includes('hoàn thành') || s.includes('paid') || s === '1' || s === 'true' || s === 'success';
       
       if (!isPaid) {
           totalUnpaid += price;
       }
    });

    const totalPaidThroughReceipts = customerReceipts.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
    const currentDebt = totalUnpaid - totalPaidThroughReceipts;
    const finalDebt = currentDebt > 0 ? currentDebt : 0;

    return {
      ...customer,
      totalOrders: validOrdersCount,
      totalSpent: totalSpent,
      
      // 🔥 RẢI THẢM TÊN BIẾN: Bắn ra mọi tên gọi có thể có để file giao diện auto bắt trúng
      currentDebt: finalDebt,
      totalDebt: finalDebt,  
      debt: finalDebt,       
      unpaid: finalDebt      
    };
  });

  return <CustomerClient initialCustomers={customersWithStats} />;
}