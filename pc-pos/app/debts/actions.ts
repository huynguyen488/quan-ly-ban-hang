// app/debts/actions.ts
"use server";

import { db } from "../../src/db";
import { receipts, orders } from "../../src/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

async function syncCustomerOrdersStatus(customerName: string | null) {
  const normalize = (s: string | null) => (s || "").trim().toLowerCase();
  const targetName = normalize(customerName);
  if (!targetName) return;

  const allReceipts = await db.select().from(receipts);
  const customerReceipts = allReceipts.filter(r => normalize(r.customer_name) === targetName);
  let totalPaidPool = customerReceipts.reduce((sum, r) => sum + (r.amount || 0), 0);

  const allOrders = await db.select().from(orders);
  const customerOrders = allOrders
    .filter(o => normalize(o.customer_name) === targetName)
    .sort((a, b) => {
      if (!a.date) return -1;
      if (!b.date) return 1;
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });

  for (const order of customerOrders) {
    const orderTotal = order.total_price || 0;
    if (totalPaidPool >= orderTotal) {
      await db.update(orders).set({ status: "Đã thanh toán" }).where(eq(orders.id, order.id));
      totalPaidPool -= orderTotal;
    } else {
      await db.update(orders).set({ status: "Chưa thanh toán" }).where(eq(orders.id, order.id));
      totalPaidPool = 0;
    }
  }
}

export async function createReceipt(data: { customer_name: string; amount: number; date: string; note: string }) {
  await db.insert(receipts).values({
    customer_name: data.customer_name.trim(),
    amount: data.amount,
    date: data.date.trim(),
    note: data.note.trim(),
  });
  await syncCustomerOrdersStatus(data.customer_name);
  
  revalidatePath("/debts");
  revalidatePath("/orders");
  revalidatePath("/customers");
}

// 🔥 NÂNG CẤP XÓA MỀM BẢO TOÀN LỊCH SỬ
export async function deleteReceipt(id: number, reason: string) {
  const allReceipts = await db.select().from(receipts).where(eq(receipts.id, id));
  if (allReceipts.length === 0) return;
  const receiptInfo = allReceipts[0];

  const originalAmount = receiptInfo.amount || 0;
  const originalNote = receiptInfo.note || "Không có ghi chú";
  const cancelReason = (reason || "").trim() || "Xóa do sai sót";
  
  // Lưu vết lịch sử vào ghi chú
  const newNote = `[ĐÃ HỦY] Lý do: ${cancelReason} | Gốc: ${originalAmount} | Cũ: ${originalNote}`;

  // Cập nhật số tiền về 0 để nhả nợ, chứ không xóa bay màu khỏi DB
  await db.update(receipts).set({
    amount: 0, 
    note: newNote
  }).where(eq(receipts.id, id));

  await syncCustomerOrdersStatus(receiptInfo.customer_name || "");

  revalidatePath("/debts");
  revalidatePath("/orders");
  revalidatePath("/customers");
}

export async function verifyAdminAuth(user: string, pass: string) {
  if (user === "admin" && pass === "123456") {
    return { success: true, message: "Xác thực thành công!" };
  }
  return { success: false, message: "Sai tài khoản hoặc mật khẩu Quản trị viên!" };
}