// app/debts/DebtsClient.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Wallet, AlertCircle, TrendingUp, User, ArrowRight } from "lucide-react";

export default function DebtsClient({ initialDebtList }: { initialDebtList: any[] }) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");

  // Tìm kiếm theo Mã ID, Tên khách hoặc Số điện thoại cực mượt
  const filteredDebts = initialDebtList.filter((item) =>
    item.displayId?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.phone?.includes(searchTerm)
  );

  const systemTotalDebt = filteredDebts.reduce((sum, item) => sum + (item.total_debt || 0), 0);

  return (
    <div className="p-6 h-full flex flex-col bg-slate-50 font-sans text-sm animate-in fade-in duration-200">
      
      {/* HEADER & THANH TÌM KIẾM THÔNG MINH */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4 bg-white px-5 py-3.5 rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-center gap-3">
          <Wallet className="w-5 h-5 text-purple-600" />
          <h1 className="text-base font-extrabold text-gray-800 tracking-wide border-r-2 border-gray-100 pr-4">Quản Lý Công Nợ</h1>
        </div>
        
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" placeholder="Tìm theo Mã ID (KH1) hoặc tên, SĐT..." 
            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} 
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-purple-500 bg-gray-50 focus:bg-white transition-all font-medium" 
          />
        </div>
      </div>

      {/* BANNER THỐNG KÊ */}
      <div className="mb-5 bg-gradient-to-r from-purple-50 to-pink-50/50 border border-purple-100 rounded-xl p-4 flex flex-wrap justify-between items-center gap-4 text-gray-700 font-semibold shadow-sm">
        <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-lg border border-gray-100 shadow-sm flex-1 md:flex-none">
          <AlertCircle className="w-5 h-5 text-purple-600 shrink-0" />
          <div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Tổng số khách đang nợ</span>
            <span className="font-extrabold text-gray-800 text-base">{filteredDebts.length} khách hàng</span>
          </div>
        </div>
        
        <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-lg border border-gray-100 shadow-sm flex-1 md:flex-none">
          <TrendingUp className="w-5 h-5 text-red-600 shrink-0" />
          <div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Tổng tiền dư nợ treo</span>
            <span className="font-black text-red-600 text-base font-mono tracking-tight">{systemTotalDebt.toLocaleString('vi-VN')} đ</span>
          </div>
        </div>
      </div>

      {/* LƯỚI THẺ KHÁCH NỢ */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 flex-1 content-start overflow-y-auto custom-scrollbar">
        {filteredDebts.length > 0 ? (
          filteredDebts.map((item, idx) => (
            <div 
              key={idx} 
              // 🔥 ĐÃ ÉP TRUYỀN CẢ ID SỐ LẪN TÊN SANG URL ĐỂ TRÁNH SÓT DỮ LIỆU
              onClick={() => router.push(`/debts/statement?id=${item.id || 'none'}&name=${encodeURIComponent(item.name)}`)}
              className="bg-white p-4.5 rounded-2xl border border-gray-200/70 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between hover:border-purple-200 group animate-in fade-in duration-150"
            >
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-700 shrink-0 border border-purple-100">
                    <User className="w-5 h-5" />
                  </div>
                  <div className="overflow-hidden">
                    <h3 className="font-extrabold text-gray-800 text-sm truncate tracking-tight" title={item.name}>{item.name}</h3>
                    <span className="text-[9px] text-purple-600 font-mono font-bold tracking-wider block mt-0.5">Mã số: {item.displayId}</span>
                  </div>
                </div>
                <span className="text-[9px] text-blue-600 font-mono tracking-wider bg-blue-50 px-2 py-0.5 rounded border border-blue-100 inline-block">SĐT: {item.phone || 'Chưa cập nhật'}</span>
              </div>
              
              <div className="flex items-end justify-between border-t border-gray-50 pt-3 mt-3">
                <div>
                  <span className="text-[10px] font-bold text-gray-400 block uppercase tracking-wider mb-0.5">Dư nợ cần thu</span>
                  <span className="text-base font-black text-red-600 font-mono tracking-tight">
                    {item.total_debt.toLocaleString('vi-VN')} đ
                  </span>
                </div>
                <div className="bg-slate-50 text-slate-400 p-2 rounded-xl group-hover:bg-purple-50 group-hover:text-purple-600 transition-colors">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-16 text-center text-gray-400 font-black tracking-wider text-base bg-white rounded-xl border border-dashed border-gray-200">🎉 Không tìm thấy khách hàng nợ nào phù hợp!</div>
        )}
      </div>

    </div>
  );
}