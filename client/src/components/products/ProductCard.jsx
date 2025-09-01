import React from 'react';
import {useTranslation} from "react-i18next";
import { Link } from 'react-router-dom';
import './ProductCard.css';

function ProductCard({ product }) {
    const { t } = useTranslation();
    /**
     * Generates the image URL based on the product's category name.
     * @param {string} categoryName - The name of the category (e.g., "CPU Cooler").
     * @returns {string} The path to the image.
     */
    const getImageUrl = (categoryName) => {
        if (!categoryName) {
            return ''; // Return empty if no category name is provided
        }
        // Converts "CPU Cooler" to "cpu_cooler.png"
        const imageName = categoryName.toLowerCase().replace(/ /g, '_') + '.png';
        return `/images/${imageName}`;
    };

    return (
        <div className="product-card">
            <img src={getImageUrl(product.category_name)} alt={product.name} className="product-image" />
            <div className="product-info">
                <h3 className="product-name">{product.name}</h3>
                <div className="product-meta">
                    <span className="product-price">${product.price}</span>
                    <span className="product-quantity" style={product.stock_quantity > 0 ? { color: "#2ecc71" } : { color: "#e74c3c" }}>{t('quantity')}: {product.stock_quantity}</span>
                </div>
            </div>
            <Link to={`/products/${product.id}`} className="view-details-btn">
                {t('view_details')}
            </Link>
        </div>
    );
}

export default ProductCard;