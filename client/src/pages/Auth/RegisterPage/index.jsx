import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { registerUser } from '../../../api/auth';
import Logo from '../../../assets/logo.svg';
import './style.css';

function RegisterPage() {
    const { t, i18n } = useTranslation();
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
    });
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            // The role will be set to 'client' by default on the backend
            await registerUser(formData);
            // On success, redirect to the login page with a success message
            navigate('/login', { state: { message: 'Registration successful! Please log in.' } });
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
        <div className="register-container">
            <div className="auth-header">
                <Link to="/">
                    <img src={Logo} alt="Tech-Shop Logo" className="auth-logo" />
                    <span>Tech-Shop</span>
                </Link>
            </div>
            <form className="register-form" onSubmit={handleSubmit}>
                <h2>{t('create_account')}</h2>
                {error && <p className="error-message">{error}</p>}
                <div className="form-group">
                    <label htmlFor="firstName">{t('first_name')}</label>
                    <input type="text" id="firstName" name="firstName" onChange={handleChange} required />
                </div>
                <div className="form-group">
                    <label htmlFor="lastName">{t('last_name')}</label>
                    <input type="text" id="lastName" name="lastName" onChange={handleChange} required />
                </div>
                <div className="form-group">
                    <label htmlFor="email">{t('email')}</label>
                    <input type="email" id="email" name="email" onChange={handleChange} required />
                </div>
                <div className="form-group">
                    <label htmlFor="password">{t('password')}</label>
                    <input type="password" id="password" name="password" onChange={handleChange} required />
                </div>
                <button type="submit" className="register-button" disabled={loading}>
                    {loading ? 'Registering...' : t('register')}
                </button>
                <p className="login-link">
                    {t('have_account')} <Link to="/login">{t('login_here')}</Link>
                </p>
                <div className="register-language-switcher">
                    <button onClick={() => changeLanguage('en')} disabled={i18n.language === 'en'}>EN</button>
                    <button onClick={() => changeLanguage('ro')} disabled={i18n.language === 'ro'}>RO</button>
                </div>
            </form>
        </div>
    );
}

export default RegisterPage;