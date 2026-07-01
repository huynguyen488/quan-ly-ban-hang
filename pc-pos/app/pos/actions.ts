// app/pos/actions.ts
"use server";

import { db } from "../../src/db";
import { orders, orderItems, products, customers } from "../../src/db/schema";
import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function quickAddCustomer(name: string, phone: string) {
  const newCus = await db.insert(customers).values({ name, phone }).returning({ id: customers.id });
  revalidatePath("/pos");
  revalidatePath("/customers");
  return newCus[0].id;
}

export async function createOrder(data: any) {
  const { cart, customerName, customerPhone, totalPrice, discount, paymentMethod, status, amountGiven, orderDate, note } = data;

  // 🔥 XỬ LÝ GHI CHÚ: Nối ghi chú tay của khách với thông tin dòng tiền
  const customNote = note ? `${note} | ` : "";
  const finalNote = `${customNote}Khách đưa: ${amountGiven} | CK: ${discount}`;

  // 🔥 TỰ TẠO MÃ ĐƠN HÀNG DUY NHẤT (Ví dụ: DH1720000123456)
  const newOrderId = `DH${Date.now()}`;

  // 1. TẠO ĐƠN HÀNG VÀO DATABASE
  const newOrder = await db.insert(orders).values({
    id: newOrderId, // 🔥 Fix triệt để lỗi thiếu ID của TypeScript
    customer_name: customerName,
    customer_phone: customerPhone,
    date: orderDate, // Dùng ngày giờ sếp chọn trên giao diện
    total_price: totalPrice,
    payment_method: paymentMethod,
    status: status,
    note: finalNote,
  }).returning({ id: orders.id });

  const orderId = newOrder[0].id;

  // 2. THÊM CHI TIẾT ĐƠN VÀ TRỪ TỒN KHO
  for (const item of cart) {
    await db.insert(orderItems).values({
      order_id: orderId.toString(),
      product_name: item.product.name,
      quantity: item.quantity,
      price: item.product.price_sell,
      price_import: item.product.price_import || 0,
      unit: item.product.unit || "Cái",
      serials: item.serials || "",
    } as any);

    const [prod] = await db.select().from(products).where(eq(products.id, item.product.id)).limit(1);
    if (prod) {
      const newStock = (prod.stock || 0) - (item.quantity || 0);
      await db.update(products).set({ stock: newStock }).where(eq(products.id, prod.id));

      // Ghi log lịch sử xuất kho (Dùng db.run chuẩn Turso)
      try {
        await db.run(sql`
          INSERT INTO stock_history (product_name, change_amount, new_balance, type, note, date)
          VALUES (${prod.name}, ${-(item.quantity || 0)}, ${newStock}, 'Xuất kho', ${`Bán đơn #${orderId}`}, ${orderDate})
        `);
      } catch(e) { console.error("Lỗi log kho:", e); }
    }
  }

  // Cập nhật lại giao diện ngay lập tức
  revalidatePath("/pos");
  revalidatePath("/orders");
  revalidatePath("/products");
  revalidatePath("/reports");

  return orderId;
}