"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  ReceiptText, 
  Users, 
  Package, 
  ListTree, 
  Wallet, 
  ShieldCheck, 
  LogOut,
  PlusCircle,
  BarChart3,
  Settings // ✅ Import icon Settings
} from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();

  const menuItems = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard, color: "text-blue-500" },
    { name: "Đơn hàng", href: "/orders", icon: ReceiptText, color: "text-green-500" },
    { name: "Khách hàng", href: "/customers", icon: Users, color: "text-orange-500" },
    { name: "Sản phẩm", href: "/products", icon: Package, color: "text-red-500" },
    { name: "Danh mục", href: "/categories", icon: ListTree, color: "text-pink-500" },
    { name: "Công nợ", href: "/debts", icon: Wallet, color: "text-purple-500" },
    { name: "Tra cứu BH", href: "/warranty", icon: ShieldCheck, color: "text-teal-500" },
    { name: "Báo cáo", href: "/reports", icon: BarChart3, color: "text-indigo-500" },
    // ✅ Thêm mục Cài đặt
    { name: "Cài đặt", href: "/settings", icon: Settings, color: "text-gray-500" },
  ];

  return (
    <aside className="w-[270px] bg-white border-r border-gray-200 flex flex-col h-screen shrink-0">
      {/* Logo & Tên Shop */}
      <div className="h-[110px] bg-blue-50 flex flex-col items-center justify-center border-b border-gray-200 shrink-0">
        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm text-blue-700 font-black text-xl border border-blue-100">
          TA
        </div>
        <div className="mt-2 text-xs font-bold text-blue-800 bg-white px-3 py-1 rounded-full border border-blue-100 shadow-sm">
          Hệ thống bán hàng 24/7
        </div>
      </div>

      {/* NÚT TẠO ĐƠN MỚI (POS) NỔI BẬT */}
      <div className="px-4 pt-5 pb-2 shrink-0">
        <Link 
          href="/pos" 
          className="bg-blue-600 hover:bg-blue-700 text-white w-full py-3 rounded-xl flex items-center justify-center text-sm font-bold shadow-md hover:shadow-lg transition-all duration-200 gap-2"
        >
          <PlusCircle className="w-5 h-5" />
          <span>TẠO ĐƠN MỚI</span>
        </Link>
      </div>

      {/* Menu List */}
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
  );
}