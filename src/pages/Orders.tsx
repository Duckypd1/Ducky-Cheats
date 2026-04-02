import { useState, useEffect } from "react";
import { Copy, Check, X, Key, Download } from "lucide-react";

const initialMockOrders = [
  {
    id: "ORD-99281",
    product: "Ducky Cheat AOV VIP (30 Ngày)",
    amount: "300,000đ",
    status: "completed",
    date: "29/03/2026 14:30",
    key: "DUCKY-AOV-30D-X92B-K19M"
  },
  {
    id: "ORD-99280",
    product: "Ducky Cheat AOV VIP (7 Ngày)",
    amount: "100,000đ",
    status: "completed",
    date: "25/03/2026 09:15",
    key: "DUCKY-AOV-7D-L92N-P01X"
  }
];

export function Orders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const savedOrders = localStorage.getItem('ducky_orders');
    if (savedOrders) {
      setOrders(JSON.parse(savedOrders));
    } else {
      setOrders(initialMockOrders);
      localStorage.setItem('ducky_orders', JSON.stringify(initialMockOrders));
    }
  }, []);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-[#111827]">Lịch sử đơn hàng</h2>
          <p className="text-sm text-gray-500">Quản lý các gói Ducky Cheat đã mua</p>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="pb-3 text-sm font-semibold text-gray-500">Mã đơn hàng</th>
                <th className="pb-3 text-sm font-semibold text-gray-500">Sản phẩm</th>
                <th className="pb-3 text-sm font-semibold text-gray-500">Số tiền</th>
                <th className="pb-3 text-sm font-semibold text-gray-500">Trạng thái</th>
                <th className="pb-3 text-sm font-semibold text-gray-500">Ngày mua</th>
                <th className="pb-3 text-sm font-semibold text-gray-500 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="py-4 text-sm font-medium text-gray-900">{order.id}</td>
                  <td className="py-4 text-sm text-gray-600">{order.product}</td>
                  <td className="py-4 text-sm font-semibold text-gray-900">{order.amount}</td>
                  <td className="py-4">
                    {order.status === "completed" ? (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-600 border border-green-200">
                        Đã thanh toán
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-orange-50 text-orange-600 border border-orange-200">
                        Chờ thanh toán
                      </span>
                    )}
                  </td>
                  <td className="py-4 text-sm text-gray-500">{order.date}</td>
                  <td className="py-4 text-right">
                    {order.status === "completed" && (
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => setSelectedOrder(order)}
                          className="inline-flex items-center gap-1.5 bg-indigo-50 text-[#4F46E5] hover:bg-indigo-100 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                        >
                          <Key className="w-4 h-4" />
                          Xem Key
                        </button>
                        <a 
                          href="https://hypercheats.vn/public/download/download.html?game=lienquan"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 bg-green-50 text-green-600 hover:bg-green-100 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                        >
                          <Download className="w-4 h-4" />
                          Tải Tool
                        </a>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="text-xs text-gray-500 mb-1">{order.id}</p>
                  <p className="text-sm font-bold text-gray-900">{order.product}</p>
                </div>
                {order.status === "completed" ? (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-medium bg-green-50 text-green-600 border border-green-200">
                    Đã thanh toán
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-medium bg-orange-50 text-orange-600 border border-orange-200">
                    Chờ thanh toán
                  </span>
                )}
              </div>
              <div className="flex justify-between items-center mb-4">
                <p className="text-sm font-semibold text-gray-900">{order.amount}</p>
                <p className="text-xs text-gray-500">{order.date}</p>
              </div>
              {order.status === "completed" && (
                <div className="flex items-center gap-2 mt-4">
                  <button 
                    onClick={() => setSelectedOrder(order)}
                    className="flex-1 flex items-center justify-center gap-2 bg-indigo-50 text-[#4F46E5] hover:bg-indigo-100 py-2 rounded-xl text-sm font-medium transition-colors"
                  >
                    <Key className="w-4 h-4" />
                    Xem Key
                  </button>
                  <a 
                    href="https://hypercheats.vn/public/download/download.html?game=lienquan"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 bg-green-50 text-green-600 hover:bg-green-100 py-2 rounded-xl text-sm font-medium transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Tải Tool
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Key Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSelectedOrder(null)}></div>
          <div className="bg-white rounded-3xl w-full max-w-md relative z-10 shadow-xl overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-xl font-bold text-[#111827]">Thông tin License Key</h3>
              <button 
                onClick={() => setSelectedOrder(null)}
                className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center hover:bg-gray-100 text-gray-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="mb-6">
                <p className="text-sm text-gray-500 mb-1">Sản phẩm</p>
                <p className="font-semibold text-gray-900">{selectedOrder.product}</p>
              </div>

              <div className="mb-6">
                <p className="text-sm text-gray-500 mb-2">License Key của bạn</p>
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex items-center justify-between gap-4">
                  <code className="text-sm font-mono font-bold text-[#4F46E5] break-all">
                    {selectedOrder.key}
                  </code>
                  <button 
                    onClick={() => handleCopy(selectedOrder.key!)}
                    className="flex-shrink-0 w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50 text-gray-600 transition-colors"
                  >
                    {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="bg-blue-50 text-blue-800 text-xs p-4 rounded-xl leading-relaxed">
                <strong>Lưu ý:</strong> Key chỉ có thể sử dụng cho 1 thiết bị duy nhất. Vui lòng không chia sẻ key này cho người khác.
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50/50">
              <a 
                href="https://hypercheats.vn/public/download/download.html?game=lienquan"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-[#4F46E5] hover:bg-indigo-600 text-white py-3.5 rounded-xl font-semibold transition-colors shadow-sm flex items-center justify-center gap-2"
              >
                <Download className="w-5 h-5" />
                Tải Tool Ducky Cheat
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}