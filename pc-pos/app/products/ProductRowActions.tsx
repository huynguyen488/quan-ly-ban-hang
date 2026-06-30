// app/products/ProductRowActions.tsx
"use client";

import { useState } from "react";
import { Edit, Trash2, X, Save, Loader2 } from "lucide-react";
import { updateProduct, deleteProduct } from "./actions"; // Đảm bảo sếp có 2 hàm này trong file actions.ts

export default function ProductRowActions({ 
  product, 
  uniqueCategories = [], 
  uniqueUnits = [] 
}: { 
  product: any; 
  uniqueCategories?: string[]; 
  uniqueUnits?: string[]; 
}) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleDelete = async () => {
    const confirm = window.confirm(`⚠️ Bạn có chắc muốn xóa vĩnh viễn sản phẩm "${product.name}"?`);
    if (!confirm) return;
    
    setIsDeleting(true);
    try {
      await deleteProduct(product.id);
    } catch (error) {
      alert("Lỗi khi xóa sản phẩm!");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div className="flex items-center justify-center gap-2">
        <button 
          onClick={() => setIsEditOpen(true)}
          className="p-1.5 text-blue-500 hover:bg-blue-100 rounded-md transition-colors"
          title="Chỉnh sửa"
        >
          <Edit className="w-4 h-4" />
        </button>
        <button 
          onClick={handleDelete}
          disabled={isDeleting}
          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
          title="Xóa sản phẩm"
        >
          {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
        </button>
      </div>

      {/* ================= POPUP SỬA SẢN PHẨM MƯỢT MÀ ================= */}
      {isEditOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-xl w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95 duration-150 text-left">
            <div className="flex justify-between items-center mb-5 border-b pb-3">
              <h2 className="text-xl font-bold text-gray-800">Cập Nhật Sản Phẩm</h2>
              <button onClick={() => setIsEditOpen(false)} className="text-gray-400 hover:text-red-500 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form action={async (formData) => {
              setIsUpdating(true);
              try {
                await updateProduct(product.id, formData);
                setIsEditOpen(false);
              } catch (e) {
                alert("Gặp lỗi khi lưu cập nhật!");
              } finally {
                setIsUpdating(false);
              }
            }} className="flex flex-col gap-4">
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Tên sản phẩm *</label>
                <input 
                  required type="text" name="name" defaultValue={product.name} 
                  className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium" 
                />
              </div>

              <div className="flex gap-4">
                {/* 🔥 VŨ KHÍ BÍ MẬT: DROPDOWN DANH MỤC THÔNG MINH BẰNG DATALIST */}
                <div className="w-1/2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Danh mục</label>
                  <input 
                    type="text" 
                    name="category" 
                    list={`edit-categories-${product.id}`}
                    defaultValue={product.category}
                    placeholder="Chọn hoặc tự gõ..." 
                    className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium"
                  />
                  <datalist id={`edit-categories-${product.id}`}>
                    {uniqueCategories.map((cat, idx) => <option key={idx} value={cat} />)}
                  </datalist>
                </div>

                {/* DROPDOWN ĐƠN VỊ TÍNH */}
                <div className="w-1/2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Đơn vị tính</label>
                  <input 
                    type="text" 
                    name="unit" 
                    list={`edit-units-${product.id}`}
                    defaultValue={product.unit || 'Cái'} 
                    className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium"
                  />
                  <datalist id={`edit-units-${product.id}`}>
                    {uniqueUnits.map((un, idx) => <option key={idx} value={un} />)}
                  </datalist>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-1/2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Giá bán (VNĐ) *</label>
                  <input required type="number" name="price_sell" defaultValue={product.price_sell} className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-bold text-blue-600 text-sm" />
                </div>
                <div className="w-1/2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Giá vốn (VNĐ)</label>
                  <input type="number" name="price_import" defaultValue={product.price_import} className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-medium text-gray-600 text-sm" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Tồn kho hiện tại</label>
                <input required type="number" name="stock" defaultValue={product.stock} className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-bold text-emerald-700 text-sm" />
              </div>

              <div className="flex justify-end gap-3 mt-4 pt-4 border-t">
                <button type="button" onClick={() => setIsEditOpen(false)} className="px-5 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium text-sm transition-colors">
                  Hủy
                </button>
                <button type="submit" disabled={isUpdating} className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm transition-colors flex items-center gap-2 shadow-md">
                  {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Lưu Thay Đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}