import { ChevronLeft, Bell, Search, Menu, X, User, LogOut, LogIn, Zap, LayoutDashboard, Gamepad2, ShoppingCart, Wallet as WalletIcon, LifeBuoy } from "lucide-react";
import { useLocation, useNavigate, Link, NavLink } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase"; // Đảm bảo đường dẫn này đúng với project của bạn
import { cn } from "../lib/utils"; // Sửa lại đường dẫn nếu cần

const routeNames: Record<string, string> = {
  "/": "Trang chủ",
  "/wallet": "Ví tiền & Nạp tiền",
  "/products": "Danh mục & Sản phẩm",
  "/orders": "Đơn hàng",
  "/profile": "Profile"
};

export function Topbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const title = routeNames[location.pathname] || "Dashboard";
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Logic kiểm tra trạng thái đăng nhập
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Lấy session hiện tại
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // Lắng nghe thay đổi auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  return (
    <>
      <header className="px-4 lg:px-6 pt-4 lg:pt-6 pb-2 sticky top-0 z-40 bg-[#F3F4F6]/80 backdrop-blur-md">
        <div className="bg-white rounded-full shadow-sm border border-gray-100 px-3 lg:px-4 py-2 lg:py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 lg:gap-4">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center hover:bg-gray-100 transition-colors text-gray-600"
            >
              <Menu className="w-5 h-5" />
            </button>
            <button 
              onClick={() => navigate(-1)}
              className="hidden lg:flex w-10 h-10 rounded-full bg-gray-50 items-center justify-center hover:bg-gray-100 transition-colors text-gray-600"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h2 className="text-base lg:text-lg font-bold text-[#111827] truncate max-w-[150px] sm:max-w-xs">{title}</h2>
          </div>

          <div className="flex items-center gap-2 lg:gap-4">
            <div className="relative hidden md:block">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                placeholder="Tìm kiếm..." 
                className="pl-9 pr-4 py-2 bg-gray-50 border-transparent focus:border-indigo-300 focus:bg-white focus:ring-2 focus:ring-indigo-100 rounded-full text-sm w-48 lg:w-64 transition-all outline-none"
              />
            </div>
            
            <button className="hidden sm:flex w-10 h-10 rounded-full bg-gray-50 items-center justify-center hover:bg-gray-100 transition-colors text-gray-600 relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>

            <div className="hidden sm:block h-8 w-px bg-gray-200 mx-1 lg:mx-2"></div>

            {/* PHẦN THAY ĐỔI: Kiểm tra User để hiển thị nút phù hợp */}
            {user ? (
              <div className="flex items-center gap-2">
                <div className="hidden lg:block text-right mr-2">
                   <p className="text-xs font-bold text-gray-900 truncate max-w-[100px]">{user.email.split('@')[0]}</p>
                </div>
                <button 
                  onClick={handleLogout}
                  className="bg-red-50 hover:bg-red-100 text-red-600 p-2 rounded-full transition-colors shadow-sm"
                  title="Đăng xuất"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link 
                to="/login"
                className="bg-[#4F46E5] hover:bg-indigo-600 text-white px-4 py-2 rounded-full text-sm font-semibold transition-colors shadow-sm flex items-center gap-2"
              >
                <LogIn className="w-4 h-4" />
                Đăng nhập
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Menu Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}></div>
          <div className="absolute top-0 left-0 bottom-0 w-[280px] bg-white shadow-xl flex flex-col transform transition-transform duration-300 ease-in-out">
            <div className="p-4 flex justify-end">
              <button 
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center hover:bg-gray-100 transition-colors text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto pb-4">
              <MobileNav onClose={() => setIsMobileMenuOpen(false)} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Nav groups data
const navGroups = [
  {
    title: "Tổng quan",
    items: [
      { name: "Trang chủ", path: "/", icon: LayoutDashboard },
      { name: "Ví tiền", path: "/wallet", icon: WalletIcon },
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
      { name: "Profile", path: "/profile", icon: User },
    ]
  },
  {
    title: "Hỗ trợ",
    items: [
      { name: "Trung tâm hỗ trợ", path: "/support", icon: LifeBuoy },
    ]
  }
];

function MobileNav({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex flex-col h-full">
      <div className="px-6 pb-6 flex items-center gap-3">
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

      <div className="flex-1 px-4 space-y-6">
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
                    onClick={onClose}
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
      </div>
    </div>
  );
}