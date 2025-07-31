import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { searchProducts } from '../../api/products';
import ProductList from '../../components/products/ProductList';
import './style.css';

function SearchPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const query = searchParams.get('q');
    const currentPage = parseInt(searchParams.get('page') || '1', 10);

    const [products, setProducts] = useState([]);
    const [pagination, setPagination] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!query) {
            setProducts([]);
            setLoading(false);
            return;
        }

        const fetchSearchResults = async () => {
            try {
                setLoading(true);
                setError(null);
                const data = await searchProducts(query, currentPage);
                setProducts(data.products);
                setPagination(data.pagination);
            } catch (err) {
                setError(`Failed to search for "${query}".`);
            } finally {
                setLoading(false);
            }
        };

        fetchSearchResults();
        window.scrollTo(0, 0);
    }, [query, currentPage]);

    const handlePageChange = (newPage) => {
        setSearchParams({ q: query, page: newPage });
    };

    return (
        <div className="search-page-container">
            <h1>Search Results for "{query}"</h1>

            {loading && <p>Searching...</p>}
            {error && <p className="error-message">{error}</p>}
            {!loading && !error && (
                <>
                    {products.length > 0
                        ? <ProductList products={products} />
                        : <p>No products found matching your search.</p>
                    }
                    {pagination && pagination.totalPages > 1 && (
                        <div className="pagination-controls">
                            <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>
                                &laquo; Previous
                            </button>
                            <span>
                                Page {pagination.currentPage} of {pagination.totalPages}
                            </span>
                            <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === pagination.totalPages}>
                                Next &raquo;
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

export default SearchPage;