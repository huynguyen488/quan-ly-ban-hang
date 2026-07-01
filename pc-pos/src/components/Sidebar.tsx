"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, ReceiptText, Users, Package, ListTree, Wallet, ShieldCheck, LogOut, PlusCircle, BarChart3, Settings, Menu, X 
} from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();
  
  // 🔥 Quản lý trạng thái đóng/mở Sidebar trên điện thoại
  const [isOpen, setIsOpen] = useState(false);

  // 🔥 Tự động đóng Sidebar khi người dùng bấm chuyển trang
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const menuItems = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard, color: "text-blue-500" },
    { name: "Đơn hàng", href: "/orders", icon: ReceiptText, color: "text-green-500" },
    { name: "Khách hàng", href: "/customers", icon: Users, color: "text-orange-500" },
    { name: "Sản phẩm", href: "/products", icon: Package, color: "text-red-500" },
    { name: "Danh mục", href: "/categories", icon: ListTree, color: "text-pink-500" },
    { name: "Công nợ", href: "/debts", icon: Wallet, color: "text-purple-500" },
    { name: "Tra cứu BH", href: "/warranty", icon: ShieldCheck, color: "text-teal-500" },
    { name: "Báo cáo", href: "/reports", icon: BarChart3, color: "text-indigo-500" },
    { name: "Cài đặt", href: "/settings", icon: Settings, color: "text-gray-500" },
  ];

  return (
    <>
      {/* 📱 1. THANH ĐIỀU HƯỚNG TRÊN MOBILE (Tự động ẩn trên máy tính) */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-white border-b border-gray-200 z-40 flex items-center justify-between px-4 shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={() => setIsOpen(true)} className="p-1.5 bg-gray-50 hover:bg-gray-100 rounded-lg text-gray-700 border border-gray-200 transition-colors">
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-extrabold text-blue-800 text-sm tracking-tight uppercase">Trường Anh PC</span>
        </div>
        <Link href="/pos" className="bg-blue-600 text-white px-3 py-1.5 rounded-lg flex items-center shadow-sm text-xs font-bold gap-1.5">
          <PlusCircle className="w-4 h-4" /> Bán Hàng
        </Link>
      </div>

      {/* 📱 2. LỚP MÀN MỜ BACKGROUND TRÊN MOBILE */}
      {isOpen && (
        <div 
          onClick={() => setIsOpen(false)} 
          className="lg:hidden fixed inset-0 bg-gray-900/60 z-[60] backdrop-blur-sm transition-opacity" 
        />
      )}

      {/* 💻 3. SIDEBAR CHÍNH (Vuốt trượt trên Mobile, Cố định trên PC) */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-[70]
        w-[270px] bg-white border-r border-gray-200 flex flex-col h-screen shrink-0
        transform transition-transform duration-300 ease-in-out shadow-2xl lg:shadow-none
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0
      `}>
        
        {/* Logo & Tên Shop */}
        <div className="h-[110px] bg-blue-50 flex flex-col items-center justify-center border-b border-gray-200 shrink-0 relative">
          {/* Nút X đóng menu chỉ hiện trên mobile */}
          <button 
            onClick={() => setIsOpen(false)} 
            className="lg:hidden absolute top-3 right-3 p-1.5 text-gray-400 hover:text-red-500 hover:bg-white/50 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm text-blue-700 font-black text-xl border border-blue-100">
            TA
          </div>
          <div className="mt-2 text-xs font-bold text-blue-800 bg-white px-3 py-1 rounded-full border border-blue-100 shadow-sm">
            Hệ thống bán hàng 24/7
          </div>
        </div>

        {/* NÚT TẠO ĐƠN MỚI (POS) */}
        <div className="px-4 pt-5 pb-2 shrink-0">
          <Link 
            href="/pos" 
            className="bg-blue-600 hover:bg-blue-700 text-white w-full py-3 rounded-xl flex items-center justify-center text-sm font-bold shadow-md hover:shadow-lg transition-all duration-200 gap-2"
          >
            <PlusCircle className="w-5 h-5" />
            <span>TẠO ĐƠN MỚI</span>
          </Link>
        </div>

        {/* Danh sách Menu */}
        <div className="flex-1 overflow-y-auto py-2 px-3 custom-scrollbar">
          <div className="text-[11px] font-bold text-gray-400 mb-2 px-3 tracking-widest uppercase">Quản lý</div>
          <nav className="space-y-1">
            {menuItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center px-3 py-2.5 rounded-lg transition-colors ${
                    isActive 
                      ? "bg-blue-50/50 border border-blue-100 shadow-sm" 
                      : "hover:bg-gray-50 border border-transparent"
                  }`}
                >
                  <item.icon className={`w-5 h-5 mr-3 ${item.color}`} />
                  <span className={`text-sm ${isActive ? "font-bold text-blue-700" : "font-medium text-gray-600"}`}>
                    {item.name}
                  </span>
                  {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-500" />}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Info & Logout */}
        <div className="p-4 border-t border-gray-100 flex items-center bg-gray-50/50 shrink-0">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700">
            <Users className="w-4 h-4" />
          </div>
          <div className="ml-3 flex-1">
            <p className="text-sm font-bold text-gray-800">Quản trị viên</p>
            <p className="text-[10px] text-green-600 font-medium">Đang hoạt động</p>
          </div>
          <button className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>
    </>
  );
}