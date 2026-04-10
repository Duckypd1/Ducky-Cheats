import React, { useState, useEffect } from 'react';
import { Edit3, Trash2, Plus, CheckCircle2, X, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

export function ProductsManager() {
  const [products, setProducts] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  // THÊM ctvPrice VÀO TRẠNG THÁI MẶC ĐỊNH
  const [formData, setFormData] = useState<any>({ id: null, name: "", price: 0, ctvPrice: 0, popular: false });
  const [loading, setLoading] = useState(false);

  const fetchPackages = async () => {
    const { data } = await supabase.from('ducky_packages').select('*').order('price', { ascending: true });
    if (data && data.length > 0) {
      setProducts(data);
    } else {
      const defaultPkgs = [
        { id: "1d", name: "1 Ngày", price: 20000, ctv_price: 15000, popular: false },
        { id: "7d", name: "7 Ngày", price: 100000, ctv_price: 70000, popular: true },
        { id: "30d", name: "30 Ngày", price: 300000, ctv_price: 200000, popular: false },
      ];
      await supabase.from('ducky_packages').insert(defaultPkgs);
      setProducts(defaultPkgs.map(p => ({...p, ctvPrice: p.ctv_price})));
    }
  };

  useEffect(() => {
    fetchPackages();
  }, []);

  const handleOpenModal = (product: any = null) => {
    if (product) {
      // Load đúng giá CTV lên form
      setFormData({ ...product, ctvPrice: product.ctv_price || product.ctvPrice || 0 });
    } else {
      setFormData({ id: null, name: "", price: 0, ctvPrice: 0, popular: false });
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name || formData.price <= 0) {
      alert("Vui lòng nhập tên gói và giá hợp lệ!");
      return;
    }
    setLoading(true);
    try {
      const payload = {
        id: formData.id || Date.now().toString(),
        name: formData.name,
        price: formData.price,
        ctv_price: formData.ctvPrice || Math.floor(formData.price * 0.7), // LẤY GIÁ CTV TỪ Ô NHẬP, nếu trống thì lấy 70%
        popular: formData.popular || false
      };
      const { error } = await supabase.from('ducky_packages').upsert(payload);
      if (error) throw error;
      
      setIsModalOpen(false);
      fetchPackages();
    } catch (err: any) {
      alert("Lỗi lưu gói: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa gói này không?")) {
      await supabase.from('ducky_packages').delete().eq('id', id);
      fetchPackages();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Quản lý Sản phẩm</h2>
        <button 
          onClick={() => handleOpenModal()} 
          className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-sm text-sm"
        >
          <Plus className="w-4 h-4" /> Thêm gói mới
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="p-4 text-xs font-bold text-gray-400 uppercase">Tên gói cheat</th>
              <th className="p-4 text-xs font-bold text-gray-400 uppercase">Giá gốc</th>
              <th className="p-4 text-xs font-bold text-gray-400 uppercase">Giá CTV</th>
              <th className="p-4 text-xs font-bold text-gray-400 uppercase text-center">Trạng thái</th>
              <th className="p-4 text-xs font-bold text-gray-400 uppercase text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {products.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="p-4 font-bold text-gray-900 text-sm">Ducky Cheat AOV VIP ({p.name})</td>
                <td className="p-4 font-bold text-indigo-600 text-sm">{Number(p.price).toLocaleString('vi-VN')}đ</td>
                <td className="p-4 font-bold text-rose-500 text-sm">{Number(p.ctv_price || p.ctvPrice || 0).toLocaleString('vi-VN')}đ</td>
                <td className="p-4 text-center">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-50 text-green-600 text-xs font-bold border border-green-100">
                    <CheckCircle2 className="w-3 h-3" /> Đang bán
                  </span>
                </td>
                <td className="p-4 text-right space-x-2">
                  <button 
                    onClick={() => handleOpenModal(p)}
                    className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleDelete(p.id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <div className="bg-white rounded-3xl w-full max-w-md relative z-10 shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between shrink-0">
              <h3 className="text-xl font-bold text-[#111827]">
                {formData.id ? "Chỉnh sửa gói" : "Thêm gói mới"}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center hover:bg-gray-100 text-gray-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-6 space-y-5 overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2 ml-1">Tên gói (VD: 1 Ngày)</label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Ví dụ: 3 Ngày"
                  className="w-full bg-gray-50 border border-gray-100 text-gray-900 text-sm rounded-2xl focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 block p-3.5 outline-none font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2 ml-1">Giá bán gốc (VNĐ)</label>
                <input 
                  type="number" 
                  value={formData.price || ""}
                  onChange={(e) => setFormData({...formData, price: Number(e.target.value)})}
                  placeholder="20000"
                  className="w-full bg-gray-50 border border-gray-100 text-gray-900 text-sm rounded-2xl focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 block p-3.5 outline-none font-bold text-indigo-600"
                />
              </div>

              {/* Ô NHẬP GIÁ CTV */}
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2 ml-1">Giá Đại Lý / CTV (VNĐ)</label>
                <input 
                  type="number" 
                  value={formData.ctvPrice || ""}
                  onChange={(e) => setFormData({...formData, ctvPrice: Number(e.target.value)})}
                  placeholder="15000"
                  className="w-full bg-gray-50 border border-gray-100 text-gray-900 text-sm rounded-2xl focus:ring-2 focus:ring-rose-100 focus:border-rose-400 block p-3.5 outline-none font-bold text-rose-500"
                />
              </div>
              
              <label className="flex items-center gap-2 cursor-pointer pt-2">
                <input 
                  type="checkbox" 
                  checked={formData.popular || false}
                  onChange={(e) => setFormData({...formData, popular: e.target.checked})}
                  className="w-4 h-4 text-indigo-600 rounded"
                />
                <span className="text-sm font-medium text-gray-700">Đánh dấu là gói "Phổ biến nhất"</span>
              </label>
            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50/50 shrink-0">
              <button 
                onClick={handleSave}
                disabled={loading}
                className="w-full bg-[#4F46E5] hover:bg-indigo-600 disabled:bg-indigo-300 text-white py-3.5 rounded-xl font-bold transition-all shadow-md flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin"/> : null}
                Lưu lại
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}