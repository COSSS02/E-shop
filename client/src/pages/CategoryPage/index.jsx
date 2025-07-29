import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getProductsByCategory } from '../../api/products';
import ProductList from '../../components/products/ProductList';
import './style.css';

function CategoryPage() {
    const { categoryName } = useParams();
    const [products, setProducts] = useState([]);
    const [category, setCategory] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [pagination, setPagination] = useState(null);

    useEffect(() => {
        // When the category name changes, reset the current page to 1
        setCurrentPage(1);
    }, [categoryName]);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                setLoading(true);
                const data = await getProductsByCategory(categoryName, currentPage);
                setProducts(data.products);
                setCategory(data.category);
                setPagination(data.pagination);
            } catch (err) {
                setError(`Failed to load products for ${categoryName}.`);
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
        window.scrollTo(0, 0);
    }, [categoryName, currentPage]);

    const handleNextPage = () => {
        if (currentPage < pagination.totalPages) {
            setCurrentPage(currentPage + 1);
        }
    };

    const handlePrevPage = () => {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1);
        }
    };

    return (
        <div className="category-page-container">
            <h1>{categoryName}</h1>
            {category && <p className="category-description">{category.description}</p>}

            {loading && <p>Loading products...</p>}
            {error && <p className="error-message">{error}</p>}
            {!loading && !error && (
                <>
                    {products.length > 0
                        ? <ProductList products={products} />
                        : <p>No products found in this category.</p>
                    }
                    {pagination && pagination.totalPages > 1 && (
                        <div className="pagination-controls">
                            <button onClick={handlePrevPage} disabled={currentPage === 1}>
                                &laquo; Previous
                            </button>
                            <span>
                                Page {pagination.currentPage} of {pagination.totalPages}
                            </span>
                            <button onClick={handleNextPage} disabled={currentPage === pagination.totalPages}>
                                Next &raquo;
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

export default CategoryPage;