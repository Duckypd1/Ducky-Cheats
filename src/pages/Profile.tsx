import React, { useEffect, useState } from "react";
import { User, Mail, Shield, Camera, Save, Lock, CalendarDays, ShieldCheck, LayoutDashboard, X, UploadCloud } from "lucide-react";
import { supabase } from "../lib/supabase";
import { Link } from "react-router-dom";

export function Profile() {
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<string | null>(null); // State lưu quyền Admin
  const [profileData, setProfileData] = useState<any>(null); // THÊM MỚI: State lưu toàn bộ dữ liệu profile
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  // State quản lý Avatar
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [selectedImageBase64, setSelectedImageBase64] = useState<string | null>(null);

  useEffect(() => {
    async function getUserData() {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) throw error;
        setUser(user);

        // Lấy quyền (role) và tất cả dữ liệu từ bảng profiles
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*') // THAY ĐỔI: Lấy tất cả các cột thay vì chỉ lấy 'role'
            .eq('id', user.id)
            .single();
            
          setProfileData(profile); // THÊM MỚI: Lưu lại profile data
          setRole(profile?.role || 'user');

          // Kéo Avatar đã lưu từ LocalStorage
          const savedAvatar = localStorage.getItem(`ducky_avatar_${user.id}`);
          if (savedAvatar) setAvatarUrl(savedAvatar);
        }
      } catch (error) {
        console.error("Error fetching user:", error);
      } finally {
        setLoading(false);
      }
    }
    getUserData();
  }, []);

  // Hàm xử lý khi người dùng chọn file từ máy tính
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Giới hạn dung lượng ảnh (Ví dụ: 2MB)
      if (file.size > 2 * 1024 * 1024) {
        alert("Dung lượng ảnh quá lớn! Vui lòng chọn ảnh dưới 2MB.");
        return;
      }

      // Dùng FileReader để đọc file ảnh thành chuỗi Base64
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImageBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Hàm xác nhận đổi ảnh
  const handleConfirmAvatar = () => {
    if (!selectedImageBase64) return;
    setAvatarUrl(selectedImageBase64);
    if (user) {
      localStorage.setItem(`ducky_avatar_${user.id}`, selectedImageBase64);
    }
    setIsAvatarModalOpen(false);
    setSelectedImageBase64(null);
    alert("Đã cập nhật ảnh đại diện thành công!");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 text-gray-500 font-medium">
        <div className="animate-pulse">Đang tải thông tin...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto p-8 text-center bg-white rounded-3xl shadow-sm border border-gray-100">
        <p className="text-gray-500">Vui lòng đăng nhập để xem thông tin cá nhân.</p>
      </div>
    );
  }

  // THÊM MỚI: Logic hiển thị tên ưu tiên tên từ Admin (display_name)
  const displayName = profileData?.display_name || (user?.email ? user.email.split('@')[0] : "Thành viên");

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* --- PHẦN 1: HEADER PROFILE CARD --- */}
      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 relative overflow-hidden">
        {/* Banner Gradient */}
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-[#4F46E5] to-indigo-400"></div>
        
        <div className="relative mt-12 flex flex-col md:flex-row items-center md:items-end gap-6">
          <div className="relative group">
            <div className="w-32 h-32 rounded-full border-4 border-white bg-white flex items-center justify-center overflow-hidden shadow-md">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <User className="w-16 h-16 text-indigo-200" />
              )}
            </div>
            {/* Nút bấm mở Modal đổi ảnh */}
            <button 
              onClick={() => setIsAvatarModalOpen(true)}
              className="absolute bottom-0 right-0 w-10 h-10 bg-white rounded-full border border-gray-200 shadow-sm flex items-center justify-center text-gray-600 hover:text-[#4F46E5] transition-colors"
            >
              <Camera className="w-5 h-5" />
            </button>
          </div>
          
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">{displayName}</h1>
            <p className="text-gray-500 flex items-center justify-center md:justify-start gap-2 text-sm">
              <Mail className="w-4 h-4" />
              {user.email}
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-indigo-50 text-[#4F46E5] text-sm font-bold border border-indigo-100 shadow-sm">
              <ShieldCheck className="w-4 h-4" />
              {role === 'admin' ? 'Quản trị viên' : 'Thành viên chính thức'}
            </span>
            
            {/* CHỈ HIỆN NÚT ADMIN NẾU ROLE LÀ ADMIN */}
            {role === 'admin' && (
              <Link
                to="/admin"
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-gray-900 text-amber-400 text-sm font-bold hover:bg-black transition-all shadow-lg animate-in fade-in slide-in-from-right-4"
              >
                <LayoutDashboard className="w-4 h-4" />
                Vào Dashboard Admin
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* --- CỘT TRÁI --- */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-5">Hệ thống</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-4 border-b border-gray-50">
                <span className="text-gray-500 text-sm">Trạng thái</span>
                <span className="inline-flex items-center gap-1 text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-md">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                  Online
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500 text-sm">Ngày tham gia</span>
                <span className="font-semibold text-gray-900 text-sm">
                  {new Date(user.created_at).toLocaleDateString('vi-VN')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* --- CỘT PHẢI --- */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-bold text-[#111827]">Thông tin tài khoản</h2>
              <button 
                onClick={() => setIsEditing(!isEditing)}
                className="text-sm font-bold text-[#4F46E5] hover:text-indigo-700 transition-colors"
              >
                {isEditing ? "Hủy bỏ" : "Chỉnh sửa"}
              </button>
            </div>

            <form className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2 ml-1">Họ và tên</label>
                <input 
                  type="text" 
                  defaultValue={displayName}
                  disabled={!isEditing}
                  className="w-full bg-gray-50 border border-gray-100 text-gray-900 text-sm rounded-2xl focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 block p-3.5 outline-none transition-all disabled:opacity-60"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2 ml-1">Email liên kết</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="w-4 h-4 text-gray-400" />
                  </div>
                  <input 
                    type="email" 
                    defaultValue={user.email}
                    disabled
                    className="w-full bg-gray-100 border border-gray-100 text-gray-500 text-sm rounded-2xl block p-3.5 pl-11 cursor-not-allowed"
                  />
                </div>
                <p className="mt-2 text-[11px] text-gray-400 italic">Email định danh duy nhất, không thể thay đổi.</p>
              </div>

              {isEditing && (
                <div className="pt-4">
                  <button 
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="w-full bg-[#4F46E5] hover:bg-indigo-600 text-white py-3.5 rounded-2xl font-bold transition-all shadow-md flex items-center justify-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    Lưu thay đổi
                  </button>
                </div>
              )}
            </form>
          </div>

          {/* Bảo mật */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold text-[#111827] mb-6">Bảo mật</h2>
            
            <div className="flex items-center justify-between p-4 border border-gray-50 rounded-2xl bg-gray-50/50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white shadow-sm border border-gray-100 flex items-center justify-center">
                  <Lock className="w-5 h-5 text-indigo-500" />
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-sm">Mật khẩu</p>
                  <p className="text-xs text-gray-400">Thay đổi mật khẩu định kỳ để bảo vệ tài khoản</p>
                </div>
              </div>
              <button className="bg-white border border-gray-200 text-gray-700 hover:text-indigo-600 hover:border-indigo-100 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm">
                Cập nhật
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* --- MODAL UPLOAD ẢNH ĐẠI DIỆN --- */}
      {isAvatarModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => { setIsAvatarModalOpen(false); setSelectedImageBase64(null); }}></div>
          <div className="bg-white rounded-3xl w-full max-w-sm relative z-10 shadow-xl overflow-hidden animate-in zoom-in-95">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-gray-900">Cập nhật ảnh đại diện</h3>
              <button onClick={() => { setIsAvatarModalOpen(false); setSelectedImageBase64(null); }} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-5 flex flex-col items-center">
              {/* Vùng hiển thị ảnh Preview */}
              <div className="w-24 h-24 rounded-full border-2 border-dashed border-indigo-300 flex items-center justify-center overflow-hidden bg-gray-50">
                {selectedImageBase64 ? (
                  <img src={selectedImageBase64} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-8 h-8 text-gray-300" />
                )}
              </div>

              {/* Nút Upload File thực tế */}
              <div className="w-full">
                <label className="flex flex-col items-center justify-center w-full p-4 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 hover:border-indigo-300 transition-colors">
                  <div className="flex flex-col items-center justify-center space-y-2 text-center">
                    <UploadCloud className="w-6 h-6 text-indigo-500" />
                    <p className="text-sm font-semibold text-gray-700">Nhấn để tải ảnh lên</p>
                    <p className="text-xs text-gray-400">JPG, PNG (Tối đa 2MB)</p>
                  </div>
                  <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                </label>
              </div>

              <button 
                onClick={handleConfirmAvatar}
                disabled={!selectedImageBase64}
                className="w-full bg-[#4F46E5] hover:bg-indigo-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-3.5 rounded-xl font-bold transition-all shadow-sm"
              >
                Xác nhận đổi ảnh
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}