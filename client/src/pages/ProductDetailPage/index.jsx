import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getProductById } from '../../api/products';
import { addToCart } from '../../api/cart';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import './style.css';

function ProductDetailPage() {
    const { user, token } = useAuth();
    const { productId } = useParams();
    const { refreshCart } = useCart();
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

    const handleAddToCart = async () => {
        console.log("1. 'Add to Cart' button clicked.");

        if (!token) {
            console.log("2. No token found. User is not logged in.");
            alert("Please log in to add items to your cart.");
            return;
        }

        if (!product || !product.id) {
            console.error("2. Product data is not available.");
            alert("Error: Product information is missing. Cannot add to cart.");
            return;
        }

        console.log(`2. Preparing to add product ID: ${product.id} to cart.`);

        try {
            console.log("3. Calling the addToCart API function...");
            await addToCart(product.id, 1, token);
            console.log("4. API call successful.");

            await refreshCart();
            console.log("5. Cart refreshed.");

            alert(`${product.name} has been added to your cart!`);
        } catch (error) {
            console.error("ERROR during 'Add to Cart' process:", error);
            alert(`An error occurred: ${error.message}`);
        }
    };

    return (
        <div className="product-detail-container">
            <div className="product-detail-card">
                <div className="product-detail-header">
                    <div>
                        <h1 className="product-title">{product.name}</h1>
                        {product.provider_name && (
                            <div className="product-provider">
                                Sold by: {product.provider_name}
                            </div>
                        )}
                    </div>
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
                            onClick={handleAddToCart}
                        >
                            Add to Cart
                        </button>
                        {user && user.id === product.provider_id && (
                            <Link to={`/provider/edit-product/${product.id}`} className="edit-product-btn">
                                Edit Product
                            </Link>
                        )}
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