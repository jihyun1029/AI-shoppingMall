import { Routes, Route } from 'react-router-dom'
import { Layout } from './components/Layout'
import { HomePage } from './pages/HomePage'
import { ShopPage } from './pages/ShopPage'
import { ProductDetailPage } from './pages/ProductDetailPage'
import { CartPage } from './pages/CartPage'
import { CheckoutPage } from './pages/CheckoutPage'
import { OrderCompletePage } from './pages/OrderCompletePage'
import { LoginPage } from './pages/LoginPage'
import { SignupPage } from './pages/SignupPage'
import { MyPage } from './pages/MyPage'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { AdminLayout } from './components/admin/AdminLayout'
import { AdminDashboard } from './pages/admin/AdminDashboard'
import { AdminProductListPage } from './pages/admin/AdminProductListPage'
import { AdminProductCreatePage } from './pages/admin/AdminProductCreatePage'
import { AdminProductEditPage } from './pages/admin/AdminProductEditPage'
import { AdminPlaceholderPage } from './pages/admin/AdminPlaceholderPage'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="shop" element={<ShopPage />} />
        <Route path="products/:id" element={<ProductDetailPage />} />
        <Route path="cart" element={<CartPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="signup" element={<SignupPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="checkout" element={<CheckoutPage />} />
          <Route path="order-complete" element={<OrderCompletePage />} />
          <Route path="mypage" element={<MyPage />} />
        </Route>
        <Route element={<ProtectedRoute role="admin" />}>
          <Route path="admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="products" element={<AdminProductListPage />} />
            <Route path="products/new" element={<AdminProductCreatePage />} />
            <Route path="products/edit/:id" element={<AdminProductEditPage />} />
            <Route path="orders" element={<AdminPlaceholderPage title="주문 관리" />} />
            <Route path="users" element={<AdminPlaceholderPage title="회원 관리" />} />
          </Route>
        </Route>
      </Route>
    </Routes>
  )
}
