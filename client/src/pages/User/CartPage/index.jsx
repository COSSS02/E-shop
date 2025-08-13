import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useCart } from '../../../contexts/CartContext';
import { getCart, updateCartItem, removeFromCart, placeOrder } from '../../../api/cart';
import { getMyAddresses } from '../../../api/address';
import { useToast } from '../../../contexts/ToastContext';
import QuantitySelector from '../../../components/quantityselector/QuantitySelector';
import { Link, useNavigate } from 'react-router-dom';
import './style.css';

function CartPage() {
    const [cartItems, setCartItems] = useState([]);
    const [addresses, setAddresses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [shippingAddressId, setShippingAddressId] = useState('');
    const [billingAddressId, setBillingAddressId] = useState('');
    const [useShippingForBilling, setUseShippingForBilling] = useState(false);

    const { token } = useAuth();
    const { refreshCart } = useCart();
    const navigate = useNavigate();
    const { addToast } = useToast();

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [cartData, addressData] = await Promise.all([
                    getCart(token),
                    getMyAddresses(token)
                ]);
                setCartItems(cartData);
                setAddresses(addressData);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        if (token) fetchData();
    }, [token]);

    const handleUpdateQuantity = async (productId, quantity) => {
        try {
            await updateCartItem(productId, quantity, token);
            const updatedCart = await getCart(token);
            setCartItems(updatedCart);
            await refreshCart();
        } catch (err) {
            setError(err.message);
        }
    };

    const handleRemoveItem = async (productId) => {
        try {
            await removeFromCart(productId, token);
            setCartItems(cartItems.filter(item => item.product_id !== productId));
            await refreshCart();
        } catch (err) {
            setError(err.message);
        }
    };

    const handlePlaceOrder = async () => {
        const finalBillingId = useShippingForBilling ? shippingAddressId : billingAddressId;
        if (!shippingAddressId || !finalBillingId) {
            setError("Please select both a shipping and billing address.");
            return;
        }
        try {
            const result = await placeOrder({ shippingAddressId, billingAddressId: finalBillingId }, token);
            addToast(result.message, "success");
            navigate('/'); // Redirect to homepage after successful order
            await refreshCart();
        } catch (err) {
            setError(err.message);
        }
    };

    const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const shippingAddresses = addresses.filter(a => a.address_type === 'shipping');
    const billingAddresses = addresses.filter(a => a.address_type === 'billing');

    if (loading) return <div className="cart-container"><p>Loading your cart...</p></div>;

    return (
        <div className="cart-container">
            <h1>Your Shopping Cart</h1>
            {error && <p className="error-message">{error}</p>}
            {cartItems.length === 0 ? (
                <p>Your cart is empty. <Link to="/">Go shopping!</Link></p>
            ) : (
                <div className="cart-layout">
                    <div className="cart-items-list">
                        {cartItems.map(item => (
                            <div key={item.product_id} className="cart-item">
                                <div className="cart-item-info">
                                    <Link to={`/products/${item.product_id}`}><h4>{item.name}</h4></Link>
                                    <p>Price: <strong>${item.price}</strong></p>
                                </div>
                                <div className="cart-item-actions">
                                    <QuantitySelector
                                        initialQuantity={item.quantity}
                                        maxQuantity={item.stock_quantity}
                                        onQuantityChange={(newQuantity) => handleUpdateQuantity(item.product_id, newQuantity)}
                                    />
                                    <button className='remove-button' onClick={() => handleRemoveItem(item.product_id)}>Remove</button>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="cart-summary">
                        <h2>Order Summary</h2>
                        <p>Total: <strong>${total.toFixed(2)}</strong></p>
                        <div className="address-selection">
                            <Link to="/profile">Manage Addresses</Link>
                            <h4>Shipping Address</h4>
                            <select value={shippingAddressId} onChange={e => setShippingAddressId(e.target.value)} required>
                                <option value="">Select Shipping Address</option>
                                {shippingAddresses.map(addr => <option key={addr.id} value={addr.id}>{addr.street}, {addr.city}</option>)}
                            </select>

                            <h4>Billing Address</h4>
                            {!useShippingForBilling && (
                                <select value={billingAddressId} onChange={e => setBillingAddressId(e.target.value)} required>
                                    <option value="">Select Billing Address</option>
                                    {billingAddresses.map(addr => <option key={addr.id} value={addr.id}>{addr.street}, {addr.city}</option>)}
                                </select>
                            )}
                            <label>
                                <input type="checkbox" checked={useShippingForBilling} onChange={e => setUseShippingForBilling(e.target.checked)} />
                                Use shipping address for billing
                            </label>
                        </div>
                        <button className="checkout-btn" onClick={handlePlaceOrder}>Place Order</button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default CartPage;