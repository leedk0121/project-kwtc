import React from 'react';
import { FilterType } from '../types';

interface SearchFilterProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  filterType: FilterType;
  onFilterChange: (value: FilterType) => void;
  filterOptions: { value: FilterType; label: string }[];
  placeholder?: string;
}

export function SearchFilter({
  searchTerm,
  onSearchChange,
  filterType,
  onFilterChange,
  filterOptions,
  placeholder = '이름, 이메일, 학과, 학번으로 검색...'
}: SearchFilterProps) {
  return (
    <div className="admin-search-filter-container">
      <div className="admin-search-box">
        <input
          type="text"
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="admin-search-input"
        />
      </div>

      <div className="admin-filter-buttons">
        {filterOptions.map((option) => (
          <button
            key={option.value}
            className={`admin-filter-btn ${filterType === option.value ? 'active' : ''}`}
            onClick={() => onFilterChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
