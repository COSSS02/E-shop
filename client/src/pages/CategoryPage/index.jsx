import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getProductsByCategory } from '../../api/products';
import ProductList from '../../components/products/ProductList';
import './style.css';

function CategoryPage() {
    const { categoryName } = useParams();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                setLoading(true);
                const data = await getProductsByCategory(categoryName);
                setProducts(data);
            } catch (err) {
                setError(`Failed to load products for ${categoryName}.`);
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, [categoryName]);

    return (
        <div className="category-page-container">
            <h1>{categoryName}</h1>

            {loading && <p>Loading products...</p>}
            {error && <p className="error-message">{error}</p>}
            {!loading && !error && (
                products.length > 0
                    ? <ProductList products={products} />
                    : <p>No products found in this category.</p>
            )}
        </div>
    );
}

export default CategoryPage;