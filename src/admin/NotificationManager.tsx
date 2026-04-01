import React from 'react';
import { Bell, Megaphone, SendHorizontal } from 'lucide-react';

export function NotificationManager() {
  return (
    <div className="max-w-3xl space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Trung tâm Thông báo</h2>
      
      <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-500 shadow-inner">
            <Megaphone className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">Gửi thông báo toàn hệ thống</h3>
            <p className="text-xs text-gray-500 font-medium">Tin nhắn sẽ hiện ở Trang chủ của mọi User</p>
          </div>
        </div>

        <div className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-2 ml-1">Tiêu đề</label>
            <input type="text" placeholder="Ví dụ: Bảo trì hệ thống" className="w-full bg-gray-50 border border-gray-100 text-gray-900 text-sm rounded-2xl p-4 outline-none focus:ring-2 focus:ring-blue-100 font-bold" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-2 ml-1">Nội dung chi tiết</label>
            <textarea rows={4} placeholder="Nhập nội dung bạn muốn thông báo..." className="w-full bg-gray-50 border border-gray-100 text-gray-900 text-sm rounded-2xl p-4 outline-none focus:ring-2 focus:ring-blue-100 resize-none" />
          </div>
        </div>

        <button className="mt-8 w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-bold transition-all shadow-lg shadow-blue-100 flex items-center justify-center gap-2">
          <SendHorizontal className="w-5 h-5" />
          Gửi thông báo ngay
        </button>
      </div>
    </div>
  );
}