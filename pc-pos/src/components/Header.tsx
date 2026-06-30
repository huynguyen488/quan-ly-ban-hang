import { PlusCircle } from "lucide-react";

export default function Header() {
  // Lấy ngày hiện tại format kiểu Việt Nam
  const today = new Intl.DateTimeFormat('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(new Date());

  return (
    <header className="h-[65px] bg-white border-b border-gray-200 px-6 flex items-center justify-between shrink-0">
      <div className="flex flex-col justify-center">
        <h1 className="text-base font-extrabold text-gray-800 uppercase tracking-wide">
          Quản Lý Bán Hàng
        </h1>
        <p className="text-xs text-gray-500 font-medium capitalize">
          {today}
        </p>
      </div>

      <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center text-sm font-bold shadow-sm transition-colors">
        <PlusCircle className="w-4 h-4 mr-2" />
        Tạo đơn mới
      </button>
    </header>
  );
}