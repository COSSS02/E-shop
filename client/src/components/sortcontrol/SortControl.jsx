import React from 'react';
import './SortControl.css';

function SortControl({ currentSort, onSortChange }) {
    return (
        <div className="sort-controls">
            <label htmlFor="sort-select">Sort by:</label>
            <select id="sort-select" value={currentSort} onChange={onSortChange}>
                <option value="created_at-desc">Newest</option>
                <option value="name-asc">Alphabetical (A-Z)</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="stock_quantity-asc">Stock: Low to High</option>
                <option value="stock_quantity-desc">Stock: High to Low</option>
            </select>
        </div>
    );
}

export default SortControl;