import React, { useEffect, useState } from "react";
import { useNavigate, NavLink } from "react-router-dom";
import { 
  LayoutDashboard, 
  Gamepad2, 
  ShoppingCart, 
  Wallet, 
  User as UserIcon, 
  LifeBuoy, 
  LogOut, 
  Zap,
  ShieldCheck // Thêm icon khiên bảo vệ cho Admin
} from "lucide-react";
import { supabase } from "../lib/supabase"; 
import { cn } from "../lib/utils";

const navGroups = [
  {
    title: "Tổng quan",
    items: [
      { name: "Trang chủ", path: "/", icon: LayoutDashboard },
      { name: "Ví tiền", path: "/wallet", icon: Wallet },
    ]
  },
  {
    title: "Phân loại",
    items: [
      { name: "Sản phẩm", path: "/products", icon: Gamepad2 },
      { name: "Đơn hàng", path: "/orders", icon: ShoppingCart },
    ]
  },
  {
    title: "Tra cứu",
    items: [
      { name: "Profile", path: "/profile", icon: UserIcon },
    ]
  },
  {
    title: "Hỗ trợ",
    items: [
      { name: "Trung tâm hỗ trợ", path: "/support", icon: LifeBuoy },
    ]
  }
];

export function Sidebar() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<string | null>(null); // State lưu quyền Admin

  useEffect(() => {
    // Hàm lấy quyền hạn từ bảng profiles
    const fetchRole = async (userId: string) => {
      try {
        const { data } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', userId)
          .single();
        setRole(data?.role || 'user');
      } catch (error) {
        console.error("Lỗi lấy quyền:", error);
      }
    };

    // Lấy session ngay khi component mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchRole(session.user.id);
      }
    });

    // Lắng nghe sự kiện Đăng nhập/Đăng xuất
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchRole(session.user.id);
      } else {
        setRole(null); // Xóa quyền khi đăng xuất
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigate("/login");
    } catch (error: any) {
      console.error("Lỗi đăng xuất:", error.message);
      alert("Không thể đăng xuất. Vui lòng thử lại!");
    }
  };

  const displayName = user?.email ? user.email.split('@')[0] : "Khách";

  return (
    <aside className="hidden lg:flex w-[280px] h-[calc(100vh-32px)] bg-white rounded-3xl m-4 flex-col shadow-sm border border-gray-100 flex-shrink-0 z-10 sticky top-4">
      
      {/* --- LOGO --- */}
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
          <Zap className="w-6 h-6 text-[#4F46E5]" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-[#111827] leading-tight">
            Ducky <span className="text-[#4F46E5]">Cheat</span>
          </h1>
          <p className="text-xs text-gray-500 font-medium tracking-wide uppercase">command hub</p>
        </div>
      </div>

      {/* --- NAVIGATION --- */}
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-6">
        {navGroups.map((group, idx) => (
          <div key={idx}>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-3">
              {group.title}
            </h3>
            <ul className="space-y-1">
              {group.items.map((item) => (
                <li key={item.name}>
                  <NavLink
                    to={item.path}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                        isActive 
                          ? "bg-indigo-50 text-[#4F46E5]" 
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <item.icon className={cn("w-5 h-5", isActive ? "text-[#4F46E5]" : "text-gray-400")} />
                        {item.name}
                      </>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}

        {/* --- KHU VỰC ADMIN (TÀNG HÌNH) --- */}
        {role === 'admin' && (
          <div className="mt-6 animate-in fade-in slide-in-from-left-4 duration-300">
            <h3 className="text-xs font-bold text-amber-500 uppercase tracking-wider mb-3 px-3">
              Bảo mật hệ thống
            </h3>
            <ul className="space-y-1">
              <li>
                <NavLink
                  to="/admin"
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-bold transition-all shadow-sm",
                      isActive 
                        ? "bg-black text-amber-400 ring-2 ring-amber-400/50" 
                        : "bg-gray-900 text-amber-500 hover:bg-black hover:text-amber-400"
                    )
                  }
                >
                  <ShieldCheck className="w-5 h-5" />
                  Khu vực Admin
                </NavLink>
              </li>
            </ul>
          </div>
        )}
      </div>

      {/* --- USER WIDGET --- */}
      <div className="p-4 mt-auto">
        <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="relative">
              <div className="w-10 h-10 rounded-full border-2 border-white bg-white flex items-center justify-center overflow-hidden shadow-sm">
                <UserIcon className="w-5 h-5 text-indigo-300" />
              </div>
              <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#22C55E] border-2 border-white rounded-full"></div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-900 truncate capitalize">
                {user ? displayName : "Chưa đăng nhập"}
              </p>
              <p className="text-[11px] text-gray-500 font-medium">Trực tuyến</p>
            </div>
          </div>

          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 bg-[#4F46E5] text-white py-2.5 rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all active:scale-95 shadow-sm"
          >
            <LogOut className="w-4 h-4" />
            Đăng xuất
          </button>
        </div>
      </div>
    </aside>
  );
}