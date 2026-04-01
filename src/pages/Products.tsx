import React, { useState, useEffect } from 'react';
import { X, Check, ShoppingBag, ShieldCheck, Download, FileText, CreditCard, Tag, Receipt, Lock } from 'lucide-react'; 
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

export function Products() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeProduct, setActiveProduct] = useState(productList[0]); 
  
  const [packages, setPackages] = useState<any[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState("wallet");
  const [balance, setBalance] = useState<number>(0);
  const [userId, setUserId] = useState<string | null>(null);
  const [totalStock, setTotalStock] = useState<number>(0);

  const [voucherCodeInput, setVoucherCodeInput] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState<number>(0);

  const navigate = useNavigate();

  useEffect(() => {
    // 1. KHỞI TẠO KHO KEY (TRỐNG HOÀN TOÀN)
    let savedKeys = JSON.parse(localStorage.getItem('ducky_keys') || "null");
    if (!savedKeys) {
      savedKeys = []; // Để trống
      localStorage.setItem('ducky_keys', JSON.stringify(savedKeys));
    }

    setTotalStock(savedKeys.filter((k: any) => k.status === 'available').length);

    // 2. Kéo gói từ LocalStorage
    const savedPackages = localStorage.getItem('ducky_packages');
    const loadedPackages = savedPackages ? JSON.parse(savedPackages) : [
      { id: "1d", name: "1 Ngày", price: 20000, popular: false },
      { id: "7d", name: "7 Ngày", price: 100000, popular: true },
      { id: "30d", name: "30 Ngày", price: 300000, popular: false },
    ];
    
    const packagesWithStock = loadedPackages.map((pkg: any) => ({
      ...pkg,
      stock: savedKeys.filter((k: any) => k.packageId === pkg.id && k.status === 'available').length
    }));

    setPackages(packagesWithStock);
    const availablePkg = packagesWithStock.find((p: any) => p.stock > 0);
    setSelectedPackage(availablePkg || null);

    const fetchBalance = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        const { data } = await supabase.from('profiles').select('balance').eq('id', user.id).single();
        if (data) setBalance(data.balance || 0);
      }
    };
    fetchBalance();
  }, []);

  const handleOpenModal = (product: any) => {
    setActiveProduct(product);
    setIsModalOpen(true);
  };

  const handleApplyVoucher = () => {
    if (!voucherCodeInput.trim()) return;
    const savedVouchersStr = localStorage.getItem('ducky_vouchers');
    const systemVouchers = savedVouchersStr ? JSON.parse(savedVouchersStr) : [];
    const foundVoucher = systemVouchers.find((v: any) => v.code === voucherCodeInput.toUpperCase());

    if (foundVoucher && foundVoucher.quantity > 0) {
      setAppliedDiscount(foundVoucher.discount);
      alert(`Áp dụng thành công mã giảm ${foundVoucher.discount}%!`);
    } else {
      alert("Mã giảm giá không hợp lệ hoặc đã hết lượt sử dụng.");
      setAppliedDiscount(0);
    }
  };

  const originalPrice = selectedPackage ? selectedPackage.price : 0;
  const discountAmount = (originalPrice * appliedDiscount) / 100;
  const finalPrice = originalPrice - discountAmount;

  // --- XỬ LÝ THANH TOÁN & RÚT KEY THẬT ---
  const handleCheckout = async () => {
    if (!selectedPackage) return;

    let currentKeys = JSON.parse(localStorage.getItem('ducky_keys') || "[]");
    const availableKeyIndex = currentKeys.findIndex((k: any) => k.packageId === selectedPackage.id && k.status === 'available');

    if (availableKeyIndex === -1) {
      alert("Rất tiếc, gói này vừa hết key! Vui lòng chọn gói khác.");
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

    const assignedKey = currentKeys[availableKeyIndex];
    currentKeys[availableKeyIndex].status = 'sold';
    localStorage.setItem('ducky_keys', JSON.stringify(currentKeys));

    const orderId = "ORD-" + Math.floor(10000 + Math.random() * 90000);
    const now = new Date();
    const dateStr = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

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
    <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 min-h-[60vh] relative">
      
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Danh mục & Sản phẩm</h2>
        <p className="text-gray-500">Quản lý và mua các gói cheat hiện hành.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {productList.map((product) => (
          <div 
            key={product.id} 
            className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col hover:shadow-md transition-shadow group"
          >
            <div className="rounded-xl overflow-hidden mb-4 bg-gray-900 aspect-square sm:aspect-[4/3] relative">
              <img 
                src={product.imageUrl} 
                alt={product.name} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>

            <h3 className="text-xl font-bold text-[#111827] mb-2">
              {product.name}
            </h3>
            
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-1.5 bg-green-50 px-2.5 py-1 rounded-md">
                <span className={`w-1.5 h-1.5 rounded-full ${totalStock > 0 ? 'bg-[#10B981]' : 'bg-red-500'}`}></span>
                <p className={`text-[11px] font-bold tracking-wide ${totalStock > 0 ? 'text-[#10B981]' : 'text-red-500'}`}>
                  {totalStock > 0 ? `Còn ${totalStock} key` : 'Hết hàng'}
                </p>
              </div>
              <p className="text-[11px] text-gray-400 font-semibold">
                {product.sold} đơn đã bán
              </p>
            </div>

            <button 
              onClick={() => handleOpenModal(product)}
              className="mt-auto w-full bg-[#2563EB] text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-sm uppercase tracking-wide"
            >
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
              <button onClick={() => setIsModalOpen(false)} className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center hover:bg-gray-100 text-gray-500 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 md:p-6 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                <div className="lg:col-span-7 xl:col-span-8 space-y-6">
                  
                  <div className="bg-white rounded-2xl p-5 md:p-6 shadow-sm border border-gray-100">
                    <h4 className="font-bold text-gray-900 mb-5 flex items-center gap-2">
                      <ShoppingBag className="w-5 h-5 text-gray-700"/> Thông tin sản phẩm
                    </h4>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-5">
                      <img src={activeProduct.imageUrl} alt={activeProduct.name} className="w-24 h-24 rounded-2xl object-cover bg-gray-900 shadow-sm" />
                      <div>
                        <h5 className="font-bold text-lg text-gray-900 mb-1">{activeProduct.name}</h5>
                        <p className="text-sm text-indigo-600 font-semibold mb-3">AOV</p>
                        <div className="flex flex-wrap gap-2">
                          <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                            <ShieldCheck className="w-4 h-4"/> Bản quyền trọn đời
                          </span>
                          <span className="text-xs font-bold text-green-600 bg-green-50 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                            <Download className="w-4 h-4"/> Tải xuống vĩnh viễn
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl p-5 md:p-6 shadow-sm border border-gray-100">
                    <h4 className="font-bold text-gray-900 mb-5 flex items-center gap-2">
                      <FileText className="w-5 h-5 text-gray-700"/> Chi tiết đơn hàng
                    </h4>
                    <div className="space-y-3">
                      {packages.map((pkg) => {
                        const isOutOfStock = pkg.stock === 0;
                        return (
                        <label 
                          key={pkg.id}
                          onClick={() => {
                            if (isOutOfStock) return;
                            setSelectedPackage(pkg);
                            setAppliedDiscount(0);
                          }}
                          className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border-2 transition-all ${
                            isOutOfStock 
                              ? "opacity-60 cursor-not-allowed bg-gray-50 border-gray-100" 
                              : selectedPackage.id === pkg.id 
                                ? "border-[#4F46E5] bg-indigo-50/20 cursor-pointer" 
                                : "border-gray-100 hover:border-indigo-100 bg-white cursor-pointer"
                          }`}
                        >
                          <div className="flex items-center gap-3 mb-2 sm:mb-0">
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                              selectedPackage.id === pkg.id && !isOutOfStock ? "border-[#4F46E5]" : "border-gray-300"
                            }`}>
                              {selectedPackage.id === pkg.id && !isOutOfStock && <div className="w-2.5 h-2.5 rounded-full bg-[#4F46E5]"></div>}
                            </div>
                            <div>
                              <span className="font-bold text-gray-900 block text-sm">Key {pkg.name}</span>
                              <span className="text-xs text-gray-500">
                                Thời hạn: {pkg.name} 
                                {isOutOfStock ? (
                                  <span className="text-red-500 font-bold ml-2">(Hết hàng)</span>
                                ) : (
                                  <span className="text-[#10B981] font-bold ml-2">(Còn {pkg.stock} key)</span>
                                )}
                              </span>
                            </div>
                          </div>
                          <span className="font-bold text-gray-900 ml-8 sm:ml-0">{pkg.price.toLocaleString('vi-VN')} đ</span>
                        </label>
                      )})}
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl p-5 md:p-6 shadow-sm border border-gray-100">
                    <h4 className="font-bold text-gray-900 mb-5 flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-gray-700"/> Thông tin thanh toán
                    </h4>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-3">Phương thức thanh toán</label>
                      <select 
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="w-full bg-white border-2 border-gray-100 text-gray-900 text-sm rounded-xl focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 block p-4 outline-none font-semibold transition-all"
                      >
                        <option value="wallet">Ví hệ thống (Số dư: {balance.toLocaleString('vi-VN')} đ)</option>
                        <option value="qr">SePay (Chuyển khoản QR)</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-5 xl:col-span-4 space-y-6">
                  
                  <div className="bg-white rounded-2xl p-5 md:p-6 shadow-sm border border-gray-100">
                    <h4 className="font-bold text-gray-900 mb-5 flex items-center gap-2">
                      <Tag className="w-5 h-5 text-gray-700"/> Mã giảm giá
                    </h4>
                    {/* BƯỚC SỬA LỖI UI MỤC VOUCHER Ở ĐÂY */}
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input 
                        type="text" 
                        value={voucherCodeInput}
                        onChange={(e) => setVoucherCodeInput(e.target.value)}
                        placeholder="Nhập mã giảm giá" 
                        className="flex-1 bg-gray-50 border border-gray-100 text-gray-900 text-sm rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 font-medium uppercase min-w-0" 
                      />
                      <button 
                        onClick={handleApplyVoucher}
                        className="bg-white border border-gray-200 text-gray-700 hover:text-indigo-600 hover:border-indigo-300 px-4 py-3 rounded-xl text-sm font-bold transition-all shadow-sm whitespace-nowrap flex-shrink-0"
                      >
                        Áp dụng
                      </button>
                    </div>
                    {appliedDiscount > 0 && (
                      <p className="text-xs text-green-600 font-bold mt-2">Đã áp dụng giảm {appliedDiscount}%</p>
                    )}
                  </div>

                  <div className="bg-white rounded-2xl p-5 md:p-6 shadow-sm border border-gray-100">
                    <h4 className="font-bold text-gray-900 mb-5 flex items-center gap-2">
                      <Receipt className="w-5 h-5 text-gray-700"/> Tóm tắt đơn hàng
                    </h4>
                    
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
                      disabled={!selectedPackage || selectedPackage.stock === 0}
                      className="w-full bg-white border-2 border-[#8B5CF6] hover:bg-[#8B5CF6] hover:text-white disabled:bg-gray-100 disabled:border-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-[#8B5CF6] py-3.5 rounded-xl font-bold transition-all shadow-sm flex items-center justify-center gap-2 group"
                    >
                      <Lock className={`w-4 h-4 transition-colors ${!selectedPackage || selectedPackage.stock === 0 ? 'text-gray-400' : 'group-hover:text-white'}`}/> 
                      Thanh toán ngay
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