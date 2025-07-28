import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getProductById } from '../../api/products';
import './style.css';

function ProductDetailPage() {
    const { productId } = useParams();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                setLoading(true);
                const data = await getProductById(productId);
                setProduct(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchProduct();
    }, [productId]); // Re-run effect if the productId in the URL changes

    if (loading) {
        return <div className="product-detail-container"><p>Loading...</p></div>;
    }

    if (error) {
        return <div className="product-detail-container"><p className="error-message">{error}</p></div>;
    }

    if (!product) {
        return null; // Or a "Product not found" component
    }

    return (
        <div className="product-detail-container">
            <div className="product-detail-card">
                <div className="product-detail-header">
                    <h1 className="product-title">{product.name}</h1>
                    <span className="product-category">{product.category_name}</span>
                </div>
                <p className="product-description">{product.description}</p>

                <div className="product-purchase-section">
                    <span className="product-price-large">${product.price}</span>
                    <div className="purchase-actions">
                        <span className={`product-stock-status ${product.stock_quantity > 0 ? 'in-stock' : 'out-of-stock'}`}>
                            {product.stock_quantity > 0 ? `In Stock: ${product.stock_quantity}` : 'Out of Stock'}
                        </span>
                        <button
                            className="add-to-cart-btn"
                            disabled={product.stock_quantity === 0}
                        >
                            Add to Cart
                        </button>
                    </div>
                </div>

                <div className="product-attributes">
                    <h2>Specifications</h2>
                    <ul className="attributes-list">
                        {product.attributes.map((attr, index) => (
                            <li key={index} className="attribute-item">
                                <span className="attribute-name">{attr.name}</span>
                                <span className="attribute-value">{attr.value}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
}

export default ProductDetailPage;