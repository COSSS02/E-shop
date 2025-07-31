import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getAllProducts } from '../../api/products';
import ProductList from '../../components/products/ProductList';
import './style.css';

function HomePage() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [pagination, setPagination] = useState(null);

    const [searchParams, setSearchParams] = useSearchParams();
    const currentPage = parseInt(searchParams.get('page') || '1', 10);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                setLoading(true);
                const data = await getAllProducts(currentPage);
                setProducts(data.products);
                setPagination(data.pagination);
            } catch (err) {
                setError("Failed to load products. Please try again later.");
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
        // Scroll to top when page changes
        window.scrollTo(0, 0);
    }, [currentPage]);

    const handleNextPage = () => {
        if (currentPage < pagination.totalPages) {
            setSearchParams({ page: currentPage + 1 });
        }
    };

    const handlePrevPage = () => {
        if (currentPage > 1) {
            setSearchParams({ page: currentPage - 1 });
        }
    };

    return (
        <div>
            <h1 className='home-page-title'>Featured Products</h1>
            <p className='home-page-description'>Explore our latest products below</p>

            {loading && <p>Loading products...</p>}
            {error && <p style={{ color: 'red' }}>{error}</p>}
            {!loading && !error && (
                <>
                    <ProductList products={products} />
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

export default HomePage;