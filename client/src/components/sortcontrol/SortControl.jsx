import React from 'react';
import {useTranslation} from "react-i18next";
import './SortControl.css';

function SortControl({ currentSort, onSortChange }) {
    const { t } = useTranslation();
    return (
        <div className="sort-controls">
            <label htmlFor="sort-select">{t('sort_by')}</label>
            <select id="sort-select" value={currentSort} onChange={onSortChange}>
                <option value="created_at-desc">{t('newest')}</option>
                <option value="name-asc">{t('alphabetical')}</option>
                <option value="price-asc">{t('price_low_high')}</option>
                <option value="price-desc">{t('price_high_low')}</option>
                <option value="stock_quantity-asc">{t('stock_low_high')}</option>
                <option value="stock_quantity-desc">{t('stock_high_low')}</option>
            </select>
        </div>
    );
}

export default SortControl;