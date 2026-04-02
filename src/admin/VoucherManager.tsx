import React, { useState, useEffect } from 'react';
import { Ticket, Gift, Trash2, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

export function VoucherManager() {
  const [code, setCode] = useState('');
  const [discount, setDiscount] = useState('');
  const [quantity, setQuantity] = useState('');
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchVouchers = async () => {
    const { data } = await supabase.from('ducky_vouchers').select('*').order('created_at', { ascending: false });
    if (data) setVouchers(data);
  };

  useEffect(() => {
    fetchVouchers();
  }, []);

  const handleCreateVoucher = async () => {
    if (!code || !discount || !quantity) {
      alert("Vui lòng điền đầy đủ thông tin!");
      return;
    }
    setLoading(true);
    try {
      const newVoucher = {
        code: code.toUpperCase(),
        discount: Number(discount),
        quantity: Number(quantity)
      };
      const { error } = await supabase.from('ducky_vouchers').insert(newVoucher);
      if (error) throw error;

      alert(`Đã tạo thành công Voucher: ${newVoucher.code} (Giảm ${newVoucher.discount}%)`);
      setCode(''); setDiscount(''); setQuantity('');
      fetchVouchers();
    } catch (err: any) {
      alert("Lỗi tạo Voucher: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Xóa mã giảm giá này?")) {
      await supabase.from('ducky_vouchers').delete().eq('id', id);
      fetchVouchers();
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Quản lý Mã Giảm Giá</h2>
      
      <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500 shadow-inner">
            <Gift className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">Tạo mã Voucher mới</h3>
            <p className="text-xs text-gray-500 font-medium">Khuyến mãi kích cầu mua sắm</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="md:col-span-1">
            <label className="block text-xs font-bold text-gray-400 uppercase mb-2 ml-1">Mã code</label>
            <input 
              type="text" 
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="VD: DUCKYNEW" 
              className="w-full bg-gray-50 border border-gray-100 text-gray-900 text-sm rounded-2xl p-4 outline-none focus:ring-2 focus:ring-amber-100 font-mono font-bold uppercase" 
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-2 ml-1">Giảm (%)</label>
            <input 
              type="number" 
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
              placeholder="10" 
              className="w-full bg-gray-50 border border-gray-100 text-gray-900 text-sm rounded-2xl p-4 outline-none focus:ring-2 focus:ring-amber-100" 
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-2 ml-1">Số lượng</label>
            <input 
              type="number" 
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="100" 
              className="w-full bg-gray-50 border border-gray-100 text-gray-900 text-sm rounded-2xl p-4 outline-none focus:ring-2 focus:ring-amber-100" 
            />
          </div>
        </div>

        <button 
          onClick={handleCreateVoucher}
          disabled={loading}
          className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-white py-4 rounded-2xl font-bold transition-all shadow-lg shadow-amber-100 flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin"/> : <Ticket className="w-5 h-5" />}
          Phát hành Voucher
        </button>
      </div>

      {vouchers.length > 0 && (
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm mt-6">
          <h3 className="font-bold text-gray-900 mb-4">Voucher đang hoạt động</h3>
          <div className="space-y-3">
            {vouchers.map(v => (
              <div key={v.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-2xl bg-gray-50/50">
                <div>
                  <span className="font-mono font-bold text-amber-600 bg-amber-50 px-3 py-1 rounded-lg border border-amber-100">{v.code}</span>
                  <span className="text-sm font-semibold text-gray-600 ml-3">Giảm {v.discount}%</span>
                  <span className="text-xs text-gray-400 ml-3">(Còn {v.quantity} lượt)</span>
                </div>
                <button onClick={() => handleDelete(v.id)} className="text-gray-400 hover:text-red-500 p-2">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}