// app/debts/statement/StatementView.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, PlusCircle, X, Wallet, TrendingUp, TrendingDown, Loader2, Trash2, ShieldCheck } from "lucide-react";

export default function StatementView({ 
  customerName, cusOrders, cusReceipts, onCreateReceipt, onDeleteReceipt, onVerifyAdmin 
}: { 
  customerName: string; cusOrders: any[]; cusReceipts: any[]; 
  onCreateReceipt: any; onDeleteReceipt: any; onVerifyAdmin: any; 
}) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [amountInput, setAmountInput] = useState(""); 
  const [noteInput, setNoteInput] = useState("Thanh toán công nợ");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [adminUser, setAdminUser] = useState("");
  const [adminPass, setAdminPass] = useState("");
  const [deleteReason, setDeleteReason] = useState("");
  const [receiptToDelete, setReceiptToDelete] = useState<number | null>(null);

  const handleMoneyChange = (val: string) => {
    const cleanNumber = val.replace(/\D/g, "");
    if (!cleanNumber) {
      setAmountInput("");
      return;
    }
    const formatted = cleanNumber.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    setAmountInput(formatted);
  };

  // 🔥 HÀM TÌM ĐƠN HỦY BỌC THÉP
  const checkIsCancelled = (status: any) => {
    if (!status) return false;
    const s = String(status).trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return s.includes("huy") || s.includes("cancel");
  };

  let statementItems: any[] = [];
  let totalDebit = 0; 

  // 🔥 ĐÃ SỬA: Lọc bọc thép, KHÔNG cho phép đơn hủy lọt vào Công Nợ
  const debtOrders = cusOrders.filter(o => {
    const s = String(o.status || "").trim().toLowerCase();
    const isPaid = s.includes('đã thanh toán') || s.includes('hoàn thành') || s.includes('paid') || s === '1' || s === 'true' || s === 'success' || s.includes('đủ');
    const isCancelled = checkIsCancelled(o.status);
    
    // Chỉ đưa vào sổ nợ nếu: CHƯA THANH TOÁN và KHÔNG BỊ HỦY
    return !isPaid && !isCancelled;
  });

  for (const order of debtOrders) {
    const amount = order.total_price || 0;
    totalDebit += amount;
    statementItems.push({
      type: 'order',
      id: order.id,
      date: order.date ? order.date.slice(0, 16) : '---',
      amount: amount,
      desc: `Mua nợ đơn hàng #${order.id}`
    });
  }

  let totalCredit = 0; 
  for (const receipt of cusReceipts) {
    const noteStr = String(receipt.note || "");
    const isDeleted = noteStr.includes("[ĐÃ HỦY]");
    
    let displayAmount = receipt.amount || 0;
    let deleteReasonText = "";
    let displayNote = noteStr;

    if (isDeleted) {
       const parts = noteStr.split("|");
       deleteReasonText = parts[0].replace("[ĐÃ HỦY] Lý do:", "").trim();
       
       const amountMatch = noteStr.match(/Gốc: (\d+)/);
       if (amountMatch) displayAmount = parseInt(amountMatch[1], 10);
       
       displayNote = parts.length > 2 ? parts[2].replace("Cũ:", "").trim() : "";
    }

    totalCredit += receipt.amount || 0;

    statementItems.push({
      type: 'receipt',
      id: receipt.id,
      date: receipt.date ? receipt.date.slice(0, 16) : '---',
      amount: displayAmount,
      realAmount: receipt.amount || 0,
      desc: displayNote || "Thanh toán công nợ",
      isDeleted: isDeleted,
      deleteReason: deleteReasonText
    });
  }

  statementItems.sort((a, b) => {
    if (a.date === '---') return -1;
    if (b.date === '---') return 1;
    return new Date(a.date).getTime() - new Date(b.date).getTime();
  });

  let runningBalance = 0;
  const processedStatement = statementItems.map((item) => {
    if (item.type === 'order') {
      runningBalance += item.amount;
      return { ...item, debit: item.amount, credit: 0, balance: runningBalance };
    } else {
      runningBalance -= item.realAmount;
      return { ...item, debit: 0, credit: item.amount, balance: runningBalance }; 
    }
  });

  const currentBalance = runningBalance;

  const handleCreateReceipt = async () => {
    const rawAmount = Number(amountInput.replace(/\./g, ""));
    if (!rawAmount || rawAmount <= 0) return alert("Vui lòng nhập số tiền thu hợp lệ!");
    if (!noteInput.trim()) return alert("Vui lòng nhập nội dung ghi chú!");

    const nowStr = new Date().toLocaleString('sv'); 
    setIsSubmitting(true);
    try {
      await onCreateReceipt({ customer_name: customerName, amount: rawAmount, date: nowStr.slice(0, 16), note: noteInput });
      alert("✅ Lập phiếu thu thành công!");
      setIsModalOpen(false);
      setAmountInput("");
      setNoteInput("Thanh toán công nợ");
    } catch(e) { alert("Lỗi tạo phiếu thu!"); } finally { setIsSubmitting(false); }
  };

  const triggerDelete = (receiptId: number) => {
    setReceiptToDelete(receiptId);
    setAdminUser("");
    setAdminPass("");
    setDeleteReason("");
    setIsAuthOpen(true);
  };

  const executeAuthDelete = async () => {
    if (!receiptToDelete) return;
    if (!deleteReason.trim()) return alert("Sếp phải nhập lý do hủy phiếu thu để ghi vào sổ!");
    
    setIsSubmitting(true);
    try {
      const auth = await onVerifyAdmin(adminUser, adminPass);
      if (!auth.success) {
        alert(auth.message);
        setIsSubmitting(false);
        return;
      }
      await onDeleteReceipt(receiptToDelete, deleteReason);
      alert("✅ Đã hủy phiếu thu và khôi phục trạng thái nợ thành công!");
      setIsAuthOpen(false);
      setReceiptToDelete(null);
    } catch (e) { alert("Lỗi khi xóa phiếu thu!"); } finally { setIsSubmitting(false); }
  };

  return (
    <div className="p-6 h-full flex flex-col bg-slate-50 font-sans text-sm animate-in fade-in duration-200">
      
      <div className="flex justify-between items-center mb-4 bg-white px-5 py-3.5 rounded-xl shadow-sm border border-gray-200">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-xs font-bold text-gray-600 hover:text-blue-600 bg-gray-50 px-3.5 py-2 rounded-lg border border-gray-200 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Quay lại danh sách nợ
        </button>
        <h1 className="text-base font-extrabold text-gray-800 tracking-wide">Sao Kê Công Nợ: <span className="text-pink-600">{customerName}</span></h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm items-center">
        <div className="bg-red-50 p-3 rounded-xl border border-red-100 flex items-center gap-3.5 h-20">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-700 shrink-0"><TrendingUp className="w-5 h-5" /></div>
          <div><span className="text-[10px] font-bold text-gray-500 block uppercase tracking-wider mb-0.5">Phát sinh nợ</span><span className="font-black text-red-600 text-sm font-mono tracking-tight">{totalDebit.toLocaleString('vi-VN')} đ</span></div>
        </div>
        <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-100 flex items-center gap-3.5 h-20">
          <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0"><TrendingDown className="w-5 h-5" /></div>
          <div><span className="text-[10px] font-bold text-gray-500 block uppercase tracking-wider mb-0.5">Đã thanh toán</span><span className="font-black text-emerald-600 text-sm font-mono tracking-tight">{totalCredit.toLocaleString('vi-VN')} đ</span></div>
        </div>
        <div className="bg-slate-50 p-3 rounded-xl border border-gray-200 flex items-center gap-3.5 h-20 md:col-span-1">
          <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-800 shrink-0"><Wallet className="w-5 h-5" /></div>
          <div><span className="text-[10px] font-bold text-gray-500 block uppercase tracking-wider mb-0.5">Dư nợ hiện tại</span><span className="text-base font-extrabold text-slate-800 font-mono tracking-tight">{currentBalance.toLocaleString('vi-VN')} đ</span></div>
        </div>
        <div className="h-20 flex items-center">
          <button onClick={() => setIsModalOpen(true)} className="w-full h-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs flex flex-col items-center justify-center gap-1 shadow-md transition-all hover:shadow-lg"><PlusCircle className="w-5 h-5" /> THU TIỀN NỢ</button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex-1 flex flex-col">
        <div className="overflow-y-auto h-full custom-scrollbar">
          <table className="w-full text-left text-xs text-gray-600 border-collapse">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-700 font-bold sticky top-0 z-10 shadow-sm whitespace-nowrap">
              <tr>
                <th className="px-5 py-4 w-36 text-center">Thời gian</th>
                <th className="px-5 py-3.5 min-w-[200px]">Nội dung phát sinh</th>
                <th className="px-5 py-3.5 text-right w-32 text-red-600">Ghi Nợ (+)</th>
                <th className="px-5 py-3.5 text-right w-32 text-emerald-600">Thanh Toán (-)</th>
                <th className="px-5 py-3.5 text-right w-32 text-black">Số dư (Dư nợ)</th>
                <th className="px-5 py-3.5 text-center w-20">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white font-sans text-xs">
              {processedStatement.length > 0 ? (
                processedStatement.map((item, index) => (
                  <tr key={index} className={`transition-colors ${item.isDeleted ? 'bg-gray-50/80 opacity-60' : 'hover:bg-blue-50/20'}`}>
                    <td className={`px-5 py-3.5 text-center font-mono text-gray-400 ${item.isDeleted ? 'line-through' : ''}`}>{item.date}</td>
                    <td className="px-5 py-3.5">
                      <span className={`font-bold block leading-normal ${item.isDeleted ? 'text-gray-500 line-through' : 'text-gray-800'}`}>{item.desc}</span>
                      {item.isDeleted && <span className="text-[10px] text-red-600 font-bold block mt-0.5 bg-red-50/60 border border-red-100 px-1.5 py-0.5 rounded w-fit">⚠️ Lý do hủy: {item.deleteReason}</span>}
                    </td>
                    <td className="px-5 py-3.5 text-right font-bold text-red-600 font-mono tracking-tight">{item.debit > 0 ? `${item.debit.toLocaleString('vi-VN')} đ` : ''}</td>
                    <td className="px-5 py-3.5 text-right font-bold text-emerald-600 font-mono tracking-tight">
                      {item.credit > 0 ? <span className={item.isDeleted ? 'line-through text-gray-400' : ''}>{item.credit.toLocaleString('vi-VN')} đ</span> : ''}
                    </td>
                    <td className="px-5 py-3.5 text-right font-extrabold text-slate-800 font-mono tracking-tight text-sm">{item.balance.toLocaleString('vi-VN')} đ</td>
                    <td className="px-5 py-3.5 text-center">
                      {item.type === 'receipt' && !item.isDeleted && (
                        <button onClick={() => triggerDelete(item.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors inline-block" title="Hủy/Xóa phiếu thu này">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (<tr><td colSpan={6} className="px-6 py-16 text-center text-gray-400 font-medium text-sm">Chưa có giao dịch công nợ nào!</td></tr>)}
            </tbody>
          </table>
        </div>
      </div>

      {/* POPUP THÊM PHIẾU THU */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-150 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50"><h2 className="text-base font-bold text-emerald-800">Lập Phiếu Thu Công Nợ</h2><button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-red-500 p-1 rounded-lg hover:bg-gray-100 transition-colors"><X className="w-5 h-5" /></button></div>
            <div className="p-5 space-y-4">
              <div className="bg-emerald-50 border border-emerald-100 p-2.5 rounded-lg text-[11px] font-bold text-emerald-700 text-center">Thu nợ của khách hàng: {customerName}</div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1.5">Số tiền cần thu (VNĐ) <span className="text-red-500">*</span></label>
                <div className="relative">
                  <input 
                    type="text" 
                    inputMode="numeric"
                    autoFocus 
                    placeholder="VD: 500.000" 
                    value={amountInput} 
                    onChange={(e) => handleMoneyChange(e.target.value)} 
                    className="w-full border border-gray-300 rounded-lg pl-3 pr-8 py-2.5 text-sm font-black text-emerald-600 outline-none focus:ring-1 focus:ring-emerald-500 transition-all font-mono" 
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 font-bold">đ</span>
                </div>
              </div>
              <div><label className="block text-xs font-bold text-gray-600 mb-1.5">Nội dung ghi chú</label><textarea rows={2} placeholder="Nội dung thu tiền..." value={noteInput} onChange={(e) => setNoteInput(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-emerald-500 transition-all resize-none font-medium" /></div>
            </div>
            <div className="px-5 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3"><button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 font-bold text-xs shadow-sm">Hủy bỏ</button><button onClick={handleCreateReceipt} disabled={isSubmitting} className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-bold text-xs shadow-md transition-all flex items-center gap-1.5">{isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wallet className="w-4 h-4" />} LƯU PHIẾU THU</button></div>
          </div>
        </div>
      )}

      {/* POPUP BẢO VỆ XÓA PHIẾU THU */}
      {isAuthOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-2xl w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-2.5 text-red-600 border-b border-gray-100 pb-3 mb-4"><ShieldCheck className="w-6 h-6" /><h3 className="font-bold text-base tracking-wide">Xác Thực Xóa Phiếu Thu</h3></div>
            <p className="text-xs text-gray-500 mb-4 leading-relaxed tracking-wide">Hành động này sẽ hủy phiếu thu và tự động **cộng dồn lại dư nợ**. Phiếu thu bị hủy vẫn sẽ lưu vết vào Lịch sử.</p>
            <div className="space-y-3 text-xs font-sans">
              <div><label className="block font-bold text-red-600 mb-1.5">Lý do hủy (Bắt buộc)</label><input type="text" placeholder="VD: Khách chuyển khoản nhầm..." value={deleteReason} onChange={(e) => setDeleteReason(e.target.value)} className="w-full border border-red-300 bg-red-50 rounded-lg px-3 py-2.5 outline-none font-medium text-red-800 focus:ring-1 focus:ring-red-500 transition-all" /></div>
              <div className="pt-2"><label className="block font-semibold text-gray-600 mb-1.5">Tài khoản Admin</label><input type="text" placeholder="VD: admin" value={adminUser} onChange={(e) => setAdminUser(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 outline-none font-medium text-gray-800 bg-gray-50 focus:bg-white focus:ring-1 focus:ring-blue-500 transition-all" /></div>
              <div><label className="block font-semibold text-gray-600 mb-1.5">Mật khẩu</label><input type="password" placeholder="VD: 123456" value={adminPass} onChange={(e) => setAdminPass(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 outline-none font-medium text-gray-800 bg-gray-50 focus:bg-white focus:ring-1 focus:ring-blue-500 transition-all" /></div>
            </div>
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100 text-xs"><button onClick={() => setIsAuthOpen(false)} className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 font-bold transition-colors">Bỏ qua</button><button onClick={executeAuthDelete} disabled={isSubmitting} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-bold shadow-md transition-colors flex items-center gap-1">{isSubmitting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />} Hủy Phiếu Thu</button></div>
          </div>
        </div>
      )}

    </div>
  );
}