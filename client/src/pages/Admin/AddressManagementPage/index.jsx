import React, { useEffect, useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useToast } from '../../../contexts/ToastContext';
import { getAllAddresses, updateAddressAsAdmin, deleteAddressAsAdmin } from '../../../api/address';
import './style.css';

function AdminAddressManagementPage() {
    const { token } = useAuth();
    const { addToast } = useToast();
    const [addresses, setAddresses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(null);
    const [filterRole, setFilterRole] = useState('all');
    const [searchTerm, setSearchTerm] = useState(''); // Debounced search term
    const [inputValue, setInputValue] = useState(''); // Immediate input value

    const load = async () => {
        try {
            setLoading(true);
            const data = await getAllAddresses(token);
            setAddresses(data);
        } catch (e) {
            addToast(e.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, [token]);

    // Debouncing effect
    useEffect(() => {
        const timer = setTimeout(() => {
            setSearchTerm(inputValue);
        }, 500); // 500ms delay

        return () => {
            clearTimeout(timer);
        };
    }, [inputValue]);

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this address?')) return;
        try {
            await deleteAddressAsAdmin(id, token);
            addToast('Address deleted', 'success');
            load();
        } catch (e) {
            addToast(e.message, 'error');
        }
    };

    const handleUpdate = async (formData) => {
        try {
            await updateAddressAsAdmin(editing.id, formData, token);
            addToast('Address updated', 'success');
            setEditing(null);
            load();
        } catch (e) {
            addToast(e.message, 'error');
        }
    };

    const filtered = addresses.filter(a => {
        const roleOk = filterRole === 'all' || a.role === filterRole;
        const term = searchTerm.trim().toLowerCase();
        const match = !term || [a.street, a.city, a.email, a.first_name, a.last_name].some(v => (v || '').toLowerCase().includes(term));
        return roleOk && match;
    });

    if (loading) return <div className="admin-address-container"><p>Loading addresses...</p></div>;

    return (
        <div className="admin-address-container">
            <h1>Address Management</h1>

            <div className="toolbar">
                <input
                    type="text"
                    placeholder="Search (street, city, user, email)..."
                    value={inputValue}
                    onChange={e => setInputValue(e.target.value)}
                />
                <select value={filterRole} onChange={e => setFilterRole(e.target.value)}>
                    <option value="all">All Roles</option>
                    <option value="client">Clients</option>
                    <option value="provider">Providers</option>
                    <option value="admin">Admins</option>
                </select>
            </div>

            <div className="admin-table-container">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>User</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>Type</th>
                            <th>Street</th>
                            <th>City</th>
                            <th>State</th>
                            <th>Zip</th>
                            <th>Country</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map(addr => (
                            <tr key={addr.id}>
                                <td>{addr.id}</td>
                                <td>{addr.first_name} {addr.last_name}</td>
                                <td>{addr.email}</td>
                                <td><span className={`role-badge role-${addr.role}`}>{addr.role}</span></td>
                                <td>{addr.address_type}</td>
                                <td>{addr.street}</td>
                                <td>{addr.city}</td>
                                <td>{addr.state}</td>
                                <td>{addr.zip_code}</td>
                                <td>{addr.country}</td>
                                <td className="actions-cell">
                                    <button className="action-btn edit-btn" onClick={() => setEditing(addr)}>Edit</button>
                                    <button className="action-btn delete-btn" onClick={() => handleDelete(addr.id)}>Delete</button>
                                </td>
                            </tr>
                        ))}
                        {filtered.length === 0 && (
                            <tr>
                                <td colSpan="11" style={{ textAlign: 'center', padding: '1rem' }}>No addresses match filters.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {editing && (
                <EditAddressModal
                    address={editing}
                    onClose={() => setEditing(null)}
                    onSave={handleUpdate}
                />
            )}
        </div>
    );
}

// The EditAddressModal component remains unchanged
const EditAddressModal = ({ address, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        addressType: address.address_type,
        street: address.street,
        city: address.city,
        state: address.state,
        zipCode: address.zip_code,
        country: address.country
    });

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
    const submit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <h2>Edit Address #{address.id}</h2>
                <form onSubmit={submit} className="modal-form">
                    <div className="form-group">
                        <label>Type</label>
                        <select name="addressType" value={formData.addressType} onChange={handleChange}>
                            <option value="shipping">shipping</option>
                            <option value="billing">billing</option>
                            <option value="provider">provider</option>
                        </select>
                    </div>
                    <div className="form-group"><label>Street</label><input name="street" value={formData.street} onChange={handleChange} /></div>
                    <div className="form-group"><label>City</label><input name="city" value={formData.city} onChange={handleChange} /></div>
                    <div className="form-group"><label>State</label><input name="state" value={formData.state} onChange={handleChange} /></div>
                    <div className="form-group"><label>Zip</label><input name="zipCode" value={formData.zipCode} onChange={handleChange} /></div>
                    <div className="form-group"><label>Country</label><input name="country" value={formData.country} onChange={handleChange} /></div>
                    <div className="modal-actions">
                        <button type="submit" className="action-btn edit-btn">Save</button>
                        <button type="button" onClick={onClose} className="action-btn cancel-btn">Cancel</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AdminAddressManagementPage;