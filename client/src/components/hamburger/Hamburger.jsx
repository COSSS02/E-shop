import React from 'react';
import './Hamburger.css';

function HamburgerMenu() {
    return (
        <button className="hamburger-menu">
            <span className="hamburger-line"></span>
            <span className="hamburger-line"></span>
            <span className="hamburger-line"></span>
        </button>
    );
}

export default HamburgerMenu;