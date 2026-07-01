// app/customers/[id]/page.tsx
import { db } from "../../../src/db";
import { customers, orders, receipts } from "../../../src/db/schema";
import { eq } from "drizzle-orm";
import CustomerDetailView from "./CustomerDetailView";
import { notFound } from "next/navigation";

export const revalidate = 0;

export default async function CustomerDetailPage(props: any) {
  const params = await props.params;
  const customerId = parseInt(params.id);

  if (isNaN(customerId)) return notFound();

  // 1. Lấy thông tin chi tiết của khách hàng
  const customerList = await db.select().from(customers).where(eq(customers.id, customerId));
  if (customerList.length === 0) return notFound();
  const customer = customerList[0];

  // 2. Kéo toàn bộ đơn hàng và phiếu thu
  const allOrders = await db.select().from(orders);
  const allReceipts = await db.select().from(receipts);

  const normalize = (s: string | null) => (s || "").trim().toLowerCase();
  const targetName = normalize(customer.name);

  // Lọc tất cả đơn hàng thuộc về khách này (Giữ nguyên để truyền xuống UI hiển thị lịch sử)
  const customerOrders = allOrders.filter(o => normalize(o.customer_name) === targetName);
  
  // Lọc tất cả phiếu thu thuộc về khách này
  const customerReceipts = allReceipts.filter(r => normalize(r.customer_name) === targetName);

  // 🔥 BỌC THÉP: Lọc riêng các đơn HỢP LỆ (Không bị hủy) để làm toán
  const validOrders = customerOrders.filter(o => {
    const s = String(o.status || "").trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return !(s.includes("huy") || s.includes("cancel"));
  });

  // 3. Tính toán các chỉ số kinh doanh chuẩn xác (Dùng validOrders thay vì customerOrders)
  const totalOrdersCount = validOrders.length;
  const totalSpentMoney = validOrders.reduce((sum, o) => sum + (o.total_price || 0), 0);
  
  // LỌC CHUẨN XÁC: Chỉ tính tổng tiền của các đơn "Chưa thanh toán" (Đơn nợ)
  const unpaidOrders = validOrders.filter(o => {
    const s = String(o.status || "").trim().toLowerCase();
    const isPaid = s.includes('đã thanh toán') || s.includes('hoàn thành') || s.includes('paid') || s === '1' || s === 'true' || s === 'success';
    return !isPaid;
  });

  const totalUnpaidMoney = unpaidOrders.reduce((sum, o) => sum + (o.total_price || 0), 0);
  const totalPaidThroughReceipts = customerReceipts.reduce((sum, r) => sum + (r.amount || 0), 0);
  
  // Dư nợ = Tổng tiền nợ mua chịu - Tổng tiền đã trả qua phiếu thu
  const currentDebt = totalUnpaidMoney - totalPaidThroughReceipts;

  return (
    <CustomerDetailView 
      customer={{
        ...customer,
        totalOrders: totalOrdersCount,
        totalSpent: totalSpentMoney,
        currentDebt: currentDebt > 0 ? currentDebt : 0
      }}
      orders={customerOrders} // Vẫn truyền toàn bộ đơn (kể cả hủy) để hiện trong danh sách giao dịch bên phải
      receipts={customerReceipts}
    />
  );
}