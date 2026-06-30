// app/settings/actions.ts
"use server";

import { db } from "../../src/db";
import { orders, orderItems, receipts, products, customers, categories } from "../../src/db/schema";
import { revalidatePath } from "next/cache";

import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import os from "os";

// ============================================================================
// 1. CÁC HÀM QUẢN LÝ TÀI KHOẢN
// ============================================================================
export async function changePassword(username: string, newPass: string) {
  try {
    return { success: true };
  } catch (error) {
    return { success: false, message: "Lỗi hệ thống khi đổi mật khẩu" };
  }
}

export async function addStaff(data: { username: string; fullname: string; pass: string }) {
  try {
    revalidatePath("/settings");
    return { success: true };
  } catch (error) {
    return { success: false, message: "Username đã tồn tại hoặc lỗi DB" };
  }
}

export async function deleteStaff(username: string) {
  try {
    if (username === 'admin') return { success: false };
    revalidatePath("/settings");
    return { success: true };
  } catch (error) {
    return { success: false };
  }
}

// ============================================================================
// 2. CỖ MÁY CHUYỂN ĐỔI DATABASE TỪ APP CŨ LÊN CLOUD
// ============================================================================
export async function migrateOldDatabase(formData: FormData) {
  const file = formData.get("dbFile") as File;
  if (!file) return { success: false, message: "Không tìm thấy file!" };

  const tempPath = path.join(os.tmpdir(), `backup_${Date.now()}.db`);

  try {
    // 1. Lưu file tạm
    const buffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(tempPath, buffer);

    // 2. Mở khóa file .db cũ
    const sqliteDb = new Database(tempPath);

    // 3. Rút ruột toàn bộ dữ liệu từ App cũ
    const oldCustomers = sqliteDb.prepare("SELECT * FROM customers").all();
    const oldCategories = sqliteDb.prepare("SELECT * FROM categories").all();
    const oldProducts = sqliteDb.prepare("SELECT * FROM products").all();
    
    // 🔥 CHUẨN HÓA TRẠNG THÁI ĐƠN HỦY: Giữ nguyên tiền gốc để lưu vết lịch sử
    const rawOrders = sqliteDb.prepare("SELECT * FROM orders").all();
    const oldOrders = rawOrders.map((order: any) => {
      const s = String(order.status || "").trim().toLowerCase();
      if (s.includes("hủy") || s.includes("huỷ") || s.includes("cancel")) {
        return {
          ...order,
          status: "Đã hủy" 
        };
      }
      return order; 
    });

    const oldOrderItems = sqliteDb.prepare("SELECT * FROM order_items").all();
    const oldReceipts = sqliteDb.prepare("SELECT * FROM receipts").all();

    sqliteDb.close();
    fs.unlinkSync(tempPath); // Dọn dẹp file tạm

    // 4. Bơm toàn bộ sang hệ thống Cloud mới (Transaction an toàn)
    await db.transaction(async (tx: any) => {
      // Xóa sạch dữ liệu rác/nháp hiện tại
      await tx.delete(orderItems);
      await tx.delete(orders);
      await tx.delete(receipts);
      await tx.delete(products);
      await tx.delete(categories);
      await tx.delete(customers);

      // Bơm dữ liệu hàng loạt vào Cloud
      if (oldCustomers.length > 0) await tx.insert(customers).values(oldCustomers as any);
      if (oldCategories.length > 0) await tx.insert(categories).values(oldCategories as any);
      if (oldProducts.length > 0) await tx.insert(products).values(oldProducts as any);
      if (oldOrders.length > 0) await tx.insert(orders).values(oldOrders as any);
      if (oldOrderItems.length > 0) await tx.insert(orderItems).values(oldOrderItems as any);
      if (oldReceipts.length > 0) await tx.insert(receipts).values(oldReceipts as any);
    });

    revalidatePath("/", "layout");
    return { success: true };

  } catch (error: any) {
    if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
    console.error("Lỗi chuyển đổi DB:", error);
    return { success: false, message: error.message || "File .db không đúng chuẩn của hệ thống cũ!" };
  }
}