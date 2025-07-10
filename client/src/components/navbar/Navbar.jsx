import React from 'react';
import { Link } from 'react-router-dom';
import Logo from '../../assets/logo.svg';
import Hamburger from '../hamburger/Hamburger';
import './Navbar.css';

function Navbar() {
    return (
        <nav className="navbar">
            <Hamburger />
            <Link to="/" className="navbar-brand">
                <img src={Logo} alt="E-Shop Logo" className="navbar-logo" />
                <span>Tech-Shop</span>
            </Link>

            <div className="search-container">
                <input type="text" className="search-input" placeholder="Search for products..." />
                <button className="search-button">Search</button>
            </div>

            <div className="nav-links">
                <Link to="/login">Login</Link>
                <Link to="/cart">Cart</Link>
            </div>
        </nav>
    );
}

export default Navbar;