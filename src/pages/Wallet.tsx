import React, { useState, useEffect } from "react";
import { Wallet as WalletIcon, ArrowUpRight, ArrowDownRight, QrCode, CreditCard, Loader2, CheckCircle2 } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";

export function Wallet() {
  const [showTopup, setShowTopup] = useState(false);
  const [amount, setAmount] = useState<number>(50000);
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState<number>(0);
  const [isLoadingBalance, setIsLoadingBalance] = useState(true);
  const [transactions, setTransactions] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const initWallet = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        let currentBalance = 0;
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
        if (profile) currentBalance = profile.balance || 0;

        const urlParams = new URLSearchParams(window.location.search);
        const statusParam = urlParams.get('status');
        const cancelParam = urlParams.get('cancel');
        const codeParam = urlParams.get('code');

        const isCanceled = cancelParam === 'true' || statusParam === 'cancel' || statusParam === 'CANCELLED';
        const isSuccess = cancelParam === 'false' || statusParam === 'success' || statusParam === 'PAID' || codeParam === '00';

        if (isCanceled) {
          localStorage.removeItem('ducky_pending_amount');
          localStorage.removeItem('ducky_pending_qr_order');
          window.history.replaceState({}, document.title, window.location.pathname);
          alert("Giao dịch đã bị hủy.");
        } else if (isSuccess) {
          let isProcessed = false;

          const pendingAmountStr = localStorage.getItem('ducky_pending_amount');
          const pendingOrderStr = localStorage.getItem('ducky_pending_qr_order');

          // LỚP BẢO VỆ: Chỉ chạy 1 trong 2 lệnh
          if (pendingAmountStr) {
            const amountToAdd = parseInt(pendingAmountStr, 10);
            currentBalance += amountToAdd; 
            
            if (profile) {
               await supabase.from('profiles').update({ balance: currentBalance }).eq('id', user.id);
            } else {
               await supabase.from('profiles').insert({ id: user.id, email: user.email, balance: currentBalance });
            }

            let currentTxns = JSON.parse(localStorage.getItem('ducky_transactions') || "[]");
            const newTxn = { id: "TXN-" + Math.floor(100000 + Math.random() * 900000), type: "deposit", amount: "+" + amountToAdd.toLocaleString('vi-VN') + "đ", date: new Date().toLocaleString('vi-VN'), status: "success", description: "Nạp tiền qua PayOS" };
            currentTxns = [newTxn, ...currentTxns];
            setTransactions(currentTxns);
            localStorage.setItem('ducky_transactions', JSON.stringify(currentTxns));
            localStorage.removeItem('ducky_pending_amount');
            isProcessed = true;
            alert(`✅ Nạp thành công ${amountToAdd.toLocaleString('vi-VN')}đ vào ví!`);

          } else if (pendingOrderStr) { // SỬ DỤNG ELSE IF ĐỂ TRÁNH LỖI XUNG ĐỘT
            const pendingOrder = JSON.parse(pendingOrderStr);
            const { data: freshKeys } = await supabase.from('ducky_keys').select('*').eq('status', 'available');
            const keysToAssign = (freshKeys || []).filter((k:any) => {
              const kid = String(k.package_id || k.packageId);
              const pid = String(pendingOrder.id);
              if (kid === pid) return true;
              const pName = String(pendingOrder.name).toLowerCase();
              if (kid === "1d" && pName.includes("1 ngày")) return true;
              if (kid === "7d" && pName.includes("7 ngày")) return true;
              if (kid === "30d" && pName.includes("30 ngày")) return true;
              return false;
            });
              
            if (keysToAssign && keysToAssign.length > 0) {
              const assignedKey = keysToAssign[0];
              await supabase.from('ducky_keys').update({ status: 'sold' }).eq('id', assignedKey.id);
              
              const newOrder = { id: "ORD-" + Math.floor(10000 + Math.random() * 90000), product: `HyperCheat (${pendingOrder.name})`, amount: pendingOrder.price.toLocaleString() + "đ", status: "completed", date: new Date().toLocaleString('vi-VN'), key: assignedKey.key_code };
              localStorage.setItem('ducky_orders', JSON.stringify([newOrder, ...JSON.parse(localStorage.getItem('ducky_orders') || "[]")]));
              
              const newTxn = { id: "TXN-" + Math.floor(100000 + Math.random() * 900000), type: "purchase", amount: "-" + pendingOrder.price.toLocaleString('vi-VN') + "đ", date: new Date().toLocaleString('vi-VN'), status: "success", description: `Mua Ducky Cheat (${pendingOrder.name}) qua QR` };
              let savedTxns = JSON.parse(localStorage.getItem('ducky_transactions') || "[]");
              localStorage.setItem('ducky_transactions', JSON.stringify([newTxn, ...savedTxns]));

              localStorage.removeItem('ducky_pending_qr_order');
              isProcessed = true;
              alert("✅ Thanh toán thành công! Key đã sẵn sàng trong mục đơn hàng.");
              navigate('/orders');
            }
          }

          if (isProcessed) window.history.replaceState({}, document.title, window.location.pathname);
        }

        if (!profile && !isSuccess) {
           await supabase.from('profiles').insert({ id: user.id, email: user.email, balance: 0 });
        }

        setBalance(currentBalance);
        const savedTxns = localStorage.getItem('ducky_transactions');
        setTransactions(savedTxns ? JSON.parse(savedTxns) : []);

      } catch (err) { 
        console.error("Lỗi khi tải hoặc cập nhật số dư:", err); 
      } finally { 
        setIsLoadingBalance(false); 
      }
    };
    initWallet();
  }, []);

  const presetAmounts = [20000, 50000, 100000, 200000, 500000];

  const handlePayment = async () => {
    setLoading(true);
    try {
      localStorage.removeItem('ducky_pending_qr_order'); // DỌN RÁC TRƯỚC KHI THỰC HIỆN LỆNH MỚI
      localStorage.setItem('ducky_pending_amount', amount.toString());
      
      const { data, error } = await supabase.functions.invoke('create-payos-order', { body: { amount: amount } });
      if (error) throw error;
      if (data?.checkoutUrl) window.location.href = data.checkoutUrl; 
    } catch (err: any) {
      const confirmDirect = window.confirm("⚠️ Hệ thống chưa tìm thấy Backend PayOS trên máy chủ.\n\nBạn có muốn tự động cộng tiền thẳng vào ví để TEST tính năng không?");
      if (confirmDirect) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const newTotal = balance + amount;
          const { data: pCheck } = await supabase.from('profiles').select('id').eq('id', user.id).maybeSingle();
          if (pCheck) {
             await supabase.from('profiles').update({ balance: newTotal }).eq('id', user.id);
          } else {
             await supabase.from('profiles').insert({ id: user.id, email: user.email, balance: newTotal });
          }
          
          setBalance(newTotal);
          let currentTxns = JSON.parse(localStorage.getItem('ducky_transactions') || "[]");
          const newTxn = { id: "TXN-" + Math.floor(100000 + Math.random() * 900000), type: "deposit", amount: "+" + amount.toLocaleString('vi-VN') + "đ", date: new Date().toLocaleString('vi-VN'), status: "success", description: "Nạp tiền tự động (Test Bypass)" };
          const updatedTxns = [newTxn, ...currentTxns];
          setTransactions(updatedTxns);
          localStorage.setItem('ducky_transactions', JSON.stringify(updatedTxns));
          
          localStorage.removeItem('ducky_pending_amount');
          setShowTopup(false);
          alert(`✅ Đã cộng thành công ${amount.toLocaleString('vi-VN')}đ!`);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="bg-gradient-to-br from-[#4F46E5] to-indigo-600 rounded-3xl p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <p className="text-indigo-100 mb-2 font-medium">Số dư khả dụng</p>
            <h2 className="text-4xl font-bold tracking-tight">
              {isLoadingBalance ? <span className="animate-pulse text-indigo-200 text-3xl">Đang tải...</span> : `${balance.toLocaleString('vi-VN')}đ`}
            </h2> 
          </div>
          <button onClick={() => setShowTopup(!showTopup)} className="bg-white text-[#4F46E5] hover:bg-indigo-50 px-6 py-3 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 shadow-sm">
            <QrCode className="w-5 h-5" /> {showTopup ? "Đóng nạp tiền" : "Nạp tiền ngay"}
          </button>
        </div>
      </div>

      {showTopup && (
        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-4 mb-8 pb-6 border-b border-gray-50">
            <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-[#4F46E5] shadow-inner"><WalletIcon className="w-7 h-7" /></div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Nạp tiền Ducky Cheat</h3>
              <p className="text-sm text-gray-500 font-medium mt-1">Thanh toán tự động 24/7 qua VietQR (payOS)</p>
            </div>
          </div>
          <div className="mb-8">
            <label className="block text-sm font-bold text-gray-700 mb-4 uppercase tracking-wide">Chọn mệnh giá nạp</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {presetAmounts.map((val) => (
                <button key={val} onClick={() => setAmount(val)} className={`relative py-4 rounded-2xl font-bold border-2 transition-all duration-200 overflow-hidden ${amount === val ? "border-[#4F46E5] bg-indigo-50/50 text-[#4F46E5] shadow-md shadow-indigo-100" : "border-gray-100 text-gray-500 hover:border-indigo-200 hover:bg-gray-50"}`}>
                  {amount === val && <div className="absolute top-2 right-2 text-[#4F46E5]"><CheckCircle2 className="w-4 h-4" /></div>}
                  {val.toLocaleString('vi-VN')}đ
                </button>
              ))}
            </div>
          </div>
          <button onClick={handlePayment} disabled={loading} className="w-full bg-[#4F46E5] hover:bg-indigo-600 text-white py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all shadow-lg shadow-indigo-200 disabled:opacity-70 disabled:cursor-not-allowed">
            {loading ? <><Loader2 className="w-6 h-6 animate-spin" /> Đang kết nối...</> : <><CreditCard className="w-6 h-6" /> Thanh toán ngay {amount.toLocaleString('vi-VN')}đ</>}
          </button>
        </div>
      )}

      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold text-[#111827] mb-6">Lịch sử giao dịch</h2>
        <div className="space-y-4">
          {transactions.map((txn) => (
            <div key={txn.id} className="flex items-center justify-between p-4 rounded-2xl border border-gray-50 hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${txn.type === 'deposit' ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'}`}>
                  {txn.type === 'deposit' ? <ArrowDownRight className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{txn.description}</p>
                  <p className="text-xs text-gray-500">{txn.date}</p>
                </div>
              </div>
              <div className="text-right">
                <p className={`font-bold ${txn.type === 'deposit' ? 'text-green-600' : 'text-gray-900'}`}>{txn.amount}</p>
                <span className="text-[10px] font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full mt-1 inline-block">Thành công</span>
              </div>
            </div>
          ))}
          {transactions.length === 0 && <div className="text-center py-8 text-gray-500 text-sm font-medium">Chưa có giao dịch nào.</div>}
        </div>
      </div>
    </div>
  );
}