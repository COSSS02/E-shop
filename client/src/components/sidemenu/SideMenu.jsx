import React from 'react';
import { Link } from 'react-router-dom';
import './SideMenu.css';

function SideMenu({ isOpen, closeMenu }) {
    // When a link is clicked, close the menu
    const handleLinkClick = () => {
        closeMenu();
    };

    return (
        <>
            {/* Overlay to dim the background */}
            <div className={`overlay ${isOpen ? 'open' : ''}`} onClick={closeMenu}></div>

            <div className={`side-menu ${isOpen ? 'open' : ''}`}>
                <div className="side-menu-header">
                    <h3>Menu</h3>
                    <button onClick={closeMenu} className="close-button">&times;</button>
                </div>
                <div className="side-menu-links">
                    <Link to="/" onClick={handleLinkClick}>Home</Link>
                    <Link to="/products" onClick={handleLinkClick}>All Products</Link>
                    <Link to="/categories/cpu" onClick={handleLinkClick}>CPUs</Link>
                    <Link to="/categories/gpu" onClick={handleLinkClick}>Graphics Cards</Link>
                </div>
            </div>
        </>
    );
}

export default SideMenu;