import React from 'react';
import { Link } from 'react-router-dom';
import './ProductCard.css';

function ProductCard({ product }) {
    return (
        <div className="product-card">
            {/* You can add an image here later */}
            {/* <img src={product.imageUrl || 'default-image.png'} alt={product.name} className="product-image" /> */}
            <div className="product-info">
                <h3 className="product-name">{product.name}</h3>
                <p className="product-price">${product.price}</p>
            </div>
            <Link to={`/products/${product.id}`} className="view-details-btn">
                View Details
            </Link>
        </div>
    );
}

export default ProductCard;