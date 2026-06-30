// app/reports/page.tsx
import { db } from "../../src/db";
// 🔥 ĐÃ FIX: Đổi order_items thành orderItems theo đúng chuẩn export của file schema
import { orders, orderItems, receipts, products } from "../../src/db/schema"; 
import ReportClient from "./ReportClient";

export const revalidate = 0;

export default async function ReportsPage() {
  // Bốc toàn bộ dữ liệu cần thiết từ Database
  const allOrders = await db.select().from(orders);
  const allOrderItems = await db.select().from(orderItems); // 🔥 Sửa gọi bảng ở đây nữa
  const allReceipts = await db.select().from(receipts);
  const allProducts = await db.select().from(products);

  // Nhúng orderItems vào từng order để tính giá vốn và lợi nhuận
  const enrichedOrders = allOrders.map(order => {
    const itemsForOrder = allOrderItems.filter(item => item.order_id === order.id);
    return {
      ...order,
      items: itemsForOrder
    };
  });

  return (
    <ReportClient 
      initialOrders={enrichedOrders} 
      initialReceipts={allReceipts} 
      initialProducts={allProducts} 
    />
  );
}