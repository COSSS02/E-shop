import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { getMyAddresses, createAddress } from '../../../api/address';
import { getMyOrders } from '../../../api/orders';
import { upgradeToProvider } from '../../../api/auth';
import { changePassword, deleteAccount } from '../../../api/user';
import OrderHistory from '../../../components/orderhistory/OrderHistory';
import { useToast } from '../../../contexts/ToastContext';
import './style.css';

function ProfilePage() {
    const [activeTab, setActiveTab] = useState('profile');
    const { user } = useAuth();

    if (!user) return <div>Loading...</div>;

    const renderContent = () => {
        switch (activeTab) {
            case 'profile':
                return <ProfileInfo />;
            case 'addresses':
                return <Addresses />;
            case 'orders':
                return <OrderHistoryTab />;
            case 'security':
                return <Security />;
            default:
                return <ProfileInfo />;
        }
    };

    return (
        <div className="profile-page-layout">
            <aside className="profile-tabs">
                <button onClick={() => setActiveTab('profile')} className={activeTab === 'profile' ? 'active' : ''}>My Profile</button>
                <button onClick={() => setActiveTab('addresses')} className={activeTab === 'addresses' ? 'active' : ''}>Addresses</button>
                <button onClick={() => setActiveTab('orders')} className={activeTab === 'orders' ? 'active' : ''}>Order History</button>
                <button onClick={() => setActiveTab('security')} className={activeTab === 'security' ? 'active' : ''}>Security</button>
            </aside>
            <main className="profile-content">
                {renderContent()}
            </main>
        </div>
    );
}

// --- Sub-components for each tab ---

const ProfileInfo = () => {
    const { user} = useAuth();
    const { addToast } = useToast();
    const [showUpgradeForm, setShowUpgradeForm] = useState(false);
    const [providerAddress, setProviderAddress] = useState(null);
    const { token } = useAuth();

    useEffect(() => {
        if (user.role === 'provider') {
            const fetchProviderAddress = async () => {
                try {
                    const allAddresses = await getMyAddresses(token);
                    const pAddress = allAddresses.find(addr => addr.address_type === 'provider');
                    setProviderAddress(pAddress);
                } catch (error) {
                    console.error("Failed to fetch provider address:", error);
                }
            };
            fetchProviderAddress();
        }
    }, [user.role, token]);

    const handleUpgradeSuccess = () => {
        setShowUpgradeForm(false);
        addToast("Account upgraded! Please log out and log back in to access provider features.", "success");
        // We don't automatically update the role here; a re-login is required for a new token.
    };

    return (
        <div>
            <h2>My Profile <span className="user-role">{user.role}</span></h2>
            <p><strong>Name:</strong> {user.firstName} {user.lastName}</p>
            <p><strong>Email:</strong> {user.email}</p>
            {/* <p><strong>Role:</strong> <span style={{ textTransform: 'capitalize' }}>{user.role}</span></p> */}
            {user.role === 'provider' && (
                <>
                    <p><strong>Company:</strong> {user.companyName || 'N/A'}</p>
                    {providerAddress && (
                        <div className="provider-address-display">
                            <strong>Business Address:</strong>
                            <p>
                                {providerAddress.street}, {providerAddress.city}, {providerAddress.state} {providerAddress.zip_code}, {providerAddress.country}
                            </p>
                        </div>
                    )}
                </>
            )}

            {user.role === 'client' && (
                <div className="upgrade-section">
                    <hr style={{ margin: '2rem 0', borderColor: '#555' }} />
                    <h3>Become a Provider</h3>
                    <p>Sell your products on our platform. Create a provider account to get started.</p>
                    <button onClick={() => setShowUpgradeForm(!showUpgradeForm)}>
                        {showUpgradeForm ? 'Cancel Upgrade' : 'Upgrade My Account'}
                    </button>
                    {showUpgradeForm && <UpgradeForm onSuccess={handleUpgradeSuccess} />}
                </div>
            )}
        </div>
    );
};

const Addresses = () => {
    const [addresses, setAddresses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const { token } = useAuth();

    const fetchAddresses = async () => {
        setLoading(true);
        try {
            const data = await getMyAddresses(token);
            // Filter out the provider address so it doesn't show in this list
            const customerAddresses = data.filter(addr => addr.address_type !== 'provider');
            setAddresses(customerAddresses);
        } catch (error) {
            console.error("Failed to fetch addresses:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAddresses();
    }, [token]);

    const handleAddressAdded = () => {
        setShowForm(false);
        fetchAddresses(); // Refresh the list
    };

    if (loading) return <p>Loading addresses...</p>;

    return (
        <div>
            <h2>My Addresses</h2>
            <div className="address-list">
                {addresses.length > 0 ? (
                    addresses.map(addr => (
                        <div key={addr.id} className="address-card">
                            <strong>{addr.address_type.charAt(0).toUpperCase() + addr.address_type.slice(1)} Address</strong>
                            <p>{addr.street}, {addr.city}, {addr.state} {addr.zip_code}, {addr.country}</p>
                        </div>
                    ))
                ) : (
                    <p>You have not added any shipping or billing addresses yet.</p>
                )}
            </div>
            <button onClick={() => setShowForm(!showForm)} className='add-address-button'>
                {showForm ? 'Cancel' : 'Add New Address'}
            </button>
            {showForm && <AddressForm onSuccess={handleAddressAdded} />}
        </div>
    );
};

const OrderHistoryTab = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const { token } = useAuth();

    useEffect(() => {
        if (!token) {
            setLoading(false);
            return;
        }
        getMyOrders(token)
            .then(setOrders)
            .catch(err => {
                console.error("Failed to fetch order history:", err);
                // You can also add a toast notification here to inform the user
            })
            .finally(() => setLoading(false));
    }, [token]);

    if (loading) return <p>Loading orders...</p>;

    return (
        <div>
            <h2>Order History</h2>
            {orders.length > 0 ? <OrderHistory orders={orders} /> : <p>You have not placed any orders yet.</p>}
        </div>
    );
};

const Security = () => {
    const [showModal, setShowModal] = useState(false);
    const { addToast } = useToast();
    const { token, logout } = useAuth();

    const handleChangePassword = async (e) => {
        e.preventDefault();
        const { currentPassword, newPassword, confirmPassword } = e.target.elements;
        if (newPassword.value !== confirmPassword.value) {
            addToast("New passwords do not match.", "error");
            return;
        }
        try {
            const result = await changePassword({
                currentPassword: currentPassword.value,
                newPassword: newPassword.value
            }, token);
            addToast(result.message, "success");
            e.target.reset();
        } catch (err) {
            addToast(err.message, "error");
        }
    };

    const handleDeleteAccount = async (password) => {
        try {
            const result = await deleteAccount(password, token);
            addToast(result.message, "success");
            logout(); // Log out and redirect
        } catch (err) {
            addToast(err.message, "error");
        }
    };

    return (
        <div>
            <h2>Security Settings</h2>
            <form onSubmit={handleChangePassword} className="profile-form">
                <h3>Change Password</h3>
                <div className="form-group">
                    <label htmlFor="currentPassword">Current Password</label>
                    <input type="password" id="currentPassword" name="currentPassword" required />
                </div>
                <div className="form-group">
                    <label htmlFor="newPassword">New Password</label>
                    <input type="password" id="newPassword" name="newPassword" required />
                </div>
                <div className="form-group">
                    <label htmlFor="confirmPassword">Confirm New Password</label>
                    <input type="password" id="confirmPassword" name="confirmPassword" required />
                </div>
                <button type="submit">Update Password</button>
            </form>

            <div className="danger-zone">
                <h3>Delete Account</h3>
                <p>Once you delete your account, there is no going back. Please be certain.</p>
                <button onClick={() => setShowModal(true)}>Delete My Account</button>
            </div>

            {showModal && <DeleteAccountModal onClose={() => setShowModal(false)} onConfirm={handleDeleteAccount} />}
        </div>
    );
};

const AddressForm = ({ onSuccess, addressTypeFixed = null }) => {
    const [formData, setFormData] = useState({
        addressType: addressTypeFixed || 'shipping',
        street: '', city: '', state: '', zipCode: '', country: ''
    });
    const { token } = useAuth();
    const { addToast } = useToast();

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await createAddress(formData, token);
            addToast("Address added successfully!", "success");
            if (onSuccess) onSuccess();
        } catch (err) {
            addToast(`Failed to add address: ${err.message}`, "error");
        }
    };

    return (
        <form onSubmit={handleSubmit} className="profile-form" style={{ marginTop: '1.5rem', borderTop: '1px solid #555', paddingTop: '1.5rem' }}>
            {!addressTypeFixed && (
                <div className="form-group">
                    <label htmlFor="addressType">Address Type</label>
                    <select name="addressType" value={formData.addressType} onChange={handleChange}>
                        <option value="shipping">Shipping</option>
                        <option value="billing">Billing</option>
                    </select>
                </div>
            )}
            <div className="form-group"><label>Street</label><input type="text" name="street" onChange={handleChange} required /></div>
            <div className="form-group"><label>City</label><input type="text" name="city" onChange={handleChange} required /></div>
            <div className="form-group"><label>State / Province</label><input type="text" name="state" onChange={handleChange} required /></div>
            <div className="form-group"><label>Zip / Postal Code</label><input type="text" name="zipCode" onChange={handleChange} required /></div>
            <div className="form-group"><label>Country</label><input type="text" name="country" onChange={handleChange} required /></div>
            <button type="submit">Save Address</button>
        </form>
    );
};

const UpgradeForm = ({ onSuccess }) => {
    const [companyName, setCompanyName] = useState('');
    const [address, setAddress] = useState({ street: '', city: '', state: '', zipCode: '', country: '' });
    const { token } = useAuth();
    const { addToast } = useToast();

    const handleAddressChange = (e) => setAddress({ ...address, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await upgradeToProvider({ companyName, address }, token);
            if (onSuccess) onSuccess();
        } catch (err) {
            addToast(`Upgrade failed: ${err.message}`, "error");
        }
    };

    return (
        <form onSubmit={handleSubmit} className="profile-form" style={{ marginTop: '1.5rem', borderTop: '1px solid #555', paddingTop: '1.5rem' }}>
            <div className="form-group">
                <label htmlFor="companyName">Company Name</label>
                <input type="text" id="companyName" value={companyName} onChange={(e) => setCompanyName(e.target.value)} required />
            </div>
            <h4>Business Address</h4>
            <div className="form-group"><label>Street</label><input type="text" name="street" onChange={handleAddressChange} required /></div>
            <div className="form-group"><label>City</label><input type="text" name="city" onChange={handleAddressChange} required /></div>
            <div className="form-group"><label>State / Province</label><input type="text" name="state" onChange={handleAddressChange} required /></div>
            <div className="form-group"><label>Zip / Postal Code</label><input type="text" name="zipCode" onChange={handleAddressChange} required /></div>
            <div className="form-group"><label>Country</label><input type="text" name="country" onChange={handleAddressChange} required /></div>
            <button type="submit">Submit for Upgrade</button>
        </form>
    );
};

const DeleteAccountModal = ({ onClose, onConfirm }) => {
    const [password, setPassword] = useState('');
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <h3>Confirm Account Deletion</h3>
                <p>This action is irreversible. To confirm, please enter your password.</p>
                <form onSubmit={(e) => { e.preventDefault(); onConfirm(password); }} className="profile-form">
                    <div className="form-group">
                        <label htmlFor="delete-confirm-password">Password</label>
                        <input
                            type="password"
                            id="delete-confirm-password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button type="submit">Permanently Delete Account</button>
                    <button type="button" onClick={onClose} style={{ backgroundColor: '#555', marginLeft: '1rem' }}>Cancel</button>
                </form>
            </div>
        </div>
    );
};

export default ProfilePage;