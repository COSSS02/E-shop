import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getAllProducts } from '../../api/products';
import ProductList from '../../components/products/ProductList';
import Pagination from '../../components/pagination/Pagination';
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

                // Validate the page number after fetching
                const { totalPages } = data.pagination;
                if (totalPages > 0 && currentPage > totalPages) {
                    // If page is too high, go to the last page
                    setSearchParams({ page: totalPages });
                    return; // Stop execution to avoid rendering with invalid data
                }

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

    const handlePageChange = (newPage) => {
        setSearchParams({ page: newPage });
    };

    return (
        <div>
            <h1 className='home-page-title'>Featured Products</h1>
            <p className='home-page-description'>Explore our products below</p>

            {loading && <p>Loading products...</p>}
            {error && <p style={{ color: 'red' }}>{error}</p>}
            {!loading && !error && (
                <>
                    <ProductList products={products} />
                    {/* 3. Replace the old div with the new component */}
                    {pagination && (
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

export default HomePage;