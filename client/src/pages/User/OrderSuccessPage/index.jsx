import React, { useState, useEffect, useRef } from 'react'; // 1. Import useRef
import { useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { useCart } from '../../../contexts/CartContext';
import { fulfillOrder } from '../../../api/checkout';
import './style.css';

function OrderSuccessPage() {
    const [searchParams] = useSearchParams();
    const [status, setStatus] = useState('processing');
    const [error, setError] = useState('');
    const [orderId, setOrderId] = useState(null);
    const { token } = useAuth();
    const { refreshCart } = useCart();
    const hasFulfilled = useRef(false); // 2. Create a ref to track fulfillment

    useEffect(() => {
        // 3. If fulfillment has already been attempted, do nothing.
        // This check will prevent the second call.
        if (hasFulfilled.current) {
            return;
        }

        const sessionId = searchParams.get('session_id');
        if (!sessionId || !token) {
            setStatus('error');
            setError('Invalid session or not logged in.');
            return;
        }

        // 4. Mark that we are now attempting fulfillment.
        hasFulfilled.current = true;

        const verifyPayment = async () => {
            try {
                const result = await fulfillOrder(sessionId, token);
                setOrderId(result.orderId);
                setStatus('success');
                await refreshCart(); // This will trigger a re-render, but the check above will prevent a second call.
            } catch (err) {
                setStatus('error');
                setError(err.message || 'An unknown error occurred during order fulfillment.');
            }
        };

        verifyPayment();

    }, [searchParams, token, refreshCart]); // Dependencies are still important for the initial run.

    return (
        <div className="order-status-container">
            {status === 'processing' && (
                <>
                    <h2>Processing Your Order...</h2>
                    <p>Please wait while we confirm your payment.</p>
                </>
            )}
            {status === 'success' && (
                <>
                    <h2>Thank You For Your Order!</h2>
                    <p>Your payment was successful and your order has been placed.</p>
                    <p>Your Order ID is: <strong>#{orderId}</strong></p>
                    <Link to="/profile" className="status-link">View Order History</Link>
                </>
            )}
            {status === 'error' && (
                <>
                    <h2>Order Failed</h2>
                    <p>There was a problem processing your order.</p>
                    <p className="error-message">{error}</p>
                    <Link to="/cart" className="status-link">Return to Cart</Link>
                </>
            )}
        </div>
    );
}

export default OrderSuccessPage