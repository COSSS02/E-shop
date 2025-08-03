import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProductDetailPage from './pages/ProductDetailPage';
import CategoryPage from './pages/CategoryPage';
import SearchPage from './pages/SearchPage';
import ProfilePage from './pages/ProfilePage';
import CartPage from './pages/CartPage';
import AddCategoryPage from './pages/AddCategoryPage';
import AddProductPage from './pages/AddProductPage';
import EditProductPage  from './pages/EditProductPage';
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/auth/ProtectedRoute';
import './App.css'

function App() {
  return (
    <Router>
      {/* A Navbar component could go here, so it appears on every page */}
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
          <Route path="/cart" element={
            <ProtectedRoute> {/* Protected for all logged-in users */}
              <CartPage />
            </ProtectedRoute>
          } />
        </Routes>
      </Layout>
      {/* A Footer component could go here */}
    </Router>
  );
}

export default App
