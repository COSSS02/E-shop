import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { getProductsByCategory } from '../../api/products';
import ProductList from '../../components/products/ProductList';
import Pagination from '../../components/pagination/Pagination';
import SortControl from '../../components/sortcontrol/SortControl';
import './style.css';

function CategoryPage() {
    const { categoryName } = useParams();
    const [products, setProducts] = useState([]);
    const [category, setCategory] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [pagination, setPagination] = useState(null);

    const [searchParams, setSearchParams] = useSearchParams();
    const currentPage = parseInt(searchParams.get('page') || '1', 10);
    const currentSort = searchParams.get('sort') || 'name-asc';

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                setLoading(true);
                const data = await getProductsByCategory(categoryName, currentPage, currentSort);

                const { totalPages } = data.pagination;
                if (totalPages > 0 && currentPage > totalPages) {
                    setSearchParams({ sort: currentSort, page: totalPages });
                    return;
                }

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
    }, [categoryName, currentPage, currentSort, setSearchParams]);

    const handlePageChange = (newPage) => {
        setSearchParams({ sort: currentSort, page: newPage });
    };

    const handleSortChange = (e) => {
        setSearchParams({ sort: e.target.value, page: 1 });
    };

    return (
        <div className="category-page-container">
            <h1>{categoryName}</h1>
            {category && <p className="category-description">{category.description}</p>}
            <SortControl currentSort={currentSort} onSortChange={handleSortChange} />

            {loading && <p>Loading products...</p>}
            {error && <p className="error-message">{error}</p>}
            {!loading && !error && (
                <>
                    {products.length > 0
                        ? <ProductList products={products} />
                        : <p>No products found in this category.</p>
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

export default CategoryPage;