import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { getAdminDashboard } from '../../../api/dashboard';
import './style.css';

function AdminDashboardPage() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const { token } = useAuth();

    useEffect(() => {
        const fetchData = async () => {
            if (!token) return;
            try {
                setLoading(true);
                const dashboardData = await getAdminDashboard(token);
                setData(dashboardData);
            } catch (err) {
                console.error("Failed to load admin dashboard:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [token]);

    if (loading) return <div className="dashboard-container"><p>Loading Dashboard...</p></div>;
    if (!data) return <div className="dashboard-container"><p>Could not load dashboard data.</p></div>;

    const { userStats, productStats, salesStats, recentOrders, recentUsers } = data;

    return (
        <div className="admin-dashboard-container">
            <h1>Admin Dashboard</h1>
            <div className="dashboard-grid">
                {/* Stat Cards */}
                <StatCard title="Total Revenue" value={`$${Number(salesStats.totalRevenue || 0).toFixed(2)}`} />
                <StatCard title="Total Orders" value={salesStats.totalOrders || 0} />
                <StatCard title="Total Users" value={userStats.totalUsers || 0} />
                <StatCard title="Total Products" value={productStats.totalProducts || 0} />

                {/* List Cards */}
                <DashboardListCard title="Recent Orders" data={recentOrders} renderItem={item => (
                    <Link to="/admin/order-management">
                        Order #{item.id} by {item.first_name} - ${Number(item.total_amount).toFixed(2)}
                    </Link>
                )} emptyMessage="No recent orders." />

                <DashboardListCard title="New Users" data={recentUsers} renderItem={item => (
                    <Link to="/admin/user-management">
                        {item.first_name} {item.last_name} ({item.email})
                        <small>Role: <span className={`role-badge role-${item.role}`}>{item.role}</span></small>
                    </Link>
                )} emptyMessage="No new users." />
            </div>
        </div>
    );
}

// Reusable components (can be moved to a shared file later)
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
                {data.map((item, index) => <li key={item.id || index}>{renderItem(item)}</li>)}
            </ul>
        ) : (
            <p className="empty-message">{emptyMessage}</p>
        )}
    </div>
);

export default AdminDashboardPage;