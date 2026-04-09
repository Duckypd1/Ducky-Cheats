import React, { useState, useEffect } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { 
  LayoutGrid, 
  Package, 
  Key, 
  Users, 
  Ticket, 
  Bell, 
  Menu, 
  X, 
  LogOut, 
  AlertTriangle, 
  Loader2 
} from "lucide-react";
import { supabase } from "../lib/supabase";

export function AdminLayout() {
  // LỚP BẢO VỆ: Trạng thái phân quyền Admin
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  
  // GIAO DIỆN: Biến trạng thái để Đóng/Mở menu trên điện thoại
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const location = useLocation();
  const navigate = useNavigate();

  // Kiểm tra quyền Admin khi vừa vào trang
  useEffect(() => {
    checkAdminRole();
  }, []);

  const checkAdminRole = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      setIsAdmin(profile?.role === 'admin');
    } catch (error) {
      console.error("Lỗi kiểm tra quyền:", error);
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  };

  // Màn hình chờ khi đang check quyền
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  // Màn hình chặn nếu không phải Admin
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <AlertTriangle className="w-16 h-16 text-red-500 mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Khu vực cấm!</h1>
        <p className="text-gray-500 mb-6">Chỉ quản trị viên mới được vào khu vực này.</p>
        <button onClick={() => navigate('/')} className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-medium">
          Về trang chủ
        </button>
      </div>
    );
  }

  // Danh sách các Menu
  const menuItems = [
    { path: '/admin/products', icon: <Package className="w-5 h-5" />, label: 'Quản lý Sản phẩm' },
    { path: '/admin/keys', icon: <Key className="w-5 h-5" />, label: 'Quản lý Kho Key' },
    { path: '/admin/users', icon: <Users className="w-5 h-5" />, label: 'Thành viên & Tiền' },
    { path: '/admin/vouchers', icon: <Ticket className="w-5 h-5" />, label: 'Quản lý Voucher' },
    { path: '/admin/notifications', icon: <Bell className="w-5 h-5" />, label: 'Phát Thông báo' },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col md:flex-row font-sans">
      
      {/* --- THANH ĐIỀU HƯỚNG TRÊN CÙNG (CHỈ HIỆN TRÊN ĐIỆN THOẠI) --- */}
      <div className="md:hidden bg-white h-16 border-b border-gray-100 flex items-center px-4 justify-between sticky top-0 z-40 shadow-sm">
        {/* Nút 3 gạch (Hamburger) */}
        <button 
          onClick={() => setIsMobileMenuOpen(true)} 
          className="p-2.5 -ml-2 rounded-xl hover:bg-gray-50 text-gray-600 transition-colors"
        >
          <Menu className="w-6 h-6" />
        </button>
        
        {/* Logo nhỏ giữa màn hình */}
        <div className="flex items-center gap-2.5 font-bold text-gray-900 text-lg">
          <div className="w-8 h-8 rounded-lg bg-[#4F46E5] flex items-center justify-center text-white shadow-sm">
            <LayoutGrid className="w-4 h-4" />
          </div>
          Ducky Admin
        </div>
        
        {/* Khối tàng hình để cân bằng flexbox */}
        <div className="w-10"></div> 
      </div>

      {/* --- LỚP MÀN MỜ MÀU ĐEN (BẬT KHI MỞ MENU TRÊN ĐIỆN THOẠI) --- */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* --- SIDEBAR BÊN TRÁI (MENU) --- */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-gray-100 transform transition-transform duration-300 ease-in-out flex flex-col shadow-2xl md:shadow-none
        md:relative md:translate-x-0
        ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        
        {/* Logo Sidebar */}
        <div className="h-20 flex items-center gap-3.5 px-6 border-b border-gray-50">
          <div className="w-10 h-10 rounded-xl bg-[#4F46E5] flex items-center justify-center text-white shadow-md shadow-indigo-200">
            <LayoutGrid className="w-5 h-5" />
          </div>
          <span className="text-xl font-bold text-gray-900">Ducky Admin</span>
          
          {/* Nút X tắt menu trên điện thoại */}
          <button 
            onClick={() => setIsMobileMenuOpen(false)} 
            className="md:hidden ml-auto p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Danh sách nút bấm */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = location.pathname.includes(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)} // Tự động đóng menu khi bấm vào link (Mobile)
                className={`flex items-center gap-3.5 px-4 py-3.5 rounded-2xl font-semibold transition-all ${
                  isActive
                    ? "bg-indigo-50 text-[#4F46E5] shadow-sm"
                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                {item.icon}
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Nút thoát về trang chủ */}
        <div className="p-4 border-t border-gray-50">
          <Link 
            to="/" 
            className="flex items-center gap-3.5 px-4 py-3.5 rounded-2xl font-semibold text-gray-500 hover:bg-red-50 hover:text-red-600 transition-all"
          >
            <LogOut className="w-5 h-5" />
            Về Trang chủ
          </Link>
        </div>
      </aside>

      {/* --- KHU VỰC HIỂN THỊ NỘI DUNG CHÍNH --- */}
      <main className="flex-1 p-4 md:p-8 overflow-x-hidden overflow-y-auto max-w-full">
        {/* Nơi chứa các trang con như ProductsManager, KeyManager... */}
        <Outlet /> 
      </main>
      
    </div>
  );
}