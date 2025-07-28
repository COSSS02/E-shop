import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { createCategory } from '../../api/categories';
import './style.css';

function AddCategoryPage() {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [loading, setLoading] = useState(false);
    const { token } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const result = await createCategory({ name, description }, token);
            setSuccess(result.message);
            setName('');
            setDescription('');
            // Optional: Redirect after a short delay
            setTimeout(() => navigate('/'), 2000);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="add-category-container">
            <form className="add-category-form" onSubmit={handleSubmit}>
                <h2>Create New Category</h2>
                <p className="form-description">Add a new product category to the store.</p>

                {error && <p className="error-message">{error}</p>}
                {success && <p className="success-message">{success}</p>}

                <div className="form-group">
                    <label htmlFor="name">Category Name</label>
                    <input
                        type="text"
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="description">Category Description</label>
                    <textarea
                        id="description"
                        rows="4"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    ></textarea>
                </div>
                <button type="submit" className="submit-button" disabled={loading}>
                    {loading ? 'Creating...' : 'Create Category'}
                </button>
            </form>
        </div>
    );
}

export default AddCategoryPage;