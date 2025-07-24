import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { searchProducts } from '../../api/products';
import ProductList from '../../components/products/ProductList';
import './style.css';

function SearchPage() {
    const [searchParams] = useSearchParams();
    const query = searchParams.get('q');
    const [products, setProducts] = useState([]);
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
                const data = await searchProducts(query);
                setProducts(data);
            } catch (err) {
                setError(`Failed to search for "${query}".`);
            } finally {
                setLoading(false);
            }
        };

        fetchSearchResults();
    }, [query]);

    return (
        <div className="search-page-container">
            <h1>Search Results for "{query}"</h1>

            {loading && <p>Searching...</p>}
            {error && <p className="error-message">{error}</p>}
            {!loading && !error && (
                products.length > 0
                    ? <ProductList products={products} />
                    : <p>No products found matching your search.</p>
            )}
        </div>
    );
}

export default SearchPage;