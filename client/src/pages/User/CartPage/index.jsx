import React, { useState, useEffect } from 'react';
import { useTranslation } from "react-i18next";
import { useAuth } from '../../../contexts/AuthContext';
import { useCart } from '../../../contexts/CartContext';
import { getCart, updateCartItem, removeFromCart } from '../../../api/cart';
import { getMyAddresses } from '../../../api/address';
import { useToast } from '../../../contexts/ToastContext';
import { createCheckoutSession } from '../../../api/checkout';
import { loadStripe } from '@stripe/stripe-js';
import QuantitySelector from '../../../components/quantityselector/QuantitySelector';
import { Link, useNavigate } from 'react-router-dom';
import './style.css';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

function CartPage() {
    const { t } = useTranslation();
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

    const handleProceedToPayment = async () => {
        const finalBillingId = useShippingForBilling ? shippingAddressId : billingAddressId;
        if (!shippingAddressId || !finalBillingId) {
            setError("Please select both a shipping and billing address.");
            return;
        }
        setError(null); // Clear previous errors

        try {
            // The backend needs to be updated to accept both address IDs.
            // We will pass them in the body of the request.
            const { id: sessionId } = await createCheckoutSession(token, {
                shippingAddressId,
                billingAddressId: finalBillingId
            });

            const stripe = await stripePromise;
            const { error } = await stripe.redirectToCheckout({ sessionId });

            // This part of the code will only be reached if there is an immediate error
            // in the redirection process (e.g., network issue).
            if (error) {
                setError(error.message);
                addToast(error.message, "error");
            }
        } catch (err) {
            setError(err.message);
            addToast(err.message, "error");
        }
    };

    const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const shippingAddresses = addresses.filter(a => a.address_type === 'shipping');
    const billingAddresses = addresses.filter(a => a.address_type === 'billing');

    if (loading) return <div className="cart-container"><p>Loading your cart...</p></div>;

    return (
        <div className="cart-container">
            <h1>{t('your_cart')}</h1>
            {error && <p className="error-message">{error}</p>}
            {cartItems.length === 0 ? (
                <p>{t('cart_empty')} <Link to="/">{t('go_shopping')}</Link></p>
            ) : (
                <div className="cart-layout">
                    <div className="cart-items-list">
                        {cartItems.map(item => (
                            <div key={item.product_id} className="cart-item">
                                <div className="cart-item-info">
                                    <Link to={`/products/${item.product_id}`}><h4>{item.name}</h4></Link>
                                    <p>{t('price')}: <strong>${item.price}</strong></p>
                                </div>
                                <div className="cart-item-actions">
                                    <QuantitySelector
                                        initialQuantity={item.quantity}
                                        maxQuantity={item.stock_quantity}
                                        onQuantityChange={(newQuantity) => handleUpdateQuantity(item.product_id, newQuantity)}
                                    />
                                    <button className='remove-button' onClick={() => handleRemoveItem(item.product_id)}>{t('remove')}</button>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="cart-summary">
                        <h2>{t('order_summary')}</h2>
                        <p>{t('total')}: <strong>${total.toFixed(2)}</strong></p>
                        <div className="address-selection">
                            <Link to="/profile">{t('manage_addresses')}</Link>
                            <h4>{t('shipping')}</h4>
                            <select value={shippingAddressId} onChange={e => setShippingAddressId(e.target.value)} required>
                                <option value="">{t('select_shipping_address')}</option>
                                {shippingAddresses.map(addr => <option key={addr.id} value={addr.id}>{addr.street}, {addr.city}</option>)}
                            </select>

                            <h4>{t('billing')}</h4>
                            {!useShippingForBilling && (
                                <select value={billingAddressId} onChange={e => setBillingAddressId(e.target.value)} required>
                                        <option value="">{t('select_billing_address')}</option>
                                    {billingAddresses.map(addr => <option key={addr.id} value={addr.id}>{addr.street}, {addr.city}</option>)}
                                </select>
                            )}
                            <label>
                                <input type="checkbox" checked={useShippingForBilling} onChange={e => setUseShippingForBilling(e.target.checked)} />
                                {t('use_shipping_for_billing')}
                            </label>
                        </div>
                            <button className="checkout-btn" onClick={handleProceedToPayment}>
                                {t('proceed_to_payment')}
                            </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default CartPage;