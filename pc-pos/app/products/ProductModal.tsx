// app/products/ProductModal.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { addProduct } from "./actions";

export default function ProductModal({ existingProducts = [] }: { existingProducts?: any[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Tự động lọc ra danh sách các Danh mục và Đơn vị tính độc nhất đang có trong kho
  const uniqueCategories = Array.from(new Set(existingProducts.map(p => p.category).filter(Boolean)));
  const uniqueUnits = Array.from(new Set(existingProducts.map(p => p.unit).filter(Boolean)));

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const suggestions = existingProducts.filter((p) =>
    p.name?.toLowerCase().includes(nameInput.toLowerCase())
  );

  const isDuplicate = existingProducts.some(
    (p) => p.name?.toLowerCase().trim() === nameInput.toLowerCase().trim()
  );

  const handleClose = () => {
    setIsOpen(false);
    setNameInput("");
    setShowSuggestions(false);
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2 shadow-sm text-sm transition-colors whitespace-nowrap"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
        Thêm Sản Phẩm
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-xl w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center mb-5 border-b pb-3">
              <h2 className="text-xl font-bold text-gray-800">Thêm Sản Phẩm</h2>
              <button onClick={handleClose} className="text-gray-400 hover:text-red-500 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            </div>
            
            <form action={async (formData) => {
              await addProduct(formData);
              handleClose();
            }} className="flex flex-col gap-4">
              
              {/* Tên sản phẩm & Kiểm tra trùng */}
              <div className="relative" ref={wrapperRef}>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Tên sản phẩm *</label>
                <input 
                  required 
                  type="text" 
                  name="name" 
                  autoComplete="off"
                  value={nameInput}
                  onChange={(e) => {
                    setNameInput(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  placeholder="VD: Bàn phím cơ DareU..." 
                  className={`w-full border px-3 py-2 rounded-lg outline-none transition-all font-medium ${
                    isDuplicate && nameInput 
                      ? 'border-red-500 focus:ring-red-500 bg-red-50 text-red-900' 
                      : 'border-gray-300 focus:ring-blue-500 text-gray-900'
                  }`} 
                />

                {isDuplicate && nameInput && (
                  <p className="text-xs text-red-600 mt-1.5 font-bold flex items-center gap-1">
                    Tên này đã tồn tại trong kho! Vui lòng đổi tên khác.
                  </p>
                )}

                {showSuggestions && nameInput && suggestions.length > 0 && !isDuplicate && (
                  <ul className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-42 overflow-y-auto divide-y divide-gray-100">
                    <li className="px-3 py-1 bg-blue-50 text-xs font-semibold text-blue-700 sticky top-0">Sản phẩm tương tự đang có:</li>
                    {suggestions.map((p) => (
                      <li key={p.id} onClick={() => { setNameInput(p.name); setShowSuggestions(false); }} className="px-3 py-2 hover:bg-gray-50 cursor-pointer text-sm text-gray-800 flex justify-between items-center">
                        <span className="truncate font-medium">{p.name}</span>
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded border">Tồn: {p.stock}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Ô CHỌN DANH MỤC VÀ ĐƠN VỊ TÍNH THÔNG MINH */}
              <div className="flex gap-4">
                <div className="w-1/2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Danh mục</label>
                  <input 
                    type="text" 
                    name="category" 
                    list="categories" 
                    placeholder="Chọn hoặc tự gõ..." 
                    className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm font-medium"
                  />
                  <datalist id="categories">
                    {uniqueCategories.map((cat, idx) => <option key={idx} value={cat} />)}
                  </datalist>
                </div>

                <div className="w-1/2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Đơn vị tính</label>
                  <input 
                    type="text" 
                    name="unit" 
                    list="units" 
                    defaultValue="Cái" 
                    className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm font-medium"
                  />
                  <datalist id="units">
                    {uniqueUnits.map((un, idx) => <option key={idx} value={un} />)}
                  </datalist>
                </div>
              </div>

              {/* Giá cả */}
              <div className="flex gap-4">
                <div className="w-1/2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Giá bán (VNĐ) *</label>
                  <input required type="number" name="price_sell" placeholder="0" className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold text-blue-600 text-sm" />
                </div>
                <div className="w-1/2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Giá vốn (VNĐ)</label>
                  <input type="number" name="price_import" defaultValue="0" className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium text-gray-600 text-sm" />
                </div>
              </div>

              {/* Tồn kho */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Số lượng tồn kho ban đầu</label>
                <input required type="number" name="stock" defaultValue="0" className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold text-emerald-700 text-sm" />
              </div>

              {/* Điều hướng */}
              <div className="flex justify-end gap-3 mt-4 pt-4 border-t">
                <button type="button" onClick={handleClose} className="px-5 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium transition-colors text-sm">
                  Hủy
                </button>
                <button 
                  type="submit"
                  disabled={isDuplicate && nameInput.length > 0}
                  className={`px-5 py-2 text-white rounded-lg font-medium text-sm transition-all ${
                    isDuplicate && nameInput.length > 0 ? 'bg-gray-400 cursor-not-allowed shadow-none' : 'bg-blue-600 hover:bg-blue-700 shadow-md'
                  }`}
                >
                  Lưu Sản Phẩm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}