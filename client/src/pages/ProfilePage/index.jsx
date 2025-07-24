import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getMyAddresses, createAddress } from '../../api/address';
import { upgradeToProvider } from '../../api/auth';
import './style.css';

function ProfilePage() {
    const { user, token, logout } = useAuth();
    const [addresses, setAddresses] = useState([]);
    const [showProviderForm, setShowProviderForm] = useState(false);
    const [error, setError] = useState('');
    const [showShippingAddressForm, setShowShippingAddressForm] = useState(false);
    const [showBillingAddressForm, setShowBillingAddressForm] = useState(false);

    const fetchAddresses = async () => {
        try {
            const data = await getMyAddresses(token);
            setAddresses(data);
        } catch (err) {
            setError('Could not load addresses.');
        }
    };

    useEffect(() => {
        if (token) {
            fetchAddresses();
        }
    }, [token]);

    const handleAddressSubmit = async (addressData) => {
        try {
            await createAddress(addressData, token);
            // Fix: Use camelCase 'addressType' to match the object property
            if (addressData.addressType === 'shipping') {
                setShowShippingAddressForm(false);
            } else {
                setShowBillingAddressForm(false);
            }
            fetchAddresses(); // Refresh the list
        } catch (err) {
            setError(err.message);
        }
    };

    const handleProviderSubmit = async (providerData) => {
        try {
            const result = await upgradeToProvider(providerData, token);
            alert(result.message); // Show success message
            logout(); // Log the user out so they can log back in with their new role
        } catch (err) {
            setError(err.message);
        }
    };

    if (!user) return <div>Loading profile...</div>;

    const shippingAddresses = addresses.filter(a => a.address_type === 'shipping');
    const billingAddresses = addresses.filter(a => a.address_type === 'billing');
    const providerAddress = addresses.find(a => a.address_type === 'provider');

    return (
        <div className="profile-container">
            <h1>My Profile</h1>
            <div className="profile-card user-info">
                <h3>{user.firstName} {user.lastName}</h3>
                <p>{user.email}</p>
                <span className="user-role">{user.role}</span>
            </div>

            {user.role === 'provider' && (
                <div className="profile-card">
                    <h2>Provider Information</h2>
                    <div className="provider-details">
                        <h4>Company Name</h4>
                        <p>{user.companyName}</p>
                        <h4>Business Address</h4>
                        {providerAddress ? <AddressDisplay address={providerAddress} /> : <p>No business address found.</p>}
                    </div>
                </div>
            )}

            <div className="profile-card">
                <h3>Shipping Addresses</h3>
                {shippingAddresses.length > 0 ? (
                    shippingAddresses.map(addr => <AddressDisplay key={addr.id} address={addr} />)
                ) : <p>No shipping addresses found.</p>}
                <button onClick={() => setShowShippingAddressForm(!showShippingAddressForm)}>Add New Address</button>
                {showShippingAddressForm && <AddressForm onSubmit={(data) => handleAddressSubmit({ ...data, addressType: 'shipping' })} />}
            </div>

            <div className="profile-card">
                <h3>Billing Addresses</h3>
                {billingAddresses.length > 0 ? (
                    billingAddresses.map(addr => <AddressDisplay key={addr.id} address={addr} />)
                ) : <p>No billing addresses found.</p>}
                <button onClick={() => setShowBillingAddressForm(!showBillingAddressForm)}>Add New Address</button>
                {showBillingAddressForm && <AddressForm onSubmit={(data) => handleAddressSubmit({ ...data, addressType: 'billing' })} />}
            </div>

            {user.role === 'client' && (
                <div className="profile-card">
                    <h3>Become a Provider</h3>
                    <p>Register your business to start selling products on our platform.</p>
                    <button onClick={() => setShowProviderForm(!showProviderForm)}>Register as Provider</button>
                    {showProviderForm && <ProviderForm onSubmit={handleProviderSubmit} />}
                </div>
            )}
            {error && <p className="error-message">{error}</p>}
        </div>
    );
}

// --- Sub-components for Forms and Display ---

const AddressDisplay = ({ address }) => (
    <div className="address-display">
        <p className="address-line">{address.street}</p>
        <p className="address-line">{address.city}, {address.state} {address.zip_code}</p>
        <p className="address-line">{address.country}</p>
    </div>
);

const AddressForm = ({ onSubmit }) => {
    // Fix: Use zipCode to match the backend API
    const [address, setAddress] = useState({ street: '', city: '', state: '', zipCode: '', country: '' });
    const handleChange = e => setAddress({ ...address, [e.target.name]: e.target.value });
    return (
        <form onSubmit={(e) => { e.preventDefault(); onSubmit(address); }} className="sub-form">
            <input name="street" placeholder="Street" onChange={handleChange} required />
            <input name="city" placeholder="City" onChange={handleChange} required />
            <input name="state" placeholder="State" onChange={handleChange} required />
            {/* Fix: Use zipCode to match the backend API */}
            <input name="zipCode" placeholder="Zip Code" onChange={handleChange} required />
            <input name="country" placeholder="Country" onChange={handleChange} required />
            <button type="submit">Save Address</button>
        </form>
    );
};

const ProviderForm = ({ onSubmit }) => {
    const [companyName, setCompanyName] = useState('');
    // Fix: Use zipCode to match the backend API
    const [address, setAddress] = useState({ street: '', city: '', state: '', zipCode: '', country: '' });
    const handleAddressChange = e => setAddress({ ...address, [e.target.name]: e.target.value });

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit({ companyName, address });
    };

    return (
        <form onSubmit={handleSubmit} className="sub-form">
            <h4>Company Details</h4>
            <input name="companyName" placeholder="Company Name" onChange={(e) => setCompanyName(e.target.value)} required />
            <h4>Business Address</h4>
            <input name="street" placeholder="Street" onChange={handleAddressChange} required />
            <input name="city" placeholder="City" onChange={handleAddressChange} required />
            <input name="state" placeholder="State" onChange={handleAddressChange} required />
            <input name="zipCode" placeholder="Zip Code" onChange={handleAddressChange} required />
            <input name="country" placeholder="Country" onChange={handleAddressChange} required />
            <button type="submit">Submit Application</button>
        </form>
    );
};

export default ProfilePage;