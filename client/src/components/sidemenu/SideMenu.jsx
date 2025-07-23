import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAllCategories } from '../../api/categories';
import './SideMenu.css';

function SideMenu({ isOpen, closeMenu }) {
    const [categories, setCategories] = useState([]);

    useEffect(() => {
        // Fetch categories only when the menu is opened for the first time
        if (isOpen && categories.length === 0) {
            getAllCategories()
                .then(data => setCategories(data))
                .catch(err => console.error("Could not load categories for side menu.", err));
        }
    }, [isOpen, categories.length]);

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
                    <hr className="divider" />
                    {categories.map(category => (
                        <Link
                            key={category.id}
                            to={`/categories/${encodeURIComponent(category.name)}`}
                            onClick={handleLinkClick}
                        >
                            {category.name}
                        </Link>
                    ))}
                </div>
            </div>
        </>
    );
}

export default SideMenu;