import React, { useState, useEffect } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
// Thêm icon Key và Users từ lucide-react
import { Package, Ticket, Bell, LayoutDashboard, AlertTriangle, Loader2, LogOut, Key, Users } from "lucide-react";
import { supabase } from "../lib/supabase";

export function AdminLayout() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
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
        <p className="text-gray-500 mb-6">Chỉ quản trị viên mới được vào khu vực này.</p>
        <button onClick={() => navigate('/')} className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-medium">
          Về trang chủ
        </button>
      </div>
    );
  }

  // Cập nhật danh sách menu bao gồm Kho Key và Quản lý Tiền
  const menuItems = [
    { path: "/admin/products", label: "Quản lý Sản phẩm", icon: Package },
    { path: "/admin/keys", label: "Quản lý Kho Key", icon: Key },
    { path: "/admin/users", label: "Thành viên & Tiền", icon: Users },
    { path: "/admin/vouchers", label: "Quản lý Voucher", icon: Ticket },
    { path: "/admin/notifications", label: "Phát Thông báo", icon: Bell },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar Menu */}
      <div className="w-64 bg-white border-r border-gray-200 fixed h-full flex flex-col">
        <div className="p-6 border-b border-gray-100 flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white">
            <LayoutDashboard className="w-5 h-5" />
          </div>
          <span className="font-bold text-xl text-gray-900">Ducky Admin</span>
        </div>
        
        <div className="flex-1 py-6 px-4 space-y-2 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.includes(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
                  isActive 
                  ? "bg-indigo-50 text-indigo-600" 
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}
        </div>

        <div className="p-4 border-t border-gray-100">
          <button 
            onClick={() => navigate('/')}
            className="w-full flex items-center gap-3 px-4 py-3 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all font-medium"
          >
            <LogOut className="w-5 h-5" />
            Thoát Admin
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="ml-64 flex-1 p-8">
        <Outlet /> 
      </div>
    </div>
  );
}