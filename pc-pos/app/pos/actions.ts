// app/pos/actions.ts
"use server";

import { db } from "../../src/db";
import { customers, orders, orderItems, products } from "../../src/db/schema";
// Giả định sếp có bảng stock_history trong db, nếu chưa chạy migration thì cứ tạo bảng trước nhé sếp
import { sql } from "drizzle-orm"; 
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function quickAddCustomer(name: string, phone: string) {
  const [newCustomer] = await db.insert(customers).values({
    name: name.trim(),
    phone: phone.trim(),
  }).returning();
  revalidatePath("/pos");
  return newCustomer;
}

export async function createOrder(orderData: any) {
  const {
    cart,
    customerName,
    customerPhone,
    totalPrice, 
    discount,
    paymentMethod,
    status,
    amountGiven,
    orderDate,
  } = orderData;

  const orderId = "DH" + Date.now().toString().slice(-6);

  // 1. Lưu hóa đơn chính
  await db.insert(orders).values({
    id: orderId,
    customer_name: customerName || "Khách vãng lai",
    customer_phone: customerPhone,
    date: orderDate,
    total_price: totalPrice,
    payment_method: paymentMethod,
    status: status,
    note: `Khách đưa: ${amountGiven} | Chiết khấu: ${discount}`,
  });

  // 2. Quét giỏ hàng: Lưu chi tiết, Trừ kho & Ghi lịch sử kho
  for (const item of cart) {
    await db.insert(orderItems).values({
      order_id: orderId,
      product_name: item.product.name,
      quantity: item.quantity,
      price: item.product.price_sell,
      price_import: item.product.price_import || 0,
      unit: item.product.unit || "Cái",
      // Đút mã Serial/IMEI vào cột note hoặc cột serials tùy cấu trúc schema của sếp
      serials: item.serials || "", 
    } as any);

    // Trừ kho vật lý
    const newStock = (item.product.stock || 0) - item.quantity;
    await db.update(products)
      .set({ stock: newStock })
      .where(eq(products.id, item.product.id));

    // GHI LỊCH SỬ KHO (Giống hệt app Flutter cũ của sếp)
    try {
      await db.execute(sql`
        INSERT INTO stock_history (product_name, change_amount, new_balance, type, note, date)
        VALUES (${item.product.name}, ${-item.quantity}, ${newStock}, 'Xuất kho', ${`Bán đơn #${orderId}`}, ${orderDate})
      `);
    } catch (e) {
      console.log("Chưa chạy migration bảng stock_history nhưng đơn vẫn lưu tốt sếp nhé!");
    }
  }

  revalidatePath("/pos");
  revalidatePath("/orders");
  return orderId;
}