import React from 'react';
import { AdminUser } from '../types';

interface Column<T> {
  header: string;
  accessor: keyof T | ((row: T) => React.ReactNode);
  width?: string;
  className?: string;
}

interface UserTableProps {
  users: AdminUser[];
  columns: Column<AdminUser>[];
  actions?: (user: AdminUser) => React.ReactNode;
  emptyMessage?: string;
  loading?: boolean;
  updatingId?: string | null;
}

export function UserTable({
  users,
  columns,
  actions,
  emptyMessage = '데이터가 없습니다.',
  loading = false,
  updatingId = null
}: UserTableProps) {
  if (loading) {
    return (
      <div className="table-loading">
        <div className="spinner"></div>
        <p>데이터를 불러오는 중...</p>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="table-empty">
        <p>{emptyMessage}</p>
      </div>
    );
  }

  const getCellValue = (user: AdminUser, column: Column<AdminUser>) => {
    if (typeof column.accessor === 'function') {
      return column.accessor(user);
    }
    return user[column.accessor];
  };

  return (
    <div className="user-table-wrapper">
      <table className="user-table">
        <thead>
          <tr>
            {columns.map((column, index) => (
              <th
                key={index}
                style={{ width: column.width }}
                className={column.className}
              >
                {column.header}
              </th>
            ))}
            {actions && <th className="actions-header">작업</th>}
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr
              key={user.id}
              className={updatingId === user.id ? 'updating' : ''}
            >
              {columns.map((column, index) => (
                <td
                  key={index}
                  className={column.className}
                >
                  {getCellValue(user, column)}
                </td>
              ))}
              {actions && (
                <td className="actions-cell">
                  {updatingId === user.id ? (
                    <div className="action-spinner"></div>
                  ) : (
                    actions(user)
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
