import { db } from "../src/db";
import { products, customers } from "../src/db/schema";
import { Toaster } from 'react-hot-toast';

// trong layout.tsx hoặc page.tsx
<Toaster position="top-right" />

// Đây là một Server Component - Nó chạy code trực tiếp trên Server cực kỳ bảo mật
export default async function Home() {
  // Lấy thử dữ liệu từ 2 bảng
  const allProducts = await db.select().from(products);
  const allCustomers = await db.select().from(customers);

  return (
    <main className="p-10 bg-slate-50 min-h-screen">
      <h1 className="text-3xl font-bold text-blue-900 mb-6">
        Hệ Thống Quản Lý Bán Hàng 24/7
      </h1>
      
      <div className="flex gap-6">
        <div className="p-6 bg-white border rounded-xl shadow-sm w-64">
          <h2 className="text-gray-500 font-semibold mb-2">Tổng Sản Phẩm</h2>
          <p className="text-4xl font-black text-blue-600">{allProducts.length}</p>
        </div>

        <div className="p-6 bg-white border rounded-xl shadow-sm w-64">
          <h2 className="text-gray-500 font-semibold mb-2">Tổng Khách Hàng</h2>
          <p className="text-4xl font-black text-purple-600">{allCustomers.length}</p>
        </div>
      </div>
      
      <p className="mt-8 text-green-600 font-medium">
        ✅ Nếu màn hình này hiện ra không bị lỗi tức là Next.js đã kết nối Turso thành công rực rỡ!
      </p>
    </main>
  );
}