import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { useToast } from '../../../contexts/ToastContext';
import { getAllProducts, deleteProduct } from '../../../api/products';
import Pagination from '../../../components/pagination/Pagination';
import SortControl from '../../../components/sortcontrol/SortControl';
import './style.css';

function AdminProductManagementPage() {
    const [products, setProducts] = useState([]);
    const [pagination, setPagination] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { token } = useAuth();
    const { addToast } = useToast();
    const [searchParams, setSearchParams] = useSearchParams();

    const { currentPage, currentSort, currentSearch } = useMemo(() => ({
        currentPage: parseInt(searchParams.get('page') || '1', 10),
        currentSort: searchParams.get('sort') || 'name-asc',
        currentSearch: searchParams.get('q') || ''
    }), [searchParams]);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const data = await getAllProducts(currentPage, currentSort, currentSearch);
            setProducts(data.products);
            setPagination(data.pagination);
        } catch (err) {
            setError("Failed to load products.");
            addToast("Failed to load products.", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, [currentPage, currentSort, currentSearch]);

    const handleDelete = async (productId, productName) => {
        if (window.confirm(`Are you sure you want to delete "${productName}"? This action is permanent.`)) {
            try {
                await deleteProduct(productId, token);
                addToast("Product deleted successfully.", "success");
                fetchProducts(); // Refresh the list
            } catch (err) {
                addToast(`Failed to delete product: ${err.message}`, "error");
            }
        }
    };

    const handlePageChange = (newPage) => setSearchParams({ sort: currentSort, page: newPage });
    const handleSortChange = (e) => setSearchParams({ sort: e.target.value, page: 1 });
    const handleSearchChange = (e) => {
        // This could be debounced in a real app for performance
        setSearchParams({ q: e.target.value, sort: currentSort, page: 1 });
    };

    if (error) return <div className="admin-product-container"><p className="error-message">{error}</p></div>;

    return (
        <div className="admin-product-container">
                <h1>Product Management</h1>
                <div className="toolbar">
                    <input
                        type="text"
                        placeholder="Search products, categories, providers..."
                        value={currentSearch}
                        onChange={handleSearchChange}
                        className="search-input"
                    />
                    <SortControl currentSort={currentSort} onSortChange={handleSortChange} />
                </div>

            {loading ? <p>Loading products...</p> : (
                <>
                    <div className="admin-table-container">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Product Name</th>
                                    <th>Category</th>
                                    <th>Provider</th>
                                    <th>Price</th>
                                    <th>Stock</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {products.map(product => (
                                    <tr key={product.id}>
                                        <td>{product.id}</td>
                                        <td>{product.name}</td>
                                        <td>{product.category_name}</td>
                                        <td>{product.provider_company_name || `${product.provider_first_name} ${product.provider_last_name}`}</td>
                                        <td>${Number(product.price).toFixed(2)}</td>
                                        <td>{product.stock_quantity}</td>
                                        <td className="actions-cell">
                                            <Link to={`/provider/edit-product/${product.id}`} className="action-btn edit-btn">Edit</Link>
                                            <button onClick={() => handleDelete(product.id, product.name)} className="action-btn delete-btn">Delete</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
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

export default AdminProductManagementPage;