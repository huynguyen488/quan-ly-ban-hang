// app/orders/OrderClient.tsx
"use client";
import { useState, useRef, useEffect, useMemo, useTransition } from "react";
import { Search, Eye, X, Loader2, Trash2, Save, Plus, Minus, User, ShieldCheck, QrCode, ShoppingBag, TrendingUp, AlertCircle, Printer, Filter } from "lucide-react";
import { updateOrderComplete, deleteOrder, verifyAdminAuth } from "./actions";

export default function OrderClient({ initialOrders, initialProducts = [] }: { initialOrders: any[], initialProducts?: any[] }) {
  const [hasMounted, setHasMounted] = useState(false);
  useEffect(() => { setHasMounted(true); }, []);

  const [searchTerm, setSearchTerm] = useState("");
  const [timeFilter, setTimeFilter] = useState("Tháng này");
  const [statusFilter, setStatusFilter] = useState("all"); 

  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [cart, setCart] = useState<any[]>([]); 
  const [isOpen, setIsOpen] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const [customerSearch, setCustomerSearch] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [discount, setDiscount] = useState<number>(0);
  const [amountGiven, setAmountGiven] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState("Tiền mặt");
  const [paymentStatus, setPaymentStatus] = useState("Đã thanh toán");
  const [orderDate, setOrderDate] = useState("");
  const [orderNote, setOrderNote] = useState(""); 

  const [productSearch, setProductSearch] = useState("");
  const [showProductSuggestions, setShowProductSuggestions] = useState(false);
  const searchProductRef = useRef<HTMLDivElement>(null);

  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [adminUser, setAdminUser] = useState("");
  const [adminPass, setAdminPass] = useState("");

 // 🔥 HÀM BỌC THÉP MỚI: Bóc tách chính xác cả NGÀY và GIỜ
  const parseSafeDate = (dateStr: string) => {
    if (!dateStr) return new Date();
    
    // Thử dịch theo chuẩn quốc tế trước
    let d = new Date(dateStr);
    if (!isNaN(d.getTime())) return d;

    // Nếu là chuẩn Việt Nam (VD: 15:30:00 01/07/2026), tự động bóc tách từng số
    const dateMatch = dateStr.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
    const timeMatch = dateStr.match(/(\d{1,2}):(\d{1,2})/);

    if (dateMatch) {
      const year = dateMatch[3];
      const month = dateMatch[2].padStart(2, '0');
      const day = dateMatch[1].padStart(2, '0');
      
      let hours = "00";
      let minutes = "00";
      
      // Bắt chính xác giờ phút sếp đã lưu
      if (timeMatch) {
        hours = timeMatch[1].padStart(2, '0');
        minutes = timeMatch[2].padStart(2, '0');
      }
      
      // Ghép lại thành chuẩn ISO để hệ thống thấu hiểu
      d = new Date(`${year}-${month}-${day}T${hours}:${minutes}:00`);
    }
    
    return isNaN(d.getTime()) ? new Date() : d;
  };

  const checkIsPaid = (status: any) => {
    if (!status) return false;
    const s = String(status).trim().toLowerCase();
    if (s.includes('chưa') || s.includes('nợ')) return false;
    return (s === '1' || s === 'true' || s === 'paid' || s === 'success' || s.includes('hoàn thành') || s.includes('đã thanh toán') || s.includes('đủ'));
  };

  const checkIsCancelled = (status: any) => {
    if (!status) return false;
    const s = String(status).trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return s.includes("huy") || s.includes("cancel");
  };
  
  const getStatusKey = (status: any) => {
    if (checkIsCancelled(status)) return 'cancelled';
    if (checkIsPaid(status)) return 'paid';
    return 'debt';
  };

  const filterByTime = (dateStr: string) => {
    if (!dateStr) return true;
    const itemDate = parseSafeDate(dateStr);
    const now = new Date();
    
    if (timeFilter === "Hôm nay") return itemDate.toDateString() === now.toDateString();
    if (timeFilter === "7 ngày qua") {
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return itemDate >= sevenDaysAgo;
    }
    if (timeFilter === "Tháng này") return itemDate.getMonth() === now.getMonth() && itemDate.getFullYear() === now.getFullYear();
    if (timeFilter === "Tháng trước") {
      const prevMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
      const prevYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
      return itemDate.getMonth() === prevMonth && itemDate.getFullYear() === prevYear;
    }
    return true; 
  };

// LỌC VÀ SẮP XẾP LẠI THEO THỜI GIAN MỚI NHẤT
  const filteredOrders = useMemo(() => {
    return initialOrders.filter((order) => {
      const matchesSearch = 
        order.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customer_phone?.includes(searchTerm) ||
        order.items?.some((item: any) => item.product_name?.toLowerCase().includes(searchTerm.toLowerCase()));

      if (!matchesSearch) return false;
      if (!filterByTime(order.date)) return false;

      const statusKey = getStatusKey(order.status);
      if (statusFilter === "paid" && statusKey !== "paid") return false;
      if (statusFilter === "debt" && statusKey !== "debt") return false;
      if (statusFilter === "cancelled" && statusKey !== "cancelled") return false;
      return true;
    }).sort((a, b) => {
      // 🔥 ĐOẠN NÀY ĐẢM BẢO ĐƠN MỚI NHẤT LUÔN NẰM TRÊN ĐẦU
      return parseSafeDate(b.date).getTime() - parseSafeDate(a.date).getTime();
    });
  }, [initialOrders, searchTerm, timeFilter, statusFilter]); // Đã bọc trong useMemo cho mượt

  const totalRevenue = filteredOrders.reduce((sum, o) => sum + (checkIsCancelled(o.status) ? 0 : (o.total_price || 0)), 0);
  
  const totalDebt = useMemo(() => {
    return filteredOrders.reduce((sum, o) => {
      const isPaid = checkIsPaid(o.status);
      const isCancelled = checkIsCancelled(o.status);
      if (!isCancelled && !isPaid) {
        return sum + (o.total_price || 0);
      }
      return sum;
    }, 0);
  }, [filteredOrders]);

  const productSuggestions = initialProducts.filter((product: any) =>
    product.name?.toLowerCase().includes(productSearch.toLowerCase()) ||
    product.id?.toString().includes(productSearch)
  ).slice(0, 5);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchProductRef.current && !searchProductRef.current.contains(event.target as Node)) setShowProductSuggestions(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleOpenDetail = (order: any) => {
    setSelectedOrder(order);
    setCustomerSearch(order.customer_name === "Khách vãng lai" ? "" : order.customer_name || "");
    setCustomerPhone(order.customer_phone || "");
    setPaymentMethod(order.payment_method || "Tiền mặt");
    
    // 🔥 Convert ngày giờ sang chuẩn datetime-local (để bật lịch lên)
    const d = parseSafeDate(order.date);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    setOrderDate(d.toISOString().slice(0, 16));
    
    const rawNote = order.note || "";
    const cleanNote = rawNote.split('| Đã sửa đơn')[0].split('| Khách đưa')[0].trim();
    setOrderNote(cleanNote);

    const isCancelled = checkIsCancelled(order.status);
    setPaymentStatus(isCancelled ? "Đã hủy" : (checkIsPaid(order.status) ? "Đã thanh toán" : "Chưa thanh toán"));
    
    const noteStr = order.note || "";
    const discountMatch = noteStr.match(/Chiết khấu:\s*(\d+)/);
    const amountGivenMatch = noteStr.match(/Khách đưa:\s*(\d+)/);
    setDiscount(discountMatch ? Number(discountMatch[1]) : 0);
    setAmountGiven(amountGivenMatch ? Number(amountGivenMatch[1]) : 0);

    const mappedCart = (order.items || []).map((item: any) => {
      const originalProd = initialProducts.find((p: any) => p.name === item.product_name);
      return {
        product: { id: originalProd?.id || 999, name: item.product_name, price_sell: item.price, price_import: item.price_import, unit: item.unit, stock: (originalProd?.stock || 0) + (item.quantity || 0) },
        quantity: item.quantity, serials: item.serials || "" 
      };
    });
    setCart(mappedCart);
    setIsOpen(true);
  };

  const handleCloseDetail = () => { setIsOpen(false); setSelectedOrder(null); setCart([]); setProductSearch(""); setOrderNote(""); };

  const handleAddProductToEditCart = (product: any) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.product.name === product.name);
      if (existingItem) {
        if (existingItem.quantity >= product.stock) { alert("Vượt quá tồn kho cho phép!"); return prevCart; }
        return prevCart.map((item) => item.product.name === product.name ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prevCart, { product, quantity: 1, serials: "" }];
    });
    setProductSearch(""); setShowProductSuggestions(false);
  };

  const handleSerialChange = (productName: string, text: string) => {
    setCart(prev => prev.map(item => item.product.name === productName ? { ...item, serials: text } : item));
  };

  const updateQuantity = (productName: string, delta: number) => {
    setCart((prevCart) => prevCart.map((item) => {
      if (item.product.name === productName) {
        const newQ = item.quantity + delta;
        if (newQ < 1 || newQ > item.product.stock) return item;
        return { ...item, quantity: newQ };
      }
      return item;
    }));
  };

  const removeFromCart = (productName: string) => { setCart((prevCart) => prevCart.filter((item) => item.product.name !== productName)); };

  const totalGoodsAmount = cart.reduce((total, item) => total + (item.product.price_sell * item.quantity), 0);
  const finalAmount = Math.max(0, totalGoodsAmount - discount);

  useEffect(() => { if (paymentStatus === 'Đã thanh toán') setAmountGiven(finalAmount); }, [finalAmount, paymentStatus]);

  const changeAmount = Math.max(0, amountGiven - finalAmount);
  const debtAmount = Math.max(0, finalAmount - amountGiven);

  const handleSaveChanges = async () => {
    if (cart.length === 0) return alert("Hóa đơn trống! Nếu muốn huỷ sếp hãy bấm nút Hủy/Xóa đơn ở góc dưới.");
    let finalCustomerName = customerSearch.trim();
    if (paymentStatus === 'Chưa thanh toán' && !finalCustomerName) return alert("Đơn ghi nợ bắt buộc phải điền tên khách hàng!");
    if (paymentStatus === 'Đã thanh toán' && !finalCustomerName) finalCustomerName = "Khách vãng lai";

    setIsActionLoading(true);
    try {
      // 🔥 Format lại ngày để lưu xuống DB đẹp mắt
      const finalDateStr = orderDate ? new Date(orderDate).toLocaleString('vi-VN') : new Date().toLocaleString('vi-VN');

      await updateOrderComplete(selectedOrder.id, { 
        cart, 
        customerName: finalCustomerName, 
        customerPhone, 
        totalPrice: finalAmount, 
        discount, 
        paymentMethod, 
        status: paymentStatus, 
        amountGiven, 
        orderDate: finalDateStr, 
        note: orderNote 
      });
      alert(`✅ Đã cập nhật chỉnh sửa và cân đối kho thành công!`);
      handleCloseDetail();
    } catch (error) { alert("Lỗi khi cập nhật!"); } finally { setIsActionLoading(false); }
  };

  const triggerAuthDelete = (order?: any) => { 
    if (order) setSelectedOrder(order); 
    setAdminUser(""); setAdminPass(""); setIsAuthOpen(true); 
  };

  const executeAuthDelete = async () => {
    const auth = await verifyAdminAuth(adminUser, adminPass);
    if (!auth.success) return alert(auth.message);
    setIsActionLoading(true);
    try {
      await deleteOrder(selectedOrder.id);
      alert(`✅ Đã HỦY ĐƠN HÀNG #${selectedOrder.id} và tự động hoàn trả kho thành công!`);
      setIsAuthOpen(false); handleCloseDetail();
    } catch (e) { alert("Lỗi hủy đơn!"); } finally { setIsActionLoading(false); }
  };

  if (!hasMounted) {
    return (
      <div className="p-6 h-full flex flex-col justify-center items-center gap-3 text-gray-500 font-sans bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <p className="text-sm font-semibold">Đang tải dữ liệu hóa đơn...</p>
      </div>
    );
  }

  const isSelectedOrderCancelled = selectedOrder && checkIsCancelled(selectedOrder.status);

  return (
    <div className="p-6 h-full flex flex-col bg-slate-50 font-sans text-sm animate-in fade-in duration-300">
      
      {/* THANH ĐIỀU HƯỚNG BỘ LỌC */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-5 bg-white px-5 py-3.5 rounded-xl shadow-sm border border-gray-200 print:hidden">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <h1 className="text-lg font-bold text-gray-800 tracking-tight">Quản Lý Hóa Đơn</h1>
          <div className="h-4 w-px bg-gray-300"></div>
          <div className="flex items-center gap-2">
            <select value={timeFilter} onChange={(e) => setTimeFilter(e.target.value)} className="border-none bg-gray-50 hover:bg-gray-100 rounded-lg px-3 py-1.5 font-semibold text-xs text-gray-700 cursor-pointer outline-none transition-colors">
              <option value="Tháng này">Tháng này</option>
              <option value="Hôm nay">Hôm nay</option>
              <option value="7 ngày qua">7 ngày qua</option>
              <option value="Tháng trước">Tháng trước</option>
              <option value="Tất cả">Tất cả thời gian</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-7 pr-3 py-2 border border-gray-300 rounded-lg text-xs font-medium bg-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all appearance-none"
              style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center', backgroundSize: '14px' }}
            >
              <option value="all">📋 Tất cả</option>
              <option value="paid">✅ Đã thanh toán</option>
              <option value="debt">📝 Ghi nợ</option>
              <option value="cancelled">❌ Đã hủy</option>
            </select>
            <Filter className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>

          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Tìm tên khách, SĐT, tên hàng..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-xs outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all bg-white" />
          </div>
        </div>
      </div>

      {/* DẢI CARD THỐNG KÊ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5 print:hidden">
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-[11px] font-bold uppercase tracking-wider mb-1">Tổng Số Đơn</p>
            <p className="text-xl font-bold text-gray-800">{filteredOrders.length} <span className="text-xs font-medium text-gray-500">đơn</span></p>
          </div>
          <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600"><ShoppingBag className="w-5 h-5" /></div>
        </div>
        
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-[11px] font-bold uppercase tracking-wider mb-1">Doanh Số Thu</p>
            <p className="text-xl font-bold text-emerald-600">{totalRevenue.toLocaleString('vi-VN')} <span className="text-xs font-medium text-emerald-500">đ</span></p>
          </div>
          <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600"><TrendingUp className="w-5 h-5" /></div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-[11px] font-bold uppercase tracking-wider mb-1">Khách Nợ Lại</p>
            <p className="text-xl font-bold text-rose-600">{totalDebt.toLocaleString('vi-VN')} <span className="text-xs font-medium text-rose-500">đ</span></p>
          </div>
          <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center text-rose-600"><AlertCircle className="w-5 h-5" /></div>
        </div>
      </div>

      {/* BẢNG DỮ LIỆU ĐƠN HÀNG */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex-1 flex flex-col print:border-none print:shadow-none">
        <div className="overflow-x-auto flex-1 custom-scrollbar">
          <table className="w-full text-left text-sm text-gray-700 border-collapse min-w-[800px]">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-bold sticky top-0 z-10">
              <tr>
                <th className="px-5 py-3 w-[20%] uppercase tracking-wider text-xs">Khách hàng</th>
                <th className="px-5 py-3 w-[35%] uppercase tracking-wider text-xs">Nội dung đơn hàng</th>
                <th className="px-5 py-3 text-center w-[12%] uppercase tracking-wider text-xs">Thời gian</th>
                <th className="px-5 py-3 text-right w-[13%] uppercase tracking-wider text-xs">Tổng tiền</th>
                <th className="px-5 py-3 text-center w-[10%] uppercase tracking-wider text-xs">Trạng thái</th>
                <th className="px-5 py-3 text-center w-[10%] uppercase tracking-wider text-xs print:hidden">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredOrders.length > 0 ? (
                filteredOrders.map((order) => {
                  const isPaid = checkIsPaid(order.status);
                  const isCancelled = checkIsCancelled(order.status);
                  // 🔥 Cập nhật hiển thị bằng hàm parse an toàn
                  const d = parseSafeDate(order.date);

                  return (
                    <tr key={order.id} className={`transition-colors duration-150 ${isCancelled ? 'bg-gray-50/80 opacity-60' : 'hover:bg-gray-50/80'}`}>
                      
                      <td className="px-5 py-3 align-middle">
                        <div className={`font-semibold text-sm line-clamp-2 ${isCancelled ? 'line-through text-gray-400' : 'text-gray-800'}`}>{order.customer_name}</div>
                        <div className={`text-xs mt-1 font-mono tracking-wider ${isCancelled ? 'text-gray-400 line-through' : 'text-blue-600'}`}>#{order.id}</div>
                        {order.customer_phone && <div className={`text-xs mt-0.5 font-mono ${isCancelled ? 'text-gray-400' : 'text-gray-500'}`}>☎ {order.customer_phone}</div>}
                      </td>
                      
                      <td className="px-5 py-3 align-middle">
                        <div className="flex flex-col gap-1 max-h-[76px] overflow-y-auto custom-scrollbar pr-1">
                          {order.items?.map((item: any, idx: number) => (
                            <div key={idx} className={`text-xs flex items-center justify-between gap-2 px-2 py-1.5 rounded border shadow-sm font-sans ${isCancelled ? 'bg-gray-100 border-gray-200 text-gray-400 line-through' : 'bg-white border-gray-200 text-gray-700'}`}>
                              <div className="flex flex-col flex-1">
                                <span className="font-medium line-clamp-1 leading-tight">{item.product_name}</span>
                                {item.serials && <span className={`text-[10px] font-mono mt-0.5 tracking-tighter ${isCancelled ? 'text-gray-400' : 'text-amber-600'}`}>S/N: {item.serials}</span>}
                              </div>
                              <span className={`font-bold px-1.5 py-0.5 rounded shrink-0 ${isCancelled ? 'bg-gray-200 text-gray-500' : 'text-blue-600 bg-blue-50'}`}>x{item.quantity}</span>
                            </div>
                          ))}
                        </div>
                      </td>

                      <td className="px-5 py-3 text-center align-middle">
                        <div className={`text-sm font-bold font-mono ${isCancelled ? 'text-gray-400 line-through' : 'text-gray-700'}`}>{d.toLocaleDateString('vi-VN')}</div>
                        <div className="text-xs text-gray-400 mt-1 font-mono">{d.toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})}</div>
                      </td>
                      
                      <td className="px-5 py-3 text-right align-middle">
                        <div className={`font-bold text-sm font-mono tracking-tight ${isCancelled ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                          {order.total_price?.toLocaleString('vi-VN')} ₫
                        </div>
                        <div className="mt-1.5 flex justify-end">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${isCancelled ? 'bg-gray-100 text-gray-400 border-gray-200' : (order.payment_method === 'Tiền mặt' ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-purple-50 text-purple-600 border-purple-200')}`}>
                            {order.payment_method}
                          </span>
                        </div>
                      </td>

                      <td className="px-5 py-3 text-center align-middle">
                        <span className={`px-2 py-1 rounded-md text-xs font-bold inline-block border uppercase tracking-wider ${
                          isCancelled ? 'bg-gray-200 text-gray-500 border-gray-300' : 
                          isPaid ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-rose-50 text-rose-600 border-rose-200'
                        }`}>
                          {isCancelled ? 'Đã hủy' : (isPaid ? 'Thu đủ' : 'Ghi nợ')}
                        </span>
                      </td>
                      
                      <td className="px-5 py-3 text-center align-middle print:hidden">
                        <div className="flex flex-col items-center justify-center gap-1.5">
                          <button onClick={() => handleOpenDetail(order)} className="inline-flex w-full items-center justify-center gap-1 px-2 py-1.5 bg-white border border-gray-300 text-gray-600 hover:text-blue-600 hover:border-blue-400 hover:bg-blue-50 rounded-lg font-semibold text-xs transition-colors shadow-sm">
                            <Eye className="w-3.5 h-3.5" /> Chi tiết
                          </button>
                          {!isCancelled && (
                            <button onClick={() => triggerAuthDelete(order)} className="inline-flex w-full items-center justify-center gap-1 px-2 py-1.5 bg-red-50 border border-red-100 text-red-600 hover:bg-red-100 hover:border-red-200 rounded-lg font-semibold text-xs transition-colors shadow-sm">
                              <Trash2 className="w-3.5 h-3.5" /> Hủy đơn
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-400">
                      <ShoppingBag className="w-10 h-10 mb-3 opacity-30" />
                      <p className="text-sm font-semibold text-gray-500">Không có hóa đơn nào ở đây!</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= POPUP: CHI TIẾT & SỬA ĐƠN ================= */}
      {isOpen && selectedOrder && (
        <div className="fixed inset-0 bg-gray-900/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm print:bg-white print:p-0">
          <div className="bg-white rounded-2xl w-full max-w-5xl shadow-2xl flex flex-col h-[90vh] text-left overflow-hidden animate-in zoom-in-95 duration-200 print:shadow-none print:w-full print:max-w-none print:h-auto print:border-none">
            
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 bg-gray-50 shrink-0 print:hidden">
              <div>
                <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  Chi Tiết Đơn Hàng <span className="text-blue-600">#{selectedOrder.id}</span>
                  {isSelectedOrderCancelled && <span className="bg-red-100 text-red-600 px-2 py-0.5 rounded text-[10px] uppercase font-black tracking-widest ml-2 border border-red-200">Đơn Đã Hủy</span>}
                </h2>
                <p className="text-xs text-gray-500 mt-1">{isSelectedOrderCancelled ? "Đơn hàng này đã bị hủy, chỉ có thể xem lịch sử." : "Điều chỉnh sản phẩm, công nợ và tự động cân bằng tồn kho"}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => window.print()} className="px-3 py-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5"><Printer className="w-4 h-4" /> In Đơn</button>
                <button onClick={handleCloseDetail} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><X className="w-5 h-5" /></button>
              </div>
            </div>

            <div className="flex-1 overflow-hidden flex flex-col md:flex-row bg-white print:block">
              {/* CỘT TRÁI */}
              <div className="w-full md:w-[60%] p-5 flex flex-col gap-4 h-full border-r border-gray-200 bg-gray-50/50 print:w-full print:border-none print:h-auto">
                {!isSelectedOrderCancelled && (
                  <div className="relative print:hidden" ref={searchProductRef}>
                    <div className="flex items-center bg-white rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus-within:ring-1 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all">
                      <Search className="w-4 h-4 text-blue-500 mr-2" />
                      <input type="text" placeholder="Tìm sản phẩm thêm vào đơn..." value={productSearch} onChange={(e) => { setProductSearch(e.target.value); setShowProductSuggestions(true); }} className="w-full text-xs outline-none font-medium text-gray-700 bg-transparent" />
                    </div>
                    {showProductSuggestions && productSearch && productSuggestions.length > 0 && (
                      <div className="absolute z-50 w-full mt-1 bg-white rounded-lg shadow-xl border border-gray-200 text-xs max-h-60 overflow-y-auto divide-y divide-gray-100">
                        {productSuggestions.map((p: any) => (
                          <div key={p.id} onClick={() => handleAddProductToEditCart(p)} className="p-3 hover:bg-blue-50 cursor-pointer flex justify-between items-center transition-colors">
                            <span className="font-semibold text-gray-800 truncate pr-4">{p.name}</span>
                            <span className="font-bold text-blue-600 shrink-0">{p.price_sell?.toLocaleString()} ₫</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div className="flex-1 bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col shadow-sm print:border-none print:shadow-none">
                  <div className="overflow-y-auto flex-1 custom-scrollbar text-xs print:overflow-visible">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 sticky top-0 z-10 font-bold uppercase tracking-wider text-[10px] print:bg-white print:text-black">
                        <tr>
                          <th className="px-4 py-3">Sản phẩm</th>
                          <th className="px-4 py-3 text-right w-24">Đơn giá</th>
                          <th className="px-4 py-3 text-center w-24">Số lượng</th>
                          <th className="px-4 py-3 text-right w-28">Thành tiền</th>
                          {!isSelectedOrderCancelled && <th className="px-4 py-3 w-10 print:hidden"></th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {cart.map((item) => (
                          <tr key={item.product.name} className="hover:bg-gray-50/50">
                            <td className="px-4 py-3">
                              <div className="font-semibold text-gray-800 leading-tight">{item.product.name}</div>
                              <div className="mt-1.5 flex items-center gap-1.5 bg-white border border-gray-200 rounded-md px-2 py-1 w-full focus-within:border-blue-400 shadow-sm print:border-none print:p-0 print:shadow-none">
                                <QrCode className="w-3 h-3 text-gray-400 shrink-0 print:hidden" />
                                <input type="text" placeholder="S/N hoặc IMEI..." value={item.serials} disabled={isSelectedOrderCancelled} onChange={(e) => handleSerialChange(item.product.name, e.target.value)} className="bg-transparent outline-none text-[10px] w-full font-mono text-gray-700 disabled:bg-transparent" />
                              </div>
                            </td>
                            <td className="px-4 py-3 text-right text-gray-600 font-medium">{item.product.price_sell?.toLocaleString()}</td>
                            <td className="px-4 py-3">
                              <div className={`flex items-center justify-center gap-1 border border-gray-200 rounded-md p-0.5 shadow-sm print:border-none print:shadow-none ${isSelectedOrderCancelled ? 'bg-transparent border-none shadow-none' : 'bg-gray-50'}`}>
                                {!isSelectedOrderCancelled && <button onClick={() => updateQuantity(item.product.name, -1)} className="p-1 hover:bg-white rounded text-gray-600 transition-colors print:hidden"><Minus className="w-3 h-3" /></button>}
                                <span className="font-bold w-5 text-center text-xs">{item.quantity}</span>
                                {!isSelectedOrderCancelled && <button onClick={() => updateQuantity(item.product.name, 1)} className="p-1 hover:bg-white rounded text-gray-600 transition-colors print:hidden"><Plus className="w-3 h-3" /></button>}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-right font-bold text-blue-600">{(item.product.price_sell * item.quantity).toLocaleString()}</td>
                            {!isSelectedOrderCancelled && <td className="px-4 py-3 text-center print:hidden"><button onClick={() => removeFromCart(item.product.name)} className="text-gray-300 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button></td>}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* CỘT PHẢI (40%) */}
              <div className="w-full md:w-[40%] p-5 flex flex-col gap-4 h-full overflow-y-auto custom-scrollbar print:w-full print:h-auto print:overflow-visible">
                
                <div className="space-y-2 bg-white p-4 rounded-xl border border-gray-200 shadow-sm print:border-none print:p-0 print:shadow-none">
                  <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Khách Hàng</h4>
                  <div className="flex items-center bg-gray-50 rounded-lg border border-gray-200 px-3 py-2 focus-within:border-blue-400 transition-colors print:border-none print:bg-transparent print:p-0">
                    <User className="w-3.5 h-3.5 text-gray-400 mr-2 print:hidden" />
                    <input type="text" placeholder="Tên khách hàng..." value={customerSearch} disabled={isSelectedOrderCancelled} onChange={(e) => setCustomerSearch(e.target.value)} className="flex-1 outline-none text-xs font-semibold bg-transparent text-gray-800 disabled:text-gray-600" />
                  </div>
                  <div className="flex items-center bg-gray-50 rounded-lg border border-gray-200 px-3 py-2 focus-within:border-blue-400 transition-colors print:border-none print:bg-transparent print:p-0 print:mt-1">
                    <span className="text-[10px] font-black text-gray-400 mr-2.5 print:hidden">☎</span>
                    <input type="text" placeholder="Số điện thoại..." value={customerPhone} disabled={isSelectedOrderCancelled} onChange={(e) => setCustomerPhone(e.target.value)} className="flex-1 outline-none text-xs font-semibold bg-transparent text-gray-800 font-mono disabled:text-gray-600" />
                  </div>
                </div>

                {/* 🔥 KHỐI THỜI GIAN VÀ GHI CHÚ */}
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-3 print:hidden">
                  <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Thời gian & Ghi chú</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="text-[10px] font-bold text-gray-500 block mb-1.5 uppercase">Thời gian tạo đơn</label>
                      {/* 🔥 Sửa type thành datetime-local để hiện lịch */}
                      <input 
                        type="datetime-local" 
                        disabled={isSelectedOrderCancelled}
                        value={orderDate} 
                        onChange={(e) => setOrderDate(e.target.value)} 
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs font-semibold outline-none focus:border-blue-500 transition-colors bg-gray-50 disabled:opacity-70"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-500 block mb-1.5 uppercase">Ghi chú</label>
                      <textarea 
                        disabled={isSelectedOrderCancelled}
                        placeholder="Nhập ghi chú đơn hàng..." 
                        value={orderNote} 
                        onChange={(e) => setOrderNote(e.target.value)} 
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-blue-500 transition-colors min-h-[60px] bg-gray-50 disabled:opacity-70 custom-scrollbar"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-3 print:hidden">
                  <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Thanh Toán</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-gray-500 block mb-1.5 uppercase tracking-wider">Hình thức</label>
                      <select value={paymentMethod} disabled={isSelectedOrderCancelled} onChange={(e) => setPaymentMethod(e.target.value)} className="w-full border border-gray-200 rounded-lg px-2.5 py-2 font-semibold text-xs outline-none bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed">
                        <option value="Tiền mặt">Tiền mặt</option>
                        <option value="Chuyển khoản">Chuyển khoản</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-500 block mb-1.5 uppercase tracking-wider">Trạng thái</label>
                      <select 
                        value={paymentStatus} 
                        disabled={isSelectedOrderCancelled} 
                        onChange={(e) => setPaymentStatus(e.target.value)} 
                        className={`w-full border rounded-lg px-2.5 py-2 font-bold text-xs outline-none cursor-pointer transition-colors disabled:opacity-70 disabled:cursor-not-allowed ${
                          paymentStatus === 'Đã thanh toán' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                          : paymentStatus === 'Đã hủy' ? 'bg-gray-100 text-gray-600 border-gray-200' 
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}
                      >
                        {isSelectedOrderCancelled && <option value="Đã hủy">Đã Hủy Đơn</option>}
                        <option value="Đã thanh toán">Đã Thu Đủ</option>
                        <option value="Chưa thanh toán">Ghi Nợ</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex-grow flex flex-col justify-end text-xs print:border-none print:p-0 print:shadow-none">
                  <div className="space-y-2.5">
                    <div className="flex justify-between font-semibold text-gray-500"><span>Tiền hàng</span><span>{totalGoodsAmount.toLocaleString()} ₫</span></div>
                    <div className="flex justify-between items-center font-semibold text-gray-500">
                      <span>Chiết khấu</span>
                      <div className="flex items-center border-b border-gray-300 focus-within:border-red-400 transition-colors w-24 print:border-none">
                        <input type="text" disabled={isSelectedOrderCancelled} value={discount === 0 ? '' : discount.toLocaleString()} onChange={(e) => setDiscount(Number(e.target.value.replace(/[^0-9]/g, '')) || 0)} className="w-full text-right outline-none text-red-500 font-bold bg-transparent pb-0.5 disabled:text-gray-500" />
                        <span className="ml-1 text-gray-400 pb-0.5">₫</span>
                      </div>
                    </div>
                    <div className="border-t border-dashed border-gray-200 my-1 print:border-solid print:border-gray-800"></div>
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-gray-800 text-sm">Tổng Thanh Toán</span>
                      <span className="text-xl font-black text-blue-600">{finalAmount.toLocaleString()} ₫</span>
                    </div>
                  </div>
                  
                  <div className={`mt-4 p-3.5 rounded-xl border transition-colors print:hidden ${isSelectedOrderCancelled ? 'bg-gray-50 border-gray-200' : paymentStatus === 'Đã thanh toán' ? 'bg-emerald-50/50 border-emerald-100' : 'bg-rose-50/30 border-rose-100'} space-y-2.5`}>
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-gray-700">
                        {isSelectedOrderCancelled ? 'Khách đã đưa' : paymentStatus === 'Đã thanh toán' ? 'Khách đưa' : 'Khách đặt cọc'}
                      </span>
                      <div className="flex items-center bg-white border border-gray-300 rounded-lg px-2 py-1 w-28 shadow-sm focus-within:border-blue-400 transition-colors">
                        <input type="text" disabled={isSelectedOrderCancelled} value={amountGiven === 0 ? '' : amountGiven.toLocaleString()} onChange={(e) => setAmountGiven(Number(e.target.value.replace(/[^0-9]/g, '')) || 0)} className="w-full text-right outline-none font-bold text-sm bg-transparent disabled:text-gray-600" />
                        <span className="ml-1 font-semibold text-gray-400">₫</span>
                      </div>
                    </div>
                    
                    {isSelectedOrderCancelled ? (
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-gray-500">Trạng thái công nợ</span>
                        <span className="font-black text-gray-400 text-base">Đã Triệt Tiêu</span>
                      </div>
                    ) : paymentStatus === 'Đã thanh toán' ? (
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-gray-500">Tiền thừa trả khách</span>
                        <span className="font-bold text-gray-800">{changeAmount.toLocaleString()} ₫</span>
                      </div>
                    ) : (
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-red-600">Còn nợ lại</span>
                        <span className="font-black text-red-600 text-base">{debtAmount.toLocaleString()} ₫</span>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-2xl flex justify-between items-center shrink-0 print:hidden">
              {!isSelectedOrderCancelled ? (
                <button onClick={() => triggerAuthDelete()} disabled={isActionLoading} className="px-4 py-2 bg-white text-red-600 border border-red-200 rounded-lg hover:bg-red-50 font-bold text-xs transition-colors flex items-center gap-1.5 shadow-sm"><Trash2 className="w-3.5 h-3.5" /> Hủy mềm đơn hàng</button>
              ) : <div></div>}
              <div className="flex gap-2">
                <button onClick={handleCloseDetail} disabled={isActionLoading} className="px-5 py-2 text-gray-600 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg font-bold text-xs transition-colors shadow-sm">Đóng</button>
                {!isSelectedOrderCancelled && (
                  <button onClick={handleSaveChanges} disabled={isActionLoading || (paymentStatus === 'Đã thanh toán' && amountGiven < finalAmount)} className={`px-5 py-2 text-white rounded-lg font-bold text-xs shadow-md transition-colors flex items-center gap-1.5 ${paymentStatus === 'Đã thanh toán' && amountGiven < finalAmount ? 'bg-gray-400 cursor-not-allowed shadow-none' : 'bg-blue-600 hover:bg-blue-700'}`}>{isActionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} {paymentStatus === 'Đã thanh toán' && amountGiven < finalAmount ? 'Khách đưa thiếu tiền' : 'Lưu cập nhật'}</button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* POPUP XÁC THỰC MẬT KHẨU ADMIN */}
      {isAuthOpen && (
        <div className="fixed inset-0 bg-gray-900/70 flex items-center justify-center z-[60] p-4 backdrop-blur-sm print:hidden">
          <div className="bg-white p-6 rounded-2xl w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-2.5 text-red-600 border-b border-gray-100 pb-3 mb-4"><ShieldCheck className="w-6 h-6" /><h3 className="font-bold text-base">Bảo Mật Hệ Thống</h3></div>
            <p className="text-xs text-gray-500 mb-4 leading-relaxed">Xóa đơn hàng sẽ làm giảm doanh thu và hoàn trả hàng hóa về kho. Vui lòng nhập mật khẩu Quản trị viên để tiếp tục.</p>
            <div className="space-y-3 text-xs font-sans">
              <div><label className="block font-bold text-gray-700 mb-1.5">Tài khoản</label><input type="text" placeholder="admin" value={adminUser} onChange={(e) => setAdminUser(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none font-semibold text-gray-800 bg-gray-50 focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all" /></div>
              <div><label className="block font-bold text-gray-700 mb-1.5">Mật khẩu</label><input type="password" placeholder="••••••" value={adminPass} onChange={(e) => setAdminPass(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none font-semibold text-gray-800 bg-gray-50 focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all" /></div>
            </div>
            <div className="flex justify-end gap-2.5 mt-5 text-xs">
              <button onClick={() => setIsAuthOpen(false)} className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 font-bold transition-colors">Bỏ qua</button>
              <button onClick={executeAuthDelete} disabled={isActionLoading} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-bold shadow-md transition-colors">Xác nhận xóa</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}