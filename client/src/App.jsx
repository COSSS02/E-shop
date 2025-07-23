import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import Layout from './components/layout/Layout';
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
          {/* <Route path="/products" element={<ProductListPage />} /> */}
        </Routes>
      </Layout>
      {/* A Footer component could go here */}
    </Router>
  );
}

export default App
