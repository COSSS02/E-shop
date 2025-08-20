import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAllCategories } from '../../api/categories';
import { useAuth } from '../../contexts/AuthContext';
import './SideMenu.css';

function SideMenu({ isOpen, closeMenu }) {
    const [categories, setCategories] = useState([]);
    const { user } = useAuth();

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

    const getIconUrl = (categoryName) => {
        if (!categoryName) {
            return '';
        }
        const iconName = categoryName.toLowerCase().replace(/ /g, '_') + '_icon.png';
        return `/images/${iconName}`;
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
                    <Link to="/" onClick={handleLinkClick}>
                        Home
                        <img src={`/images/home.png`} alt={"Home"} className="sidemenu-icon" />
                    </Link>
                    {user && (
                        <Link to="/wishlist" onClick={handleLinkClick}>
                            Wishlist
                            <img src={`/images/wishlist.png`} alt={"Wishlist"} className="sidemenu-icon" />
                        </Link>
                    )}
                    {user && user.role === 'admin' && (
                        <>
                            <Link to="/admin/user-management" onClick={handleLinkClick} className="admin-link">
                                User Management
                                <img src={`/images/um.png`} alt={"User Management   "} className="sidemenu-icon" />
                            </Link>
                        </>
                    )}
                    {user && user.role === 'admin' && (
                        <>
                            <Link to="/admin/address-management" onClick={handleLinkClick} className="admin-link">
                                Address Management
                                <img src={`/images/am.png`} alt={"Address Management"} className="sidemenu-icon" />
                            </Link>
                        </>
                    )}
                    {user && user.role === 'admin' && (
                        <>
                            <Link to="/admin/product-management" onClick={handleLinkClick} className="admin-link">
                                Product Management
                                <img src={`/images/product.png`} alt={"Product Management"} className="sidemenu-icon" />
                            </Link>
                        </>
                    )}
                    {user && user.role === 'admin' && (
                        <>
                            <Link to="/admin/order-management" onClick={handleLinkClick} className="admin-link">
                                Order Management
                                <img src={`/images/order.png`} alt={"Order Management"} className="sidemenu-icon" />
                            </Link>
                        </>
                    )}
                    {user && user.role === 'admin' && (
                        <>
                            <Link to="/admin/add-category" onClick={handleLinkClick} className="admin-link">
                                Add Category
                                <img src={`/images/add.png`} alt={"Add Category"} className="sidemenu-icon" />
                            </Link>
                        </>
                    )}
                    {user && user.role === 'admin' && (
                        <>
                            <Link to="/admin/dashboard" onClick={handleLinkClick} className="admin-link">
                                Dashboard
                                <img src={`/images/dashboard.png`} alt={"Dashboard"} className="sidemenu-icon" />
                            </Link>
                        </>
                    )}
                    {user && user.role === 'provider' && (
                        <>
                            <Link to="/provider/my-products" onClick={handleLinkClick} className="admin-link">
                                My Products
                                <img src={`/images/product.png`} alt={"My Products"} className="sidemenu-icon" />
                            </Link>
                        </>
                    )}
                    {user && user.role === 'provider' && (
                        <>
                            <Link to="/provider/add-product" onClick={handleLinkClick} className="admin-link">
                                Add Product
                                <img src={`/images/add.png`} alt={"Add Product"} className="sidemenu-icon" />
                            </Link>
                        </>
                    )}
                    {user && user.role === 'provider' && (
                        <>
                            <Link to="/provider/manage-orders" onClick={handleLinkClick} className="admin-link">
                                Manage Orders
                                <img src={`/images/order.png`} alt={"Manage Orders"} className="sidemenu-icon" />
                            </Link>
                        </>
                    )}
                    {user && user.role === 'provider' && (
                        <>
                            <Link to="/provider/dashboard" onClick={handleLinkClick} className="admin-link">
                                Dashboard
                                <img src={`/images/dashboard.png`} alt={"Dashboard"} className="sidemenu-icon" />
                            </Link>
                        </>
                    )}
                    <hr className="divider" />
                    {categories.map(category => (
                        <Link
                            key={category.id}
                            to={`/categories/${encodeURIComponent(category.name)}`}
                            onClick={handleLinkClick}
                        >
                            {category.name}
                            <img src={getIconUrl(category.name)} alt={category.name} className="sidemenu-icon" />
                        </Link>
                    ))}
                </div>
            </div>
        </>
    );
}

export default SideMenu;