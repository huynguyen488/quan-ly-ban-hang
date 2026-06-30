// app/categories/CategoryClient.tsx
"use client";

import { useState } from "react";
import { PlusCircle, Edit, Trash2, X, Loader2, Save, ListTree, Package, Plus, Search, Layers } from "lucide-react";
import { createCategory, updateCategory, deleteAndMergeCategory, updateProductCategory } from "./actions";

export default function CategoryClient({ 
  initialCategories, 
  allProducts = []
}: { 
  initialCategories: any[]; 
  allProducts?: any[];
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  // State quản lý Popup Thêm/Sửa danh mục
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  // State quản lý Xem sản phẩm & Gộp nhóm vĩnh viễn
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  
  // State popup xác nhận gộp/chuyển hàng loạt khi xóa danh mục
  const [isMergeOpen, setIsMergeOpen] = useState(false);
  const [categoryToMerge, setCategoryToMerge] = useState<any>(null);
  const [mergeTarget, setMergeTarget] = useState<string>("Chưa phân loại");

  // Bộ lọc tìm kiếm danh mục nhanh
  const filteredCategories = initialCategories.filter(cat => 
    cat.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenAdd = () => {
    setEditingId(null);
    setName("");
    setDescription("");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cat: any) => {
    setEditingId(cat.id);
    setName(cat.name || "");
    setDescription(cat.description || "");
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!name.trim()) return alert("Tên danh mục không được để trống!");
    setIsLoading(true);
    try {
      if (editingId) {
        await updateCategory(editingId, name, description);
        alert("✅ Đã cập nhật danh mục!");
      } else {
        await createCategory(name, description);
        alert("✅ Đã thêm danh mục mới!");
      }
      setIsModalOpen(false);
    } catch (e) {
      alert("Lỗi lưu danh mục!");
    } finally {
      setIsLoading(false);
    }
  };

  // KÍCH HOẠT MÀN HÌNH BẢO VỆ GỘP NHÓM KHI XOÁ
  const triggerDeleteWithMerge = (cat: any) => {
    if (cat.productCount === 0) {
      const confirm = window.confirm(`⚠️ Bạn có chắc muốn xóa vĩnh viễn danh mục "${cat.name}" không?`);
      if (confirm) executeMergeDelete(cat.name, null);
    } else {
      setCategoryToMerge(cat);
      setMergeTarget("Chưa phân loại");
      setIsMergeOpen(true);
    }
  };

  const executeMergeDelete = async (oldName: string, targetName: string | null) => {
    setIsLoading(true);
    try {
      await deleteAndMergeCategory(oldName, targetName);
      alert(`✅ Đã xử lý hoàn tất nhóm hàng!`);
      setIsMergeOpen(false);
      setIsDetailOpen(false);
    } catch (e) {
      alert("Lỗi xử lý hệ thống danh mục!");
    } finally {
      setIsLoading(false);
    }
  };

  // Hàm mở popup quản lý sản phẩm chi tiết của từng danh mục
  const handleViewProducts = (cat: any) => {
    setSelectedCategory(cat);
    setIsDetailOpen(true);
    setIsAddingProduct(false);
  };

  // Lọc sản phẩm
  const productsInCategory = allProducts.filter(p => p.category === selectedCategory?.name);
  const unassignedProducts = allProducts.filter(p => !p.category || p.category === "Chưa phân loại" || p.category.trim() === "");

  // Gắn sản phẩm vào danh mục
  const handleAddProductToCategory = async (productId: number) => {
    setIsLoading(true);
    try {
      await updateProductCategory(productId, selectedCategory.name);
      alert("✅ Đã thêm sản phẩm vào danh mục!");
    } catch (err) {
      alert("Lỗi khi thêm sản phẩm vào danh mục!");
    } finally {
      setIsLoading(false);
    }
  };

  // Xóa sản phẩm khỏi danh mục (chuyển về Chưa phân loại)
  const handleRemoveProductFromCategory = async (productId: number) => {
    const confirm = window.confirm("⚠️ Bạn có chắc muốn đưa sản phẩm này về trạng thái 'Chưa phân loại' không?");
    if (!confirm) return;
    
    setIsLoading(true);
    try {
      await updateProductCategory(productId, "Chưa phân loại");
    } catch (err) {
      alert("Lỗi khi gỡ sản phẩm khỏi danh mục!");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 h-full flex flex-col bg-slate-50 font-sans text-sm animate-in fade-in duration-200">
      
      {/* 1. THANH TÌM KIẾM & ĐIỀU HƯỚNG */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-5 bg-white px-5 py-3.5 rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-center gap-3">
          <ListTree className="w-5 h-5 text-pink-600" />
          <h1 className="text-base font-bold text-blue-900 border-r-2 border-gray-100 pr-4">Quản Lý Danh Mục</h1>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" placeholder="Tìm kiếm nhóm hàng..." value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white transition-all" 
            />
          </div>
          <button onClick={handleOpenAdd} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-1.5 shadow-sm transition-colors whitespace-nowrap">
            <PlusCircle className="w-4 h-4" /> Thêm Danh Mục
          </button>
        </div>
      </div>

      {/* 2. LƯỚI DANH SÁCH CÁC NHÓM HÀNG */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 flex-1 content-start overflow-y-auto custom-scrollbar pr-1">
        {filteredCategories.map((cat) => (
          <div key={cat.id} className="bg-white p-4 rounded-2xl border border-gray-200/60 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
            <div>
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-extrabold text-gray-800 text-sm line-clamp-1 tracking-wide">{cat.name}</h3>
                <button 
                  onClick={() => handleViewProducts(cat)}
                  className="bg-blue-50 text-blue-600 px-2.5 py-0.5 rounded-full text-[10px] font-black border border-blue-100 hover:bg-blue-100 transition-colors inline-flex items-center gap-1 tracking-tight"
                  title="Xem kho hàng linh kiện chi tiết"
                >
                  <Package className="w-3 h-3" /> {cat.productCount} SP
                </button>
              </div>
              <p className="text-xs text-gray-500 mb-4 line-clamp-2 h-8 leading-relaxed">
                {cat.description || "Chưa có mô tả nhóm hàng"}
              </p>
            </div>
            <div className="flex justify-end gap-2 border-t border-gray-50 pt-3">
              <button onClick={() => handleOpenEdit(cat)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-xl transition-colors border border-transparent hover:border-blue-100">
                <Edit className="w-4 h-4" />
              </button>
              <button onClick={() => triggerDeleteWithMerge(cat)} disabled={isLoading} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors border border-transparent hover:border-red-100">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
        {filteredCategories.length === 0 && (
          <div className="col-span-full py-16 text-center text-gray-400 font-bold tracking-wider">Không tìm thấy nhóm hàng nào!</div>
        )}
      </div>

      {/* POPUP FORM THÊM / SỬA */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-150 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-base font-bold text-gray-800 flex items-center gap-1.5">
                <ListTree className="w-5 h-5 text-pink-600" />
                {editingId ? "Sửa Nhóm Hàng" : "Thêm Nhóm Hàng"}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-red-500 p-1 rounded-lg hover:bg-gray-100 transition-colors"><X className="w-5 h-5" /></button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1.5">Tên danh mục <span className="text-red-500">*</span></label>
                <input 
                  type="text" autoFocus placeholder="VD: Linh kiện máy tính" value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-blue-500 transition-all font-medium" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1.5">Mô tả nhóm</label>
                <textarea 
                  rows={2} placeholder="Vài nét về nhóm hàng này..." value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-blue-500 transition-all resize-none font-medium" 
                />
              </div>
            </div>

            <div className="px-5 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
              <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 font-bold text-xs transition-colors">Hủy bỏ</button>
              <button onClick={handleSave} disabled={isLoading} className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold text-xs shadow-md transition-all flex items-center gap-1.5">{isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}Lưu danh mục</button>
            </div>
          </div>
        </div>
      )}

      {/* ================= POPUP QUẢN LÝ SẢN PHẨM TRONG DANH MỤC (HIỂN THỊ ĐỦ GIÁ NHẬP, GIÁ BÁN, ẨN TỒN KHO) ================= */}
      {isDetailOpen && selectedCategory && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col h-[75vh] animate-in fade-in zoom-in-95 duration-150 overflow-hidden">
            
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 bg-gray-50/50 shrink-0">
              <div>
                <h2 className="text-base font-extrabold text-gray-800 tracking-wide">
                  Sản phẩm thuộc nhóm: <span className="text-pink-600">{selectedCategory.name}</span>
                </h2>
                <p className="text-[10px] text-gray-400 mt-0.5 tracking-wide">Hiển thị giá nhập, giá bán và cho phép gán/gỡ sản phẩm</p>
              </div>
              
              <div className="flex items-center gap-2">
                {!isAddingProduct ? (
                  <button 
                    onClick={() => setIsAddingProduct(true)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors shadow-sm"
                  >
                    <Plus className="w-4 h-4" /> Thêm sản phẩm vào danh mục
                  </button>
                ) : (
                  <button 
                    onClick={() => setIsAddingProduct(false)}
                    className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors shadow-sm"
                  >
                    Quay lại danh sách
                  </button>
                )}
                
                <button onClick={() => setIsDetailOpen(false)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-gray-100 rounded-lg transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Body Bảng sản phẩm */}
            <div className="flex-1 overflow-y-auto custom-scrollbar bg-white">
              {!isAddingProduct ? (
                // DANH SÁCH SẢN PHẨM HIỆN TẠI TRONG DANH MỤC
                <table className="w-full text-left text-xs text-gray-600 border-collapse">
                  <thead className="bg-gray-50 border-b border-gray-100 text-gray-700 font-bold sticky top-0 z-10 shadow-sm">
                    <tr>
                      <th className="px-5 py-3 w-16 text-center">Mã SP</th>
                      <th className="px-5 py-3 min-w-[180px]">Tên sản phẩm</th>
                      <th className="px-5 py-3 text-right w-28">Giá nhập</th>
                      <th className="px-5 py-3 text-right w-28">Giá bán</th>
                      <th className="px-5 py-3 text-center w-20">Xóa khỏi DM</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {productsInCategory.length > 0 ? (
                      productsInCategory.map((prod) => (
                        <tr key={prod.id} className="hover:bg-gray-50/80 transition-colors">
                          <td className="px-5 py-3.5 text-center font-mono font-bold text-gray-400">#{prod.id}</td>
                          <td className="px-5 py-3.5 font-bold text-gray-800 leading-snug">{prod.name}</td>
                          <td className="px-5 py-3.5 text-right font-medium text-gray-500 font-mono tracking-tight">
                            {prod.price_import?.toLocaleString('vi-VN')} đ
                          </td>
                          <td className="px-5 py-3.5 text-right font-black text-blue-600 font-mono tracking-tight text-sm">
                            {prod.price_sell?.toLocaleString('vi-VN')} đ
                          </td>
                          <td className="px-5 py-3.5 text-center">
                            <button 
                              onClick={() => handleRemoveProductFromCategory(prod.id)}
                              disabled={isLoading}
                              className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors inline-block"
                              title="Bỏ sản phẩm khỏi danh mục"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="px-6 py-16 text-center text-gray-400 font-medium">
                          Chưa có sản phẩm nào thuộc nhóm hàng này!
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              ) : (
                // MÀN HÌNH CHỌN SẢN PHẨM ĐỂ THÊM VÀO
                <div className="p-4">
                  <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl mb-4 text-emerald-800 text-xs font-bold">
                    📌 Chọn các sản phẩm chưa phân loại dưới đây để gán vào danh mục: {selectedCategory.name}
                  </div>
                  
                  <table className="w-full text-left text-xs text-gray-600 border-collapse">
                    <thead className="bg-gray-50 border-b border-gray-100 text-gray-700 font-bold">
                      <tr>
                        <th className="px-4 py-2 w-16 text-center">Mã SP</th>
                        <th className="px-4 py-2">Tên sản phẩm</th>
                        <th className="px-4 py-2 text-right w-24">Giá bán</th>
                        <th className="px-4 py-2 text-center w-20">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {unassignedProducts.length > 0 ? (
                        unassignedProducts.map((prod) => (
                          <tr key={prod.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 font-mono text-center font-bold text-gray-400">#{prod.id}</td>
                            <td className="px-4 py-3 font-bold text-gray-800">{prod.name}</td>
                            <td className="px-4 py-3 text-right font-black text-blue-600 font-mono tracking-tight">
                              {prod.price_sell?.toLocaleString('vi-VN')} đ
                            </td>
                            <td className="px-4 py-3 text-center">
                              <button 
                                onClick={() => handleAddProductToCategory(prod.id)}
                                disabled={isLoading}
                                className="bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1 rounded-lg font-bold text-xs inline-flex items-center gap-1 shadow-sm transition-colors"
                              >
                                <Plus className="w-3.5 h-3.5" /> Thêm
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="px-6 py-12 text-center text-gray-400 font-medium">
                            Tất cả sản phẩm trong hệ thống đều đã được xếp vào danh mục!
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end shrink-0">
              <button onClick={() => setIsDetailOpen(false)} className="px-5 py-2 text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 font-bold text-xs transition-colors shadow-sm">
                Đóng bảng
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ================= POPUP BẢO VỆ GỘP / CHUYỂN NHÓM KHI XÓA ================= */}
      {isMergeOpen && categoryToMerge && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-2xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-2.5 text-red-600 border-b border-gray-100 pb-3 mb-4">
              <Layers className="w-6 h-6" />
              <h3 className="font-bold text-base tracking-wide">Gộp / Chuyển Nhóm Hàng Loạt</h3>
            </div>
            
            <p className="text-xs text-gray-500 mb-3 leading-relaxed tracking-wide">
              Bạn đang xóa nhóm hàng: <strong className="text-pink-600">{categoryToMerge.name}</strong>. Nhóm này hiện vẫn còn chứa <strong className="text-blue-600">{categoryToMerge.productCount} sản phẩm</strong>.
            </p>
            <p className="text-xs font-bold text-gray-700 mb-4">Vui lòng chọn đích đến cho các mặt hàng này trước khi xóa nhóm:</p>
            
            <div className="space-y-3.5 text-xs font-sans">
              <select 
                value={mergeTarget} 
                onChange={(e) => setMergeTarget(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 outline-none font-bold text-blue-700 bg-gray-50 focus:bg-white focus:ring-1 focus:ring-blue-500"
              >
                <option value="Chưa phân loại">Chuyển toàn bộ sản phẩm về trạng thái: Chưa phân loại</option>
                <option disabled className="text-gray-400">--- Hoặc chuyển sang danh mục khác ---</option>
                {initialCategories
                  .filter(c => c.name !== categoryToMerge.name)
                  .map(c => <option key={c.id} value={c.name}>Gộp sang danh mục: {c.name}</option>)
                }
              </select>
            </div>
            
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100 text-xs">
              <button onClick={() => setIsMergeOpen(false)} className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 font-bold transition-colors">Hủy bỏ</button>
              <button onClick={() => executeMergeDelete(categoryToMerge.name, mergeTarget)} disabled={isLoading} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-bold shadow-md transition-colors flex items-center gap-1">
                {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                Xác nhận gộp & Xóa
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}