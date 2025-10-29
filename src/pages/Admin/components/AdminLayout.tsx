import React from 'react';
import { useNavigate } from 'react-router-dom';

interface AdminLayoutProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  backPath?: string;
}

export function AdminLayout({
  title,
  subtitle,
  children,
  actions,
  backPath = '/admin'
}: AdminLayoutProps) {
  const navigate = useNavigate();

  return (
    <div className="admin-page-container">
      <div className="admin-page-header">
        <div className="header-left">
          <button
            className="back-btn"
            onClick={() => navigate(backPath)}
          >
            ← 뒤로
          </button>
          <div className="header-title-group">
            <h1 className="page-title">{title}</h1>
            {subtitle && <p className="page-subtitle">{subtitle}</p>}
          </div>
        </div>
        {actions && <div className="header-actions">{actions}</div>}
      </div>

      <div className="admin-page-content">
        {children}
      </div>
    </div>
  );
}
