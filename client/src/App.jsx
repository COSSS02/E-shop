import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProductDetailPage from './pages/ProductDetailPage';
import CategoryPage from './pages/CategoryPage';
import SearchPage from './pages/SearchPage';
import ProfilePage from './pages/ProfilePage';
import AddCategoryPage from './pages/AddCategoryPage';
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
        </Routes>
      </Layout>
      {/* A Footer component could go here */}
    </Router>
  );
}

export default App
