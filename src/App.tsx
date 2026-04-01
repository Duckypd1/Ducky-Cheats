/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route } from "react-router-dom";

// Các components khu vực Người dùng (User)
import { Layout } from "./components/Layout";
import { Home } from "./pages/Home";
import { Wallet } from "./pages/Wallet";
import { Products } from "./pages/Products";
import { Orders } from "./pages/Orders";
import { Profile } from "./pages/Profile";
import { Login } from "./pages/Login";

// Các components khu vực Quản trị (Admin)
import { AdminLayout } from './admin/AdminLayout';
import { ProductsManager } from './admin/ProductsManager';
import { VoucherManager } from './admin/VoucherManager';
import { NotificationManager } from './admin/NotificationManager';
// Import thêm 2 trang quản lý mới
import { KeyManager } from './admin/KeyManager';
import { UserManager } from './admin/UserManager';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* --- ROUTE ĐĂNG NHẬP --- */}
        <Route path="/login" element={<Login />} />

        {/* --- KHU VỰC NGƯỜI DÙNG CHUNG --- */}
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="wallet" element={<Wallet />} />
          <Route path="products" element={<Products />} />
          <Route path="orders" element={<Orders />} />
          <Route path="profile" element={<Profile />} />
          <Route path="*" element={<div className="p-8 text-center text-gray-500">Trang không tồn tại</div>} />
        </Route>

        {/* --- KHU VỰC QUẢN TRỊ VIÊN (ADMIN) --- */}
        <Route path="/admin" element={<AdminLayout />}>
          {/* Mặc định khi vào /admin sẽ render ProductsManager */}
          <Route index element={<ProductsManager />} /> 
          <Route path="products" element={<ProductsManager />} />
          
          {/* THÊM 2 ROUTE QUẢN LÝ MỚI Ở ĐÂY */}
          <Route path="keys" element={<KeyManager />} />
          <Route path="users" element={<UserManager />} />
          
          <Route path="vouchers" element={<VoucherManager />} />
          <Route path="notifications" element={<NotificationManager />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}