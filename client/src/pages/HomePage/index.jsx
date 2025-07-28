import React, { useState, useEffect } from 'react';
import { getAllProducts } from '../../api/products';
import ProductList from '../../components/products/ProductList';
import './style.css';

function HomePage() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const data = await getAllProducts();
                setProducts(data);
            } catch (err) {
                setError('Failed to load products. Please try again later.');
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, []); // The empty array ensures this effect runs only once on mount

    return (
        <div>
            <h1 className='home-page-title'>Featured Products</h1>
            <p className='home-page-description'>Explore our latest products below</p>

            {loading && <p>Loading products...</p>}
            {error && <p style={{ color: 'red' }}>{error}</p>}
            {!loading && !error && <ProductList products={products} />}
        </div>
    );
}

export default HomePage;