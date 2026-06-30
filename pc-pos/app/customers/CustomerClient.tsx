// app/customers/CustomerClient.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation"; // 🔥 Thêm import router để điều hướng
import { Search, PlusCircle, Edit, Trash2, X, MapPin, Phone, User, Loader2, Save, AlertTriangle, ShieldCheck, Eye } from "lucide-react";
import { createCustomer, updateCustomer, deleteCustomer, verifyAdminAuth } from "./actions";

export default function CustomerClient({ initialCustomers }: { initialCustomers: any[] }) {
  const router = useRouter(); // 🔥 Kích hoạt router
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ name: "", phone: "", address: "", note: "" });

  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [adminUser, setAdminUser] = useState("");
  const [adminPass, setAdminPass] = useState("");
  const [customerToDelete, setCustomerToDelete] = useState<{id: number, name: string} | null>(null);

  const [showNameSuggestions, setShowNameSuggestions] = useState(false);
  const [showPhoneSuggestions, setShowPhoneSuggestions] = useState(false);
  const nameRef = useRef<HTMLDivElement>(null);
  const phoneRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (nameRef.current && !nameRef.current.contains(event.target as Node)) setShowNameSuggestions(false);
      if (phoneRef.current && !phoneRef.current.contains(event.target as Node)) setShowPhoneSuggestions(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredCustomers = initialCustomers.filter((cus) =>
    cus.name?.toLowerCase().includes(searchTerm.toLowerCase()) || cus.phone?.includes(searchTerm)
  );

  const nameSuggestions = initialCustomers.filter(cus => 
    formData.name.trim() && cus.name?.toLowerCase().includes(formData.name.toLowerCase()) && cus.id !== editingId
  ).slice(0, 4);

  const phoneSuggestions = initialCustomers.filter(cus => 
    formData.phone.trim() && cus.phone?.includes(formData.phone) && cus.id !== editingId
  ).slice(0, 4);

  const totalSystemDebt = initialCustomers.reduce((sum, cus) => sum + (cus.totalDebt || 0), 0);
  const vipCustomers = initialCustomers.filter(cus => (cus.totalSpent || 0) > 10000000).length;

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({ name: "", phone: "", address: "", note: "" });
    setShowNameSuggestions(false);
    setShowPhoneSuggestions(false);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cus: any) => {
    setEditingId(cus.id);
    setFormData({ name: cus.name || "", phone: cus.phone || "", address: cus.address || "", note: cus.note || "" });
    setShowNameSuggestions(false);
    setShowPhoneSuggestions(false);
    setIsModalOpen(true);
  };

  const handleSelectExistingCustomer = (cus: any) => {
    setFormData({ name: cus.name || "", phone: cus.phone || "", address: cus.address || "", note: cus.note || "" });
    setEditingId(cus.id); 
    setShowNameSuggestions(false);
    setShowPhoneSuggestions(false);
    alert(`⚠️ Phát hiện trùng lặp: Đã tự động tải dữ liệu của khách hàng "${cus.name}" và chuyển sang chế độ CẬP NHẬT.`);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) return alert("Tên khách hàng không được để trống!");
    setIsLoading(true);
    try {
      if (editingId) {
        await updateCustomer(editingId, formData);
        alert("✅ Đã cập nhật thông tin khách hàng!");
      } else {
        await createCustomer(formData);
        alert("✅ Đã thêm khách hàng mới!");
      }
      setIsModalOpen(false);
    } catch (e) { alert("Lỗi lưu dữ liệu!"); } finally { setIsLoading(false); }
  };

  const triggerDelete = (cus: any) => {
    if (cus.totalOrders > 0) {
      alert(`❌ KHÔNG THỂ XÓA!\nKhách hàng "${cus.name}" đang có ${cus.totalOrders} đơn hàng trên hệ thống.\nSếp phải xóa hết đơn hàng của người này trước thì mới được phép xóa thông tin khách!`);
      return;
    }
    setCustomerToDelete({ id: cus.id, name: cus.name });
    setAdminUser("");
    setAdminPass("");
    setIsAuthOpen(true);
  };

  const executeAuthDelete = async () => {
    if (!customerToDelete) return;
    const auth = await verifyAdminAuth(adminUser, adminPass);
    if (!auth.success) return alert(auth.message);

    setIsLoading(true);
    try {
      await deleteCustomer(customerToDelete.id);
      alert(`✅ Đã xóa thông tin khách hàng "${customerToDelete.name}" thành công!`);
      setIsAuthOpen(false);
      setCustomerToDelete(null);
    } catch (e) { alert("Lỗi khi xóa!"); } finally { setIsLoading(false); }
  };

  return (
    <div className="p-6 h-full flex flex-col bg-gray-50/50 font-sans text-sm animate-in fade-in duration-200">
      
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4 bg-white px-5 py-3 rounded-xl shadow-sm border border-gray-200">
        <h1 className="text-base font-bold text-blue-900 border-r-2 border-gray-100 pr-4">Quản Lý Khách Hàng</h1>
        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Tìm theo tên hoặc số điện thoại..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white transition-all" />
          </div>
          <button onClick={handleOpenAdd} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-1.5 shadow-sm transition-colors whitespace-nowrap"><PlusCircle className="w-4 h-4" /> Thêm Khách</button>
        </div>
      </div>

      <div className="mb-4 bg-gradient-to-r from-orange-50 to-amber-50/50 border border-orange-100 rounded-xl p-3.5 flex flex-wrap justify-around items-center gap-4 text-gray-700 font-semibold shadow-sm">
        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-gray-100 shadow-sm"><span className="text-xs text-gray-500">Tổng khách hệ thống:</span> <span className="font-bold text-blue-700 text-sm">{initialCustomers.length} người</span></div>
        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-gray-100 shadow-sm"><span className="text-xs text-gray-500">Khách VIP ({'>'}10 triệu):</span> <span className="font-bold text-emerald-600 text-sm">{vipCustomers} người</span></div>
        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-gray-100 shadow-sm"><span className="text-xs text-gray-500">Tổng dư nợ đang treo:</span> <span className="font-bold text-red-600 text-sm">{totalSystemDebt.toLocaleString('vi-VN')} đ</span></div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex-1">
        <div className="overflow-y-auto h-full custom-scrollbar">
          <table className="w-full text-left text-xs text-gray-600 border-collapse relative">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-700 font-bold sticky top-0 z-10 shadow-sm whitespace-nowrap">
              <tr>
                <th className="px-5 py-4 w-12 text-center">ID</th>
                <th className="px-5 py-4 w-64">Thông tin khách hàng</th>
                <th className="px-5 py-4 min-w-[200px]">Địa chỉ & Ghi chú</th>
                <th className="px-5 py-4 text-center w-28">Đơn đã mua</th>
                <th className="px-5 py-4 text-right w-36">Tổng chi tiêu</th>
                <th className="px-5 py-4 text-right w-36">Công nợ hiện tại</th>
                <th className="px-5 py-4 text-center w-24">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {filteredCustomers.length > 0 ? (
                filteredCustomers.map((cus) => (
                  <tr key={cus.id} className="hover:bg-blue-50/30 even:bg-gray-50/20 transition-colors">
                    <td className="px-5 py-4 text-center font-bold text-gray-400">#{cus.id}</td>
                    
                    {/* 🔥 NÂNG CẤP: Click vào tên khách hàng sẽ nhảy thẳng sang trang chi tiết hồ sơ */}
                    <td className="px-5 py-4">
                      <div 
                        onClick={() => router.push(`/customers/${cus.id}`)}
                        className="font-bold text-gray-900 text-sm hover:text-blue-600 cursor-pointer hover:underline transition-all"
                        title="Click để xem biên niên sử giao dịch"
                      >
                        {cus.name}
                      </div>
                      <div className="text-[11px] text-gray-500 mt-0.5 flex items-center gap-1 font-mono"><Phone className="w-3 h-3 text-blue-400" /> {cus.phone || 'Chưa cập nhật SĐT'}</div>
                    </td>
                    
                    <td className="px-5 py-4">
                      <div className="flex items-start gap-1.5 text-gray-600 line-clamp-1 mb-1"><MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" /><span className="leading-tight">{cus.address || '---'}</span></div>
                      {cus.note && <div className="text-[10px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded border border-amber-100 inline-block max-w-full truncate">Ghi chú: {cus.note}</div>}
                    </td>
                    <td className="px-5 py-4 text-center font-bold text-gray-700 text-sm"><span className="bg-gray-100 px-2 py-0.5 rounded-full border">{cus.totalOrders}</span></td>
                    <td className="px-5 py-4 text-right font-bold text-emerald-600 font-mono text-sm tracking-tight">{cus.totalSpent?.toLocaleString('vi-VN')} đ</td>
                    <td className="px-5 py-4 text-right">
                      {cus.totalDebt > 0 ? <span className="font-bold text-red-600 font-mono text-sm tracking-tight bg-red-50 px-2 py-1 rounded-md border border-red-100">{cus.totalDebt.toLocaleString('vi-VN')} đ</span> : <span className="text-gray-400 italic">0 đ</span>}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {/* 🔥 NÚT ICON XEM CHI TIẾT NHANH */}
                        <button onClick={() => router.push(`/customers/${cus.id}`)} className="p-1.5 text-purple-500 hover:bg-purple-100 rounded-md transition-colors" title="Xem hồ sơ giao dịch"><Eye className="w-4 h-4" /></button>
                        <button onClick={() => handleOpenEdit(cus)} className="p-1.5 text-blue-500 hover:bg-blue-100 rounded-md transition-colors" title="Chỉnh sửa"><Edit className="w-4 h-4" /></button>
                        <button onClick={() => triggerDelete(cus)} disabled={isLoading} className={`p-1.5 rounded-md transition-colors ${cus.totalOrders > 0 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-400 hover:text-red-500 hover:bg-red-50'}`} title={cus.totalOrders > 0 ? "Không thể xóa khách đang có đơn hàng" : "Xóa khách hàng"}><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (<tr><td colSpan={7} className="px-6 py-16 text-center text-gray-400 font-medium">Không tìm thấy khách hàng nào!</td></tr>)}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL THÊM/SỬA KHÁCH HÀNG */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-150 overflow-visible">
            <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 rounded-t-2xl"><h2 className="text-base font-bold text-gray-800 flex items-center gap-2"><User className="w-5 h-5 text-blue-600" />{editingId ? "Cập Nhật Khách Hàng" : "Thêm Khách Hàng Mới"}</h2><button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-red-500 p-1 rounded-lg hover:bg-gray-100 transition-colors"><X className="w-5 h-5" /></button></div>
            <div className="p-5 space-y-4">
              <div className="relative" ref={nameRef}>
                <label className="block text-xs font-bold text-gray-600 mb-1.5">Tên khách hàng <span className="text-red-500">*</span></label>
                <input type="text" autoFocus placeholder="VD: Anh Nam PC" value={formData.name} onChange={(e) => { setFormData({...formData, name: e.target.value}); setShowNameSuggestions(true); }} onFocus={() => setShowNameSuggestions(true)} className={`w-full border rounded-lg px-3 py-2 text-sm outline-none transition-all ${showNameSuggestions && nameSuggestions.length > 0 ? 'border-amber-400 ring-1 ring-amber-400' : 'border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'}`} />
                {showNameSuggestions && nameSuggestions.length > 0 && (
                  <div className="absolute z-[60] w-full mt-1 bg-white rounded-lg shadow-xl border border-amber-200 overflow-hidden divide-y divide-gray-100">
                    <div className="px-3 py-1.5 bg-amber-50 text-amber-700 font-bold text-[10px] uppercase tracking-wider flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Phát hiện tên có thể trùng lặp</div>
                    {nameSuggestions.map((cus: any) => (<div key={cus.id} onClick={() => handleSelectExistingCustomer(cus)} className="p-2.5 hover:bg-amber-50 cursor-pointer flex justify-between items-center transition-colors"><div><div className="font-bold text-gray-800 leading-none">{cus.name}</div><div className="text-[10px] text-gray-500 mt-1 font-mono">☎ {cus.phone || 'Chưa có SĐT'}</div></div><span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">Cập nhật</span></div>))}
                  </div>
                )}
              </div>
              <div className="relative" ref={phoneRef}>
                <label className="block text-xs font-bold text-gray-600 mb-1.5">Số điện thoại</label>
                <input type="text" placeholder="VD: 0987654321" value={formData.phone} onChange={(e) => { setFormData({...formData, phone: e.target.value}); setShowPhoneSuggestions(true); }} onFocus={() => setShowPhoneSuggestions(true)} className={`w-full border rounded-lg px-3 py-2 text-sm outline-none transition-all font-mono ${showPhoneSuggestions && phoneSuggestions.length > 0 ? 'border-amber-400 ring-1 ring-amber-400' : 'border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'}`} />
                {showPhoneSuggestions && phoneSuggestions.length > 0 && (
                  <div className="absolute z-[60] w-full mt-1 bg-white rounded-lg shadow-xl border border-amber-200 overflow-hidden divide-y divide-gray-100">
                    <div className="px-3 py-1.5 bg-amber-50 text-amber-700 font-bold text-[10px] uppercase tracking-wider flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Đã có khách dùng số này</div>
                    {phoneSuggestions.map((cus: any) => (<div key={cus.id} onClick={() => handleSelectExistingCustomer(cus)} className="p-2.5 hover:bg-amber-50 cursor-pointer flex justify-between items-center transition-colors"><div><div className="font-bold text-gray-800 leading-none">{cus.name}</div><div className="text-[10px] text-gray-500 mt-1 font-mono">☎ {cus.phone}</div></div><span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">Cập nhật</span></div>))}
                  </div>
                )}
              </div>
              <div><label className="block text-xs font-bold text-gray-600 mb-1.5">Địa chỉ</label><input type="text" placeholder="VD: Số 10, Ngõ 1, Cầu Giấy..." value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all" /></div>
              <div><label className="block text-xs font-bold text-gray-600 mb-1.5">Ghi chú (Tùy chọn)</label><textarea rows={2} placeholder="Sở thích, lưu ý về khách hàng..." value={formData.note} onChange={(e) => setFormData({...formData, note: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all resize-none" /></div>
            </div>
            <div className="px-5 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 rounded-b-2xl"><button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 font-bold text-xs transition-colors">Huỷ bỏ</button><button onClick={handleSave} disabled={isLoading} className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold text-xs shadow-md transition-all flex items-center gap-1.5">{isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}{editingId ? "Lưu Cập Nhật" : "Lưu Khách Mới"}</button></div>
          </div>
        </div>
      )}

      {/* POPUP BẢO VỆ XÓA KHÁCH HÀNG */}
      {isAuthOpen && customerToDelete && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-2xl w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-2.5 text-red-600 border-b border-gray-100 pb-3 mb-4">
              <ShieldCheck className="w-6 h-6" />
              <h3 className="font-bold text-base tracking-wide">Xác Thực Xóa Khách Hàng</h3>
            </div>
            <p className="text-xs text-gray-500 mb-4 leading-relaxed tracking-wide">Bạn đang chuẩn bị xóa vĩnh viễn khách hàng <strong className="text-red-600">{customerToDelete.name}</strong>. Vui lòng nhập tài khoản Admin để xác nhận hành động này.</p>
            <div className="space-y-3.5 text-xs font-sans">
              <div><label className="block font-semibold text-gray-600 mb-1.5">Tài khoản Admin</label><input type="text" placeholder="VD: admin" value={adminUser} onChange={(e) => setAdminUser(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 outline-none font-medium text-gray-800 bg-gray-50 focus:bg-white focus:ring-1 focus:ring-blue-500 transition-all" /></div>
              <div><label className="block font-semibold text-gray-600 mb-1.5">Mật khẩu</label><input type="password" placeholder="VD: 123456" value={adminPass} onChange={(e) => setAdminPass(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 outline-none font-medium text-gray-800 bg-gray-50 focus:bg-white focus:ring-1 focus:ring-blue-500 transition-all" /></div>
            </div>
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100 text-xs"><button onClick={() => setIsAuthOpen(false)} className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 font-bold transition-colors">Bỏ qua</button><button onClick={executeAuthDelete} disabled={isLoading} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-bold shadow-md transition-colors flex items-center gap-1">{isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}Xóa vĩnh viễn</button></div>
          </div>
        </div>
      )}

    </div>
  );
}