// app/products/ProductClient.tsx
"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import ProductModal from "./ProductModal";
import ProductRowActions from "./ProductRowActions";

const CATEGORY_COLORS = [
  "bg-blue-50 text-blue-700 border-blue-200",
  "bg-purple-50 text-purple-700 border-purple-200",
  "bg-amber-50 text-amber-700 border-amber-200",
  "bg-teal-50 text-teal-700 border-teal-200",
  "bg-rose-50 text-rose-700 border-rose-200",
  "bg-indigo-50 text-indigo-700 border-indigo-200",
  "bg-emerald-50 text-emerald-700 border-emerald-200",
  "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200",
];

const getCategoryStyle = (category: string | null) => {
  if (!category || category === "Chưa phân loại" || category.trim() === "") {
    return "bg-gray-50 text-gray-600 border-gray-200"; 
  }
  let hash = 0;
  for (let i = 0; i < category.length; i++) {
    hash = category.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % CATEGORY_COLORS.length;
  return CATEGORY_COLORS[index];
};

export default function ProductClient({ initialProducts }: { initialProducts: any[] }) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredProducts = initialProducts.filter((product) =>
    product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.id?.toString().includes(searchTerm)
  );

  // 🔥 TỰ ĐỘNG GOM DANH SÁCH DANH MỤC VÀ ĐƠN VỊ TÍNH ĐỘC NHẤT
  const uniqueCategories = Array.from(new Set(initialProducts.map(p => p.category).filter(Boolean))) as string[];
  const uniqueUnits = Array.from(new Set(initialProducts.map(p => p.unit).filter(Boolean))) as string[];

  return (
    <div className="p-6 h-full flex flex-col bg-gray-50/50">
      
      {/* KHU VỰC ĐIỀU HƯỚNG */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-5 bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-blue-900 border-r-2 pr-4 border-gray-200">
            Sản Phẩm
          </h1>
          <p className="text-gray-500 text-sm font-medium">
            Tổng số: <span className="font-bold text-blue-600">{filteredProducts.length}</span> sản phẩm
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Tìm kiếm theo mã hoặc tên..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white transition-all duration-150"
            />
          </div>
          <ProductModal existingProducts={initialProducts} />
        </div>
      </div>

      {/* BẢNG DANH SÁCH SẢN PHẨM */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex-1">
        <div className="overflow-x-auto max-h-[calc(100vh-200px)]">
          <table className="w-full text-left text-sm text-gray-600 relative border-collapse">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-700 font-semibold sticky top-0 z-10 shadow-sm whitespace-nowrap">
              <tr>
                <th className="px-6 py-4 text-center w-20">Mã</th>
                <th className="px-6 py-4 w-1/3 min-w-[280px]">Tên sản phẩm</th>
                <th className="px-6 py-4 text-center">Danh mục</th>
                <th className="px-6 py-4 text-right">Giá vốn</th>
                <th className="px-6 py-4 text-right">Giá bán</th>
                <th className="px-6 py-4 text-center">Tồn kho</th>
                <th className="px-6 py-4 text-center w-36">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {filteredProducts.length > 0 ? (
                filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-blue-50/40 even:bg-gray-50/30 transition-colors duration-150">
                    <td className="px-6 py-3.5 text-gray-400 text-center whitespace-nowrap">#{product.id}</td>
                    <td className="px-6 py-3.5 font-medium text-gray-900">
                      <div className="line-clamp-2 leading-relaxed" title={product.name || ''}>
                        {product.name}
                      </div>
                    </td>
                    
                    <td className="px-6 py-3.5 text-center whitespace-nowrap">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${getCategoryStyle(product.category)}`}>
                        {product.category || 'Chưa phân loại'}
                      </span>
                    </td>
                    
                    <td className="px-6 py-3.5 text-right text-gray-500 font-medium whitespace-nowrap">
                      {product.price_import?.toLocaleString('vi-VN')} đ
                    </td>
                    <td className="px-6 py-3.5 text-right text-blue-600 font-bold whitespace-nowrap">
                      {product.price_sell?.toLocaleString('vi-VN')} đ
                    </td>
                    <td className="px-6 py-3.5 text-center whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold inline-block min-w-[75px] ${
                        (product.stock ?? 0) > 0 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {product.stock ?? 0} {product.unit || 'Cái'}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-center">
                      {/* 🔥 ĐÃ TRUYỀN DANH MỤC VÀ ĐƠN VỊ TÍNH VÀO ĐÂY ĐỂ POPUP SỬA XÀI */}
                      <ProductRowActions 
                        product={product} 
                        uniqueCategories={uniqueCategories} 
                        uniqueUnits={uniqueUnits} 
                      />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500 font-medium">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Search className="w-8 h-8 text-gray-300" />
                      <p>Không tìm thấy sản phẩm nào khớp với từ khóa "<span className="font-bold text-gray-700">{searchTerm}</span>"</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}