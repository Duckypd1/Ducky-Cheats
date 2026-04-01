/**
 * file: src/components/Layout.tsx
 */
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

export function Layout() {
  return (
    <div className="flex h-screen w-full bg-[#F3F4F6] overflow-hidden">
      {/* Thanh điều hướng bên trái */}
      <Sidebar />

      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Thanh công cụ phía trên */}
        <Topbar />

        {/* Nội dung chính của từng trang */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 pb-24">
          <div className="max-w-7xl mx-auto w-full">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Ghi chú: Nút "Cài đặt ứng dụng" và icon Download 
         đã được gỡ bỏ hoàn toàn để tối ưu giao diện.
      */}
    </div>
  );
}