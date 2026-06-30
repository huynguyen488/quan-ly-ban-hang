// app/orders/page.tsx
import { db } from "../../src/db";
import { orders, products, orderItems } from "../../src/db/schema";
import { desc } from "drizzle-orm";
import OrderClient from "./OrderClient";

export default async function OrdersPage() {
  // Lấy toàn bộ Đơn hàng, Sản phẩm gốc và Chi tiết các món đã bán
  const allOrders = await db.select().from(orders).orderBy(desc(orders.date));
  const allProducts = await db.select().from(products).orderBy(desc(products.id));
  const allOrderItems = await db.select().from(orderItems);

  // Thuật toán nhét chi tiết món ăn vào bụng từng đơn hàng
  const enrichedOrders = allOrders.map(order => {
    const itemsOfThisOrder = allOrderItems.filter(item => item.order_id === order.id);
    return { ...order, items: itemsOfThisOrder };
  });

  // Ném toàn bộ data đã được làm giàu sang Client
  return <OrderClient initialOrders={enrichedOrders} initialProducts={allProducts} />;
}