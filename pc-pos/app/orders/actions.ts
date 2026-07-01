// app/orders/actions.ts
"use server";

import { db } from "../../src/db";
import { orders, orderItems, products } from "../../src/db/schema";
import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getOrderItems(orderId: string) {
  return await db.select().from(orderItems).where(eq(orderItems.order_id, orderId));
}

// BẢO MẬT ADMIN: Xác minh tài khoản mật khẩu trước khi hủy/xóa hóa đơn
export async function verifyAdminAuth(username: string, password: string) {
  if (username.trim() === "admin" && password === "123456") {
    return { success: true };
  }
  return { success: false, message: "Sai tài khoản hoặc mật khẩu quản trị!" };
}

export async function updateOrderComplete(orderId: string, updatedData: any) {
  const { cart, customerName, customerPhone, totalPrice, discount, paymentMethod, status, amountGiven, orderDate } = updatedData;

  // 1. HOÀN TRẢ LẠI KHO CŨ VÀ LOG LỊCH SỬ HOÀN KHO
  const oldItems = await db.select().from(orderItems).where(eq(orderItems.order_id, orderId));
  for (const oldItem of oldItems) {
    const [prod] = await db.select().from(products).where(eq(products.name, oldItem.product_name as string)).limit(1);
    if (prod) {
      const rolledBackStock = (prod.stock || 0) + (oldItem.quantity || 0);
      await db.update(products).set({ stock: rolledBackStock }).where(eq(products.id, prod.id));
      
      try {
        // 🔥 ĐÃ SỬA: Thay db.execute bằng db.run chuẩn thư viện libSQL/Turso
        await db.run(sql`
          INSERT INTO stock_history (product_name, change_amount, new_balance, type, note, date)
          VALUES (${prod.name}, ${oldItem.quantity || 0}, ${rolledBackStock}, 'Nhập kho', ${`Hoàn kho phục vụ sửa đơn #${orderId}`}, ${orderDate})
        `);
      } catch(e){ console.error(e); }
    }
  }

  // 2. XÓA CŨ GHI MỚI CHI TIẾT ĐƠN HÀNG
  await db.delete(orderItems).where(eq(orderItems.order_id, orderId));
  await db.update(orders).set({
    customer_name: customerName || "Khách vãng lai",
    customer_phone: customerPhone,
    date: orderDate,
    total_price: totalPrice,
    payment_method: paymentMethod,
    status: status,
    note: `Đã sửa đơn | Khách đưa: ${amountGiven} | Chiết khấu: ${discount}`,
  }).where(eq(orders.id, orderId));

  // 3. TRỪ KHO THEO ĐƠN MỚI SAU KHI SỬA
  for (const item of cart) {
    await db.insert(orderItems).values({
      order_id: orderId,
      product_name: item.product.name,
      quantity: item.quantity,
      price: item.product.price_sell,
      price_import: item.product.price_import || 0,
      unit: item.product.unit || "Cái",
      serials: item.serials || "",
    } as any);

    const [prod] = await db.select().from(products).where(eq(products.id, item.product.id)).limit(1);
    if (prod) {
      const finalStock = (prod.stock || 0) - (item.quantity || 0);
      await db.update(products).set({ stock: finalStock }).where(eq(products.id, prod.id));

      try {
        // 🔥 ĐÃ SỬA: Thay db.execute bằng db.run
        await db.run(sql`
          INSERT INTO stock_history (product_name, change_amount, new_balance, type, note, date)
          VALUES (${prod.name}, ${-(item.quantity || 0)}, ${finalStock}, 'Xuất kho', ${`Xuất kho sau khi sửa đơn #${orderId}`}, ${orderDate})
        `);
      } catch(e){ console.error(e); }
    }
  }

  revalidatePath("/orders"); revalidatePath("/products"); revalidatePath("/pos"); revalidatePath("/reports");
  return { success: true };
}

// 🔥 TÍNH NĂNG MỚI: XÓA MỀM (SOFT DELETE) - TRẢ KHO NHƯNG LƯU VẾT
export async function deleteOrder(orderId: string) {
  const items = await db.select().from(orderItems).where(eq(orderItems.order_id, orderId));
  const nowStr = new Date().toLocaleString('vi-VN');
  
  // Trả lại kho toàn bộ hàng hóa của đơn bị hủy
  for (const item of items) {
    const [prod] = await db.select().from(products).where(eq(products.name, item.product_name as string)).limit(1);
    if (prod) {
      const rolledBackStock = (prod.stock || 0) + (item.quantity || 0);
      await db.update(products).set({ stock: rolledBackStock }).where(eq(products.id, prod.id));

      try {
        // 🔥 ĐÃ SỬA: Thay db.execute bằng db.run
        await db.run(sql`
          INSERT INTO stock_history (product_name, change_amount, new_balance, type, note, date)
          VALUES (${prod.name}, ${item.quantity || 0}, ${rolledBackStock}, 'Nhập kho', ${`Hoàn trả kho do HỦY ĐƠN #${orderId}`}, ${nowStr})
        `);
      } catch(e){ console.error(e); }
    }
  }
  
  // KHÔNG XÓA ROW: Chỉ cập nhật trạng thái đơn hàng thành "Đã hủy"
  await db.update(orders).set({ status: "Đã hủy" }).where(eq(orders.id, orderId));
  
  // Làm mới bộ đệm toàn hệ thống
  revalidatePath("/orders"); revalidatePath("/products"); revalidatePath("/pos"); revalidatePath("/reports");
  return { success: true };
}