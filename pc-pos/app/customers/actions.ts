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

export async function createCustomer(data: { name: string; phone: string; address: string; note: string }) {
  await db.insert(customers).values({
    name: data.name.trim(),
    phone: data.phone.trim(),
    address: data.address.trim(),
    note: data.note.trim(),
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