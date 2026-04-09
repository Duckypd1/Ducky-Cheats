import { Gamepad2, X, Check, ArrowRight, CreditCard, ShoppingBag, ShieldCheck, Download, FileText, Tag, Receipt, Lock, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "../lib/supabase";

const products = [
  {
    id: 1,
    name: "HyperCheats AOV VIP", 
    desc: "Hack Liên Quân iOS Ổn Định Số 1 T...",
    imageUrl: "/images/aov-vip.png",
    stock: 26,
    sold: 254,
    isHot: true,
  }
];

const DUMMY_PACKAGE = { id: "loading", name: "Đang tải dữ liệu...", price: 0, ctvPrice: 0, stock: 0, popular: false };

export function Home() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeProduct, setActiveProduct] = useState<any>(products[0]);
  const [packages, setPackages] = useState<any[]>([DUMMY_PACKAGE]);
  const [selectedPackage, setSelectedPackage] = useState<any>(DUMMY_PACKAGE);
  const [paymentMethod, setPaymentMethod] = useState("wallet");
  const [balance, setBalance] = useState<number>(0);
  const [userId, setUserId] = useState<string | null>(null);
  const [role, setRole] = useState<string>("user"); 
  const [customPrices, setCustomPrices] = useState<Record<string, number>>({}); 
  const [totalStock, setTotalStock] = useState<number>(0);
  const [voucherCodeInput, setVoucherCodeInput] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState<number>(0); 
  const [currentMonthStr, setCurrentMonthStr] = useState("");
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loadingPay, setLoadingPay] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const date = new Date();
    setCurrentMonthStr(`Tháng ${String(date.getMonth() + 1).padStart(2, '0')}`);

    const loadData = async () => {
      const { data: dbKeys } = await supabase.from('ducky_keys').select('*').eq('status', 'available'); 
      const availableKeys = dbKeys || [];

      const { data: dbPackages } = await supabase.from('ducky_packages').select('*').order('price', { ascending: true });
      let loadedPackages = [];
      
      if (dbPackages && dbPackages.length > 0) {
        loadedPackages = dbPackages.map((p: any) => ({
          id: p.id,
          name: p.name,
          price: Number(p.price),
          ctvPrice: Number(p.ctv_price),
          popular: p.popular
        }));
      } else {
        loadedPackages = [
          { id: "1d", name: "1 Ngày", price: 20000, ctvPrice: 15000, popular: false },
          { id: "7d", name: "7 Ngày", price: 100000, ctvPrice: 70000, popular: true },
          { id: "30d", name: "30 Ngày", price: 300000, ctvPrice: 200000, popular: false },
        ];
      }
      
      const packagesWithStock = loadedPackages.map((pkg: any) => {
        const stock = availableKeys.filter((k: any) => {
          const kid = String(k.package_id || k.packageId);
          const pid = String(pkg.id);
          if (kid === pid) return true;
          
          const pName = String(pkg.name).toLowerCase();
          if (kid === "1d" && pName.includes("1 ngày")) return true;
          if (kid === "7d" && pName.includes("7 ngày")) return true;
          if (kid === "30d" && pName.includes("30 ngày")) return true;
          return false;
        }).length;
        return { ...pkg, stock };
      });

      setPackages(packagesWithStock);
      
      const validTotalStock = packagesWithStock.reduce((sum: number, p: any) => sum + p.stock, 0);
      setTotalStock(validTotalStock);

      const availablePkg = packagesWithStock.find((p: any) => p.stock > 0);
      setSelectedPackage(availablePkg || packagesWithStock[0] || DUMMY_PACKAGE);

      let userBalance = 0;
      let userEmail = "";
      let userAvatar = "";
      const { data: { user } } = await supabase.auth.getUser();
      
      let profileData = null;

      if (user) {
        setUserId(user.id);
        userEmail = user.email || "";
        const savedAvatar = localStorage.getItem(`ducky_avatar_${user.id}`);
        if (savedAvatar) userAvatar = savedAvatar;

        const { data } = await supabase.from('profiles').select('balance, role, custom_prices').eq('id', user.id).maybeSingle();
        profileData = data;
        
        if (data) {
          userBalance = data.balance || 0;
          setBalance(userBalance);
          setRole(data.role || "user"); 
          setCustomPrices(data.custom_prices || {}); 
        }
      }

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

        // LỚP BẢO VỆ
        if (pendingAmountStr && user) {
          const amountToAdd = parseInt(pendingAmountStr, 10);
          const latestBalance = userBalance + amountToAdd;
          
          if (profileData) {
             await supabase.from('profiles').update({ balance: latestBalance }).eq('id', user.id);
          } else {
             await supabase.from('profiles').insert({ id: user.id, email: userEmail, balance: latestBalance });
          }

          userBalance = latestBalance;
          setBalance(latestBalance);

          let currentTxns = JSON.parse(localStorage.getItem('ducky_transactions') || "[]");
          const newTxn = { id: "TXN-" + Math.floor(100000 + Math.random() * 900000), type: "deposit", amount: "+" + amountToAdd.toLocaleString('vi-VN') + "đ", date: new Date().toLocaleString('vi-VN'), status: "success", description: "Nạp tiền qua PayOS" };
          currentTxns = [newTxn, ...currentTxns];
          localStorage.setItem('ducky_transactions', JSON.stringify(currentTxns));
          localStorage.removeItem('ducky_pending_amount');
          isProcessed = true;
          alert(`✅ Nạp thành công ${amountToAdd.toLocaleString('vi-VN')}đ vào ví!`);

        } else if (pendingOrderStr) { // SỬ DỤNG ELSE IF
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
            
            const newOrder = { id: "ORD-" + Math.floor(10000 + Math.random() * 90000), product: `Ducky Cheat AOV VIP (${pendingOrder.name})`, amount: pendingOrder.price.toLocaleString() + "đ", status: "completed", date: new Date().toLocaleString('vi-VN'), key: assignedKey.key_code };
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

      const { data: topProfiles } = await supabase.from('profiles').select('*').order('balance', { ascending: false }).limit(10);
      let combined = [];

      if (topProfiles && topProfiles.length > 0 && topProfiles.some(p => p.balance > 0)) {
        const colors = [
          { color: "text-rose-600", bg: "bg-rose-100" },
          { color: "text-[#4F46E5]", bg: "bg-indigo-100" },
          { color: "text-amber-600", bg: "bg-amber-100" },
          { color: "text-emerald-600", bg: "bg-emerald-100" },
          { color: "text-purple-600", bg: "bg-purple-100" },
        ];

        combined = topProfiles
          .filter((p: any) => p.balance > 0)
          .map((p: any, idx: number) => {
            const isMe = user && p.id === user.id;
            let rawName = p.email ? p.email.split('@')[0] : `Thành viên ${p.id.substring(0, 4).toUpperCase()}`;
            const displayName = isMe ? `${rawName} (Bạn)` : `${rawName.substring(0, 4)}***`;
            const theme = colors[idx % colors.length];

            return {
              name: displayName,
              amount: p.balance,
              color: theme.color,
              bg: theme.bg,
              letter: rawName.charAt(0).toUpperCase(),
              img: p.avatar_url || null
            };
          });
      } else {
        const currentDay = date.getDate();
        const monthIndex = date.getMonth();
        
        if (userBalance > 0) {
          combined.push({ name: userEmail.split('@')[0] + " (Bạn)", amount: userBalance, color: "text-rose-600", bg: "bg-rose-100", letter: userEmail.charAt(0).toUpperCase(), img: userAvatar });
        }

        if (currentDay > 20) {
          const botPool = [
            { name: "Hoàng Anh", color: "text-amber-600", bg: "bg-amber-100", img: "https://i.pravatar.cc/150?u=hoanganh" },
            { name: "Quân Lê", color: "text-[#4F46E5]", bg: "bg-indigo-100", letter: "Q" },
            { name: "Hùng Mai", color: "text-purple-600", bg: "bg-purple-100", letter: "H" },
            { name: "Tiến Đạt", color: "text-emerald-600", bg: "bg-emerald-100", letter: "T" },
            { name: "Minh Tuấn", color: "text-red-600", bg: "bg-red-100", img: "https://i.pravatar.cc/150?u=minhtuan" },
          ];
          const b1 = botPool[(monthIndex * 3) % botPool.length];
          const b2 = botPool[(monthIndex * 3 + 1) % botPool.length];
          const b3 = botPool[(monthIndex * 3 + 2) % botPool.length];

          const maxTargets = [1200000, 800000, 500000];
          let generatedAmounts = maxTargets.map((target) => {
            const dailyAvg = target / 30;
            return Math.floor(dailyAvg * currentDay) + Math.floor(Math.random() * 30000);
          });
          generatedAmounts.sort((a, b) => b - a);

          combined.push({ ...b1, amount: generatedAmounts[0] });
          combined.push({ ...b2, amount: generatedAmounts[1] });
          combined.push({ ...b3, amount: generatedAmounts[2] });
        }
      }

      combined.sort((a, b) => b.amount - a.amount);
      const finalLeaderboard = combined.slice(0, 5).map((u, idx) => ({ ...u, top: idx + 1 }));
      setLeaderboard(finalLeaderboard);
    };

    loadData();
  }, []);

  const handleApplyVoucher = async () => {
    if (!voucherCodeInput.trim()) return;

    const { data: foundVoucher } = await supabase
      .from('ducky_vouchers')
      .select('*')
      .eq('code', voucherCodeInput.toUpperCase())
      .maybeSingle();

    if (foundVoucher && foundVoucher.quantity > 0) {
      setAppliedDiscount(foundVoucher.discount);
      alert(`Áp dụng thành công mã giảm ${foundVoucher.discount}%!`);
    } else {
      alert("Mã giảm giá không hợp lệ hoặc đã hết lượt sử dụng.");
      setAppliedDiscount(0);
    }
  };

  const getDisplayOriginalPrice = () => {
    if (!selectedPackage || selectedPackage.id === 'loading') return 0;
    if (customPrices && customPrices[selectedPackage.id] > 0) {
      return customPrices[selectedPackage.id];
    }
    if (role === 'ctv') {
      return selectedPackage.ctvPrice || Math.floor(selectedPackage.price * 0.7);
    }
    return selectedPackage.price;
  };

  const originalPrice = getDisplayOriginalPrice();
  const discountAmount = (originalPrice * appliedDiscount) / 100;
  const finalPrice = originalPrice - discountAmount;

  const handleCheckout = async () => {
    if (!selectedPackage || selectedPackage.id === 'loading') return;

    const { data: allAvailableKeys } = await supabase.from('ducky_keys').select('*').eq('status', 'available');
    
    const keysToAssign = (allAvailableKeys || []).filter(k => {
      const kid = String(k.package_id || k.packageId);
      const pid = String(selectedPackage.id);
      if (kid === pid) return true;
      const pName = String(selectedPackage.name).toLowerCase();
      if (kid === "1d" && pName.includes("1 ngày")) return true;
      if (kid === "7d" && pName.includes("7 ngày")) return true;
      if (kid === "30d" && pName.includes("30 ngày")) return true;
      return false;
    });

    if (!keysToAssign || keysToAssign.length === 0) {
      alert("Rất tiếc, gói này vừa có khách mua mất key! Vui lòng chọn gói khác.");
      return; 
    }

    if (paymentMethod === 'qr') {
      setLoadingPay(true);
      try {
        localStorage.removeItem('ducky_pending_amount'); // DỌN RÁC TRƯỚC KHI THỰC HIỆN LỆNH MỚI
        localStorage.setItem('ducky_pending_qr_order', JSON.stringify({
          id: selectedPackage.id,
          name: selectedPackage.name,
          price: finalPrice
        }));
        const { data, error } = await supabase.functions.invoke('create-payos-order', {
          body: { amount: finalPrice }
        });
        if (error) throw error;
        if (data?.checkoutUrl) {
          window.location.href = data.checkoutUrl;
          return; 
        }
      } catch (err) {
        alert("Lỗi tạo link thanh toán QR.");
      } finally {
        setLoadingPay(false);
      }
      return; 
    }

    if (paymentMethod === 'wallet') {
      if (balance < finalPrice) {
        alert("Số dư ví không đủ! Vui lòng nạp thêm.");
        return;
      }
      const newBalance = balance - finalPrice;
      if (userId) {
        const { data: checkProfile } = await supabase.from('profiles').select('id').eq('id', userId).maybeSingle();
        if (checkProfile) {
          await supabase.from('profiles').update({ balance: newBalance }).eq('id', userId);
        } else {
          await supabase.from('profiles').insert({ id: userId, balance: newBalance });
        }
        setBalance(newBalance);
      }
    }

    const assignedKey = keysToAssign[0];
    await supabase.from('ducky_keys').update({ status: 'sold' }).eq('id', assignedKey.id);

    const orderId = "ORD-" + Math.floor(10000 + Math.random() * 90000);
    const dateStr = new Date().toLocaleString('vi-VN');

    const newOrder = {
      id: orderId,
      product: `Ducky Cheat AOV VIP (${selectedPackage.name})`,
      amount: finalPrice.toLocaleString('vi-VN') + "đ",
      status: "completed",
      date: dateStr,
      key: assignedKey.key_code 
    };

    let savedOrders = JSON.parse(localStorage.getItem('ducky_orders') || "[]");
    localStorage.setItem('ducky_orders', JSON.stringify([newOrder, ...savedOrders]));

    const newTxn = {
      id: "TXN-" + Math.floor(100000 + Math.random() * 900000),
      type: "purchase",
      amount: "-" + finalPrice.toLocaleString('vi-VN') + "đ",
      date: dateStr,
      status: "success",
      description: `Mua Ducky Cheat AOV VIP (${selectedPackage.name})`
    };

    let savedTxns = JSON.parse(localStorage.getItem('ducky_transactions') || "[]");
    localStorage.setItem('ducky_transactions', JSON.stringify([newTxn, ...savedTxns]));

    setIsModalOpen(false);
    navigate('/orders'); 
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 relative rounded-[32px] overflow-hidden shadow-sm group h-[340px] bg-gray-900 flex flex-col justify-end p-8 md:p-10">
          <img src="https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070&auto=format&fit=crop" alt="Hero" className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-overlay group-hover:scale-105 transition-transform duration-700" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
          <div className="relative z-10 w-full max-w-lg">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full text-white text-[11px] font-bold uppercase mb-4 border border-white/10">
              <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span> Mới cập nhật
            </div>
            <h1 className="text-3xl md:text-5xl font-bold text-white mb-3">Uy tín số 1 Việt Nam</h1>
            <p className="text-gray-300 text-sm md:text-base mb-8 font-medium">Hệ thống bán key tự động 24/7. Bảo mật tuyệt đối, hỗ trợ tận tình.</p>
            <button onClick={() => { setActiveProduct(products[0]); setIsModalOpen(true); }} className="bg-white hover:bg-gray-100 text-gray-900 px-8 py-3 rounded-2xl font-bold transition-all shadow-lg text-sm w-fit">Xem Chi Tiết</button>
          </div>
        </div>

        <div className="lg:col-span-4 bg-white rounded-[32px] p-6 shadow-sm border border-gray-100 flex flex-col h-[340px]">
          <h2 className="text-base font-bold text-[#111827] mb-6">BXH {currentMonthStr}</h2>
          <div className="flex-1 flex flex-col justify-start gap-4 mb-4 overflow-y-auto">
            {leaderboard.length === 0 ? (<div className="flex flex-col items-center justify-center h-full text-gray-400"><p className="text-sm font-medium">Chưa có ai đua top tháng này.</p><p className="text-xs">Hãy là người đầu tiên!</p></div>) : (
              leaderboard.map((user, idx) => (
                <div key={idx} className="flex items-center gap-4">
                  {user.img ? (<img src={user.img} alt={user.name} className="w-12 h-12 rounded-2xl object-cover shadow-sm" />) : (<div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg ${user.bg} ${user.color}`}>{user.letter}</div>)}
                  <div className="flex-1 min-w-0 flex items-center justify-between">
                    <div><p className="text-sm font-bold text-gray-900 truncate pr-2">{user.name}</p><p className="text-[11px] font-semibold text-gray-500">Top {user.top}</p></div>
                    <p className="text-sm font-bold text-[#EA580C]">{user.amount.toLocaleString('vi-VN')}đ</p>
                  </div>
                </div>
              ))
            )}
          </div>
          <button onClick={() => navigate('/wallet')} className="w-full bg-[#10B981] hover:bg-[#059669] text-white py-3.5 rounded-2xl font-bold transition-colors shadow-sm flex items-center justify-center gap-2 text-sm"><CreditCard className="w-4 h-4" /> Nạp tiền</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-4 bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-[#3B82F6] shadow-[0_0_8px_rgba(59,130,246,0.6)]"></div>
            <div><h3 className="text-xs font-bold text-gray-900 leading-none mb-1">Hệ thống</h3><p className="text-xs text-gray-500">Bảo trì nạp thẻ 15 phút.</p></div>
          </div>
          <button className="text-gray-300 hover:text-gray-500"><X className="w-4 h-4" /></button>
        </div>

        <div className="lg:col-span-8 bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center overflow-hidden relative">
          <div className="animate-[marquee_20s_linear_infinite] whitespace-nowrap flex items-center gap-6">
            <div className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[#10B981]"></span><span className="text-xs font-medium text-gray-500"><strong className="text-[#10B981]">Hoàng***</strong> mua HyperCheat...</span></div>
            <div className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[#10B981]"></span><span className="text-xs font-medium text-gray-500"><strong className="text-[#10B981]">Quân L***</strong> mua HyperCheat...</span></div>
            <div className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[#10B981]"></span><span className="text-xs font-medium text-gray-500"><strong className="text-[#10B981]">Thuận***</strong> mua HyperCheat...</span></div>
          </div>
          <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white to-transparent z-10"></div>
          <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent z-10"></div>
        </div>
      </div>

      <div className="pt-4">
        <div className="flex items-center justify-between mb-6 px-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#111827] flex items-center justify-center text-white"><Gamepad2 className="w-5 h-5" /></div>
            <h2 className="text-xl font-bold text-[#111827] uppercase tracking-wide">Danh mục Game</h2>
          </div>
          <Link to="/products" className="text-sm font-bold text-[#10B981] hover:text-[#059669] transition-colors flex items-center gap-1.5">Xem tất cả <ArrowRight className="w-4 h-4" /></Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => (
            <div key={product.id} className="bg-white rounded-[32px] p-4 shadow-sm border border-gray-100 flex flex-col hover:shadow-md transition-shadow group relative">
              <div className="rounded-[24px] overflow-hidden mb-5 bg-gray-100 aspect-[16/10] relative">
                <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                {product.isHot && (<div className="absolute top-3 right-3 bg-[#EF4444] text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-sm z-10">HOT</div>)}
              </div>
              <div className="px-2 flex-1 flex flex-col">
                <h3 className="text-[17px] font-bold text-[#0F172A] mb-1 leading-snug">{product.name}</h3>
                <p className="text-xs text-gray-500 font-medium mb-5 truncate">{product.desc}</p>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-1.5 bg-green-50 px-2.5 py-1 rounded-md">
                    <span className={`w-1.5 h-1.5 rounded-full ${totalStock > 0 ? 'bg-[#10B981]' : 'bg-red-500'}`}></span>
                    <p className={`text-[11px] font-bold tracking-wide ${totalStock > 0 ? 'text-[#10B981]' : 'text-red-500'}`}>{totalStock > 0 ? `Còn ${totalStock} key` : 'Hết hàng'}</p>
                  </div>
                  <p className="text-[11px] text-gray-400 font-semibold">{product.sold} đơn đã bán</p>
                </div>
                <button onClick={() => { setActiveProduct(product); setIsModalOpen(true); }} className="mt-auto w-full bg-[#2563EB] text-white py-3 rounded-2xl text-[14px] font-bold hover:bg-blue-700 transition-all shadow-sm flex items-center justify-center gap-2 uppercase tracking-wide">Xem Chi Tiết</button>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {isModalOpen && selectedPackage && activeProduct && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <div className="bg-[#F8FAFC] rounded-3xl w-full max-w-5xl relative z-10 shadow-2xl overflow-hidden flex flex-col max-h-[95vh] animate-in zoom-in-95 duration-200">
            <div className="bg-white p-4 md:px-6 md:py-4 border-b border-gray-100 flex items-center justify-between sticky top-0 z-20">
              <h3 className="text-lg md:text-xl font-bold text-gray-900">Thanh toán đơn hàng</h3>
              <button onClick={() => setIsModalOpen(false)} className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center hover:bg-gray-100 text-gray-500 transition-colors"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="p-4 md:p-6 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-7 xl:col-span-8 space-y-6">
                  <div className="bg-white rounded-2xl p-5 md:p-6 shadow-sm border border-gray-100">
                    <h4 className="font-bold text-gray-900 mb-5 flex items-center gap-2"><ShoppingBag className="w-5 h-5 text-gray-700"/> Thông tin sản phẩm</h4>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-5">
                      <img src={activeProduct.imageUrl} alt={activeProduct.name} className="w-24 h-24 rounded-2xl object-cover bg-gray-900 shadow-sm" />
                      <div><h5 className="font-bold text-lg text-gray-900 mb-1">{activeProduct.name}</h5><p className="text-sm text-indigo-600 font-semibold mb-3">AOV</p><div className="flex flex-wrap gap-2"><span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg flex items-center gap-1.5"><ShieldCheck className="w-4 h-4"/> Bản quyền trọn đời</span><span className="text-xs font-bold text-green-600 bg-green-50 px-3 py-1.5 rounded-lg flex items-center gap-1.5"><Download className="w-4 h-4"/> Tải xuống vĩnh viễn</span></div></div>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl p-5 md:p-6 shadow-sm border border-gray-100">
                    <h4 className="font-bold text-gray-900 mb-5 flex items-center gap-2"><FileText className="w-5 h-5 text-gray-700"/> Chi tiết đơn hàng</h4>
                    <div className="space-y-3">
                      {packages.map((pkg) => {
                        const isOutOfStock = pkg.stock === 0;
                        const pkgCustomPrice = customPrices?.[pkg.id];
                        const hasCustomPrice = pkgCustomPrice && pkgCustomPrice > 0;
                        const isCTV = role === 'ctv';
                        
                        let displayPrice = pkg.price;
                        if (hasCustomPrice) {
                          displayPrice = pkgCustomPrice;
                        } else if (isCTV) {
                          displayPrice = pkg.ctvPrice || Math.floor(pkg.price * 0.7);
                        }

                        return (
                          <label key={pkg.id} onClick={() => !isOutOfStock && setSelectedPackage(pkg)} className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border-2 transition-all ${isOutOfStock ? "opacity-60 cursor-not-allowed bg-gray-50 border-gray-100" : selectedPackage.id === pkg.id ? "border-[#4F46E5] bg-indigo-50/20 cursor-pointer" : "border-gray-100 hover:border-indigo-100 bg-white cursor-pointer"}`}>
                            <div className="flex items-center gap-3 mb-2 sm:mb-0">
                              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${selectedPackage.id === pkg.id && !isOutOfStock ? "border-[#4F46E5]" : "border-gray-300"}`}>{selectedPackage.id === pkg.id && !isOutOfStock && <div className="w-2.5 h-2.5 rounded-full bg-[#4F46E5]"></div>}</div>
                              <div><span className="font-bold text-gray-900 block text-sm">Key {pkg.name}</span><span className="text-xs text-gray-500">Thời hạn: {pkg.name} {isOutOfStock ? (<span className="text-red-500 font-bold ml-2">(Hết hàng)</span>) : (<span className="text-[#10B981] font-bold ml-2">(Còn {pkg.stock} key)</span>)}</span></div>
                            </div>
                            
                            <div>
                              {(hasCustomPrice || isCTV) ? (
                                <div className="text-right ml-8 sm:ml-0">
                                  <span className="text-xs text-gray-400 line-through mr-2">{pkg.price.toLocaleString('vi-VN')} đ</span>
                                  <span className="font-bold text-rose-600">{displayPrice.toLocaleString('vi-VN')} đ</span>
                                  <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded ml-2">
                                    {hasCustomPrice ? "Giá VIP" : "Giá CTV"}
                                  </span>
                                </div>
                              ) : (
                                <span className="font-bold text-gray-900 ml-8 sm:ml-0">{pkg.price.toLocaleString('vi-VN')} đ</span>
                              )}
                            </div>
                          </label>
                        )
                      })}
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl p-5 md:p-6 shadow-sm border border-gray-100">
                    <h4 className="font-bold text-gray-900 mb-5 flex items-center gap-2"><CreditCard className="w-5 h-5 text-gray-700"/> Thông tin thanh toán</h4>
                    <div><label className="block text-sm font-bold text-gray-700 mb-3">Phương thức thanh toán</label><select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="w-full bg-white border-2 border-gray-100 text-gray-900 text-sm rounded-xl focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 block p-4 outline-none font-semibold transition-all"><option value="wallet">Ví hệ thống (Số dư: {balance.toLocaleString('vi-VN')} đ)</option><option value="qr">SePay (Chuyển khoản QR)</option></select></div>
                  </div>
                </div>

                <div className="lg:col-span-5 xl:col-span-4 space-y-6">
                  <div className="bg-white rounded-2xl p-5 md:p-6 shadow-sm border border-gray-100">
                    <h4 className="font-bold text-gray-900 mb-5 flex items-center gap-2"><Tag className="w-5 h-5 text-gray-700"/> Mã giảm giá</h4>
                    <div className="flex flex-row items-stretch gap-2 w-full"><input type="text" value={voucherCodeInput} onChange={(e) => setVoucherCodeInput(e.target.value)} placeholder="Nhập mã..." className="flex-1 min-w-0 bg-gray-50 border border-gray-100 text-gray-900 text-sm rounded-xl px-3 outline-none focus:ring-2 focus:ring-indigo-100 uppercase font-bold" /><button onClick={handleApplyVoucher} className="shrink-0 bg-white border border-gray-200 text-gray-700 hover:text-indigo-600 hover:border-indigo-300 px-4 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm">Áp dụng</button></div>
                    {appliedDiscount > 0 && (<p className="text-[11px] text-green-600 font-bold mt-2 flex items-center gap-1"><Check className="w-3 h-3"/> Đã giảm {appliedDiscount}%</p>)}
                  </div>

                  <div className="bg-white rounded-2xl p-5 md:p-6 shadow-sm border border-gray-100">
                    <h4 className="font-bold text-gray-900 mb-5 flex items-center gap-2"><Receipt className="w-5 h-5 text-gray-700"/> Tóm tắt đơn hàng</h4>
                    <div className="space-y-4 mb-6 border-b border-gray-100 pb-6"><div className="flex justify-between items-center text-sm"><span className="text-gray-500 font-medium">Giá gốc</span><span className="font-bold text-gray-900">{originalPrice.toLocaleString('vi-VN')} đ</span></div>{appliedDiscount > 0 && (<div className="flex justify-between items-center text-sm"><span className="text-green-600 font-bold">Giảm giá ({appliedDiscount}%)</span><span className="font-bold text-green-600">-{discountAmount.toLocaleString('vi-VN')} đ</span></div>)}</div>
                    <div className="flex justify-between items-center mb-6"><span className="text-base font-bold text-gray-900">Tổng cộng</span><span className="text-2xl font-bold text-indigo-600">{finalPrice.toLocaleString('vi-VN')} đ</span></div>
                    
                    <button 
                      onClick={handleCheckout} 
                      disabled={loadingPay || !selectedPackage || selectedPackage.id === 'loading' || selectedPackage.stock === 0} 
                      className="w-full bg-white border-2 border-[#8B5CF6] hover:bg-[#8B5CF6] hover:text-white disabled:bg-gray-100 disabled:border-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-[#8B5CF6] py-3.5 rounded-xl font-bold transition-all shadow-sm flex items-center justify-center gap-2 group"
                    >
                      {loadingPay ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className={`w-4 h-4 transition-colors ${!selectedPackage || selectedPackage.id === 'loading' || selectedPackage.stock === 0 ? 'text-gray-400' : 'group-hover:text-white'}`}/>}
                      {loadingPay ? "Đang xử lý..." : "Thanh toán ngay"}
                    </button>
                    
                    <p className="text-[11px] text-gray-400 text-center mt-5 leading-relaxed font-medium">Bằng việc đặt hàng, bạn đồng ý với <a href="#" className="underline hover:text-gray-600">Điều khoản</a> & <a href="#" className="underline hover:text-gray-600">Chính sách</a></p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}