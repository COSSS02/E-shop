import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Logo from '../../assets/logo.svg';
import Hamburger from '../hamburger/Hamburger';
import SideMenu from '../sidemenu/SideMenu';
import './Navbar.css';

function Navbar() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        if (searchTerm.trim()) {
            navigate(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
            setSearchTerm('');
        }
    };

    return (
        <>
            <nav className="navbar">
                <div className="navbar-left">
                    <Hamburger onClick={toggleMenu} />
                    <Link to="/" className="navbar-brand">
                        <img src={Logo} alt="E-Shop Logo" className="navbar-logo" />
                        <span>Tech-Shop</span>
                    </Link>
                </div>

                <form className="search-container" onSubmit={handleSearchSubmit}>
                    <input
                        type="text"
                        className="search-input"
                        placeholder="Search for products..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <button type="submit" className="search-button">Search</button>
                </form>

                <div className="nav-links">
                    {user ? (
                        <>
                            <span className="welcome-message">Welcome, {user.firstName}</span>
                            <Link to="/cart" className="nav-button">Cart</Link>
                            <button onClick={logout} className="nav-button logout-button">Logout</button>
                        </>
                    ) : (
                        <>
                            <Link to="/login" className="nav-button">Login</Link>
                            <Link to="/register" className="nav-button">Register</Link>
                        </>
                    )}
                </div>
            </nav>
            <SideMenu isOpen={isMenuOpen} closeMenu={() => setIsMenuOpen(false)} />
        </>
    );
}

export default Navbar;