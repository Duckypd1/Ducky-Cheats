import React, { useState, useEffect } from 'react';
import { Key, Database, Save, CheckCircle2, Trash2, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase'; 

export function KeyManager() {
  const [keysInput, setKeysInput] = useState("");
  const [packages, setPackages] = useState<any[]>([]);
  const [selectedPackageId, setSelectedPackageId] = useState<string>("");
  const [keysList, setKeysList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false); 

  const fetchData = async () => {
    try {
      // 1. KÉO GÓI SẢN PHẨM TỪ SUPABASE (Đồng bộ chuẩn ID với trang chủ)
      const { data: dbPkgs } = await supabase.from('ducky_packages').select('*').order('price', { ascending: true });
      if (dbPkgs && dbPkgs.length > 0) {
        setPackages(dbPkgs);
        setSelectedPackageId(dbPkgs[0].id);
      } else {
        const defaultPkgs = [
          { id: "1d", name: "1 Ngày", price: 20000, ctvPrice: 15000 },
          { id: "7d", name: "7 Ngày", price: 100000, ctvPrice: 70000 },
          { id: "30d", name: "30 Ngày", price: 300000, ctvPrice: 200000 },
        ];
        setPackages(defaultPkgs);
        setSelectedPackageId(defaultPkgs[0].id);
      }

      // 2. KÉO DANH SÁCH KEY
      const { data: dbKeys, error } = await supabase.from('ducky_keys').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      if (dbKeys) setKeysList(dbKeys);
    } catch (err: any) {
      console.error("Lỗi tải dữ liệu:", err.message);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSaveKeys = async () => {
    if (!selectedPackageId) {
      alert("Vui lòng chọn gói sản phẩm!");
      return;
    }

    const keyArray = keysInput.split('\n').filter(k => k.trim() !== '');
    if (keyArray.length === 0) return;
    setLoading(true);

    try {
      const newKeys = keyArray.map(code => ({
        package_id: selectedPackageId, 
        key_code: code.trim(),
        status: 'available' 
      }));

      const { error } = await supabase.from('ducky_keys').insert(newKeys);
      if (error) throw error;

      alert(`Thành công! Đã nạp ${newKeys.length} key vào Đám mây.`);
      setKeysInput(""); 
      fetchData(); 
    } catch (err: any) {
      alert("❌ Lỗi khi lưu key lên hệ thống: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteKey = async (id: string) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa key này khỏi hệ thống?")) {
      setLoading(true);
      try {
        const { error } = await supabase.from('ducky_keys').delete().eq('id', id);
        if (error) throw error;
        setKeysList(prev => prev.filter(k => k.id !== id));
      } catch (err: any) {
        alert("❌ Lỗi khi xóa key: " + err.message);
      } finally {
        setLoading(false);
      }
    }
  };

  const getPackageName = (id: string) => {
    const pkg = packages.find(p => String(p.id) === String(id));
    return pkg ? pkg.name : "Gói không rõ";
  };

  return (
    <div className="max-w-5xl space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
        <Database className="w-6 h-6 text-indigo-600" />
        Quản lý Kho Key Đám Mây
      </h2>

      <div className="bg-white p-6 md:p-8 rounded-3xl border border-gray-100 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 mb-6">Nhập lô Key mới</h3>
        
        <div className="mb-6">
          <label className="block text-sm font-bold text-gray-700 mb-2">Chọn gói Sản phẩm</label>
          <select 
            value={selectedPackageId}
            onChange={(e) => setSelectedPackageId(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 block p-3.5 outline-none font-medium cursor-pointer"
          >
            {packages.map(p => (
              <option key={p.id} value={p.id}>Ducky Cheat AOV VIP ({p.name})</option>
            ))}
          </select>
        </div>

        <div className="mb-6">
          <label className="flex items-center justify-between text-sm font-bold text-gray-700 mb-2">
            <span>Danh sách Key</span>
            <span className="text-xs text-gray-400 font-normal">Mỗi dòng 1 key</span>
          </label>
          <textarea
            value={keysInput}
            onChange={(e) => setKeysInput(e.target.value)}
            rows={6}
            placeholder="ABCD-1234-EFGH-5678&#10;QWER-9876-TYUI-5432"
            className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 block p-4 outline-none font-mono tracking-wider"
          />
        </div>

        <button 
          onClick={handleSaveKeys}
          disabled={!keysInput.trim() || loading}
          className="w-full bg-[#4F46E5] hover:bg-indigo-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-3.5 rounded-xl font-bold transition-all shadow-md flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          {loading ? "Đang đẩy lên mây..." : "Nạp vào kho"}
        </button>
      </div>

      <div className="bg-white p-6 md:p-8 rounded-3xl border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Key className="w-5 h-5 text-indigo-500" />
            Danh sách Key hiện có ({keysList.length})
          </h3>
          <button 
            onClick={fetchData} 
            className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition-colors"
          >
            Làm mới
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="p-4 text-xs font-bold text-gray-400 uppercase">Mã Key</th>
                <th className="p-4 text-xs font-bold text-gray-400 uppercase">Gói Sản Phẩm</th>
                <th className="p-4 text-xs font-bold text-gray-400 uppercase text-center">Trạng thái</th>
                <th className="p-4 text-xs font-bold text-gray-400 uppercase text-right">Xóa</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {keysList.map((k) => (
                <tr key={k.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="p-4 font-mono font-bold text-indigo-600 text-sm">
                    {k.key_code}
                  </td>
                  <td className="p-4 font-semibold text-gray-900 text-sm">
                    Key {getPackageName(k.package_id || k.packageId)} 
                  </td>
                  <td className="p-4 text-center">
                    {k.status === 'available' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-50 text-green-600 text-[11px] font-bold border border-green-100">
                        <CheckCircle2 className="w-3 h-3" /> Chưa bán
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gray-100 text-gray-500 text-[11px] font-bold border border-gray-200">
                        Đã bán
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    <button 
                      onClick={() => handleDeleteKey(k.id)}
                      disabled={loading}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {keysList.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-gray-500 font-medium">
                    Kho key đang trống. Vui lòng nhập thêm key ở trên!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}