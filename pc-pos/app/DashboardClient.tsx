// app/DashboardClient.tsx
"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { 
  TrendingUp, ShoppingBag, Users, AlertCircle, 
  Wallet, ChevronRight, Receipt, PackageOpen
} from "lucide-react";

export default function DashboardClient({ orders, customers, products, receipts }: any) {
  const [timeRange, setTimeRange] = useState("month"); // today, month, all

  // 1. HÀM DỊCH NGÀY CHUẨN (Chống lỗi múi giờ)
  const parseSafeDate = (dateStr: string) => {
    if (!dateStr || dateStr === '---') return new Date(0);
    const dateMatch = String(dateStr).match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{3,4})/);
    const timeMatch = String(dateStr).match(/(\d{1,2}):(\d{1,2})/);
    if (dateMatch) {
      const day = dateMatch[1].padStart(2, '0');
      const month = dateMatch[2].padStart(2, '0');
      let year = dateMatch[3];
      if (year.length === 3 && year.startsWith('202')) year = '2026'; // Fix lỗi năm 202
      let hours = "00", minutes = "00";
      if (timeMatch) { hours = timeMatch[1].padStart(2, '0'); minutes = timeMatch[2].padStart(2, '0'); }
      const d = new Date(`${year}-${month}-${day}T${hours}:${minutes}:00`);
      if (!isNaN(d.getTime())) return d;
    }
    const fallback = new Date(dateStr);
    return isNaN(fallback.getTime()) ? new Date(0) : fallback;
  };

  // 2. LỌC ĐƠN HÀNG THEO THỜI GIAN
  const filteredOrders = useMemo(() => {
    const now = new Date();
    return orders.filter((o: any) => {
      if (timeRange === 'all') return true;
      const d = parseSafeDate(o.date);
      if (d.getTime() === 0) return false;
      if (timeRange === 'today') {
        return d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      }
      if (timeRange === 'month') {
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      }
      return true;
    });
  }, [orders, timeRange]);

  // Loại bỏ đơn Hủy khỏi các phép tính doanh thu
  const validOrders = filteredOrders.filter((o: any) => {
      const s = String(o.status || "").trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      return !(s.includes("huy") || s.includes("cancel"));
  });

  // TÍNH CHỈ SỐ CARDS
  const totalRevenue = validOrders.reduce((sum: number, o: any) => sum + (Number(o.total_price) || 0), 0);
  const totalOrdersCount = validOrders.length;
  const totalCustomersCount = customers.length;

  // 3. LOGIC TÍNH TỔNG DƯ NỢ (Tất cả thời gian) & TÌM KHÁCH NỢ NHIỀU NHẤT
  const normalize = (s: string | null) => String(s || "").trim().toLowerCase();
  
  const customerDebts = customers.map((cus: any) => {
    const targetName = normalize(cus.name);
    const cusOrders = orders.filter((o: any) => normalize(o.customer_name) === targetName);
    const cusReceipts = receipts.filter((r: any) => normalize(r.customer_name) === targetName);
    
    let unpaid = 0;
    cusOrders.forEach((o: any) => {
      const s = String(o.status || "").trim().toLowerCase();
      const sNoAccent = s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      if (sNoAccent.includes("huy") || s.includes("cancel")) return;
      const isPaid = s.includes('đã thanh toán') || s.includes('hoàn thành') || s.includes('paid') || s === '1' || s === 'true' || s === 'success';
      if (!isPaid) unpaid += (Number(o.total_price) || 0);
    });
    
    const paid = cusReceipts.reduce((sum: number, r: any) => sum + (Number(r.amount) || 0), 0);
    return { ...cus, debt: Math.max(0, unpaid - paid) };
  });

  const totalSystemDebt = customerDebts.reduce((sum: number, c: any) => sum + c.debt, 0);
  
  // Lấy Top 5 khách nợ nhiều nhất
  const topDebtors = customerDebts.filter((c: any) => c.debt > 0).sort((a: any, b: any) => b.debt - a.debt).slice(0, 5);

  // 4. LỌC SẢN PHẨM SẮP HẾT HÀNG (Tồn kho <= 5)
  const lowStockProducts = products.filter((p: any) => (Number(p.stock) || 0) <= 5).sort((a: any, b: any) => (Number(a.stock)||0) - (Number(b.stock)||0)).slice(0, 5);

  return (
    <div className="p-4 lg:p-6 bg-slate-50 min-h-full font-sans animate-in fade-in duration-300 pb-20 lg:pb-6">
      
      {/* 🌟 HEADER & FILTER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-black text-gray-800 tracking-tight">Tổng Quan Hệ Thống</h1>
          <p className="text-xs lg:text-sm text-gray-500 font-medium mt-1">Báo cáo doanh thu & tình hình kinh doanh</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-1 flex shadow-sm w-full md:w-auto overflow-hidden">
          {['today', 'month', 'all'].map(range => (
            <button 
              key={range}
              onClick={() => setTimeRange(range)}
              className={`flex-1 md:flex-none px-4 py-2.5 rounded-md text-xs font-bold transition-all ${timeRange === range ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              {range === 'today' ? 'Hôm nay' : range === 'month' ? 'Tháng này' : 'Tất cả'}
            </button>
          ))}
        </div>
      </div>

      {/* 🌟 4 THẺ THỐNG KÊ QUAN TRỌNG */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between group hover:border-blue-200 transition-all">
          <div>
            <p className="text-[10px] lg:text-[11px] uppercase tracking-wider font-bold text-gray-400 mb-1">Doanh Thu ({timeRange === 'today' ? 'Hôm nay' : timeRange === 'month' ? 'Tháng này' : 'Tất cả'})</p>
            <h3 className="text-2xl font-black text-blue-700">{totalRevenue.toLocaleString()} đ</h3>
          </div>
          <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform"><TrendingUp className="w-6 h-6" /></div>
        </div>
        
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between group hover:border-emerald-200 transition-all">
          <div>
            <p className="text-[10px] lg:text-[11px] uppercase tracking-wider font-bold text-gray-400 mb-1">Số Đơn Hàng ({timeRange === 'today' ? 'Hôm nay' : timeRange === 'month' ? 'Tháng này' : 'Tất cả'})</p>
            <h3 className="text-2xl font-black text-emerald-600">{totalOrdersCount} <span className="text-sm font-bold text-emerald-400">đơn</span></h3>
          </div>
          <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform"><ShoppingBag className="w-6 h-6" /></div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between group hover:border-orange-200 transition-all">
          <div>
            <p className="text-[10px] lg:text-[11px] uppercase tracking-wider font-bold text-gray-400 mb-1">Tổng Số Khách Hàng</p>
            <h3 className="text-2xl font-black text-orange-600">{totalCustomersCount} <span className="text-sm font-bold text-orange-400">người</span></h3>
          </div>
          <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center text-orange-500 group-hover:scale-110 transition-transform"><Users className="w-6 h-6" /></div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between group hover:border-rose-200 transition-all">
          <div>
            <p className="text-[10px] lg:text-[11px] uppercase tracking-wider font-bold text-gray-400 mb-1">Tổng Dư Nợ Toàn Hệ Thống</p>
            <h3 className="text-2xl font-black text-rose-600">{totalSystemDebt.toLocaleString()} đ</h3>
          </div>
          <div className="w-12 h-12 bg-rose-50 rounded-xl flex items-center justify-center text-rose-500 group-hover:scale-110 transition-transform"><Wallet className="w-6 h-6" /></div>
        </div>
      </div>

      {/* 🌟 NỘI DUNG CHÍNH (Cột trái Bảng, Cột phải Cảnh báo) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* ĐƠN HÀNG GẦN ĐÂY (Chiếm 2/3 không gian trên PC) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
           <div className="p-4 lg:p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="font-extrabold text-gray-800 flex items-center gap-2 text-sm lg:text-base"><Receipt className="w-5 h-5 text-blue-500"/> Giao Dịch Gần Đây</h3>
              <Link href="/orders" className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center transition-colors">Xem tất cả <ChevronRight className="w-4 h-4"/></Link>
           </div>
           <div className="overflow-x-auto flex-1 custom-scrollbar">
              <table className="w-full text-left text-xs lg:text-sm min-w-[500px]">
                 <thead className="bg-gray-50/80 text-gray-500 font-bold border-b border-gray-100">
                   <tr>
                     <th className="p-4">Khách hàng</th>
                     <th className="p-4">Thời gian</th>
                     <th className="p-4 text-center">Trạng thái</th>
                     <th className="p-4 text-right">Tổng tiền</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-50">
                   {validOrders.slice(0, 10).map((o: any, i: number) => {
                     const isPaid = String(o.status).toLowerCase().includes('đã') || String(o.status).toLowerCase().includes('đủ');
                     return (
                       <tr key={i} className="hover:bg-blue-50/30 transition-colors">
                         <td className="p-4 font-bold text-gray-800">{o.customer_name || 'Khách vãng lai'}</td>
                         <td className="p-4 text-gray-500 font-mono text-[11px]">{o.date ? o.date.slice(0,16) : '---'}</td>
                         <td className="p-4 text-center">
                           <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${isPaid ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-orange-50 text-orange-600 border-orange-100'}`}>{o.status}</span>
                         </td>
                         <td className="p-4 text-right font-black text-blue-600 font-mono">{(Number(o.total_price)||0).toLocaleString()} đ</td>
                       </tr>
                     )
                   })}
                   {validOrders.length === 0 && <tr><td colSpan={4} className="p-8 text-center text-gray-400 font-medium">Chưa có đơn hàng nào trong khoảng thời gian này.</td></tr>}
                 </tbody>
              </table>
           </div>
        </div>

        {/* RADAR CẢNH BÁO (Chiếm 1/3 không gian trên PC) */}
        <div className="space-y-6">
          
          {/* Cảnh báo nợ xấu */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-100 bg-rose-50/50 flex justify-between items-center">
              <h3 className="font-extrabold text-rose-800 flex items-center gap-2 text-sm"><Wallet className="w-5 h-5 text-rose-500"/> Khách Nợ Nhiều Nhất</h3>
              <Link href="/debts" className="text-[10px] font-bold text-rose-600 hover:underline">Chi tiết</Link>
            </div>
            <div className="p-2 divide-y divide-gray-50 flex-1">
               {topDebtors.length > 0 ? topDebtors.map((c: any, i: number) => (
                  <div key={i} className="p-3 flex justify-between items-center hover:bg-gray-50 rounded-xl transition-colors">
                    <div>
                       <p className="font-bold text-gray-800 text-xs">{c.name}</p>
                       <p className="text-[10px] text-gray-400 mt-0.5 font-mono">{c.phone || 'Chưa có SĐT'}</p>
                    </div>
                    <span className="font-black text-rose-600 text-xs bg-rose-50 px-2 py-1 rounded-md border border-rose-100">{c.debt.toLocaleString()} đ</span>
                  </div>
               )) : <p className="p-6 text-center text-xs text-gray-500 font-medium">Tuyệt vời! Hệ thống không có nợ xấu.</p>}
            </div>
          </div>

          {/* Cảnh báo Hết hàng */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-100 bg-orange-50/50 flex justify-between items-center">
              <h3 className="font-extrabold text-orange-800 flex items-center gap-2 text-sm"><AlertCircle className="w-5 h-5 text-orange-500"/> Cảnh Báo Sắp Hết Hàng</h3>
              <Link href="/products" className="text-[10px] font-bold text-orange-600 hover:underline">Nhập kho</Link>
            </div>
            <div className="p-2 divide-y divide-gray-50 flex-1">
               {lowStockProducts.length > 0 ? lowStockProducts.map((p: any, i: number) => (
                  <div key={i} className="p-3 flex justify-between items-center hover:bg-gray-50 rounded-xl transition-colors gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-800 text-xs truncate" title={p.name}>{p.name}</p>
                    </div>
                    <span className={`font-black text-xs px-2 py-1 rounded-md border shrink-0 ${(Number(p.stock)||0) === 0 ? 'text-red-600 bg-red-50 border-red-100' : 'text-orange-600 bg-orange-50 border-orange-100'}`}>
                      {(Number(p.stock)||0) === 0 ? 'Hết sạch' : `Còn ${p.stock}`}
                    </span>
                  </div>
               )) : <p className="p-6 text-center text-xs text-gray-500 font-medium">Kho hàng đang dồi dào, sẵn sàng chiến đấu!</p>}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}