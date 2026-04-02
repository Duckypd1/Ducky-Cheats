import React from 'react';
import { LifeBuoy, Megaphone, MessageSquare, UserCheck, ExternalLink, ShieldQuestion } from 'lucide-react';

export function Support() {
  const supportChannels = [
    {
      id: 1,
      title: "Thông báo cập nhật",
      desc: "Kênh thông báo tình trạng Tool, phiên bản mới và các sự kiện.",
      icon: <Megaphone className="w-6 h-6 text-blue-500" />,
      link: "https://t.me/refducky",
      bgHover: "hover:border-blue-500 hover:shadow-blue-100",
      btnColor: "bg-blue-50 text-blue-600 group-hover:bg-blue-500 group-hover:text-white"
    },
    {
      id: 2,
      title: "Group Chat Cộng Đồng",
      desc: "Nơi giao lưu, hỏi đáp, chém gió và chia sẻ kinh nghiệm sử dụng.",
      icon: <MessageSquare className="w-6 h-6 text-indigo-500" />,
      link: "https://t.me/+jVTECSq2YT9hOGJl",
      bgHover: "hover:border-indigo-500 hover:shadow-indigo-100",
      btnColor: "bg-indigo-50 text-indigo-600 group-hover:bg-indigo-500 group-hover:text-white"
    },
    {
      id: 3,
      title: "Liên hệ Admin (Hỗ trợ 1-1)",
      desc: "Nhắn tin trực tiếp cho Ducky để xử lý lỗi nạp thẻ, bảo hành Key.",
      icon: <UserCheck className="w-6 h-6 text-rose-500" />,
      link: "https://web.telegram.org/k/#@duckypd1",
      bgHover: "hover:border-rose-500 hover:shadow-rose-100",
      btnColor: "bg-rose-50 text-rose-600 group-hover:bg-rose-500 group-hover:text-white"
    }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* HEADER TỔNG QUAN */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-[32px] p-8 md:p-10 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full text-white text-xs font-bold uppercase mb-4 border border-white/10">
            <ShieldQuestion className="w-4 h-4" /> Hỗ trợ 24/7
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">Trung tâm hỗ trợ Ducky</h1>
          <p className="text-gray-300 text-sm md:text-base max-w-xl font-medium">
            Chúng tôi luôn sẵn sàng lắng nghe và giải quyết mọi vấn đề của bạn. Tham gia cộng đồng Telegram ngay để không bỏ lỡ bất kỳ thông tin nào!
          </p>
        </div>
      </div>

      {/* DANH SÁCH KÊNH HỖ TRỢ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {supportChannels.map((channel) => (
          <a 
            key={channel.id}
            href={channel.link}
            target="_blank"
            rel="noopener noreferrer"
            className={`group bg-white rounded-3xl p-6 md:p-8 shadow-sm border-2 border-gray-100 transition-all duration-300 flex flex-col h-full hover:-translate-y-1 hover:shadow-lg ${channel.bgHover}`}
          >
            <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              {channel.icon}
            </div>
            
            <h3 className="text-xl font-bold text-gray-900 mb-3">{channel.title}</h3>
            <p className="text-sm text-gray-500 font-medium mb-8 flex-1 leading-relaxed">
              {channel.desc}
            </p>
            
            <div className={`mt-auto w-full py-3.5 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2 ${channel.btnColor}`}>
              Truy cập ngay <ExternalLink className="w-4 h-4" />
            </div>
          </a>
        ))}
      </div>

      {/* BOX CẢNH BÁO BẢO MẬT */}
      <div className="bg-amber-50 border border-amber-200 rounded-3xl p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
          <LifeBuoy className="w-6 h-6 text-amber-600" />
        </div>
        <div>
          <h4 className="text-base font-bold text-amber-900 mb-1">Lưu ý bảo mật quan trọng</h4>
          <p className="text-sm text-amber-700 font-medium">
            Admin Ducky <strong>KHÔNG BAO GIỜ</strong> chủ động nhắn tin yêu cầu bạn cung cấp mật khẩu, mã OTP hay chuyển tiền vào các tài khoản cá nhân lạ. Hãy cảnh giác với các thành phần giả mạo!
          </p>
        </div>
      </div>
    </div>
  );
}