// app/customers/[id]/CustomerDetailView.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, User, Phone, MapPin, FileText, ShoppingBag, Receipt, Wallet, Calendar } from "lucide-react";

export default function CustomerDetailView({ customer, orders = [], receipts = [] }: { customer: any, orders: any[], receipts: any[] }) {
  const router = useRouter();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // 🔥 HÀM BỌC THÉP: Dịch ngày tháng chuẩn Việt Nam (chống lỗi năm 202)
  const parseSafeDate = (dateStr: string) => {
    if (!dateStr || dateStr === '---') return new Date(0);
    
    const dateMatch = String(dateStr).match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{3,4})/);
    const timeMatch = String(dateStr).match(/(\d{1,2}):(\d{1,2})/);

    if (dateMatch) {
      const day = dateMatch[1].padStart(2, '0');
      const month = dateMatch[2].padStart(2, '0');
      let year = dateMatch[3];
      
      // Chữa cháy cho mấy cái đơn lỡ bị lưu thiếu năm trong bộ nhớ đệm
      if (year.length === 3 && year.startsWith('202')) year = '2026';
      
      let hours = "00";
      let minutes = "00";
      if (timeMatch) {
        hours = timeMatch[1].padStart(2, '0');
        minutes = timeMatch[2].padStart(2, '0');
      }
      
      const d = new Date(`${year}-${month}-${day}T${hours}:${minutes}:00`);
      if (!isNaN(d.getTime())) return d;
    }

    const fallback = new Date(dateStr);
    return isNaN(fallback.getTime()) ? new Date(0) : fallback;
  };

  // 🔥 HÀM LÀM ĐẸP UI: Format mọi định dạng ngày về chung 1 kiểu (HH:mm DD/MM/YYYY)
  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr || dateStr === '---') return '---';
    const d = parseSafeDate(dateStr);
    if (d.getTime() === 0) return dateStr;
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    const hours = d.getHours().toString().padStart(2, '0');
    const minutes = d.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes} ${day}/${month}/${year}`;
  };

  let timelineItems: any[] = [];

  // 1. NẠP ĐƠN HÀNG (Không xài máy chém slice nữa)
  orders.forEach(o => {
    const s = String(o.status || "").trim().toLowerCase();
    const sNormalized = s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    
    const isCancelled = sNormalized.includes("huy") || s.includes("cancel");
    const isPaid = !s.includes('chưa') && !s.includes('nợ') && (s.includes('đã thanh toán') || s.includes('hoàn thành') || s.includes('paid') || s === '1' || s === 'true' || s === 'success');

    let displayStatus = 'Ghi nợ/Chưa trả đủ';
    if (isCancelled) displayStatus = 'Đã hủy';
    else if (isPaid) displayStatus = 'Đã trả đủ';

    timelineItems.push({
      type: 'order',
      id: o.id,
      date: o.date ? String(o.date) : '---', // 🔥 Đã gỡ bỏ .slice(0, 16)
      title: `Đơn hàng #${o.id}`,
      status: displayStatus,
      isPaid: isPaid,
      isCancelled: isCancelled, 
      amount: o.total_price || 0,
      note: o.note || "Mua hàng từ hệ thống",
      isDeleted: isCancelled, 
      deleteReason: ""
    });
  });

  // 2. NẠP PHIẾU THU
  receipts.forEach(r => {
    const noteStr = String(r.note || "");
    const isDeleted = noteStr.includes("[ĐÃ HỦY]");
    
    let displayAmount = r.amount || 0;
    let deleteReasonText = "";
    let displayNote = noteStr;

    if (isDeleted) {
       const parts = noteStr.split("|");
       deleteReasonText = parts[0].replace("[ĐÃ HỦY] Lý do:", "").trim();
       const amountMatch = noteStr.match(/Gốc: (\d+)/);
       if (amountMatch) displayAmount = parseInt(amountMatch[1], 10);
       displayNote = parts.length > 2 ? parts[2].replace("Cũ:", "").trim() : "";
    }

    timelineItems.push({
      type: 'receipt',
      id: r.id,
      date: r.date ? String(r.date) : '---', // 🔥 Đã gỡ bỏ .slice(0, 16)
      title: `Phiếu thu nợ #${r.id}`,
      status: isDeleted ? 'Đã hủy/xóa' : 'Đã thu quỹ',
      isPaid: true,
      isCancelled: false,
      amount: displayAmount, 
      note: displayNote || "Thanh toán công nợ",
      isDeleted: isDeleted,
      deleteReason: deleteReasonText
    });
  });

  // Lọc theo thời gian
  const filteredTimeline = timelineItems.filter(item => {
    if (!startDate && !endDate) return true;
    if (item.date === '---') return false; 
    
    const itemTime = parseSafeDate(item.date).getTime();
    const startTime = startDate ? parseSafeDate(startDate).getTime() : 0;
    const endTime = endDate ? parseSafeDate(endDate).getTime() + 86399999 : Infinity; 

    return itemTime >= startTime && itemTime <= endTime;
  });

  // 🔥 Sắp xếp dựa trên hàm parse chuẩn
  filteredTimeline.sort((a, b) => {
    if (a.date === '---') return 1;
    if (b.date === '---') return -1;
    return parseSafeDate(b.date).getTime() - parseSafeDate(a.date).getTime(); 
  });

  return (
    <div className="p-6 h-full flex flex-col bg-slate-50 font-sans text-sm animate-in fade-in duration-200">
      
      <div className="flex justify-between items-center mb-5 bg-white px-5 py-3.5 rounded-xl shadow-sm border border-gray-200">
        <button onClick={() => router.push("/customers")} className="flex items-center gap-2 text-xs font-bold text-gray-600 hover:text-blue-600 bg-gray-50 px-3.5 py-2 rounded-lg border border-gray-200 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Quay lại danh sách khách
        </button>
        <h1 className="text-base font-extrabold text-gray-800 tracking-wide">Hồ Sơ Chi Tiết Khách Hàng</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 flex-1 items-start overflow-hidden">
        
        {/* BAN TRÁI */}
        <div className="space-y-4 lg:col-span-1">
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center gap-3.5 border-b border-gray-100 pb-4 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0"><User className="w-6 h-6" /></div>
              <div><h2 className="font-black text-gray-900 text-base tracking-tight">{customer.name}</h2><span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mt-0.5">Mã số khách: #{customer.id}</span></div>
            </div>
            <div className="space-y-3 text-xs text-gray-600">
              <div className="flex items-center gap-2.5"><Phone className="w-4 h-4 text-gray-400" /><span className="font-mono font-semibold text-gray-800">{customer.phone || 'Chưa có số điện thoại'}</span></div>
              <div className="flex items-start gap-2.5"><MapPin className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" /><span className="leading-normal font-medium text-gray-700">{customer.address || 'Chưa cập nhật địa chỉ'}</span></div>
              <div className="flex items-start gap-2.5 pt-2 border-t border-dashed border-gray-100"><FileText className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" /><div className="bg-slate-50 border p-2 rounded-lg w-full text-gray-500 italic font-medium">{customer.note || 'Không có ghi chú đặc biệt.'}</div></div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm grid grid-cols-1 gap-3.5">
            <div className="flex items-center justify-between bg-blue-50/50 p-3 rounded-xl border border-blue-100">
              <div className="flex items-center gap-2.5"><ShoppingBag className="w-4 h-4 text-blue-600" /><span className="font-bold text-gray-700 text-xs">Tổng đơn đã mua</span></div>
              <span className="font-black text-blue-700 bg-white border border-blue-200 px-2.5 py-0.5 rounded-full text-xs">{customer.totalOrders} đơn</span>
            </div>
            <div className="flex items-center justify-between bg-emerald-50/50 p-3 rounded-xl border border-emerald-100">
              <div className="flex items-center gap-2.5"><Receipt className="w-4 h-4 text-emerald-600" /><span className="font-bold text-gray-700 text-xs">Doanh số cống hiến</span></div>
              <span className="font-black text-emerald-700 font-mono text-sm tracking-tight">{customer.totalSpent?.toLocaleString('vi-VN')} đ</span>
            </div>
            <div className="flex items-center justify-between bg-red-50/60 p-3 rounded-xl border border-red-100">
              <div className="flex items-center gap-2.5"><Wallet className="w-4 h-4 text-red-600" /><span className="font-bold text-gray-700 text-xs">Dư nợ treo hiện tại</span></div>
              <span className="font-black text-red-600 font-mono text-sm tracking-tight">{customer.currentDebt?.toLocaleString('vi-VN')} đ</span>
            </div>
          </div>
        </div>

        {/* BAN PHẢI */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden lg:col-span-2 h-full flex flex-col">
          <div className="px-5 py-3 bg-gray-50/60 border-b border-gray-100 flex flex-col md:flex-row justify-between items-center gap-3 shrink-0">
            <div className="font-bold text-gray-800 flex items-center gap-2"><Calendar className="w-4 h-4 text-purple-600" /> Giao Dịch Phát Sinh</div>
            <div className="flex items-center gap-2 text-xs">
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="border border-gray-300 rounded-lg px-2.5 py-1.5 outline-none focus:ring-1 focus:ring-blue-500 font-medium text-gray-600" />
              <span className="text-gray-400 font-bold">-</span>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="border border-gray-300 rounded-lg px-2.5 py-1.5 outline-none focus:ring-1 focus:ring-blue-500 font-medium text-gray-600" />
              {(startDate || endDate) && (<button onClick={() => { setStartDate(""); setEndDate(""); }} className="bg-red-50 text-red-600 px-3 py-1.5 rounded-lg border border-red-100 font-bold hover:bg-red-100 transition-colors">Xóa lọc</button>)}
            </div>
          </div>
          
          <div className="overflow-y-auto flex-1 custom-scrollbar">
            <table className="w-full text-left text-xs text-gray-600 border-collapse">
              <thead className="bg-gray-50 border-b border-gray-100 text-gray-700 font-bold sticky top-0 z-10 shadow-sm whitespace-nowrap">
                <tr>
                  <th className="px-5 py-4 w-36 text-center">Thời gian</th>
                  <th className="px-5 py-4 min-w-[160px]">Loại giao dịch</th>
                  <th className="px-5 py-4 text-center w-36">Trạng thái</th>
                  <th className="px-5 py-4 text-right w-36">Giá trị giao dịch</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {filteredTimeline.length > 0 ? (
                  filteredTimeline.map((item, index) => (
                    <tr key={index} className={`transition-colors ${item.isDeleted ? 'bg-gray-50/80 opacity-60' : 'hover:bg-blue-50/20'}`}>
                      {/* 🔥 HIỂN THỊ ĐẸP CỘT NGÀY */}
                      <td className={`px-5 py-4 text-center font-mono text-gray-400 ${item.isDeleted ? 'line-through' : ''}`}>
                        {formatDisplayDate(item.date)}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          {item.type === 'order' ? (
                            <span className={`p-1 rounded-md border ${item.isDeleted ? 'bg-gray-100 text-gray-400 border-gray-200' : 'bg-blue-50 text-blue-600 border-blue-100'}`}><ShoppingBag className="w-3.5 h-3.5" /></span>
                          ) : (
                            <span className={`p-1 rounded-md border ${item.isDeleted ? 'bg-gray-100 text-gray-400 border-gray-200' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}><Receipt className="w-3.5 h-3.5" /></span>
                          )}
                          <div>
                            <span className={`font-extrabold block text-xs ${item.isDeleted ? 'line-through text-gray-500' : 'text-gray-800'}`}>{item.title}</span>
                            {item.type === 'receipt' && item.isDeleted ? (
                              <span className="text-[10px] text-red-600 font-bold block mt-0.5 bg-red-50/60 border border-red-100 px-1.5 py-0.5 rounded w-fit max-w-[220px] truncate" title={`Lý do hủy: ${item.deleteReason}`}>⚠️ Hủy: {item.deleteReason}</span>
                            ) : (
                              <span className="text-[10px] text-gray-400 font-medium block mt-0.5 max-w-[200px] truncate" title={item.note}>{item.note}</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-center">
                        {item.type === 'order' ? (
                          <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] border tracking-tight ${
                            item.isCancelled ? 'bg-gray-100 text-gray-500 border-gray-300' : 
                            item.isPaid ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-orange-50 text-orange-600 border-orange-100'
                          }`}>{item.status}</span>
                        ) : (
                          <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] tracking-tight border ${item.isDeleted ? 'bg-red-50 text-red-500 border-red-100' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>{item.status}</span>
                        )}
                      </td>
                      <td className={`px-5 py-4 text-right font-black font-mono text-sm tracking-tight ${item.isDeleted ? 'text-gray-400 line-through' : (item.type === 'order' ? 'text-blue-600' : 'text-emerald-600')}`}>
                        {item.type === 'order' ? `+${item.amount.toLocaleString('vi-VN')} đ` : `-${item.amount.toLocaleString('vi-VN')} đ`}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan={4} className="px-6 py-16 text-center text-gray-400 font-medium">Không tìm thấy giao dịch nào trong khoảng thời gian này!</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  );
}