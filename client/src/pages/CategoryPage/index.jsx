import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { getProductsByCategory } from '../../api/products';
import { getCategoryFilters } from '../../api/attributes';
import ProductList from '../../components/products/ProductList';
import Pagination from '../../components/pagination/Pagination';
import SortControl from '../../components/sortcontrol/SortControl';
import './style.css';

function CategoryPage() {
    const { categoryName } = useParams();
    const [products, setProducts] = useState([]);
    const [category, setCategory] = useState(null);
    const [availableFilters, setAvailableFilters] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [pagination, setPagination] = useState(null);

    const [searchParams, setSearchParams] = useSearchParams();

    const { currentPage, currentSort, activeFilters } = useMemo(() => {
        const page = parseInt(searchParams.get('page') || '1', 10);
        const sort = searchParams.get('sort') || 'created_at-desc';
        const filters = {};
        for (const [key, value] of searchParams.entries()) {
            if (key !== 'page' && key !== 'sort') {
                filters[key] = value;
            }
        }
        return { currentPage: page, currentSort: sort, activeFilters: filters };
    }, [searchParams]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                // Fetch products and filters in parallel
                const [productData, filterData] = await Promise.all([
                    getProductsByCategory(categoryName, currentPage, currentSort, activeFilters),
                    getCategoryFilters(categoryName)
                ]);

                const { totalPages } = productData.pagination;
                if (totalPages > 0 && currentPage > totalPages) {
                    const newParams = new URLSearchParams({ ...activeFilters, sort: currentSort, page: totalPages });
                    setSearchParams(newParams);
                    return;
                }

                setProducts(productData.products);
                setCategory(productData.category);
                setPagination(productData.pagination);
                setAvailableFilters(filterData);
            } catch (err) {
                setError(`Failed to load products for ${categoryName}.`);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
        window.scrollTo(0, 0);
    }, [categoryName, currentPage, currentSort, activeFilters, setSearchParams]);

    const handleFilterChange = (filterName, value) => {
        const newParams = new URLSearchParams(searchParams);
        if (value) {
            newParams.set(filterName, value);
        } else {
            newParams.delete(filterName);
        }
        newParams.set('page', '1'); // Reset to first page on filter change
        setSearchParams(newParams);
    };

    const handleSortChange = (e) => {
        const newParams = new URLSearchParams(searchParams);
        newParams.set('sort', e.target.value);
        newParams.set('page', '1');
        setSearchParams(newParams);
    };

    const handlePageChange = (newPage) => {
        const newParams = new URLSearchParams(searchParams);
        newParams.set('page', newPage);
        setSearchParams(newParams);
    };

    return (
        <div className="category-page-container">
            <h1>{categoryName}</h1>
            {category && <p className="category-description">{category.description}</p>}
            <SortControl currentSort={currentSort} onSortChange={handleSortChange} />

            <aside className="filter-sidebar">
                <h3>Filters</h3>
                {availableFilters.map(filter => (
                    <div key={filter.attributeName} className="filter-group">
                        <label htmlFor={filter.attributeName}>{filter.attributeName}</label>
                        <select
                            id={filter.attributeName}
                            value={activeFilters[filter.attributeName] || ''}
                            onChange={(e) => handleFilterChange(filter.attributeName, e.target.value)}
                        >
                            <option value="">All</option>
                            {filter.attributeValues.map(val => <option key={val} value={val}>{val}</option>)}
                        </select>
                    </div>
                ))}
            </aside>

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