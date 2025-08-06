import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './OrderHistory.css';

function OrderCard({ order }) {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <div className="order-card">
            <div className="order-summary-row" onClick={() => setIsExpanded(!isExpanded)}>
                <span className="order-id">Order #{order.id}</span>
                <span className="order-date">{new Date(order.created_at).toLocaleDateString()}</span>
                <span className="order-total">${order.total_amount}</span>
                <span className={`order-status ${order.order_status.toLowerCase()}`}>{order.order_status}</span>
                <span className="order-toggle">{isExpanded ? '▲' : '▼'}</span>
            </div>
            {isExpanded && (
                <div className="order-details">
                    <h4>Order Items</h4>
                    <ul className="order-item-list">
                        {order.items.map(item => (
                            <li key={item.product_id}>
                                <Link to={`/products/${item.product_id}`} className="item-name">{item.product_name}</Link>
                                <span className="item-qty">Qty: {item.quantity}</span>
                                <span className="item-price">Price: ${item.price_at_purchase}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}

function OrderHistory({ orders }) {
    return (
        <div className="order-history-list">
            {orders.map(order => (
                <OrderCard key={order.id} order={order} />
            ))}
        </div>
    );
}

export default OrderHistory;