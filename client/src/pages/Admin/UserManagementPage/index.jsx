import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useToast } from '../../../contexts/ToastContext';
import { getAllUsers, deleteUserAsAdmin, updateUserAsAdmin } from '../../../api/user';
import './style.css';

function AdminUserManagementPage() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingUser, setEditingUser] = useState(null);
    const [filterRole, setFilterRole] = useState('all');
    const [searchTerm, setSearchTerm] = useState(''); // Debounced search term
    const [inputValue, setInputValue] = useState(''); // Immediate input value
    const { token } = useAuth();
    const { addToast } = useToast();

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const data = await getAllUsers(token); // Fetches all users
            setUsers(data.users || data); // Adjust based on what your API returns
        } catch (error) {
            addToast(error.message, "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, [token]);

    // Debouncing effect
    useEffect(() => {
        const timer = setTimeout(() => {
            setSearchTerm(inputValue);
        }, 500); // 500ms delay

        return () => {
            clearTimeout(timer);
        };
    }, [inputValue]);

    const handleUpdate = async (updatedUserData) => {
        try {
            await updateUserAsAdmin(editingUser.id, updatedUserData, token);
            addToast("User updated successfully.", "success");
            setEditingUser(null);
            fetchUsers();
        } catch (error) {
            addToast(error.message, "error");
        }
    };

    const handleDelete = async (userId) => {
        if (window.confirm("Are you sure you want to permanently delete this user?")) {
            try {
                await deleteUserAsAdmin(userId, token);
                addToast("User deleted successfully.", "success");
                fetchUsers();
            } catch (error) {
                addToast(error.message, "error");
            }
        }
    };

    if (loading) return <div className="admin-page-container"><p>Loading users...</p></div>;

    const filteredUsers = users.filter(user => {
        const roleOk = filterRole === 'all' || user.role === filterRole;
        const term = searchTerm.trim().toLowerCase();
        const fullName = `${user.first_name} ${user.last_name}`.toLowerCase();
        const match = !term ||
            fullName.includes(term) ||
            user.email.toLowerCase().includes(term) ||
            (user.company_name || '').toLowerCase().includes(term);
        return roleOk && match;
    });

    return (
        <div className="admin-page-container">
            <h1>User Management</h1>
            <div className="toolbar">
                <input
                    type="text"
                    placeholder="Search by name, email, company..."
                    value={inputValue}
                    onChange={e => setInputValue(e.target.value)}
                />
                <select value={filterRole} onChange={e => setFilterRole(e.target.value)}>
                    <option value="all">All Roles</option>
                    <option value="client">Client</option>
                    <option value="provider">Provider</option>
                    <option value="admin">Admin</option>
                </select>
            </div>
            <div className="admin-table-container">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>Company</th>
                            <th>Joined</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredUsers.map(user => (
                            <tr key={user.id}>
                                <td>{user.id}</td>
                                <td>{user.first_name} {user.last_name}</td>
                                <td>{user.email}</td>
                                <td><span className={`role-badge role-${user.role}`}>{user.role}</span></td>
                                <td>{user.company_name || 'N/A'}</td>
                                <td>{new Date(user.created_at).toLocaleDateString()}</td>
                                <td className="actions-cell">
                                    <button onClick={() => setEditingUser(user)} className="action-btn edit-btn">Edit</button>
                                    <button onClick={() => handleDelete(user.id)} className="action-btn delete-btn">Delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {editingUser && (
                <EditUserModal
                    user={editingUser}
                    onClose={() => setEditingUser(null)}
                    onSave={handleUpdate}
                />
            )}
        </div>
    );
}

// The EditUserModal component remains unchanged
const EditUserModal = ({ user, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        role: user.role,
        companyName: user.company_name || ''
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <h2>Edit User: {user.first_name} {user.last_name}</h2>
                <form onSubmit={handleSubmit} className="modal-form">
                    <div className="form-group">
                        <label>First Name</label>
                        <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                        <label>Last Name</label>
                        <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                        <label>Email</label>
                        <input type="email" name="email" value={formData.email} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                        <label>Role</label>
                        <select name="role" value={formData.role} onChange={handleChange}>
                            <option value="client">Client</option>
                            <option value="provider">Provider</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>
                    {formData.role === 'provider' && (
                        <div className="form-group">
                            <label>Company Name</label>
                            <input type="text" name="companyName" value={formData.companyName} onChange={handleChange} />
                        </div>
                    )}
                    <div className="modal-actions">
                        <button type="submit" className="action-btn edit-btn">Save Changes</button>
                        <button type="button" onClick={onClose} className="action-btn cancel-btn">Cancel</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AdminUserManagementPage;