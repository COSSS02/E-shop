import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { useToast } from '../../../contexts/ToastContext';
import { getAllOrders, updateOrderItemStatus } from '../../../api/orders';
import Pagination from '../../../components/pagination/Pagination';
import './style.css';

function AdminOrderManagementPage() {
    const [orders, setOrders] = useState([]);
    const [pagination, setPagination] = useState(null);
    const [loading, setLoading] = useState(true);
    const { token } = useAuth();
    const { addToast } = useToast();
    const [searchParams, setSearchParams] = useSearchParams();

    const { currentPage, currentSort, currentSearch } = useMemo(() => ({
        currentPage: parseInt(searchParams.get('page') || '1', 10),
        currentSort: searchParams.get('sort') || 'created_at-desc',
        currentSearch: searchParams.get('q') || ''
    }), [searchParams]);

    const [inputValue, setInputValue] = useState(currentSearch);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const data = await getAllOrders(currentPage, currentSort, currentSearch, token);
            setOrders(data.orders);
            setPagination(data.pagination);
        } catch (err) {
            addToast("Failed to load orders.", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, [currentPage, currentSort, currentSearch, token]);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (inputValue !== currentSearch) {
                setSearchParams({ q: inputValue, sort: currentSort, page: 1 }, { replace: true });
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [inputValue, currentSearch, currentSort, setSearchParams]);

    const handlePageChange = (newPage) => setSearchParams({ q: currentSearch, sort: currentSort, page: newPage });

    const handleStatusChange = async (orderItemId, newStatus) => {
        try {
            await updateOrderItemStatus(orderItemId, newStatus, token);
            addToast("Status updated successfully!", "success");
            // Optimistically update the UI
            setOrders(prevOrders => prevOrders.map(order => ({
                ...order,
                items: order.items.map(item =>
                    item.order_item_id === orderItemId ? { ...item, status: newStatus } : item
                )
            })));
        } catch (err) {
            addToast(`Failed to update status: ${err.message}`, "error");
        }
    };

    return (
        <div className="admin-order-container">
            <h1>Order Management</h1>
            <div className="toolbar">
                <input
                    type="text"
                    placeholder="Search by Order ID, User Email, Name..."
                    value={inputValue}
                    onChange={e => setInputValue(e.target.value)}
                    className="search-input"
                />
            </div>

            {loading ? <p>Loading orders...</p> : (
                <>
                    <div className="admin-orders-list">
                        {orders.map(order => (
                            <OrderCard
                                key={order.id}
                                order={order}
                                onStatusChange={handleStatusChange}
                            />
                        ))}
                    </div>
                    {pagination && pagination.totalPages > 1 && (
                        <Pagination
                            currentPage={currentPage}
                            totalPages={pagination.totalPages}
                            onPageChange={handlePageChange}
                        />
                    )}
                </>
            )}
        </div>
    );
}

const OrderCard = ({ order, onStatusChange }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const statusOptions = ['Pending', 'Processing', 'Shipped', 'Cancelled'];

    return (
        <div className="admin-order-card">
            <div className="order-summary-row" onClick={() => setIsExpanded(!isExpanded)}>
                <span className="order-id">#{order.id}</span>
                <span className="order-customer">{order.first_name} {order.last_name}</span>
                <span className="order-email">{order.email}</span>
                <span className="order-address">{order.shipping_street}, {order.shipping_city}</span>
                <span className="order-date">{new Date(order.created_at).toLocaleDateString()}</span>
                <span className="order-total">${Number(order.total_amount).toFixed(2)}</span>
                <span className="order-toggle">{isExpanded ? '▲' : '▼'}</span>
            </div>
            {isExpanded && (
                <div className="order-details-admin">
                    <h4>Order Items</h4>
                    <div className="items-header">
                        <span>Product</span>
                        <span>Quantity</span>
                        <span>Price</span>
                        <span>Status</span>
                    </div>
                    <ul className="order-item-list-admin">
                        {order.items.map(item => (
                            <li key={item.order_item_id}>
                                <Link to={`/products/${item.product_id}`} className="item-name">{item.product_name}</Link>
                                <span>{item.quantity}</span>
                                <span>${Number(item.price_at_purchase).toFixed(2)}</span>
                                <select
                                    value={item.status}
                                    onChange={(e) => onStatusChange(item.order_item_id, e.target.value)}
                                    className={`status-select status-${item.status.toLowerCase()}`}
                                    onClick={e => e.stopPropagation()} // Prevent card from collapsing
                                >
                                    {statusOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                </select>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default AdminOrderManagementPage;