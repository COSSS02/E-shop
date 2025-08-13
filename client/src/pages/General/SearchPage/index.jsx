import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { searchProducts } from '../../../api/products';
import ProductList from '../../../components/products/ProductList';
import Pagination from '../../../components/pagination/Pagination';
import SortControl from '../../../components/sortcontrol/SortControl';
import './style.css';

function SearchPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const query = searchParams.get('q');
    const currentPage = parseInt(searchParams.get('page') || '1', 10);
    const currentSort = searchParams.get('sort') || 'name-asc';

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
                const data = await searchProducts(query, currentPage, currentSort);

                // Validate the page number after fetching
                const { totalPages } = data.pagination;
                if (totalPages > 0 && currentPage > totalPages) {
                    // Preserve the query and sort when redirecting to the last page
                    setSearchParams({ q: query, sort: currentSort, page: totalPages });
                    return;
                }

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
    }, [query, currentPage, currentSort, setSearchParams]);

    const handlePageChange = (newPage) => {
        setSearchParams({ q: query, sort: currentSort, page: newPage });
    };

    const handleSortChange = (e) => {
        setSearchParams({ q: query, sort: e.target.value, page: 1 });
    };

    return (
        <div className="search-page-container">
            <h1>Search Results for "{query}"</h1>
            <SortControl currentSort={currentSort} onSortChange={handleSortChange} />

            {loading && <p>Searching...</p>}
            {error && <p className="error-message">{error}</p>}
            {!loading && !error && (
                <>
                    {products.length > 0
                        ? <ProductList products={products} />
                        : <p>No products found matching your search.</p>
                    }
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

export default SearchPage;