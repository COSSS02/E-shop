import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { getProductById, updateProduct } from '../../../api/products';
import { getAllCategories } from '../../../api/categories';
import { getAttributesByCategoryId } from '../../../api/attributes';
// Reuse the same CSS as the AddProductPage
import '../AddProductPage/style.css';

function EditProductPage() {
    const { productId } = useParams();
    const navigate = useNavigate();
    const { user, token } = useAuth();

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
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    // Fetch all data needed for the form on initial load
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [productData, allCategories] = await Promise.all([
                    getProductById(productId),
                    getAllCategories()
                ]);

                // Security check: Does the logged-in user own this product?
                if (user && user.role !== 'admin' && productData.provider_id !== user.id) {
                    setError("You are not authorized to edit this product.");
                    return;
                }

                // Pre-populate the form state
                setName(productData.name);
                setDescription(productData.description);
                setPrice(productData.price);
                setStockQuantity(productData.stock_quantity);
                setCategoryId(productData.category_id);
                setAttributes(productData.attributes.map(attr => ({ attributeName: attr.name, value: attr.value })));
                setCategories(allCategories);

            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        if (user) { // Only fetch if the user is loaded
            fetchData();
        }
    }, [productId, user]);

    // Fetch attribute suggestions when the category changes
    useEffect(() => {
        if (categoryId) {
            getAttributesByCategoryId(categoryId, token)
                .then(setCategoryAttributes)
                .catch(() => console.error("Could not load attribute suggestions."));
        }
    }, [categoryId, token]);


    const handleAttributeChange = (index, event) => {
        const newAttributes = [...attributes];
        newAttributes[index][event.target.name] = event.target.value;
        setAttributes(newAttributes);
    };

    const addAttribute = () => setAttributes([...attributes, { attributeName: '', value: '' }]);
    const removeAttribute = (index) => setAttributes(attributes.filter((_, i) => i !== index));

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
            await updateProduct(productId, productPayload, token);
            setSuccess(`Product updated successfully!`);
            setTimeout(() => navigate(`/products/${productId}`), 2000);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="add-product-container"><p>Loading product data...</p></div>;

    return (
        <div className="add-product-container">
            <form className="add-product-form" onSubmit={handleSubmit}>
                <h2>Edit Product</h2>
                {error && <p className="error-message">{error}</p>}
                {success && <p className="success-message">{success}</p>}

                {/* The form is identical to AddProductPage, so we can reuse the JSX */}
                {!error && (
                    <>
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
                                        autoComplete="off"
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
                                    />
                                    <button type="button" className="remove-btn" onClick={() => removeAttribute(index)}>&times;</button>
                                </div>
                            ))}
                            <button type="button" className="add-btn" onClick={addAttribute}>+ Add Specification</button>
                        </fieldset>

                        <button type="submit" className="submit-button" disabled={loading}>
                            {loading ? 'Saving...' : 'Save Changes'}
                        </button>
                    </>
                )}
            </form>
        </div>
    );
}

export default EditProductPage;