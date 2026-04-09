import React, { useState, useEffect } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, 
  Package, 
  Key, 
  Users, 
  Ticket, 
  Bell, 
  LogOut, 
  AlertTriangle, 
  Loader2,
  Menu,
  X
} from "lucide-react";
import { supabase } from "../lib/supabase";

export function AdminLayout() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Trạng thái bật/tắt menu trên điện thoại
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const location = useLocation();
  const navigate = useNavigate();

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <AlertTriangle className="w-16 h-16 text-red-500 mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Khu vực cấm!</h1>
        <p className="text-gray-500 mb-6 text-center">Chỉ quản trị viên mới được vào khu vực này.</p>
        <button onClick={() => navigate('/')} className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-medium">
          Về trang chủ
        </button>
      </div>
    );
  }

  const menuItems = [
    { path: "/admin/products", label: "Quản lý Sản phẩm", icon: Package },
    { path: "/admin/keys", label: "Quản lý Kho Key", icon: Key },
    { path: "/admin/users", label: "Thành viên & Tiền", icon: Users },
    { path: "/admin/vouchers", label: "Quản lý Voucher", icon: Ticket },
    { path: "/admin/notifications", label: "Phát Thông báo", icon: Bell },
  ];

  return (
    // Dùng flex-col cho mobile, flex-row cho máy tính
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      
      {/* --- THANH ĐIỀU HƯỚNG TRÊN CÙNG (CHỈ HIỂN THỊ TRÊN ĐIỆN THOẠI) --- */}
      <div className="md:hidden bg-white h-16 border-b border-gray-200 flex items-center justify-between px-4 sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
            <LayoutDashboard className="w-4 h-4" />
          </div>
          <span className="font-bold text-lg text-gray-900">Ducky Admin</span>
        </div>
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="p-2 bg-gray-50 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* --- LỚP MÀN MỜ MÀU ĐEN KHI MỞ MENU (ĐIỆN THOẠI) --- */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* --- SIDEBAR MENU --- */}
      <div
        className={`
          fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-gray-200 flex flex-col 
          transition-transform duration-300 ease-in-out 
          md:relative md:translate-x-0 md:w-64
          ${isMobileMenuOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"}
        `}
      >
        {/* Header của Sidebar */}
        <div className="h-16 md:h-auto p-4 md:p-6 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shrink-0">
              <LayoutDashboard className="w-5 h-5" />
            </div>
            <span className="font-bold text-xl text-gray-900">Ducky Admin</span>
          </div>
          {/* Nút đóng X chỉ hiện trên mobile */}
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="md:hidden p-2 text-gray-400 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        {/* Danh sách Menu */}
        <div className="flex-1 py-6 px-4 space-y-2 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.includes(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)} // Tự động đóng menu khi bấm vào link
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
                  isActive 
                  ? "bg-indigo-50 text-indigo-600 shadow-sm" 
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}
        </div>

        {/* Nút thoát */}
        <div className="p-4 border-t border-gray-100">
          <button 
            onClick={() => {
              setIsMobileMenuOpen(false);
              navigate('/');
            }}
            className="w-full flex items-center gap-3 px-4 py-3 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all font-medium"
          >
            <LogOut className="w-5 h-5" />
            Về trang chủ
          </button>
        </div>
      </div>

      {/* --- NỘI DUNG CHÍNH CỦA TRANG ADMIN --- */}
      <div className="flex-1 p-4 md:p-8 w-full max-w-full overflow-x-hidden">
        <Outlet /> 
      </div>
      
    </div>
  );
}