// app/page.tsx
import { db } from "../src/db";
import { orders, products, customers } from "../src/db/schema";
import { desc, eq } from "drizzle-orm";
import Link from "next/link";
import { Toaster } from 'react-hot-toast';

// Vô hiệu hóa cache để Dashboard luôn hiển thị số liệu mới nhất mỗi khi sếp F5
export const revalidate = 0;

export default async function Dashboard() {
  // 1. KÉO DỮ LIỆU TỪ DATABASE TURSO
  const allOrders = await db.select().from(orders).orderBy(desc(orders.date));
  const allProducts = await db.select().from(products);
  const allCustomers = await db.select().from(customers);

  // 2. TÍNH TOÁN CÁC CHỈ SỐ QUAN TRỌNG
  const totalProducts = allProducts.length;
  const totalCustomers = allCustomers.length;
  const totalOrdersCount = allOrders.length;

  // Tính tổng doanh thu (Chỉ cộng những đơn không bị Hủy)
  const totalRevenue = allOrders.reduce((sum, order) => {
    const status = String(order.status || "").toLowerCase();
    if (!status.includes("hủy") && !status.includes("cancel")) {
      return sum + (order.total_price || 0);
    }
    return sum;
  }, 0);

  // Lọc sản phẩm sắp hết hàng (Tồn kho <= Mức tối thiểu)
  const lowStockProducts = allProducts.filter(p => (p.stock || 0) <= (p.min_stock || 10));

  // Lấy 5 đơn hàng gần nhất
  const recentOrders = allOrders.slice(0, 5);

  // Hàm định dạng tiền tệ VNĐ
  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      <Toaster position="top-right" />
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">Tổng Quan Hệ Thống</h1>
        <p className="text-slate-500 mt-2">Cập nhật số liệu kinh doanh mới nhất của cửa hàng</p>
      </div>

      {/* 4 THẺ CHỈ SỐ (METRICS CARDS) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Thẻ Doanh Thu */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
          <span className="text-sm font-semibold text-slate-500 mb-2 uppercase">Tổng Doanh Thu</span>
          <span className="text-3xl font-bold text-blue-600">{formatMoney(totalRevenue)}</span>
        </div>

        {/* Thẻ Đơn Hàng */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
          <span className="text-sm font-semibold text-slate-500 mb-2 uppercase">Tổng Đơn Hàng</span>
          <span className="text-3xl font-bold text-emerald-500">{totalOrdersCount} <span className="text-lg font-medium text-slate-400">đơn</span></span>
        </div>

        {/* Thẻ Sản Phẩm */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
          <span className="text-sm font-semibold text-slate-500 mb-2 uppercase">Mặt Hàng Đang Bán</span>
          <span className="text-3xl font-bold text-amber-500">{totalProducts} <span className="text-lg font-medium text-slate-400">sản phẩm</span></span>
        </div>

        {/* Thẻ Khách Hàng */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
          <span className="text-sm font-semibold text-slate-500 mb-2 uppercase">Tổng Khách Hàng</span>
          <span className="text-3xl font-bold text-purple-500">{totalCustomers} <span className="text-lg font-medium text-slate-400">khách</span></span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* BẢNG ĐƠN HÀNG GẦN NHẤT */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-800">Đơn Hàng Gần Đây</h2>
            <Link href="/orders" className="text-sm text-blue-600 hover:underline font-medium">Xem tất cả</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-500 text-sm">
                <tr>
                  <th className="p-4 font-semibold">Mã Đơn</th>
                  <th className="p-4 font-semibold">Khách Hàng</th>
                  <th className="p-4 font-semibold">Ngày Tạo</th>
                  <th className="p-4 font-semibold text-right">Tổng Tiền</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentOrders.length > 0 ? (
                  recentOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4 font-medium text-slate-700">{order.id}</td>
                      <td className="p-4 text-slate-600">{order.customer_name || "Khách lẻ"}</td>
                      <td className="p-4 text-slate-500 text-sm">{order.date}</td>
                      <td className="p-4 font-bold text-blue-600 text-right">{formatMoney(order.total_price || 0)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-slate-400">Chưa có đơn hàng nào.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* CẢNH BÁO HẾT HÀNG */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-100">
            <h2 className="text-lg font-bold text-red-500 flex items-center gap-2">
              ⚠️ Cảnh Báo Sắp Hết Hàng
            </h2>
          </div>
          <div className="p-6 flex-1 overflow-y-auto max-h-[400px]">
            {lowStockProducts.length > 0 ? (
              <ul className="space-y-4">
                {lowStockProducts.map((product) => (
                  <li key={product.id} className="flex justify-between items-center p-3 bg-red-50 rounded-xl border border-red-100">
                    <div>
                      <p className="font-semibold text-slate-700">{product.name}</p>
                      <p className="text-xs text-slate-500 mt-1">Mức tối thiểu: {product.min_stock || 10}</p>
                    </div>
                    <div className="text-right">
                      <span className="inline-block px-3 py-1 bg-red-500 text-white font-bold rounded-lg text-sm">
                        Còn {product.stock}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 py-10">
                <span className="text-4xl mb-2">📦</span>
                <p>Kho hàng đang dồi dào!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}