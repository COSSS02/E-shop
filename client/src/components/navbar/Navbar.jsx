import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Logo from '../../assets/logo.svg';
import Hamburger from '../hamburger/Hamburger';
import SideMenu from '../sidemenu/SideMenu';
import './Navbar.css';

function Navbar() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
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

                <div className="search-container">
                    <input type="text" className="search-input" placeholder="Search for products..." />
                    <button className="search-button">Search</button>
                </div>

                <div className="nav-links">
                    <Link to="/login">Login</Link>
                    <Link to="/cart">Cart</Link>
                </div>
            </nav>
            <SideMenu isOpen={isMenuOpen} closeMenu={() => setIsMenuOpen(false)} />
        </>
    );
}

export default Navbar;