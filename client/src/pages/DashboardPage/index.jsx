import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getProviderDashboard } from '../../api/dashboard';
import './style.css';

function DashboardPage() {
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { token } = useAuth();

    useEffect(() => {
        const fetchData = async () => {
            if (!token) return;
            try {
                setLoading(true);
                const data = await getProviderDashboard(token);
                setDashboardData(data);
            } catch (err) {
                setError("Failed to load dashboard data.");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [token]);

    if (loading) return <div className="dashboard-container"><p>Loading Dashboard...</p></div>;
    if (error) return <div className="dashboard-container"><p className="error-message">{error}</p></div>;
    if (!dashboardData) return null;

    const { salesStats, lowStockProducts, topSellers, recentOrders } = dashboardData;

    return (
        <div className="dashboard-container">
            <h1>Provider Dashboard</h1>
            <div className="dashboard-grid">
                <StatCard title="Total Revenue" value={`$${Number(salesStats.totalRevenue).toFixed(2)}`} />
                <StatCard title="Total Orders" value={salesStats.totalOrders} />
                <StatCard title="Items Sold" value={salesStats.totalItemsSold} />

                <DashboardListCard title="Low Stock Alerts" data={lowStockProducts} renderItem={item => (
                    <Link to={`/provider/edit-product/${item.id}`}>
                        {item.name} <span>Stock: {item.stock_quantity}</span>
                    </Link>
                )} emptyMessage="No products are low on stock." />

                <DashboardListCard title="Top Selling Products" data={topSellers} renderItem={item => (
                    <Link to={`/products/${item.id}`}>
                        {item.name} <span>Sold: {item.total_sold}</span>
                    </Link>
                )} emptyMessage="No sales data yet." />

                <DashboardListCard title="Recent Orders" data={recentOrders} renderItem={item => (
                    <Link to="/provider/manage-orders">
                        Order #{item.order_id} - ${Number(item.order_total).toFixed(2)}
                        <small>{item.product_names}</small>
                    </Link>
                )} emptyMessage="No recent orders." />
            </div>
        </div>
    );
}

const StatCard = ({ title, value }) => (
    <div className="dashboard-card stat-card">
        <h3>{title}</h3>
        <p>{value}</p>
    </div>
);

const DashboardListCard = ({ title, data, renderItem, emptyMessage }) => (
    <div className="dashboard-card list-card">
        <h3>{title}</h3>
        {data && data.length > 0 ? (
            <ul>
                {data.map((item, index) => <li key={index}>{renderItem(item)}</li>)}
            </ul>
        ) : (
            <p className="empty-message">{emptyMessage}</p>
        )}
    </div>
);

export default DashboardPage;