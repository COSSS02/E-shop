import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProductDetailPage from './pages/ProductDetailPage';
import CategoryPage from './pages/CategoryPage';
import SearchPage from './pages/SearchPage';
import ProfilePage from './pages/ProfilePage';
import CartPage from './pages/CartPage';
import WishlistPage from './pages/WishlistPage';
import DashboardPage from './pages/DashboardPage';
import AddCategoryPage from './pages/AddCategoryPage';
import AddProductPage from './pages/AddProductPage';
import EditProductPage from './pages/EditProductPage';
import MyProductsPage from './pages/MyProductsPage';
import ManageOrdersPage from './pages/ManageOrdersPage';
import { ToastProvider } from './contexts/ToastContext';
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/auth/ProtectedRoute';
import './App.css'

function App() {
  return (
    <Router>
      <ToastProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/products/:productId" element={<ProductDetailPage />} />
            <Route path="/categories/:categoryName" element={<CategoryPage />} />
            <Route path="/search" element={<SearchPage />} />

            {/* Protected Routes */}
            <Route path="/profile" element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            } />
            <Route path="/admin/add-category" element={
              <ProtectedRoute roles={['admin']}>
                <AddCategoryPage />
              </ProtectedRoute>
            } />
            <Route path="/provider/add-product" element={
              <ProtectedRoute roles={['provider']}>
                <AddProductPage />
              </ProtectedRoute>
            } />
            <Route path="/provider/edit-product/:productId" element={
              <ProtectedRoute roles={['provider']}>
                <EditProductPage />
              </ProtectedRoute>
            } />
            <Route path="/provider/my-products" element={
              <ProtectedRoute roles={['provider']}>
                <MyProductsPage />
              </ProtectedRoute>
            } />
            <Route path="/provider/manage-orders" element={
              <ProtectedRoute roles={['provider']}>
                <ManageOrdersPage />
              </ProtectedRoute>
            } />
            <Route path="/provider/dashboard" element={
              <ProtectedRoute roles={['provider']}>
                <DashboardPage />
              </ProtectedRoute>
            } />
            <Route path="/wishlist" element={
              <ProtectedRoute>
                <WishlistPage />
              </ProtectedRoute>
            } />
            <Route path="/cart" element={
              <ProtectedRoute> {/* Protected for all logged-in users */}
                <CartPage />
              </ProtectedRoute>
            } />
          </Routes>
        </Layout>
      </ToastProvider>
    </Router>
  );
}

export default App
