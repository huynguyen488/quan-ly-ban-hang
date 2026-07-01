// app/pos/PosClient.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { Search, Trash2, Plus, Minus, User, MonitorSpeaker, Receipt, Loader2, QrCode, UserPlus, X, Save } from "lucide-react";
import { quickAddCustomer, createOrder } from "./actions";

interface CartItem {
  product: any;
  quantity: number;
  serials: string; 
}

export default function PosClient({ initialProducts, initialCustomers }: { initialProducts: any[], initialCustomers: any[] }) {

  const [searchTerm, setSearchTerm] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showProductSuggestions, setShowProductSuggestions] = useState(false);
  const searchProductRef = useRef<HTMLDivElement>(null);

  const [discount, setDiscount] = useState<number>(0); 
  const [amountGiven, setAmountGiven] = useState<number>(0); 
  const [paymentMethod, setPaymentMethod] = useState("Tiền mặt"); 
  const [paymentStatus, setPaymentStatus] = useState("Đã thanh toán"); 

  const [customerSearch, setCustomerSearch] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [showCustomerSuggestions, setShowCustomerSuggestions] = useState(false);
  const searchCustomerRef = useRef<HTMLDivElement>(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newCusName, setNewCusName] = useState("");
  const [newCusPhone, setNewCusPhone] = useState("");
  const [newCusAddress, setNewCusAddress] = useState("");
  const [newCusNote, setNewCusNote] = useState("");
  const [isAddingCus, setIsAddingCus] = useState(false);

  const [currentDate, setCurrentDate] = useState("");
  const [orderNote, setOrderNote] = useState(""); 
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const now = new Date();
    const tzOffset = now.getTimezoneOffset() * 60000;
    setCurrentDate(new Date(now.getTime() - tzOffset).toISOString().slice(0, 16));
  }, []);

  useEffect(() => {
    const handleF9 = (e: KeyboardEvent) => {
      if (e.key === "F9") { e.preventDefault(); document.getElementById("btn-checkout")?.click(); }
    };
    window.addEventListener("keydown", handleF9);
    return () => window.removeEventListener("keydown", handleF9);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchProductRef.current && !searchProductRef.current.contains(event.target as Node)) setShowProductSuggestions(false);
      if (searchCustomerRef.current && !searchCustomerRef.current.contains(event.target as Node)) setShowCustomerSuggestions(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const productSuggestions = initialProducts.filter((product) =>
    product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.id?.toString().includes(searchTerm)
  ).slice(0, 10);

  const customerSuggestions = initialCustomers.filter((cus) =>
    cus.name?.toLowerCase().includes(customerSearch.toLowerCase()) || cus.phone?.includes(customerSearch)
  ).slice(0, 5);

  const addToCart = (product: any) => {
    if (product.stock <= 0) { alert(`Hết hàng!`); return; }
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.product.id === product.id);
      if (existingItem) {
        if (existingItem.quantity >= product.stock) { alert(`Kho chỉ còn ${product.stock}!`); return prevCart; }
        return prevCart.map((item) => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prevCart, { product, quantity: 1, serials: "" }];
    });
    setSearchTerm("");
    setShowProductSuggestions(false);
  };

  const handleSerialChange = (productId: number, text: string) => {
    setCart(prev => prev.map(item => item.product.id === productId ? { ...item, serials: text } : item));
  };

  const totalGoodsAmount = cart.reduce((total, item) => total + (item.product.price_sell * item.quantity), 0); 
  const finalAmount = Math.max(0, totalGoodsAmount - discount); 
  
  useEffect(() => {
    if (paymentStatus === 'Đã thanh toán') setAmountGiven(finalAmount);
    else setAmountGiven(0);
  }, [finalAmount, paymentStatus]);

  const formatSafeDate = (dateVal: string) => {
    const d = dateVal ? new Date(dateVal) : new Date();
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    const hours = d.getHours().toString().padStart(2, '0');
    const minutes = d.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}:00 ${day}/${month}/${year}`;
  };

  const handleQuickAddCustomer = async () => {
    if (!newCusName.trim()) return alert("Vui lòng nhập tên khách hàng!");
    setIsAddingCus(true);
    try {
      const newId = await quickAddCustomer(newCusName, newCusPhone, newCusAddress, newCusNote);
      
      setSelectedCustomerId(newId);
      setCustomerSearch(newCusName);
      setCustomerPhone(newCusPhone);
      
      setShowAddModal(false);
      setNewCusName(""); setNewCusPhone(""); setNewCusAddress(""); setNewCusNote("");
      
      alert("✅ Thêm khách hàng mới thành công!");
    } catch (error) {
      alert("❌ Có lỗi xảy ra khi thêm khách! Hãy kiểm tra lại kết nối.");
    } finally {
      setIsAddingCus(false);
    }
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    
    if (customerSearch.trim() && !selectedCustomerId) {
      alert("⚠️ Khách hàng này chưa có trong hệ thống! Vui lòng bấm 'Thêm nhanh' để lưu khách vào CSDL trước khi tạo đơn.");
      return;
    }

    let finalCustomerName = customerSearch.trim();

    if (paymentStatus === 'Chưa thanh toán' && !finalCustomerName) {
      alert("⚠️ Đơn ghi nợ bắt buộc phải chọn thông tin khách hàng từ danh sách để đòi nợ!");
      return;
    }
    if (!finalCustomerName) finalCustomerName = "Khách vãng lai";

    setIsSubmitting(true);
    try {
      const finalDate = formatSafeDate(currentDate);

      const orderId = await createOrder({
        cart,
        customerName: finalCustomerName,
        customerPhone,
        totalPrice: finalAmount,
        discount,
        paymentMethod,
        status: paymentStatus,
        amountGiven,
        orderDate: finalDate, 
        note: orderNote,      
      });
      
      alert(`✅ XUẤT ĐƠN VÀ TRỪ KHO THÀNH CÔNG! Mã đơn: ${orderId}`);
      window.location.href = "/orders"; 

    } catch (error) {
      alert("❌ Lỗi lưu đơn!");
    } finally { setIsSubmitting(false); }
  };

  return (
    // 🔥 BỌC THÉP RESPONSIVE: Dùng flex-col cho mobile (xếp chồng), lg:flex-row cho máy tính (trái-phải)
    <div className="flex flex-col lg:flex-row w-full min-h-full bg-gray-100 text-sm lg:overflow-hidden pb-10 lg:pb-0">
      
      {/* ================= CỘT TRÁI (TÌM KIẾM & BẢNG) ================= */}
      {/* Mobile: Rộng 100% (w-full). PC: Rộng 65% (lg:w-[65%]) */}
      <div className="w-full lg:w-[65%] flex flex-col p-3 lg:p-4 gap-4 flex-none lg:h-full lg:overflow-hidden">
        
        {/* Ô TÌM SẢN PHẨM / QUÉT MÃ VẠCH */}
        <div className="relative shrink-0" ref={searchProductRef}>
          <div className="flex items-center bg-white rounded-xl shadow-sm border border-gray-200 px-4 py-3 focus-within:border-blue-500 transition-colors">
            <Search className="w-5 h-5 lg:w-6 lg:h-6 text-blue-500 mr-3" />
            <input type="text" autoFocus placeholder="Quét mã vạch hoặc nhập tên thiết bị..." value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setShowProductSuggestions(true); }} onFocus={() => setShowProductSuggestions(true)} className="flex-1 text-base lg:text-lg outline-none font-medium text-gray-800 bg-transparent" />
          </div>
          {showProductSuggestions && searchTerm && productSuggestions.length > 0 && (
            <div className="absolute z-50 w-full mt-2 bg-white rounded-xl shadow-2xl border max-h-80 overflow-y-auto divide-y">
              {productSuggestions.map((p) => (
                <div key={p.id} onClick={() => addToCart(p)} className="p-3 hover:bg-blue-50 cursor-pointer flex justify-between">
                  <div><p className="font-bold text-gray-800">{p.name}</p><p className="text-xs text-gray-400">Mã: #{p.id} | Tồn: {p.stock}</p></div>
                  <p className="font-bold text-blue-600">{p.price_sell?.toLocaleString()} đ</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* BẢNG GIỎ HÀNG */}
        {/* Mobile: Tạo min-height để cái khung ko bị dẹp nếu ko có SP. Cấm vỡ layout */}
        <div className="flex-1 bg-white rounded-xl shadow-sm border flex flex-col min-h-[400px] lg:min-h-0 overflow-hidden">
          <div className="overflow-x-auto flex-1 custom-scrollbar">
            {/* 🔥 BỌC THÉP: min-w-[650px] để bắt buộc vuốt ngang trên đt, chống ép chữ */}
            <table className="w-full text-left min-w-[650px]">
              <thead className="bg-blue-50/50 border-b font-semibold sticky top-0 z-10 text-gray-700">
                <tr>
                  <th className="p-3 w-12 text-center">STT</th>
                  <th className="p-3">Sản phẩm & Số Serial Máy</th>
                  <th className="p-3 text-right w-28">Đơn giá</th>
                  <th className="p-3 text-center w-28">SL</th>
                  <th className="p-3 text-right w-32">Thành tiền</th>
                  <th className="p-3 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {cart.length === 0 ? (
                  <tr><td colSpan={6} className="h-64 text-center text-gray-400"><MonitorSpeaker className="w-12 h-12 mx-auto mb-2 opacity-35" />Quét sản phẩm điện máy nhập đơn</td></tr>
                ) : (
                  cart.map((item, index) => (
                    <tr key={item.product.id} className="hover:bg-gray-50/60 group">
                      <td className="p-3 text-center text-gray-400 font-medium">{index + 1}</td>
                      <td className="p-3">
                        <div className="font-bold text-gray-900 leading-tight">{item.product.name}</div>
                        <div className="mt-1.5 flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded px-2 py-1 max-w-sm">
                          <QrCode className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          <input 
                            type="text" 
                            placeholder="Nhập hoặc quét mã Serial / IMEI máy..." 
                            value={item.serials}
                            onChange={(e) => handleSerialChange(item.product.id, e.target.value)}
                            className="bg-transparent outline-none text-xs w-full text-gray-700 font-mono"
                          />
                        </div>
                      </td>
                      <td className="p-3 text-right font-medium text-gray-600">{item.product.price_sell?.toLocaleString()}</td>
                      <td className="p-3">
                        <div className="flex items-center justify-center gap-1 border rounded p-0.5 w-fit mx-auto bg-white">
                          <button onClick={() => setCart(prev => prev.map(i => i.product.id === item.product.id && i.quantity > 1 ? { ...i, quantity: i.quantity - 1 } : i))} className="p-1 hover:bg-gray-100 rounded text-gray-600"><Minus className="w-3 h-3" /></button>
                          <span className="font-bold px-2 text-xs w-6 text-center">{item.quantity}</span>
                          <button onClick={() => setCart(prev => prev.map(i => i.product.id === item.product.id && i.quantity < item.product.stock ? { ...i, quantity: i.quantity + 1 } : i))} className="p-1 hover:bg-gray-100 rounded text-gray-600"><Plus className="w-3 h-3" /></button>
                        </div>
                      </td>
                      <td className="p-3 text-right font-bold text-blue-600 font-mono">{(item.product.price_sell * item.quantity).toLocaleString()} đ</td>
                      <td className="p-3 text-center"><button onClick={() => setCart(prev => prev.filter(i => i.product.id !== item.product.id))} className="text-gray-300 hover:text-red-500 lg:opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-4 h-4" /></button></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ================= CỘT PHẢI (THANH TOÁN) ================= */}
      {/* Mobile: Tự động đẩy xuống dưới (mt-2). PC: Đứng bên phải (lg:border-l, lg:w-[35%]) */}
      <div className="w-full lg:w-[35%] bg-white border-t lg:border-t-0 lg:border-l border-gray-200 shadow-xl flex flex-col flex-none lg:h-full mt-2 lg:mt-0 lg:overflow-y-auto">
        <div className="p-4 bg-blue-600 text-white font-bold text-base flex items-center gap-2 shrink-0"><Receipt className="w-5 h-5" />Thông Tin Đơn</div>
        
        <div className="p-4 border-b bg-gray-50/50 space-y-3 shrink-0">
          
          <div className="relative" ref={searchCustomerRef}>
            <div className="bg-white border border-gray-300 rounded px-3 py-2 flex items-center focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-400 transition-colors shadow-sm">
              <User className="w-4 h-4 text-gray-400 mr-2 shrink-0" />
              <input 
                type="text" 
                placeholder="Tìm khách... (Bỏ trống = Khách vãng lai)" 
                value={customerSearch} 
                onChange={(e) => { 
                  setCustomerSearch(e.target.value); 
                  setShowCustomerSuggestions(true); 
                  setSelectedCustomerId(null); 
                  setCustomerPhone(""); 
                }} 
                onFocus={() => setShowCustomerSuggestions(true)}
                className="w-full bg-transparent outline-none font-medium text-gray-800" 
              />
            </div>

            {showCustomerSuggestions && (
              <div className="absolute z-50 w-full mt-1 bg-white rounded-lg shadow-xl border border-gray-200 text-xs max-h-64 flex flex-col overflow-hidden">
                <div className="overflow-y-auto divide-y divide-gray-100">
                  {customerSuggestions.length > 0 ? (
                    customerSuggestions.map((cus: any) => (
                      <div 
                        key={cus.id} 
                        onClick={() => {
                          setCustomerSearch(cus.name);
                          setCustomerPhone(cus.phone || "");
                          setSelectedCustomerId(cus.id);
                          setShowCustomerSuggestions(false);
                        }} 
                        className="p-3 hover:bg-blue-50 cursor-pointer flex flex-col transition-colors"
                      >
                        <span className="font-bold text-gray-800">{cus.name}</span>
                        {cus.phone && <span className="font-mono text-[10px] text-gray-500 mt-0.5">☎ {cus.phone}</span>}
                      </div>
                    ))
                  ) : (
                    <div className="p-3 text-center text-gray-500 font-medium">Khách hàng mới chưa có trong hệ thống.</div>
                  )}
                </div>

                {customerSearch && !selectedCustomerId && (
                  <div 
                    onClick={() => {
                      setNewCusName(customerSearch);
                      setNewCusPhone("");
                      setNewCusAddress("");
                      setNewCusNote("");
                      setShowAddModal(true);
                      setShowCustomerSuggestions(false);
                    }}
                    className="p-3 bg-blue-50 hover:bg-blue-100 text-blue-600 font-bold cursor-pointer flex items-center justify-center gap-1.5 border-t border-blue-100 transition-colors shadow-inner"
                  >
                    <Plus className="w-4 h-4" /> Thêm nhanh: {customerSearch}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="bg-gray-100 border border-gray-200 rounded px-3 py-2 flex items-center shadow-inner">
            <span className="text-xs text-gray-400 mr-2 shrink-0">☎</span>
            <input type="text" placeholder="Số điện thoại (Tự động điền)..." readOnly value={customerPhone} className="w-full bg-transparent outline-none font-medium text-gray-500 cursor-not-allowed" />
          </div>
          
          <div className="space-y-3 mt-4 pt-3 border-t border-gray-200">
            <div>
              <label className="text-[10px] font-bold text-gray-500 block mb-1.5 uppercase tracking-wider">Thời gian tạo đơn</label>
              <input type="datetime-local" value={currentDate} onChange={(e) => setCurrentDate(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs font-semibold outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all bg-white" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-500 block mb-1.5 uppercase tracking-wider">Ghi chú (Tùy chọn)</label>
              <textarea placeholder="Khách dặn dò gì thêm..." value={orderNote} onChange={(e) => setOrderNote(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all min-h-[60px] custom-scrollbar bg-white" />
            </div>
          </div>
        </div>

        <div className="p-4 border-b text-xs grid grid-cols-2 gap-3 shrink-0">
          <div><label className="font-semibold text-gray-500 block mb-1">Hình thức</label><select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="w-full border rounded p-1.5 outline-none bg-gray-50"><option value="Tiền mặt">Tiền mặt</option><option value="Chuyển khoản">Chuyển khoản</option></select></div>
          <div><label className="font-semibold text-gray-500 block mb-1">Trạng thái</label><select value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)} className="w-full border rounded p-1.5 font-bold outline-none bg-gray-50 text-blue-700"><option value="Đã thanh toán">Đã thanh toán đủ</option><option value="Chưa thanh toán">Ghi nợ / Đặt cọc</option></select></div>
        </div>
        
        <div className="p-4 flex-1 space-y-3 font-medium text-gray-700 min-h-[220px]">
          <div className="flex justify-between"><span>Tổng tiền hàng:</span><span>{totalGoodsAmount.toLocaleString()} đ</span></div>
          <div className="flex justify-between items-center"><span>Chiết khấu giảm giá:</span><input type="text" value={discount === 0 ? "" : discount.toLocaleString()} onChange={(e) => setDiscount(Number(e.target.value.replace(/[^0-9]/g, '')) || 0)} className="w-24 text-right border-b outline-none text-red-500 font-bold" placeholder="0" /></div>
          <div className="h-px bg-gray-200"></div>
          <div className="flex justify-between items-end"><span className="font-bold text-gray-900 text-base">Khách Cần Trả:</span><span className="text-2xl font-black text-blue-600">{finalAmount.toLocaleString()} đ</span></div>
          <div className={`p-3 rounded-xl border space-y-2 ${paymentStatus === 'Đã thanh toán' ? 'bg-blue-50/50 border-blue-100' : 'bg-amber-50/40 border-amber-100'}`}>
            <div className="flex justify-between items-center"><span className="font-bold text-gray-700">{paymentStatus === 'Đã thanh toán' ? 'Khách đưa:' : 'Khách cọc:'}</span><input type="text" value={amountGiven === 0 ? "" : amountGiven.toLocaleString()} onChange={(e) => setAmountGiven(Number(e.target.value.replace(/[^0-9]/g, '')) || 0)} className="w-28 text-right font-bold text-base border-b bg-transparent outline-none focus:border-blue-400 transition-colors" /></div>
            <div className="flex justify-between text-xs text-gray-500"><span>{paymentStatus === 'Đã thanh toán' ? 'Tiền thừa trả khách:' : 'Tiền khách nợ lại:'}</span><span className="font-bold">{paymentStatus === 'Đã thanh toán' ? (amountGiven - finalAmount > 0 ? (amountGiven - finalAmount).toLocaleString() : 0) : (finalAmount - amountGiven > 0 ? (finalAmount - amountGiven).toLocaleString() : 0)} đ</span></div>
          </div>
        </div>
        
        {/* Nút Tạo Đơn - Đã thêm dính đáy trên mobile */}
        <div className="p-4 bg-gray-50 border-t sticky bottom-0 z-20 shrink-0">
          <button id="btn-checkout" onClick={handleCheckout} disabled={cart.length === 0 || isSubmitting || (paymentStatus === 'Đã thanh toán' && amountGiven < finalAmount)} className={`w-full py-3.5 rounded-xl font-bold text-white shadow-md flex items-center justify-center gap-2 transition-all ${cart.length === 0 || (paymentStatus === 'Đã thanh toán' && amountGiven < finalAmount) ? 'bg-gray-400 cursor-not-allowed shadow-none' : 'bg-blue-600 hover:bg-blue-700 active:scale-[0.98]'}`}>
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Receipt className="w-5 h-5" />}
            {paymentStatus === 'Đã thanh toán' && amountGiven < finalAmount ? "KHÁCH ĐƯA THIẾU TIỀN" : "TẠO HÓA ĐƠN (F9)"}
          </button>
        </div>
      </div>

      {/* POPUP THÊM NHANH KHÁCH HÀNG */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-900/60 flex items-center justify-center z-[60] p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden border border-gray-100">
            <div className="px-5 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
              <h3 className="font-bold text-gray-800 flex items-center gap-2"><UserPlus className="w-5 h-5 text-blue-600" /> Thêm Khách Hàng Mới</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-red-500 transition-colors bg-gray-100 p-1.5 rounded-lg hover:bg-red-50"><X className="w-4 h-4" /></button>
            </div>
            
            <div className="p-5 space-y-4 text-xs font-sans">
              <div>
                <label className="block font-bold text-gray-700 mb-1.5 uppercase tracking-wide text-[10px]">Tên khách hàng <span className="text-red-500">*</span></label>
                <input autoFocus type="text" value={newCusName} onChange={(e) => setNewCusName(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 outline-none font-semibold text-gray-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm" />
              </div>
              <div>
                <label className="block font-bold text-gray-700 mb-1.5 uppercase tracking-wide text-[10px]">Số điện thoại</label>
                <input type="text" placeholder="Nhập số điện thoại..." value={newCusPhone} onChange={(e) => setNewCusPhone(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 outline-none font-semibold text-gray-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm" />
              </div>
              <div>
                <label className="block font-bold text-gray-700 mb-1.5 uppercase tracking-wide text-[10px]">Địa chỉ</label>
                <input type="text" placeholder="Số nhà, đường, phường/xã..." value={newCusAddress} onChange={(e) => setNewCusAddress(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 outline-none font-semibold text-gray-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm" />
              </div>
              <div>
                <label className="block font-bold text-gray-700 mb-1.5 uppercase tracking-wide text-[10px]">Ghi chú khách</label>
                <textarea placeholder="Khách thích gì, lưu ý gì..." value={newCusNote} onChange={(e) => setNewCusNote(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 outline-none font-semibold text-gray-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm min-h-[60px]" />
              </div>
            </div>
            
            <div className="px-5 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-2 text-xs">
              <button onClick={() => setShowAddModal(false)} className="px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 font-bold transition-colors">Hủy bỏ</button>
              <button onClick={handleQuickAddCustomer} disabled={isAddingCus || !newCusName.trim()} className={`px-5 py-2 text-white rounded-lg font-bold shadow-md transition-colors flex items-center gap-1.5 ${(!newCusName.trim() || isAddingCus) ? 'bg-blue-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}>
                {isAddingCus ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Lưu Khách & Chọn
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}