// app/customers/actions.ts
"use server";

import { db } from "../../src/db";
import { customers } from "../../src/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// Hàm xác thực Admin (Giống hệt bên Đơn hàng)
export async function verifyAdminAuth(username: string, password: string) {
  if (username.trim() === "admin" && password === "123456") {
    return { success: true };
  }
  return { success: false, message: "Sai tài khoản hoặc mật khẩu quản trị!" };
}

// Trong file app/customers/actions.ts (hoặc file action nào sếp đang chứa nó)
export async function createCustomer(data: any) {
  // Bọc thép tự tạo ngày giờ Việt Nam
  const now = new Date();
  const tzOffset = now.getTimezoneOffset() * 60000;
  const localNow = new Date(now.getTime() - tzOffset);
  
  const day = localNow.getDate().toString().padStart(2, '0');
  const month = (localNow.getMonth() + 1).toString().padStart(2, '0');
  const year = localNow.getFullYear();
  const hours = localNow.getHours().toString().padStart(2, '0');
  const minutes = localNow.getMinutes().toString().padStart(2, '0');
  
  const createdAtStr = `${hours}:${minutes}:00 ${day}/${month}/${year}`;

  await db.insert(customers).values({
    name: data.name,
    phone: data.phone,
    address: data.address,
    note: data.note,
    created_at: createdAtStr // 🔥 Ép lưu ngày tạo vào Database
  });
  
  revalidatePath("/customers");
}
export async function updateCustomer(id: number, data: { name: string; phone: string; address: string; note: string }) {
  await db.update(customers).set({
    name: data.name.trim(),
    phone: data.phone.trim(),
    address: data.address.trim(),
    note: data.note.trim(),
  }).where(eq(customers.id, id));
  revalidatePath("/customers");
}

export async function deleteCustomer(id: number) {
  await db.delete(customers).where(eq(customers.id, id));
  revalidatePath("/customers");
}