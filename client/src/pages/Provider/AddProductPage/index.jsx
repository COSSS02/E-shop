import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { getAllCategories } from '../../../api/categories';
import { getAttributesByCategoryId } from '../../../api/attributes';
import { createProduct } from '../../../api/products';
import './style.css';

function AddProductPage() {
    // Form state
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('');
    const [stockQuantity, setStockQuantity] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [attributes, setAttributes] = useState([{ attributeName: '', value: '' }]);

    // Data and UI state
    const [categories, setCategories] = useState([]);
    const [categoryAttributes, setCategoryAttributes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    const { token } = useAuth();
    const navigate = useNavigate();

    // Fetch all categories on component mount
    useEffect(() => {
        getAllCategories()
            .then(setCategories)
            .catch(() => setError("Could not load categories."));
    }, []);

    // Fetch attributes when a category is selected
    useEffect(() => {
        if (categoryId) {
            getAttributesByCategoryId(categoryId, token)
                .then(data => {
                    // This is the correct place to log the fetched data
                    console.log("Fetched attributes for this category:", data);
                    setCategoryAttributes(data);
                })
                .catch(err => {
                    // This will show the actual error in the console if something goes wrong
                    console.error("Failed to fetch attributes:", err);
                    setError("Could not load attribute suggestions.");
                });
        } else {
            setCategoryAttributes([]);
        }
    }, [categoryId, token]);

    const handleAttributeChange = (index, event) => {
        const newAttributes = [...attributes];
        newAttributes[index][event.target.name] = event.target.value;
        setAttributes(newAttributes);
    };

    const addAttribute = () => {
        setAttributes([...attributes, { attributeName: '', value: '' }]);
    };

    const removeAttribute = (index) => {
        const newAttributes = attributes.filter((_, i) => i !== index);
        setAttributes(newAttributes);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);

        const productPayload = {
            productData: {
                category_id: parseInt(categoryId, 10),
                name,
                description,
                price: parseFloat(price),
                stock_quantity: parseInt(stockQuantity, 10)
            },
            attributesData: attributes.filter(attr => attr.attributeName && attr.value)
        };

        try {
            const result = await createProduct(productPayload, token);
            setSuccess(`Product "${name}" created successfully!`);
            setTimeout(() => navigate(`/products/${result.productId}`), 2000);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="add-product-container">
            <form className="add-product-form" onSubmit={handleSubmit}>
                <h2>Add a New Product</h2>
                <p className="form-description">Fill out the details to list a new item in the store.</p>

                {error && <p className="error-message">{error}</p>}
                {success && <p className="success-message">{success}</p>}

                <fieldset>
                    <legend>Core Information</legend>
                    <div className="form-group">
                        <label htmlFor="name">Product Name</label>
                        <input type="text" id="name" value={name} onChange={e => setName(e.target.value)} required />
                    </div>
                    <div className="form-group">
                        <label htmlFor="category">Category</label>
                        <select id="category" value={categoryId} onChange={e => setCategoryId(e.target.value)} required>
                            <option value="">-- Select a Category --</option>
                            {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                        </select>
                    </div>
                    <div className="form-group-row">
                        <div className="form-group">
                            <label htmlFor="price">Price ($)</label>
                            <input type="number" id="price" value={price} onChange={e => setPrice(e.target.value)} required min="0.01" step="0.01" />
                        </div>
                        <div className="form-group">
                            <label htmlFor="stock_quantity">Stock Quantity</label>
                            <input type="number" id="stock_quantity" value={stockQuantity} onChange={e => setStockQuantity(e.target.value)} required min="0" step="1" />
                        </div>
                    </div>
                    <div className="form-group">
                        <label htmlFor="description">Description (Optional)</label>
                        <textarea id="description" rows="4" value={description} onChange={e => setDescription(e.target.value)}></textarea>
                    </div>
                </fieldset>

                <fieldset>
                    <legend>Product Specifications</legend>
                    {attributes.map((attr, index) => (
                        <div key={index} className="attribute-row">
                            <input
                                type="text"
                                name="attributeName"
                                placeholder="Attribute (e.g., Color)"
                                value={attr.attributeName}
                                onChange={e => handleAttributeChange(index, e)}
                                list="attribute-suggestions"
                                disabled={!categoryId}
                                autoComplete='off'
                            />
                            <datalist id="attribute-suggestions">
                                {categoryAttributes.map(catAttr => <option key={catAttr.id} value={catAttr.name} />)}
                            </datalist>
                            <input
                                type="text"
                                name="value"
                                placeholder="Value (e.g., Red)"
                                value={attr.value}
                                onChange={e => handleAttributeChange(index, e)}
                                disabled={!categoryId}
                            />
                            <button type="button" className="remove-btn" onClick={() => removeAttribute(index)}>&times;</button>
                        </div>
                    ))}
                    <button type="button" className="add-btn" onClick={addAttribute} disabled={!categoryId}>
                        + Add Specification
                    </button>
                </fieldset>

                <button type="submit" className="submit-button" disabled={loading || !categoryId}>
                    {loading ? 'Submitting...' : 'Create Product'}
                </button>
            </form>
        </div>
    );
}

export default AddProductPage;