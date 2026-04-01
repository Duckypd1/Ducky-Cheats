import React, { useState } from 'react';
import { Users, Search, PlusCircle, Wallet, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

export function UserManager() {
  const [email, setEmail] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAddBalance = async () => {
    if (!email || !amount) return;
    setLoading(true);

    try {
      // 1. Tìm user trong bảng profiles dựa vào email (áp dụng trim() để xóa khoảng trắng thừa)
      const { data: userProfile, error: searchError } = await supabase
        .from('profiles')
        .select('id, balance')
        .eq('email', email.trim())
        .single();

      if (searchError || !userProfile) {
        alert(`❌ Không tìm thấy email: ${email}\n\nLý do: Khách hàng này chưa từng đăng nhập vào web, hoặc họ chưa bấm vào trang Ví Tiền để hệ thống lưu email.\nChi tiết lỗi: ${searchError?.message || 'Null'}`);
        setLoading(false);
        return;
      }

      // 2. Thực hiện cộng tiền vào số dư cũ
      const newBalance = (userProfile.balance || 0) + Number(amount);
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ balance: newBalance })
        .eq('id', userProfile.id);

      if (updateError) {
        alert(`❌ Supabase đã chặn lệnh cộng tiền!\n\nLý do: Bạn chưa tắt tính năng bảo mật RLS cho bảng 'profiles'.\nChi tiết lỗi Supabase: ${updateError.message}`);
        setLoading(false);
        return;
      }

      alert(`✅ Thành công! Đã cộng ${Number(amount).toLocaleString('vi-VN')}đ cho tài khoản ${email}. Khách hàng f5 lại ví sẽ thấy tiền!`);
      setAmount("");
      setEmail("");
    } catch (error: any) {
      console.error("Lỗi cộng tiền:", error);
      alert("❌ Lỗi không xác định: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
        <Users className="w-6 h-6 text-green-600" />
        Quản lý Khách hàng & Tài chính
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Box Tìm kiếm và Cộng tiền */}
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

        {/* Box Hướng dẫn / Lịch sử */}
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-6 md:p-8 rounded-3xl text-white shadow-sm">
          <h3 className="text-lg font-bold mb-4">Lưu ý khi cộng tiền</h3>
          <ul className="space-y-3 text-sm text-gray-300">
            <li className="flex gap-2">
              <span className="text-amber-400">⚠️</span> Nhập chính xác Email của khách hàng đã đăng ký trên hệ thống.
            </li>
            <li className="flex gap-2">
              <span className="text-amber-400">⚠️</span> Số tiền nhập vào không chứa dấu phẩy (VD: Nhập 50000 thay vì 50,000).
            </li>
            <li className="flex gap-2">
              <span className="text-amber-400">⚠️</span> Hành động này sẽ lập tức thay đổi số dư thực tế của người dùng.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}