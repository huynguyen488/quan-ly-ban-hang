// app/debts/page.tsx
import { db } from "../../src/db";
import { orders, receipts, customers } from "../../src/db/schema";
import { desc } from "drizzle-orm";
import DebtsClient from "./DebtsClient";

export const revalidate = 0;

// 🔥 HÀM BỌC THÉP TÌM ĐƠN HỦY TRÊN SERVER
const checkIsCancelled = (status: string | null | undefined) => {
  if (!status) return false;
  const s = String(status).trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return s.includes("huy") || s.includes("cancel");
};

export default async function DebtsPage() {
  const allOrders = await db.select().from(orders).orderBy(desc(orders.date));
  const allReceipts = await db.select().from(receipts);
  const allCustomers = await db.select().from(customers);

  const customerLookup: Record<string, { id: number; phone: string | null }> = {};
  allCustomers.forEach(c => {
    if (c.name) {
      customerLookup[c.name.trim().toLowerCase()] = {
        id: c.id,
        phone: c.phone || null
      };
    }
  });

  // 🔥 BƯỚC 1: LỌC BỌC THÉP - KHÔNG LẤY ĐƠN ĐÃ THANH TOÁN & ĐƠN ĐÃ HỦY
  const debtOrders = allOrders.filter(o => {
    const s = String(o.status || "").trim().toLowerCase();
    const isPaid = s.includes('đã thanh toán') || s.includes('hoàn thành') || s.includes('paid') || s === '1' || s === 'true' || s === 'success' || s.includes('đủ');
    const isCancelled = checkIsCancelled(o.status);
    
    // Chỉ giữ lại những đơn CHƯA THANH TOÁN và KHÔNG BỊ HỦY
    return !isPaid && !isCancelled;
  });

  const customerDebtMap: Record<string, { id: number | null; displayId: string; name: string; total_debt: number; phone: string | null }> = {};

  // 🔥 BƯỚC 2: TÍNH TỔNG NỢ TỪ CÁC ĐƠN CHUẨN
  for (const order of debtOrders) {
    const cName = order.customer_name || "Khách lẻ";
    
    // Tuyệt đối không đưa Khách vãng lai vào danh sách nợ
    if (cName.toLowerCase().includes("vãng lai")) continue;

    const key = cName.trim().toLowerCase();
    
    if (!customerDebtMap[key]) {
      const info = customerLookup[key];
      customerDebtMap[key] = {
        id: info ? info.id : null,
        displayId: info ? `KH${info.id}` : "---",
        name: cName,
        total_debt: 0,
        phone: order.customer_phone || (info ? info.phone : null)
      };
    }
    customerDebtMap[key].total_debt += (order.total_price || 0);
  }

  // 🔥 BƯỚC 3: KHẤU TRỪ CHÍNH XÁC CÁC PHIẾU THU ĐÃ TRẢ
  for (const r of allReceipts) {
    // Nếu phiếu thu đã bị hủy (có chữ [ĐÃ HỦY] trong note) thì không dùng để trừ nợ
    const isReceiptCancelled = String(r.note || "").includes("[ĐÃ HỦY]");
    if (isReceiptCancelled) continue;

    const cName = r.customer_name || "Khách lẻ";
    if (cName.toLowerCase().includes("vãng lai")) continue;
    
    const key = cName.trim().toLowerCase();
    if (customerDebtMap[key]) {
      customerDebtMap[key].total_debt -= (r.amount || 0);
    }
  }

  // Loại bỏ những người đã trả hết nợ hoặc nợ bị triệt tiêu (dư nợ <= 0)
  const debtList = Object.values(customerDebtMap).filter(item => item.total_debt > 0);

  return <DebtsClient initialDebtList={debtList} />;
}