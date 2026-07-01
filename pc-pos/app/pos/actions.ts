// actions.ts (Dùng chung cho cả POS và Orders)
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

export async function getOrderItems(orderId: string) {
  return await db.select().from(orderItems).where(eq(orderItems.order_id, orderId));
}

export async function verifyAdminAuth(username: string, password: string) {
  if (username.trim() === "admin" && password === "123456") return { success: true };
  return { success: false, message: "Sai tài khoản hoặc mật khẩu quản trị!" };
}

// ==========================================
// 1. TẠO ĐƠN HÀNG MỚI (TỐI ƯU SIÊU TỐC)
// ==========================================
export async function createOrder(data: any) {
  const { cart, customerName, customerPhone, totalPrice, discount, paymentMethod, status, amountGiven, orderDate, note } = data;

  const customNote = note ? `${note} | ` : "";
  const finalNote = `${customNote}Khách đưa: ${amountGiven} | CK: ${discount}`;
  const newOrderId = `DH${Date.now()}`;

  // 1. Tạo đơn (1 Query)
  await db.insert(orders).values({
    id: newOrderId,
    customer_name: customerName,
    customer_phone: customerPhone,
    date: orderDate,
    total_price: totalPrice,
    payment_method: paymentMethod,
    status: status,
    note: finalNote,
  });

  // 2. BULK INSERT: Nhét toàn bộ giỏ hàng vào DB trong 1 câu lệnh duy nhất (Cực nhanh)
  if (cart.length > 0) {
    const itemsToInsert = cart.map((item: any) => ({
      order_id: newOrderId,
      product_name: item.product.name,
      quantity: item.quantity,
      price: item.product.price_sell,
      price_import: item.product.price_import || 0,
      unit: item.product.unit || "Cái",
      serials: item.serials || "",
    }));
    await db.insert(orderItems).values(itemsToInsert as any);
  }

  // 3. PROMISE.ALL: Cập nhật tồn kho và ghi lịch sử SONG SONG
  const updatePromises = cart.map(async (item: any) => {
    const [prod] = await db.select().from(products).where(eq(products.id, item.product.id)).limit(1);
    if (prod) {
      const newStock = (prod.stock || 0) - (item.quantity || 0);
      await db.update(products).set({ stock: newStock }).where(eq(products.id, prod.id));
      await db.run(sql`
        INSERT INTO stock_history (product_name, change_amount, new_balance, type, note, date)
        VALUES (${prod.name}, ${-(item.quantity || 0)}, ${newStock}, 'Xuất kho', ${`Bán đơn #${newOrderId}`}, ${orderDate})
      `);
    }
  });
  
  // Đợi tất cả các query chạy song song hoàn tất
  await Promise.all(updatePromises);

  revalidatePath("/pos"); revalidatePath("/orders"); revalidatePath("/products");
  return newOrderId;
}

// ==========================================
// 2. SỬA ĐƠN HÀNG (TỐI ƯU SIÊU TỐC)
// ==========================================
export async function updateOrderComplete(orderId: string, updatedData: any) {
  const { cart, customerName, customerPhone, totalPrice, discount, paymentMethod, status, amountGiven, orderDate, note } = updatedData;

  const customNote = note ? `${note} | ` : "";
  const finalNote = `${customNote}Đã sửa đơn | Khách đưa: ${amountGiven} | CK: ${discount}`;

  // 1. HOÀN TRẢ KHO CŨ BẰNG PROMISE.ALL (Chạy song song)
  const oldItems = await db.select().from(orderItems).where(eq(orderItems.order_id, orderId));
  
  const rollbackPromises = oldItems.map(async (oldItem) => {
    const [prod] = await db.select().from(products).where(eq(products.name, oldItem.product_name as string)).limit(1);
    if (prod) {
      const rolledBackStock = (prod.stock || 0) + (oldItem.quantity || 0);
      await db.update(products).set({ stock: rolledBackStock }).where(eq(products.id, prod.id));
      await db.run(sql`
        INSERT INTO stock_history (product_name, change_amount, new_balance, type, note, date)
        VALUES (${prod.name}, ${oldItem.quantity || 0}, ${rolledBackStock}, 'Nhập kho', ${`Hoàn kho phục vụ sửa đơn #${orderId}`}, ${orderDate})
      `);
    }
  });
  await Promise.all(rollbackPromises);

  // 2. XÓA CŨ GHI MỚI CHI TIẾT ĐƠN HÀNG VÀ CẬP NHẬT ĐƠN (Chạy song song)
  await Promise.all([
    db.delete(orderItems).where(eq(orderItems.order_id, orderId)),
    db.update(orders).set({
      customer_name: customerName || "Khách vãng lai",
      customer_phone: customerPhone,
      date: orderDate,
      total_price: totalPrice,
      payment_method: paymentMethod,
      status: status,
      note: finalNote,
    }).where(eq(orders.id, orderId))
  ]);

  // 3. BULK INSERT CHI TIẾT ĐƠN MỚI
  if (cart.length > 0) {
    const newItemsToInsert = cart.map((item: any) => ({
      order_id: orderId,
      product_name: item.product.name,
      quantity: item.quantity,
      price: item.product.price_sell,
      price_import: item.product.price_import || 0,
      unit: item.product.unit || "Cái",
      serials: item.serials || "",
    }));
    await db.insert(orderItems).values(newItemsToInsert as any);
  }

  // 4. TRỪ KHO MỚI BẰNG PROMISE.ALL (Chạy song song)
  const applyNewStockPromises = cart.map(async (item: any) => {
    const [prod] = await db.select().from(products).where(eq(products.id, item.product.id)).limit(1);
    if (prod) {
      const finalStock = (prod.stock || 0) - (item.quantity || 0);
      await db.update(products).set({ stock: finalStock }).where(eq(products.id, prod.id));
      await db.run(sql`
        INSERT INTO stock_history (product_name, change_amount, new_balance, type, note, date)
        VALUES (${prod.name}, ${-(item.quantity || 0)}, ${finalStock}, 'Xuất kho', ${`Xuất kho sau khi sửa đơn #${orderId}`}, ${orderDate})
      `);
    }
  });
  await Promise.all(applyNewStockPromises);

  revalidatePath("/orders"); revalidatePath("/products"); revalidatePath("/reports");
  return { success: true };
}

// ==========================================
// 3. HỦY ĐƠN HÀNG (TỐI ƯU SIÊU TỐC)
// ==========================================
export async function deleteOrder(orderId: string) {
  const items = await db.select().from(orderItems).where(eq(orderItems.order_id, orderId));
  const nowStr = new Date().toLocaleString('vi-VN');
  
  // Chạy song song hoàn kho tất cả sản phẩm
  const deletePromises = items.map(async (item) => {
    const [prod] = await db.select().from(products).where(eq(products.name, item.product_name as string)).limit(1);
    if (prod) {
      const rolledBackStock = (prod.stock || 0) + (item.quantity || 0);
      await db.update(products).set({ stock: rolledBackStock }).where(eq(products.id, prod.id));
      await db.run(sql`
        INSERT INTO stock_history (product_name, change_amount, new_balance, type, note, date)
        VALUES (${prod.name}, ${item.quantity || 0}, ${rolledBackStock}, 'Nhập kho', ${`Hoàn trả kho do HỦY ĐƠN #${orderId}`}, ${nowStr})
      `);
    }
  });
  
  await Promise.all([
    ...deletePromises,
    db.update(orders).set({ status: "Đã hủy" }).where(eq(orders.id, orderId))
  ]);
  
  revalidatePath("/orders"); revalidatePath("/products"); revalidatePath("/reports");
  return { success: true };
}