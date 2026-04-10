import React, { useState, useEffect } from 'react';
import { Users, Search, PlusCircle, Wallet, Loader2, ShieldAlert, CheckCircle, UserCog, Tag, User } from 'lucide-react';
import { supabase } from '../lib/supabase';

export function UserManager() {
  const [email, setEmail] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  const [ctvEmail, setCtvEmail] = useState("");
  const [ctvLoading, setCtvLoading] = useState(false);

  const [packages, setPackages] = useState<any[]>([]);

  // 💥 FIX LỖI ĐỒNG BỘ: Ép hệ thống kéo danh sách gói trực tiếp từ Đám mây Supabase
  useEffect(() => {
    const fetchPackages = async () => {
      try {
        const { data, error } = await supabase
          .from('ducky_packages')
          .select('*')
          .order('price', { ascending: true });
          
        if (error) throw error;
        
        if (data && data.length > 0) {
          setPackages(data);
        } else {
          setPackages([
            { id: "1d", name: "1 Ngày", price: 20000, ctvPrice: 15000 },
            { id: "7d", name: "7 Ngày", price: 100000, ctvPrice: 70000 },
            { id: "30d", name: "30 Ngày", price: 300000, ctvPrice: 200000 },
          ]);
        }
      } catch (err) {
        console.error("Lỗi tải danh sách gói:", err);
      }
    };
    
    fetchPackages();
  }, []);

  const [searchEmail, setSearchEmail] = useState("");
  const [foundUser, setFoundUser] = useState<any>(null);
  const [editName, setEditName] = useState("");
  
  const [editCustomPrices, setEditCustomPrices] = useState<Record<string, any>>({}); 
  const [updateLoading, setUpdateLoading] = useState(false);

  const handleAddBalance = async () => {
    if (!email || !amount) return;
    setLoading(true);

    try {
      const { data: userProfile, error: searchError } = await supabase
        .from('profiles')
        .select('id, balance')
        .eq('email', email.trim())
        .maybeSingle();

      if (searchError || !userProfile) {
        alert(`❌ Không tìm thấy email: ${email}\n\nLý do: Khách hàng này chưa từng đăng nhập vào web, hoặc họ chưa bấm vào trang Ví Tiền để hệ thống lưu email.`);
        setLoading(false);
        return;
      }

      const newBalance = (userProfile.balance || 0) + Number(amount);
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ balance: newBalance })
        .eq('id', userProfile.id);

      if (updateError) {
        alert(`❌ Supabase đã chặn lệnh cộng tiền!\n\nLý do: Bạn chưa tắt tính năng bảo mật RLS cho bảng 'profiles'.`);
        setLoading(false);
        return;
      }

      alert(`✅ Thành công! Đã cộng ${Number(amount).toLocaleString('vi-VN')}đ cho tài khoản ${email}.`);
      setAmount("");
      setEmail("");
    } catch (error: any) {
      alert("❌ Lỗi không xác định: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSetRole = async (newRole: string) => {
    if (!ctvEmail) return;
    setCtvLoading(true);

    try {
      const { data: userProfile, error: searchError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', ctvEmail.trim())
        .maybeSingle();

      if (searchError || !userProfile) {
        alert(`❌ Không tìm thấy email: ${ctvEmail}`);
        setCtvLoading(false);
        return;
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userProfile.id);

      if (updateError) {
        alert(`❌ Lỗi chặn quyền RLS: ${updateError.message}`);
        setCtvLoading(false);
        return;
      }

      alert(`✅ Đã thiết lập tài khoản ${ctvEmail} thành: ${newRole === 'ctv' ? 'Đại Lý (CTV)' : 'Khách thường'}`);
      setCtvEmail("");
    } catch (error: any) {
      alert("❌ Lỗi: " + error.message);
    } finally {
      setCtvLoading(false);
    }
  };

  const handleSearchUser = async () => {
    if (!searchEmail) return;
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', searchEmail.trim())
      .maybeSingle();
    
    if (error || !data) {
      alert("Không tìm thấy khách hàng này!");
      return;
    }
    setFoundUser(data);
    setEditName(data.display_name || "");
    setEditCustomPrices(data.custom_prices || {}); 
  };

  const handlePriceChange = (pkgId: string, value: string) => {
    setEditCustomPrices(prev => ({
      ...prev,
      [pkgId]: value === "" ? "" : Number(value)
    }));
  };

  const handleUpdateUserInfo = async () => {
    if (!foundUser) return;
    setUpdateLoading(true);
    
    const cleanPrices: Record<string, number> = {};
    Object.keys(editCustomPrices).forEach(key => {
      if (editCustomPrices[key] !== "") {
        cleanPrices[key] = editCustomPrices[key];
      }
    });

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: editName,
          custom_prices: cleanPrices 
        })
        .eq('id', foundUser.id);
      
      if (error) throw error;
      alert("✅ Đã cập nhật Tên & Bảng Giá Riêng thành công!");
    } catch (e: any) {
      alert("Lỗi: " + e.message);
    } finally {
      setUpdateLoading(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
        <Users className="w-6 h-6 text-green-600" />
        Quản lý Khách hàng & Tài chính
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Box 1: Cộng tiền thủ công */}
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-gray-100 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Wallet className="w-5 h-5 text-indigo-500" />
            Cộng tiền thủ công
          </h3>
          
          <div className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Email khách hàng</label>
              <div className="relative">
                <Search className="w-5 h-5 text-gray-400 absolute left-3 top-3.5" />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="khachhang@gmail.com"
                  className="w-full bg-gray-50 border border-gray-100 text-gray-900 text-sm rounded-xl pl-10 p-3.5 outline-none focus:ring-2 focus:ring-indigo-100"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Số tiền cộng (VNĐ)</label>
              <input 
                type="number" 
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Ví dụ: 50000"
                className="w-full bg-gray-50 border border-gray-100 text-gray-900 text-sm rounded-xl p-3.5 outline-none focus:ring-2 focus:ring-indigo-100 font-bold"
              />
            </div>

            <button 
              onClick={handleAddBalance}
              disabled={!email || !amount || loading}
              className="w-full bg-[#10B981] hover:bg-[#059669] disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-3.5 rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <PlusCircle className="w-5 h-5" />}
              {loading ? "Đang xử lý..." : "Thực hiện cộng tiền"}
            </button>
          </div>
        </div>

        {/* Box 2: Cấp quyền Đại lý (CTV) */}
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-rose-100 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-rose-50 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
          <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2 relative z-10">
            <ShieldAlert className="w-5 h-5 text-rose-500" /> Cấp quyền Đại lý (CTV)
          </h3>
          <div className="space-y-5 relative z-10">
            <p className="text-xs text-gray-500 mb-2">Tài khoản Đại lý sẽ tự động được mua Key với giá sỉ siêu rẻ mà không cần nhập mã giảm giá.</p>
            <input 
              type="email" 
              value={ctvEmail} 
              onChange={(e) => setCtvEmail(e.target.value)}
              placeholder="Nhập email CTV..."
              className="w-full bg-gray-50 border border-gray-100 text-gray-900 text-sm rounded-xl p-3.5 outline-none focus:ring-2 focus:ring-rose-100"
            />
            <div className="flex gap-3">
              <button 
                onClick={() => handleSetRole('ctv')} 
                disabled={ctvLoading || !ctvEmail}
                className="flex-1 bg-rose-500 hover:bg-rose-600 disabled:bg-gray-300 text-white py-3.5 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
              >
                {ctvLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                Lên Đại Lý
              </button>
              <button 
                onClick={() => handleSetRole('user')} 
                disabled={ctvLoading || !ctvEmail}
                className="flex-1 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 text-gray-700 py-3.5 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
              >
                Hủy quyền
              </button>
            </div>
          </div>
        </div>

        {/* Box 4: Chỉnh sửa Tên & Bảng giá riêng từng Sản phẩm */}
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-amber-100 shadow-sm md:col-span-2">
          <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
            <UserCog className="w-5 h-5 text-amber-500" /> Cài đặt Tên & Bảng Giá Riêng (VIP)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="md:col-span-2 flex gap-2">
              <input 
                type="email" 
                value={searchEmail} 
                onChange={(e) => setSearchEmail(e.target.value)} 
                placeholder="Nhập email khách cần chỉnh..." 
                className="flex-1 bg-gray-50 border border-gray-100 rounded-xl p-3 outline-none focus:ring-2 focus:ring-amber-100 text-sm" 
              />
              <button 
                onClick={handleSearchUser} 
                className="bg-amber-500 hover:bg-amber-600 text-white px-6 rounded-xl font-bold flex items-center gap-2 transition-all"
              >
                <Search className="w-4 h-4"/> Tìm
              </button>
            </div>
          </div>

          {foundUser && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-amber-50/30 rounded-3xl border border-amber-50 animate-in fade-in zoom-in-95 duration-300">
              
              {/* Form Input Tên */}
              <div className="space-y-4">
                <label className="block text-xs font-bold text-amber-600 uppercase tracking-wider">Tên hiển thị mới</label>
                <div className="relative">
                  <User className="absolute left-3 top-3.5 w-4 h-4 text-gray-400"/>
                  <input 
                    type="text" 
                    value={editName} 
                    onChange={(e) => setEditName(e.target.value)} 
                    className="w-full bg-white border border-amber-200 rounded-xl p-3 pl-10 outline-none focus:ring-2 focus:ring-amber-200 text-sm" 
                  />
                </div>
              </div>

              {/* Danh sách nhập Giá riêng cho từng gói */}
              <div className="bg-white rounded-2xl p-4 border border-amber-100 shadow-sm row-span-2">
                <p className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-4">Cài đặt giá riêng từng gói (VNĐ)</p>
                <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
                  {packages.map(pkg => (
                    <div key={pkg.id} className="flex flex-col gap-1.5 pb-3 border-b border-gray-50 last:border-0 last:pb-0">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-gray-700 text-sm">{pkg.name}</span>
                        <span className="text-[10px] text-gray-400">Giá gốc: {Number(pkg.price).toLocaleString()}đ</span>
                      </div>
                      <div className="relative w-full">
                        <Tag className="absolute left-3 top-2.5 w-3.5 h-3.5 text-gray-400"/>
                        <input 
                          type="number" 
                          value={editCustomPrices[pkg.id] !== undefined ? editCustomPrices[pkg.id] : ""} 
                          onChange={(e) => handlePriceChange(pkg.id, e.target.value)} 
                          placeholder="Để trống = Giá gốc" 
                          className="w-full bg-gray-50 border border-amber-200 rounded-lg p-2 pl-9 outline-none focus:ring-2 focus:ring-amber-200 text-sm font-bold text-rose-600" 
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-end">
                <button 
                  onClick={handleUpdateUserInfo} 
                  disabled={updateLoading} 
                  className="w-full bg-gray-900 text-amber-400 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-black transition-all shadow-lg shadow-amber-100"
                >
                  {updateLoading ? <Loader2 className="w-5 h-5 animate-spin"/> : <CheckCircle className="w-5 h-5"/>}
                  Lưu Thông Tin VIP
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Box 3: Hướng dẫn */}
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-6 md:p-8 rounded-3xl text-white shadow-sm md:col-span-2">
          <h3 className="text-lg font-bold mb-4">Lưu ý khi quản lý khách hàng</h3>
          <ul className="space-y-3 text-sm text-gray-300">
            <li className="flex gap-2">
              <span className="text-amber-400">⚠️</span> Nhập chính xác Email của khách hàng đã đăng ký trên hệ thống.
            </li>
            <li className="flex gap-2">
              <span className="text-amber-400">⚠️</span> Nếu bạn điền <strong>Giá bán riêng</strong> cho một gói, khách hàng sẽ luôn mua gói đó bằng giá này (ưu tiên cao hơn giá CTV mặc định). Nếu để trống, hệ thống sẽ tính giá mặc định.
            </li>
            <li className="flex gap-2">
              <span className="text-amber-400">⚠️</span> Các thay đổi về Tên và Bảng giá sẽ áp dụng ngay khi khách hàng tải lại trang.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}