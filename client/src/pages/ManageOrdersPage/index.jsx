import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getProviderOrderItems, updateOrderItemStatus } from '../../api/cart';
import { Link } from 'react-router-dom';
import './style.css';

function ManageOrdersPage() {
    const [orderItems, setOrderItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { token } = useAuth();

    const fetchOrderItems = async () => {
        if (!token) return;
        try {
            setLoading(true);
            const data = await getProviderOrderItems(token);
            setOrderItems(data);
        } catch (err) {
            setError("Failed to load your orders. Please try again later.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrderItems();
    }, [token]);

    const handleStatusChange = async (orderItemId, newStatus) => {
        try {
            await updateOrderItemStatus(orderItemId, newStatus, token);
            // Refresh the list to show the updated status
            fetchOrderItems();
        } catch (err) {
            alert(`Failed to update status: ${err.message}`);
        }
    };

    const statusOptions = ['Pending', 'Processing', 'Shipped', 'Cancelled'];

    return (
        <div className="manage-orders-container">
            <h1>Manage Incoming Orders</h1>
            {loading && <p>Loading orders...</p>}
            {error && <p className="error-message">{error}</p>}
            {!loading && !error && (
                <div className="order-items-table">
                    <div className="table-header">
                        <span>Order ID</span>
                        <span>Product</span>
                        <span>Customer</span>
                        <span>Shipping Address</span>
                        <span>Status</span>
                    </div>
                    {orderItems.length > 0 ? (
                        orderItems.map(item => (
                            <div key={item.order_item_id} className="table-row">
                                <span className="cell-order-id">#{item.order_id}</span>
                                <div className="cell-product">
                                    <Link to={`/products/${item.product_id}`} className="item-name"><strong>{item.product_name}</strong></Link>
                                    <span>Qty: {item.quantity}</span>
                                </div>
                                <span className="cell-customer">{item.first_name} {item.last_name}</span>
                                <div className="cell-address">
                                    {item.shipping_street}, {item.shipping_city}, {item.shipping_state} {item.shipping_postal_code}
                                </div>
                                <div className="cell-status">
                                    <select
                                        value={item.status}
                                        onChange={(e) => handleStatusChange(item.order_item_id, e.target.value)}
                                        className={`status-select status-${item.status.toLowerCase()}`}
                                    >
                                        {statusOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                    </select>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p>You have no incoming orders.</p>
                    )}
                </div>
            )}
        </div>
    );
}

export default ManageOrdersPage;