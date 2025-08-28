import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import Logo from '../../../assets/logo.svg';
import './style.css';

function LoginPage() {
    const { t, i18n } = useTranslation();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const registrationMessage = location.state?.message;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            await login(email, password);
            navigate('/'); // Redirect to homepage on successful login
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const changeLanguage = (lng) => {
        i18n.changeLanguage(lng);
    };

    return (
        <div className="login-container">
            <div className="auth-header">
                <Link to="/">
                    <img src={Logo} alt="Tech-Shop Logo" className="auth-logo" />
                    <span>Tech-Shop</span>
                </Link>
            </div>
            <form className="login-form" onSubmit={handleSubmit}>
                <h2>{t('login_page')}</h2>
                {registrationMessage && <p className="success-message">{registrationMessage}</p>}
                {error && <p className="error-message">{error}</p>}
                <div className="form-group">
                    <label htmlFor="email">{t('email')}</label>
                    <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="password">{t('password')}</label>
                    <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>
                <button type="submit" className="login-button" disabled={loading}>
                    {loading ? 'Logging in...' : t('login')}
                </button>
                <p className="register-link">
                    {t("dont_have_account")} <Link to="/register">{t('register_here')}</Link>
                </p>
                <div className="login-language-switcher">
                    <button onClick={() => changeLanguage('en')} disabled={i18n.language === 'en'}>EN</button>
                    <button onClick={() => changeLanguage('ro')} disabled={i18n.language === 'ro'}>RO</button>
                </div>
            </form>
        </div>
    );
}

export default LoginPage;