// app/reports/ReportClient.tsx
"use client";

import { useState, useMemo } from "react";
import * as XLSX from "xlsx";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell 
} from "recharts";
import { 
  FileSpreadsheet, Calendar, FileText, Wallet, AlertTriangle, TrendingUp,
  FolderOpen, ShoppingBag, Receipt, Users, CreditCard, PieChart as PieIcon,
  PlusCircle
} from "lucide-react";
import { useRouter } from "next/navigation"; 

const COLORS = ["#10B981", "#3B82F6", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899"];

export default function ReportClient({ initialOrders, initialReceipts, initialProducts }: any) {
  const router = useRouter(); 
  const [quickOption, setQuickOption] = useState("Tháng này");
  
  const getInitialDates = () => {
    const now = new Date();
    return {
      start: new Date(now.getFullYear(), now.getMonth(), 1),
      end: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
    };
  };
  
  const [dateRange, setDateRange] = useState(getInitialDates());

  const handleQuickSelect = (option: string) => {
    const now = new Date();
    let start, end;
    setQuickOption(option);

    switch (option) {
      case "Hôm nay":
        start = new Date(now.setHours(0, 0, 0, 0));
        end = new Date(now.setHours(23, 59, 59, 999));
        break;
      case "Hôm qua":
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        start = new Date(yesterday.setHours(0, 0, 0, 0));
        end = new Date(yesterday.setHours(23, 59, 59, 999));
        break;
      case "7 ngày qua":
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6, 0, 0, 0);
        end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
        break;
      case "Tháng này":
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        break;
      case "Tháng trước":
        start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
        break;
      default: return;
    }
    setDateRange({ start, end });
  };

  const reportData = useMemo(() => {
    const { start, end } = dateRange;
    const startTime = start.getTime();
    const endTime = end.getTime();

    // 🔥 BỘ LỌC KẾ TOÁN: Bỏ qua hoàn toàn các đơn "Đã hủy" khỏi phép tính tiền
    const currentOrders = initialOrders.filter((o: any) => {
      const statusNormal = String(o.status || "").trim().toLowerCase();
      if (statusNormal.includes('hủy') || statusNormal.includes('huỷ')) return false;

      const t = new Date(o.date).getTime();
      return t >= startTime && t <= endTime;
    });

    const currentReceipts = initialReceipts.filter((r: any) => {
      const t = new Date(r.date).getTime();
      return t >= startTime && t <= endTime;
    });

    let totalRevenue = 0;
    let orderCash = 0;
    let debtGen = 0;
    let totalCost = 0;

    const normalize = (s: string) => (s || "").trim().toLowerCase();

    const dailyMap: Record<string, any> = {};
    const productMap: Record<string, any> = {};
    const catMap: Record<string, any> = {};
    const customerMap: Record<string, number> = {};
    const paymentMap: Record<string, number> = {};

    const detailedOrderList: any[] = [];
    const detailedItemList: any[] = [];

    currentOrders.forEach((o: any, oIndex: number) => {
      const price = o.total_price || 0;
      totalRevenue += price;

      const s = normalize(o.status);
      const isPaid = s.includes('đã thanh toán') || s.includes('hoàn thành') || s.includes('paid');
      
      if (isPaid) orderCash += price;
      else debtGen += price;

      const day = o.date ? o.date.slice(0, 10) : '---';
      if (!dailyMap[day]) dailyMap[day] = { day, real_rec: 0, debt_gen: 0 };
      if (isPaid) dailyMap[day].real_rec += price;
      else dailyMap[day].debt_gen += price;

      const cName = o.customer_name?.trim() || "Khách lẻ";
      customerMap[cName] = (customerMap[cName] || 0) + price;

      const pm = o.payment_method?.trim() || "Tiền mặt";
      paymentMap[pm] = (paymentMap[pm] || 0) + price;

      detailedOrderList.push({
        "STT": oIndex + 1,
        "Mã Đơn": o.id || "---",
        "Ngày Bán": o.date ? o.date.slice(0, 10) : '---',
        "Khách Hàng": o.customer_name || "Khách lẻ",
        "Tổng Tiền (VNĐ)": price,
        "Trạng Thái": o.status || "---",
        "Phương Thức TT": o.payment_method || "Tiền mặt"
      });

      (o.items || []).forEach((item: any, iIndex: number) => {
        totalCost += (item.quantity * (item.price_import || 0));

        const pName = item.product_name || "Không tên";
        const prodInfo = initialProducts.find((p: any) => p.name === pName);
        const catName = prodInfo?.category || "Chưa phân loại";
        const rev = item.quantity * item.price;

        if (!productMap[pName]) productMap[pName] = { name: pName, qty: 0, rev: 0 };
        productMap[pName].qty += item.quantity;
        productMap[pName].rev += rev;

        if (!catMap[catName]) catMap[catName] = { name: catName, rev: 0 };
        catMap[catName].rev += rev;

        detailedItemList.push({
          "STT": iIndex + 1,
          "Mã Đơn": o.id || "---",
          "Ngày Bán": o.date ? o.date.slice(0, 10) : '---',
          "Tên Sản Phẩm": pName,
          "Danh Mục": catName,
          "Số Lượng": item.quantity || 0,
          "Giá Bán (VNĐ)": item.price || 0,
          "Thành Tiền (VNĐ)": rev,
          "Giá Vốn (VNĐ)": item.price_import || 0
        });
      });
    });

    const receiptCash = currentReceipts.reduce((sum: number, r: any) => sum + (r.amount || 0), 0);
    
    if (receiptCash > 0) {
      paymentMap["Thu nợ (Phiếu thu)"] = (paymentMap["Thu nợ (Phiếu thu)"] || 0) + receiptCash;
    }

    currentReceipts.forEach((r: any) => {
      const day = r.date ? r.date.slice(0, 10) : '---';
      if (!dailyMap[day]) dailyMap[day] = { day, real_rec: 0, debt_gen: 0 };
      dailyMap[day].real_rec += (r.amount || 0);
      dailyMap[day].debt_gen -= (r.amount || 0);
      if (dailyMap[day].debt_gen < 0) dailyMap[day].debt_gen = 0;
    });

    const realReceipt = orderCash + receiptCash; 
    const netDebt = debtGen - receiptCash;
    const finalDebtCreated = netDebt > 0 ? netDebt : 0;
    const grossProfit = totalRevenue - totalCost;

    const chartData = Object.values(dailyMap).sort((a: any, b: any) => a.day.localeCompare(b.day));
    const topProducts = Object.values(productMap).sort((a: any, b: any) => b.rev - a.rev).slice(0, 5);
    const topCategories = Object.values(catMap).sort((a: any, b: any) => b.rev - a.rev);
    const topCustomers = Object.entries(customerMap).map(([name, rev]) => ({ name, rev })).sort((a, b) => b.rev - a.rev).slice(0, 5);
    const paymentMethods = Object.entries(paymentMap).map(([name, rev]) => ({ name, rev })).sort((a, b) => b.rev - a.rev);

    const lowStockProducts = initialProducts.filter((p: any) => (p.stock || 0) <= (p.min_stock || 10));

    return {
      totalRevenue, realReceipt, finalDebtCreated, grossProfit,
      chartData, topProducts, topCategories, topCustomers, paymentMethods, lowStockProducts,
      detailedOrderList, detailedItemList
    };
  }, [dateRange, initialOrders, initialReceipts, initialProducts]);

  const exportToExcel = () => {
    try {
      const wb = XLSX.utils.book_new();

      const chartSheetData = reportData.chartData.map((d: any) => ({
        "Ngày Giao Dịch": d.day,
        "Thực Thu (VNĐ)": d.real_rec,
        "Nợ Phát Sinh (VNĐ)": d.debt_gen
      }));
      const ws1 = XLSX.utils.json_to_sheet(chartSheetData);
      XLSX.utils.book_append_sheet(wb, ws1, "Biến động Dòng Tiền");

      const catSheetData = reportData.topCategories.map((c: any) => ({
        "Danh mục": c.name,
        "Doanh thu (VNĐ)": c.rev
      }));
      const ws2 = XLSX.utils.json_to_sheet(catSheetData);
      XLSX.utils.book_append_sheet(wb, ws2, "Doanh Thu Danh Mục");

      const ws3 = XLSX.utils.json_to_sheet(reportData.detailedOrderList);
      XLSX.utils.book_append_sheet(wb, ws3, "Bảng kê Đơn Hàng");

      const ws4 = XLSX.utils.json_to_sheet(reportData.detailedItemList);
      XLSX.utils.book_append_sheet(wb, ws4, "Bảng kê Chi Tiết Sản Phẩm");

      XLSX.writeFile(wb, `BaoCao_KinhDoanh_ChiTiet_${new Date().getTime()}.xlsx`);
    } catch (e) {
      alert("Có lỗi khi xuất Excel!");
    }
  };

  return (
    <div className="p-6 h-full flex flex-col bg-slate-50 font-sans animate-in fade-in duration-200 overflow-y-auto">
      
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6 bg-white px-5 py-3.5 rounded-xl shadow-sm border border-gray-200">
        <div>
          <h1 className="text-xl font-extrabold text-blue-900 tracking-tight">Báo Cáo Kinh Doanh</h1>
          <p className="text-xs font-medium text-gray-500 mt-0.5 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" /> 
            {dateRange.start.toLocaleDateString('vi-VN')} - {dateRange.end.toLocaleDateString('vi-VN')}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => router.push("/pos")} 
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-1.5 shadow-sm transition-colors whitespace-nowrap"
          >
            <PlusCircle className="w-4 h-4" /> TẠO ĐƠN MỚI
          </button>
          
          <select 
            value={quickOption} 
            onChange={(e) => handleQuickSelect(e.target.value)}
            className="border border-blue-200 text-blue-800 font-bold bg-white rounded-lg px-3.5 py-2 text-xs outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
          >
            <option value="Hôm nay">Hôm nay</option>
            <option value="Hôm qua">Hôm qua</option>
            <option value="7 ngày qua">7 ngày qua</option>
            <option value="Tháng này">Tháng này</option>
            <option value="Tháng trước">Tháng trước</option>
          </select>

          <button 
            onClick={exportToExcel}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-lg font-bold text-xs flex items-center gap-1.5 shadow-md transition-all whitespace-nowrap"
          >
            <FileSpreadsheet className="w-4 h-4" /> Xuất Excel Chi Tiết
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
        <SummaryCard title="Doanh Số Ký Xuất" value={reportData.totalRevenue} color="bg-blue-50 text-blue-600" borderColor="border-blue-100" icon={<FileText className="w-5 h-5"/>} />
        <SummaryCard title="Thực Thu (Tiền về túi)" value={reportData.realReceipt} color="bg-emerald-50 text-emerald-600" borderColor="border-emerald-100" icon={<Wallet className="w-5 h-5"/>} />
        <SummaryCard title="Còn Nợ Trong Kỳ" value={reportData.finalDebtCreated} color="bg-red-50 text-red-600" borderColor="border-red-100" icon={<AlertTriangle className="w-5 h-5"/>} />
        <SummaryCard title="Lợi Nhuận Gộp" value={reportData.grossProfit} color="bg-purple-50 text-purple-600" borderColor="border-purple-100" icon={<TrendingUp className="w-5 h-5"/>} />
      </div>

      {reportData.lowStockProducts.length > 0 && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 shadow-sm">
          <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0" />
          <div>
            <h3 className="text-amber-800 font-bold text-sm tracking-wide">CẢNH BÁO SẮP HẾT HÀNG TRONG KHO (DƯỚI MỨC TỐI THIỂU)</h3>
            <p className="text-amber-700 text-xs mt-1 font-medium leading-relaxed">
              {reportData.lowStockProducts.map((p: any) => `${p.name} (Còn: ${p.stock})`).join(" • ")}
            </p>
          </div>
        </div>
      )}

      <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm mb-6">
        <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2 text-base">
          <TrendingUp className="w-5 h-5 text-blue-600" /> Biểu đồ Phân tích Dòng Tiền (Thực Thu vs Công Nợ)
        </h3>
        <div className="h-[350px] w-full overflow-hidden"> 
          {reportData.chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={reportData.chartData} margin={{ top: 25, right: 10, left: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="day" tickFormatter={(val) => val.slice(8, 10) + '/' + val.slice(5, 7)} axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 12, fontWeight: 600}} dy={15} />
                <YAxis axisLine={false} tickLine={false} tick={false} width={10} /> 
                <RechartsTooltip cursor={{fill: '#F3F4F6'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} formatter={(value: any) => [`${Number(value).toLocaleString('vi-VN')} đ`, '']} />
                <Legend iconType="circle" wrapperStyle={{paddingTop: '35px'}} />
                <Bar dataKey="real_rec" name="Thực Thu" fill="#10B981" radius={[4, 4, 0, 0]} barSize={20} />
                <Bar dataKey="debt_gen" name="Nợ Mới" fill="#EF4444" radius={[4, 4, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-400 font-medium">Chưa có dữ liệu biểu đồ trong kỳ này</div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
          <div className="px-5 py-3.5 bg-gray-50 border-b border-gray-100 font-bold text-gray-800 flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-purple-600" /> 🏆 Top 5 Sản Phẩm Chạy Nhất
          </div>
          <div className="p-2">
            {reportData.topProducts.length > 0 ? reportData.topProducts.map((p: any, idx: number) => (
              <div key={idx} className="flex justify-between items-center p-3 hover:bg-slate-50 rounded-lg transition-colors border-b border-gray-50 last:border-0">
                <div>
                  <div className="font-bold text-gray-800 text-sm line-clamp-1">{p.name}</div>
                  <div className="text-[11px] text-gray-500 mt-0.5">Đã xuất: <span className="font-bold text-gray-700">{p.qty}</span> SP</div>
                </div>
                <div className="font-black text-blue-600 font-mono text-sm tracking-tight">{p.rev.toLocaleString('vi-VN')} đ</div>
              </div>
            )) : <div className="p-6 text-center text-gray-400">Không có dữ liệu</div>}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
          <div className="px-5 py-3.5 bg-gray-50 border-b border-gray-100 font-bold text-gray-800 flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-600" /> 👥 Top 5 Khách Hàng Doanh Số Khủng
          </div>
          <div className="p-2">
            {reportData.topCustomers.length > 0 ? reportData.topCustomers.map((c: any, idx: number) => (
              <div key={idx} className="flex justify-between items-center p-3 hover:bg-slate-50 rounded-lg transition-colors border-b border-gray-50 last:border-0">
                <div className="font-bold text-gray-800 text-sm truncate pr-2">{c.name}</div>
                <div className="font-black text-blue-600 font-mono text-sm tracking-tight whitespace-nowrap">{c.rev.toLocaleString('vi-VN')} đ</div>
              </div>
            )) : <div className="p-6 text-center text-gray-400">Không có dữ liệu</div>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-10">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
          <div className="px-5 py-3.5 bg-gray-50 border-b border-gray-100 font-bold text-gray-800 flex items-center gap-2">
            <FolderOpen className="w-4 h-4 text-amber-500" /> 📁 Doanh Thu Theo Danh Mục
          </div>
          <div className="p-2">
            {reportData.topCategories.length > 0 ? reportData.topCategories.map((c: any, idx: number) => (
              <div key={idx} className="flex justify-between items-center p-3 hover:bg-slate-50 rounded-lg transition-colors border-b border-gray-50 last:border-0">
                <div className="font-bold text-gray-800 text-sm truncate pr-2">{c.name}</div>
                <div className="font-black text-emerald-600 font-mono text-sm tracking-tight whitespace-nowrap">{c.rev.toLocaleString('vi-VN')} đ</div>
              </div>
            )) : <div className="p-6 text-center text-gray-400">Không có dữ liệu</div>}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
          <div className="px-5 py-3.5 bg-gray-50 border-b border-gray-100 font-bold text-gray-800 flex items-center gap-2">
            <PieIcon className="w-4 h-4 text-emerald-600" /> 💳 Tỷ Trọng Phương Thức Thanh Toán
          </div>
          
          <div className="p-4 flex flex-col items-center justify-center border-b border-gray-100 bg-slate-50/50">
            <div className="h-[240px] w-full">
              {reportData.paymentMethods.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart margin={{ top: 25, right: 35, bottom: 25, left: 35 }}>
                    <Pie
                      data={reportData.paymentMethods}
                      cx="50%"
                      cy="50%"
                      innerRadius={45} 
                      outerRadius={65} 
                      paddingAngle={5}
                      dataKey="rev"
                      nameKey="name"
                      label={({ name, percent }: any) => `${name} (${(percent * 100).toFixed(0)}%)`}
                     
                    >
                      {reportData.paymentMethods.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} formatter={(value: any) => [`${Number(value).toLocaleString('vi-VN')} đ`, 'Doanh thu']} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-400 font-medium text-xs">Chưa có dữ liệu thanh toán</div>
              )}
            </div>
          </div>

          <div className="p-2">
            {reportData.paymentMethods.length > 0 ? reportData.paymentMethods.map((p: any, idx: number) => (
              <div key={idx} className="flex justify-between items-center p-3 hover:bg-slate-50 rounded-lg transition-colors border-b border-gray-50 last:border-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                  <div className="font-bold text-gray-800 text-sm truncate pr-2">{p.name}</div>
                </div>
                <div className="font-black text-emerald-600 font-mono text-sm tracking-tight whitespace-nowrap">{p.rev.toLocaleString('vi-VN')} đ</div>
              </div>
            )) : <div className="p-6 text-center text-gray-400">Không có dữ liệu</div>}
          </div>
        </div>
      </div>

    </div>
  );
}

function SummaryCard({ title, value, color, borderColor, icon }: any) {
  return (
    <div className={`p-4 bg-white rounded-2xl border ${borderColor} shadow-sm flex items-start gap-4 hover:shadow-md transition-shadow`}>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
        {icon}
      </div>
      <div>
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">{title}</h3>
        <p className={`text-xl font-black font-mono tracking-tight ${color.split(' ')[1]}`}>
          {value.toLocaleString('vi-VN')} đ
        </p>
      </div>
    </div>
  );
}