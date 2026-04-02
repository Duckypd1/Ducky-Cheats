import React, { useState, useEffect } from 'react';
import { X, Check, ShoppingBag, ShieldCheck, Download, FileText, CreditCard, Tag, Receipt, Lock, Loader2 } from 'lucide-react'; 
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";

const productList = [
  {
    id: 1,
    name: "HyperCheats AOV VIP",
    status: "Hoạt động tốt",
    imageUrl: "/images/aov-vip.png",
    sold: 254,
    actionText: "Xem Chi Tiết"
  }
];

const DUMMY_PACKAGE = { id: "loading", name: "Đang tải dữ liệu...", price: 0, ctvPrice: 0, stock: 0, popular: false };

export function Products() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeProduct, setActiveProduct] = useState(productList[0]); 
  const [packages, setPackages] = useState<any[]>([DUMMY_PACKAGE]);
  const [selectedPackage, setSelectedPackage] = useState<any>(DUMMY_PACKAGE);
  const [paymentMethod, setPaymentMethod] = useState("wallet");
  const [balance, setBalance] = useState<number>(0);
  const [userId, setUserId] = useState<string | null>(null);
  const [role, setRole] = useState<string>("user"); 
  const [customPrices, setCustomPrices] = useState<Record<string, number>>({}); 
  const [totalStock, setTotalStock] = useState<number>(0);
  const [loadingPay, setLoadingPay] = useState(false); 
  const [voucherCodeInput, setVoucherCodeInput] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState<number>(0);
  const navigate = useNavigate();

  useEffect(() => {
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
      
      // BỘ LỌC THÔNG MINH
      const packagesWithStock = loadedPackages.map((pkg: any) => {
        const stock = availableKeys.filter((k: any) => {
          const kid = String(k.package_id || k.packageId);
          const pid = String(pkg.id);
          if (kid === pid) return true;
          if (pkg.name.includes("1 Ngày") && kid === "1d") return true;
          if (pkg.name.includes("7 Ngày") && kid === "7d") return true;
          if (pkg.name.includes("30 Ngày") && kid === "30d") return true;
          return false;
        }).length;
        return { ...pkg, stock };
      });

      setPackages(packagesWithStock);
      
      // Đồng bộ số Key hiển thị bên ngoài
      const validTotalStock = packagesWithStock.reduce((sum, p) => sum + p.stock, 0);
      setTotalStock(validTotalStock);

      const availablePkg = packagesWithStock.find((p: any) => p.stock > 0);
      setSelectedPackage(availablePkg || packagesWithStock[0] || DUMMY_PACKAGE);

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        const { data } = await supabase.from('profiles').select('balance, role, custom_prices').eq('id', user.id).single();
        if (data) {
          setBalance(data.balance || 0);
          setRole(data.role || "user");
          setCustomPrices(data.custom_prices || {}); 
        }
      }

      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('status') === 'success' || urlParams.get('code') === '00' || urlParams.get('cancel') === 'false') {
        const pendingOrder = JSON.parse(localStorage.getItem('ducky_pending_qr_order') || "null");
        if (pendingOrder) {
          const { data: freshKeys } = await supabase.from('ducky_keys').select('*').eq('status', 'available');
          
          const keysToAssign = (freshKeys || []).filter(k => {
            const kid = String(k.package_id || k.packageId);
            const pid = String(pendingOrder.id);
            if (kid === pid) return true;
            if (pendingOrder.name.includes("1 Ngày") && kid === "1d") return true;
            if (pendingOrder.name.includes("7 Ngày") && kid === "7d") return true;
            if (pendingOrder.name.includes("30 Ngày") && kid === "30d") return true;
            return false;
          });
            
          if (keysToAssign && keysToAssign.length > 0) {
            const assignedKey = keysToAssign[0];
            await supabase.from('ducky_keys').update({ status: 'sold' }).eq('id', assignedKey.id);
            
            const newOrder = { id: "ORD-" + Math.floor(Math.random()*90000), product: `HyperCheat (${pendingOrder.name})`, amount: pendingOrder.price.toLocaleString() + "đ", status: "completed", date: new Date().toLocaleString('vi-VN'), key: assignedKey.key_code };
            localStorage.setItem('ducky_orders', JSON.stringify([newOrder, ...JSON.parse(localStorage.getItem('ducky_orders') || "[]")]));
            localStorage.removeItem('ducky_pending_qr_order');
            
            window.history.replaceState({}, '', window.location.pathname);
            alert("Thanh toán thành công! Key đã sẵn sàng trong mục đơn hàng.");
            navigate('/orders');
          }
        }
      }
    };
    loadData();
  }, []);

  const handleOpenModal = (product: any) => {
    setActiveProduct(product);
    setIsModalOpen(true);
  };

  const handleApplyVoucher = async () => {
    if (!voucherCodeInput.trim()) return;
    const { data: foundVoucher } = await supabase.from('ducky_vouchers').select('*').eq('code', voucherCodeInput.toUpperCase()).maybeSingle();

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
      if (selectedPackage.name.includes("1 Ngày") && kid === "1d") return true;
      if (selectedPackage.name.includes("7 Ngày") && kid === "7d") return true;
      if (selectedPackage.name.includes("30 Ngày") && kid === "30d") return true;
      return false;
    });

    if (!keysToAssign || keysToAssign.length === 0) {
      alert("Rất tiếc, gói này vừa hết key! Vui lòng chọn gói khác.");
      return; 
    }

    if (paymentMethod === 'qr') {
      setLoadingPay(true);
      try {
        localStorage.setItem('ducky_pending_qr_order', JSON.stringify({ id: selectedPackage.id, name: selectedPackage.name, price: finalPrice }));
        const { data, error } = await supabase.functions.invoke('create-payos-order', { body: { amount: finalPrice } });
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
        await supabase.from('profiles').update({ balance: newBalance }).eq('id', userId);
        setBalance(newBalance);
      }
    }

    const assignedKey = keysToAssign[0];
    await supabase.from('ducky_keys').update({ status: 'sold' }).eq('id', assignedKey.id);

    const orderId = "ORD-" + Math.floor(10000 + Math.random() * 90000);
    const now = new Date();
    const dateStr = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const newOrder = { id: orderId, product: `Ducky Cheat AOV VIP (${selectedPackage.name})`, amount: finalPrice.toLocaleString('vi-VN') + "đ", status: "completed", date: dateStr, key: assignedKey.key_code };
    let savedOrders = JSON.parse(localStorage.getItem('ducky_orders') || "[]");
    localStorage.setItem('ducky_orders', JSON.stringify([newOrder, ...savedOrders]));

    const newTxn = { id: "TXN-" + Math.floor(100000 + Math.random() * 900000), type: "purchase", amount: "-" + finalPrice.toLocaleString('vi-VN') + "đ", date: dateStr, status: "success", description: `Mua Ducky Cheat AOV VIP (${selectedPackage.name})` };
    let savedTxns = JSON.parse(localStorage.getItem('ducky_transactions') || "[]");
    localStorage.setItem('ducky_transactions', JSON.stringify([newTxn, ...savedTxns]));

    setIsModalOpen(false);
    navigate('/orders');
  };

  return (
    <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 min-h-[60vh] relative">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Danh mục & Sản phẩm</h2>
        <p className="text-gray-500">Quản lý và mua các gói cheat hiện hành.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {productList.map((product) => (
          <div key={product.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col hover:shadow-md transition-shadow group">
            <div className="rounded-xl overflow-hidden mb-4 bg-gray-900 aspect-square sm:aspect-[4/3] relative">
              <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            </div>
            <h3 className="text-xl font-bold text-[#111827] mb-2">{product.name}</h3>
            
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-1.5 bg-green-50 px-2.5 py-1 rounded-md">
                <span className={`w-1.5 h-1.5 rounded-full ${totalStock > 0 ? 'bg-[#10B981]' : 'bg-red-500'}`}></span>
                <p className={`text-[11px] font-bold tracking-wide ${totalStock > 0 ? 'text-[#10B981]' : 'text-red-500'}`}>
                  {totalStock > 0 ? `Còn ${totalStock} key` : 'Hết hàng'}
                </p>
              </div>
              <p className="text-[11px] text-gray-400 font-semibold">{product.sold} đơn đã bán</p>
            </div>
            <button onClick={() => handleOpenModal(product)} className="mt-auto w-full bg-[#2563EB] text-white py-3 rounded-2xl text-[14px] font-bold hover:bg-blue-700 transition-colors shadow-sm uppercase tracking-wide">
              {product.actionText}
            </button>
          </div>
        ))}
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
                      <div>
                        <h5 className="font-bold text-lg text-gray-900 mb-1">{activeProduct.name}</h5>
                        <p className="text-sm text-indigo-600 font-semibold mb-3">AOV</p>
                        <div className="flex flex-wrap gap-2">
                          <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg flex items-center gap-1.5"><ShieldCheck className="w-4 h-4"/> Bản quyền trọn đời</span>
                          <span className="text-xs font-bold text-green-600 bg-green-50 px-3 py-1.5 rounded-lg flex items-center gap-1.5"><Download className="w-4 h-4"/> Tải xuống vĩnh viễn</span>
                        </div>
                      </div>
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
                        <label 
                          key={pkg.id}
                          onClick={() => {
                            if (isOutOfStock) return;
                            setSelectedPackage(pkg);
                            setAppliedDiscount(0);
                          }}
                          className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border-2 transition-all ${isOutOfStock ? "opacity-60 cursor-not-allowed bg-gray-50 border-gray-100" : selectedPackage.id === pkg.id ? "border-[#4F46E5] bg-indigo-50/20 cursor-pointer" : "border-gray-100 hover:border-indigo-100 bg-white cursor-pointer"}`}
                        >
                          <div className="flex items-center gap-3 mb-2 sm:mb-0">
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${selectedPackage.id === pkg.id && !isOutOfStock ? "border-[#4F46E5]" : "border-gray-300"}`}>
                              {selectedPackage.id === pkg.id && !isOutOfStock && <div className="w-2.5 h-2.5 rounded-full bg-[#4F46E5]"></div>}
                            </div>
                            <div>
                              <span className="font-bold text-gray-900 block text-sm">Key {pkg.name}</span>
                              <span className="text-xs text-gray-500">
                                Thời hạn: {pkg.name} 
                                {isOutOfStock ? <span className="text-red-500 font-bold ml-2">(Hết hàng)</span> : <span className="text-[#10B981] font-bold ml-2">(Còn {pkg.stock} key)</span>}
                              </span>
                            </div>
                          </div>
                          <div>
                            {(hasCustomPrice || isCTV) ? (
                              <div className="text-right ml-8 sm:ml-0">
                                <span className="text-xs text-gray-400 line-through mr-2">{pkg.price.toLocaleString('vi-VN')} đ</span>
                                <span className="font-bold text-rose-600">{displayPrice.toLocaleString('vi-VN')} đ</span>
                                <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded ml-2">{hasCustomPrice ? "Giá VIP" : "Giá CTV"}</span>
                              </div>
                            ) : (
                              <span className="font-bold text-gray-900 ml-8 sm:ml-0">{pkg.price.toLocaleString('vi-VN')} đ</span>
                            )}
                          </div>
                        </label>
                      )})}
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl p-5 md:p-6 shadow-sm border border-gray-100">
                    <h4 className="font-bold text-gray-900 mb-5 flex items-center gap-2"><CreditCard className="w-5 h-5 text-gray-700"/> Thông tin thanh toán</h4>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-3">Phương thức thanh toán</label>
                      <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="w-full bg-white border-2 border-gray-100 text-gray-900 text-sm rounded-xl focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 block p-4 outline-none font-semibold transition-all">
                        <option value="wallet">Ví hệ thống (Số dư: {balance.toLocaleString('vi-VN')} đ)</option>
                        <option value="qr">SePay (Chuyển khoản QR)</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-5 xl:col-span-4 space-y-6">
                  <div className="bg-white rounded-2xl p-5 md:p-6 shadow-sm border border-gray-100">
                    <h4 className="font-bold text-gray-900 mb-5 flex items-center gap-2"><Tag className="w-5 h-5 text-gray-700"/> Mã giảm giá</h4>
                    <div className="flex flex-row items-stretch gap-2 w-full">
                      <input type="text" value={voucherCodeInput} onChange={(e) => setVoucherCodeInput(e.target.value)} placeholder="Nhập mã giảm giá" className="flex-1 min-w-0 bg-gray-50 border border-gray-100 text-gray-900 text-sm rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 font-medium uppercase min-w-0" />
                      <button onClick={handleApplyVoucher} className="bg-white border border-gray-200 text-gray-700 hover:text-indigo-600 hover:border-indigo-300 px-4 py-3 rounded-xl text-sm font-bold transition-all shadow-sm whitespace-nowrap flex-shrink-0">
                        Áp dụng
                      </button>
                    </div>
                    {appliedDiscount > 0 && <p className="text-xs text-green-600 font-bold mt-2">Đã áp dụng giảm {appliedDiscount}%</p>}
                  </div>

                  <div className="bg-white rounded-2xl p-5 md:p-6 shadow-sm border border-gray-100">
                    <h4 className="font-bold text-gray-900 mb-5 flex items-center gap-2"><Receipt className="w-5 h-5 text-gray-700"/> Tóm tắt đơn hàng</h4>
                    <div className="space-y-4 mb-6 border-b border-gray-100 pb-6">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-500 font-medium">Giá gốc</span>
                        <span className="font-bold text-gray-900">{originalPrice.toLocaleString('vi-VN')} đ</span>
                      </div>
                      {appliedDiscount > 0 && (
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-green-600 font-bold">Giảm giá ({appliedDiscount}%)</span>
                          <span className="font-bold text-green-600">-{discountAmount.toLocaleString('vi-VN')} đ</span>
                        </div>
                      )}
                    </div>
                    <div className="flex justify-between items-center mb-6">
                      <span className="text-base font-bold text-gray-900">Tổng cộng</span>
                      <span className="text-2xl font-bold text-indigo-600">{finalPrice.toLocaleString('vi-VN')} đ</span>
                    </div>
                    
                    <button 
                      onClick={handleCheckout}
                      disabled={loadingPay || !selectedPackage || selectedPackage.id === 'loading' || selectedPackage.stock === 0}
                      className="w-full bg-white border-2 border-[#8B5CF6] hover:bg-[#8B5CF6] hover:text-white disabled:bg-gray-100 disabled:border-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-[#8B5CF6] py-3.5 rounded-xl font-bold transition-all shadow-sm flex items-center justify-center gap-2 group"
                    >
                      {loadingPay ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className={`w-4 h-4 transition-colors ${!selectedPackage || selectedPackage.id === 'loading' || selectedPackage.stock === 0 ? 'text-gray-400' : 'group-hover:text-white'}`}/>} 
                      {loadingPay ? "Đang xử lý..." : "Thanh toán ngay"}
                    </button>
                    <p className="text-[11px] text-gray-400 text-center mt-5 leading-relaxed font-medium">
                      Bằng việc đặt hàng, bạn đồng ý với <a href="#" className="underline hover:text-gray-600">Điều khoản</a> & <a href="#" className="underline hover:text-gray-600">Chính sách</a>
                    </p>
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