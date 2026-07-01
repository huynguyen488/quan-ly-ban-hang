// app/pos/PosClient.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { Search, Trash2, Plus, Minus, User, MonitorSpeaker, Receipt, CalendarClock, Loader2, QrCode } from "lucide-react";
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

  const [currentDate, setCurrentDate] = useState("");
  const [orderNote, setOrderNote] = useState(""); // 🔥 Thêm state Ghi chú
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

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    let finalCustomerName = customerSearch.trim();

    if (paymentStatus === 'Chưa thanh toán' && !finalCustomerName) {
      alert("Đơn ghi nợ bắt buộc phải nhập thông tin tên khách hàng để đòi nợ!");
      return;
    }
    if (paymentStatus === 'Đã thanh toán' && !finalCustomerName) finalCustomerName = "Khách vãng lai";

    setIsSubmitting(true);
    try {
      // 🔥 Xử lý format ngày tháng cho đẹp trước khi lưu
      const finalDate = currentDate ? new Date(currentDate).toLocaleString('vi-VN') : new Date().toLocaleString('vi-VN');

      const orderId = await createOrder({
        cart,
        customerName: finalCustomerName,
        customerPhone,
        totalPrice: finalAmount,
        discount,
        paymentMethod,
        status: paymentStatus,
        amountGiven,
        orderDate: finalDate, // Truyền ngày
        note: orderNote,      // Truyền ghi chú
      });
      alert(`✅ XUẤT ĐƠN VÀ TRỪ KHO THÀNH CÔNG! Mã đơn: ${orderId}`);
      
      // Xóa form sau khi lưu
      setCart([]); setCustomerSearch(""); setCustomerPhone(""); setDiscount(0); setOrderNote("");
      const now = new Date();
      const tzOffset = now.getTimezoneOffset() * 60000;
      setCurrentDate(new Date(now.getTime() - tzOffset).toISOString().slice(0, 16));
    } catch (error) {
      alert("❌ Lỗi lưu đơn!");
    } finally { setIsSubmitting(false); }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100 text-sm">
      <div className="w-[65%] flex flex-col p-4 gap-4">
        {/* Ô TÌM SẢN PHẨM / QUÉT MÃ VẠCH */}
        <div className="relative" ref={searchProductRef}>
          <div className="flex items-center bg-white rounded-xl shadow-sm border border-gray-200 px-4 py-3">
            <Search className="w-6 h-6 text-blue-500 mr-3" />
            <input type="text" autoFocus placeholder="Quét mã vạch hoặc nhập tên thiết bị điện tử..." value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setShowProductSuggestions(true); }} className="flex-1 text-lg outline-none font-medium text-gray-800 bg-transparent" />
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

        {/* BẢNG GIỎ HÀNG CÓ Ô NHẬP SERIAL/IMEI */}
        <div className="flex-1 bg-white rounded-xl shadow-sm border overflow-hidden flex flex-col">
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left">
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
                          <button onClick={() => setCart(prev => prev.map(i => i.product.id === item.product.id && i.quantity > 1 ? { ...i, quantity: i.quantity - 1 } : i))} className="p-1 hover:bg-gray-100 rounded"><Minus className="w-3 h-3" /></button>
                          <span className="font-bold px-2 text-xs">{item.quantity}</span>
                          <button onClick={() => setCart(prev => prev.map(i => i.product.id === item.product.id && i.quantity < item.product.stock ? { ...i, quantity: i.quantity + 1 } : i))} className="p-1 hover:bg-gray-100 rounded"><Plus className="w-3 h-3" /></button>
                        </div>
                      </td>
                      <td className="p-3 text-right font-bold text-blue-600 font-mono">{(item.product.price_sell * item.quantity).toLocaleString()} đ</td>
                      <td className="p-3 text-center"><button onClick={() => setCart(prev => prev.filter(i => i.product.id !== item.product.id))} className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-4 h-4" /></button></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* CỘT TÍNH TIỀN BÊN PHẢI */}
      <div className="w-[35%] bg-white border-l shadow-xl flex flex-col">
        <div className="p-4 bg-blue-600 text-white font-bold text-base flex items-center gap-2"><Receipt className="w-5 h-5" />Thông Tin Đơn</div>
        
        <div className="p-4 border-b bg-gray-50/50 space-y-3">
          <div className="bg-white border rounded px-3 py-2 flex items-center"><User className="w-4 h-4 text-gray-400 mr-2" /><input type="text" placeholder="Tên khách hàng..." value={customerSearch} onChange={(e) => setCustomerSearch(e.target.value)} className="w-full bg-transparent outline-none font-medium" /></div>
          <div className="bg-white border rounded px-3 py-2 flex items-center"><span className="text-xs text-gray-400 mr-2">☎</span><input type="text" placeholder="Số điện thoại..." value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} className="w-full bg-transparent outline-none font-medium" /></div>
          
          {/* 🔥 KHỐI THỜI GIAN VÀ GHI CHÚ */}
          <div className="space-y-3 mt-4 pt-3 border-t border-gray-200">
            <div>
              <label className="text-[10px] font-bold text-gray-500 block mb-1.5 uppercase tracking-wider">Thời gian tạo đơn</label>
              <input 
                type="datetime-local" 
                value={currentDate} 
                onChange={(e) => setCurrentDate(e.target.value)} 
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs font-semibold outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all bg-white"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-500 block mb-1.5 uppercase tracking-wider">Ghi chú (Tùy chọn)</label>
              <textarea 
                placeholder="Khách dặn dò gì thêm..." 
                value={orderNote} 
                onChange={(e) => setOrderNote(e.target.value)} 
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all min-h-[60px] custom-scrollbar bg-white"
              />
            </div>
          </div>
        </div>

        <div className="p-4 border-b text-xs grid grid-cols-2 gap-3">
          <div><label className="font-semibold text-gray-500 block mb-1">Hình thức</label><select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="w-full border rounded p-1.5 outline-none bg-gray-50"><option value="Tiền mặt">Tiền mặt</option><option value="Chuyển khoản">Chuyển khoản</option></select></div>
          <div><label className="font-semibold text-gray-500 block mb-1">Trạng thái</label><select value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)} className="w-full border rounded p-1.5 font-bold outline-none bg-gray-50 text-blue-700"><option value="Đã thanh toán">Đã thanh toán đủ</option><option value="Chưa thanh toán">Ghi nợ / Đặt cọc</option></select></div>
        </div>
        <div className="p-4 flex-1 space-y-3 font-medium text-gray-700">
          <div className="flex justify-between"><span>Tổng tiền hàng:</span><span>{totalGoodsAmount.toLocaleString()} đ</span></div>
          <div className="flex justify-between items-center"><span>Chiết khấu giảm giá:</span><input type="text" value={discount === 0 ? "" : discount.toLocaleString()} onChange={(e) => setDiscount(Number(e.target.value.replace(/[^0-9]/g, '')) || 0)} className="w-24 text-right border-b outline-none text-red-500 font-bold" placeholder="0" /></div>
          <div className="h-px bg-gray-200"></div>
          <div className="flex justify-between items-end"><span className="font-bold text-gray-900 text-base">Khách Cần Trả:</span><span className="text-2xl font-black text-blue-600">{finalAmount.toLocaleString()} đ</span></div>
          <div className={`p-3 rounded-xl border space-y-2 ${paymentStatus === 'Đã thanh toán' ? 'bg-blue-50/50' : 'bg-amber-50/40'}`}>
            <div className="flex justify-between items-center"><span className="font-bold text-gray-700">{paymentStatus === 'Đã thanh toán' ? 'Khách đưa:' : 'Khách cọc:'}</span><input type="text" value={amountGiven === 0 ? "" : amountGiven.toLocaleString()} onChange={(e) => setAmountGiven(Number(e.target.value.replace(/[^0-9]/g, '')) || 0)} className="w-28 text-right font-bold text-base border-b bg-transparent outline-none" /></div>
            <div className="flex justify-between text-xs text-gray-500"><span>{paymentStatus === 'Đã thanh toán' ? 'Tiền thừa trả khách:' : 'Tiền khách nợ lại:'}</span><span className="font-bold">{paymentStatus === 'Đã thanh toán' ? (amountGiven - finalAmount > 0 ? (amountGiven - finalAmount).toLocaleString() : 0) : (finalAmount - amountGiven > 0 ? (finalAmount - amountGiven).toLocaleString() : 0)} đ</span></div>
          </div>
        </div>
        <div className="p-4 bg-gray-50 border-t"><button id="btn-checkout" onClick={handleCheckout} disabled={cart.length === 0 || isSubmitting || (paymentStatus === 'Đã thanh toán' && amountGiven < finalAmount)} className={`w-full py-3.5 rounded-xl font-bold text-white shadow-md flex items-center justify-center gap-2 ${cart.length === 0 || (paymentStatus === 'Đã thanh toán' && amountGiven < finalAmount) ? 'bg-gray-400 cursor-not-allowed shadow-none' : 'bg-blue-600 hover:bg-blue-700'}`}>{isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Receipt className="w-5 h-5" />}{paymentStatus === 'Đã thanh toán' && amountGiven < finalAmount ? "KHÁCH ĐƯA THIẾU TIỀN" : "TẠO HÓA ĐƠN (F9)"}</button></div>
      </div>
    </div>
  );
}