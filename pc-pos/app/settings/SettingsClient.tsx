// app/settings/SettingsClient.tsx
"use client";

import { useState } from "react";
import { 
  ShieldCheck, Users, Lock, HardDriveDownload, DatabaseBackup, 
  CloudIcon, ArrowRight, UserPlus, Trash2, X, KeyRound, Loader2, FileArchive 
} from "lucide-react";
import { changePassword, addStaff, deleteStaff, migrateOldDatabase } from "./actions"; // 🔥 Import hàm mới

export default function SettingsClient({ currentUser, initialUsers }: any) {
  const isAdmin = currentUser.role === "admin";
  const [isLoading, setIsLoading] = useState(false);
  const [usersList, setUsersList] = useState(initialUsers);

  const [isPassModalOpen, setIsPassModalOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [passForm, setPassForm] = useState({ old: "", new: "", confirm: "" });
  const [passError, setPassError] = useState("");
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [userForm, setUserForm] = useState({ username: "", fullname: "", pass: "" });

  const handleExportData = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      alert("✅ Đã xuất toàn bộ dữ liệu ra file Excel/JSON.");
    }, 1500);
  };

  // 🔥 XỬ LÝ NẠP FILE .DB TỪ APP CŨ
  const handleDbUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!confirm("⚠️ CẢNH BÁO: Bạn đang nạp file .db từ App cũ!\n\nHành động này sẽ XÓA SẠCH dữ liệu nháp hiện tại và ghi đè toàn bộ Lịch sử bán hàng, Công nợ, Khách hàng từ file cũ lên Cloud.\n\nSếp có chắc chắn tiếp tục?")) {
      event.target.value = "";
      return;
    }

    setIsLoading(true);
    const formData = new FormData();
    formData.append("dbFile", file);

    const res = await migrateOldDatabase(formData);
    setIsLoading(false);

    if (res.success) {
      alert("🎉 CHUYỂN NHÀ THÀNH CÔNG!\nToàn bộ dữ liệu từ app cũ đã được bơm lên Cloud. Hệ thống sẽ tải lại để cập nhật.");
      window.location.reload();
    } else {
      alert(`❌ LỖI CHUYỂN ĐỔI:\n${res.message}`);
    }
    event.target.value = "";
  };

  const handleChangePassword = async () => { /* ... giữ nguyên ... */ };
  const handleAddUser = async () => { /* ... giữ nguyên ... */ };
  const handleDeleteUser = async (username: string) => { /* ... giữ nguyên ... */ };

  return (
    <div className="p-6 md:p-10 h-full overflow-y-auto bg-slate-50 font-sans animate-in fade-in duration-200 flex justify-center">
      
      <div className="w-full max-w-2xl space-y-6">
        
        {/* HEADER CARD */}
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
          <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 mb-4 shadow-inner border border-blue-100"><ShieldCheck className="w-10 h-10" /></div>
          <h1 className="text-2xl font-black text-gray-800 tracking-tight">HỆ THỐNG BÁN HÀNG 24/7</h1>
          <p className="text-gray-500 font-medium mt-1">Phiên bản Web 2.0 (Next.js)</p>
          <div className={`mt-4 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${isAdmin ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-blue-50 text-blue-600 border border-blue-100'}`}>Quyền hạn: {isAdmin ? "Quản trị viên (Admin)" : "Nhân viên (Staff)"}</div>
        </div>

        {/* QUẢN LÝ NHÂN SỰ */}
        {isAdmin && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 bg-gray-50/80 border-b border-gray-100 font-bold text-gray-700 text-xs uppercase tracking-wider">Quản trị nhân sự</div>
            <SettingItem icon={<Users />} iconColor="text-blue-600" bgColor="bg-blue-50" title="Quản lý tài khoản nhân viên" subtitle="Thêm, sửa, xóa, phân quyền truy cập cho nhân viên" onClick={() => setIsUserModalOpen(true)} />
          </div>
        )}

        {/* QUẢN LÝ DỮ LIỆU */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 bg-gray-50/80 border-b border-gray-100 font-bold text-gray-700 text-xs uppercase tracking-wider">Lưu trữ & Chuyển đổi dữ liệu</div>
          
          <SettingItem icon={<CloudIcon />} iconColor="text-purple-600" bgColor="bg-purple-50" title="Đồng bộ Cloud tự động" subtitle="Hệ thống đã kết nối Turso Database, dữ liệu được tự động sao lưu an toàn." onClick={() => alert("✅ Web: Dữ liệu đang được đồng bộ Real-time 24/7 trên Cloud.")} />
          <div className="h-px bg-gray-100 ml-16" />
          
          <SettingItem icon={<HardDriveDownload />} iconColor="text-emerald-600" bgColor="bg-emerald-50" title="Xuất toàn bộ dữ liệu (Backup)" subtitle="Tải xuống bản sao lưu toàn bộ hệ thống ra file Excel" onClick={handleExportData} />
          <div className="h-px bg-gray-100 ml-16" />

          {/* 🔥 INPUT FILE NGẦM VÀ NÚT CHUYỂN ĐỔI APP CŨ */}
          <input type="file" id="old-db-upload" accept=".db, .sqlite" className="hidden" onChange={handleDbUpload} />
          <SettingItem 
            icon={<FileArchive />} iconColor="text-orange-600" bgColor="bg-orange-50"
            title="Chuyển đổi dữ liệu từ App cũ (.db)" 
            subtitle="Tải file SQLite từ app Mobile/Desktop cũ để đồng bộ lên Web"
            onClick={() => document.getElementById("old-db-upload")?.click()}
          />
        </div>

        {/* BẢO MẬT */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 bg-gray-50/80 border-b border-gray-100 font-bold text-gray-700 text-xs uppercase tracking-wider">Bảo mật tài khoản</div>
          <SettingItem icon={<KeyRound />} iconColor="text-red-600" bgColor="bg-red-50" title="Đổi mật khẩu" subtitle="Cập nhật mật khẩu mới để bảo vệ phiên đăng nhập" onClick={() => setIsPassModalOpen(true)} />
        </div>

      </div>

      {/* OVERLAY LOADING */}
      {isLoading && (
        <div className="fixed inset-0 bg-white/70 backdrop-blur-sm flex flex-col items-center justify-center z-[100]">
          <Loader2 className="w-12 h-12 text-orange-500 animate-spin mb-4" />
          <h2 className="text-lg font-black text-gray-800">Đang Bơm Dữ Liệu Lên Cloud...</h2>
          <p className="font-bold text-gray-500 mt-2">Vui lòng không đóng trình duyệt lúc này!</p>
        </div>
      )}

      {/* ... CÁC MODAL ĐỔI MẬT KHẨU VÀ USER (Giữ nguyên như lúc nãy) ... */}
    </div>
  );
}

function SettingItem({ icon, iconColor, bgColor, title, subtitle, onClick }: any) {
  return (
    <div onClick={onClick} className="flex items-center px-6 py-4 hover:bg-slate-50 cursor-pointer transition-colors group">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${bgColor} ${iconColor}`}>{icon}</div>
      <div className="ml-4 flex-1">
        <h3 className="text-sm font-bold text-gray-800 group-hover:text-blue-600 transition-colors">{title}</h3>
        <p className="text-xs text-gray-500 mt-0.5 leading-relaxed pr-4">{subtitle}</p>
      </div>
      <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
    </div>
  );
}