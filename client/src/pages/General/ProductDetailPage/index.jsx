import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getProductById } from '../../../api/products';
import { addToCart } from '../../../api/cart';
import { useAuth } from '../../../contexts/AuthContext';
import { useCart } from '../../../contexts/CartContext';
import { getWishlist, addToWishlist, removeFromWishlist } from '../../../api/wishlist';
import { useToast } from '../../../contexts/ToastContext';
import './style.css';

function ProductDetailPage() {
    const { user, token } = useAuth();
    const { productId } = useParams();
    const { refreshCart } = useCart();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isInWishlist, setIsInWishlist] = useState(false);
    const { addToast } = useToast();

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);

                // Fetch product details and the user's wishlist in parallel
                const productPromise = getProductById(productId);
                const wishlistPromise = token ? getWishlist(token) : Promise.resolve([]); // Only fetch if logged in

                const [productData, wishlistData] = await Promise.all([productPromise, wishlistPromise]);

                setProduct(productData);

                // Check if the current product is in the user's wishlist
                if (wishlistData && productData) {
                    const isProductInWishlist = wishlistData.some(item => item.id === productData.id);
                    setIsInWishlist(isProductInWishlist);
                }

            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [productId, token]); // Re-run effect if the productId in the URL changes

    if (loading) {
        return <div className="product-detail-container"><p>Loading...</p></div>;
    }

    if (error) {
        return <div className="product-detail-container"><p className="error-message">{error}</p></div>;
    }

    if (!product) {
        return null; // Or a "Product not found" component
    }

    const getImageUrl = (categoryName) => {
        if (!categoryName) {
            return '';
        }
        const imageName = categoryName.toLowerCase().replace(/ /g, '_') + '.png';
        return `/images/${imageName}`;
    };

    const handleAddToCart = async () => {

        if (!token) {
            addToast("Please log in to add items to your cart.");
            return;
        }

        if (!product || !product.id) {
            console.error("2. Product data is not available.");
            addToast("Error: Product information is missing. Cannot add to cart.","error");
            return;
        }

        try {
            await addToCart(product.id, 1, token);

            await refreshCart();

            addToast(`${product.name} has been added to your cart!`);
        } catch (error) {
            console.error("ERROR during 'Add to Cart' process:", error);
            addToast(`An error occurred: ${error.message}`,"error");
        }
    };

    const handleToggleWishlist = async () => {
        if (!token) {
            addToast("Please log in to manage your wishlist.");
            return;
        }
        try {
            if (isInWishlist) {
                await removeFromWishlist(product.id, token);
                addToast(`${product.name} removed from wishlist.`, "info");
            } else {
                await addToWishlist(product.id, token);
                addToast(`${product.name} added to wishlist!`, "success");
            }
            setIsInWishlist(!isInWishlist);
        } catch (err) {
            addToast(`Error updating wishlist: ${err.message}`, "error");
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
                <img src={getImageUrl(product.category_name)} alt={product.name} className="product-detail-image" />
                <p className="product-description">{product.description}</p>

                <div className="product-purchase-section">
                    <span className="product-price-large">${product.price}</span>
                    <div className="purchase-actions">
                        <span className={`product-stock-status ${product.stock_quantity > 0 ? 'in-stock' : 'out-of-stock'}`}>
                            {product.stock_quantity > 0 ? `In Stock: ${product.stock_quantity}` : 'Out of Stock'}
                        </span>
                        <button onClick={handleToggleWishlist} className={`wishlist-btn ${isInWishlist ? 'active' : ''}`}>
                            ❤
                        </button>
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