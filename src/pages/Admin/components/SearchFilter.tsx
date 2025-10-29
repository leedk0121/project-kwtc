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
    <div className="search-filter-container">
      <div className="search-box">
        <input
          type="text"
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="search-input"
        />
      </div>

      <div className="filter-buttons">
        {filterOptions.map((option) => (
          <button
            key={option.value}
            className={`filter-btn ${filterType === option.value ? 'active' : ''}`}
            onClick={() => onFilterChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
