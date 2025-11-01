import { useState, useMemo } from 'react';
import { withAdminAuth } from '../../services/adminHOC';
import { AdminLayout } from './components/AdminLayout';
import { SearchFilter } from './components/SearchFilter';
import { UserTable } from './components/UserTable';
import { useAdminUsers } from './hooks/useAdminUsers';
import { AdminUser, FilterType } from './types';
import '../Admin/styles/admin-shared.css';

function AdminRoleManager() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');

  const {
    users,
    loading,
    updating,
    toggleAdminRole,
    getStats
  } = useAdminUsers({ filterApproved: true });

  const stats = getStats();

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        user.name.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower) ||
        user.major.toLowerCase().includes(searchLower) ||
        String(user.stnum).includes(searchTerm);

      const matchesFilter =
        filterType === 'all' ||
        (filterType === 'admin' && user.is_admin) ||
        (filterType === 'user' && !user.is_admin);

      return matchesSearch && matchesFilter;
    });
  }, [users, searchTerm, filterType]);

  const handleToggleAdmin = async (user: AdminUser) => {
    const confirmMessage = user.is_admin
      ? `${user.name}님의 관리자 권한을 제거하시겠습니까?`
      : `${user.name}님을 관리자로 지정하시겠습니까?`;

    if (!window.confirm(confirmMessage)) return;

    const result = await toggleAdminRole(user.id, user.is_admin);

    if (result.success) {
      alert(result.message);
    } else {
      alert(`실패: ${result.message}`);
    }
  };

  const filterOptions = [
    { value: 'all' as FilterType, label: `전체 (${stats.total})` },
    { value: 'admin' as FilterType, label: `관리자 (${stats.admins})` },
    { value: 'user' as FilterType, label: `일반 사용자 (${stats.users})` }
  ];

  const columns = [
    {
      header: '이름',
      accessor: 'name' as keyof AdminUser,
      width: '15%'
    },
    {
      header: '이메일',
      accessor: 'email' as keyof AdminUser,
      width: '30%'
    },
    {
      header: '학과',
      accessor: 'major' as keyof AdminUser,
      width: '20%'
    },
    {
      header: '학번',
      accessor: 'stnum' as keyof AdminUser,
      width: '10%'
    },
    {
      header: '권한',
      accessor: (user: AdminUser) => (
        <span className={user.is_admin ? 'admin-badge admin-badge-admin' : 'admin-badge'}>
          {user.is_admin ? '👑 관리자' : '일반 사용자'}
        </span>
      ),
      width: '15%'
    }
  ];

  return (
    <AdminLayout
      title="👑 관리자 권한 관리"
      subtitle="사용자의 관리자 권한 부여 및 해제"
    >
      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="admin-stat-value">{stats.total}</div>
          <div className="admin-stat-label">전체 사용자</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-value">{stats.admins}</div>
          <div className="admin-stat-label">관리자</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-value">{stats.users}</div>
          <div className="admin-stat-label">일반 사용자</div>
        </div>
      </div>

      <SearchFilter
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        filterType={filterType}
        onFilterChange={setFilterType}
        filterOptions={filterOptions}
      />

      <UserTable
        users={filteredUsers}
        columns={columns}
        loading={loading}
        updatingId={updating}
        emptyMessage="조건에 맞는 사용자가 없습니다."
        actions={(user) => (
          <button
            className={user.is_admin ? 'admin-action-btn admin-action-btn-danger' : 'admin-action-btn admin-action-btn-primary'}
            onClick={() => handleToggleAdmin(user)}
            disabled={updating === user.id}
          >
            {user.is_admin ? '권한 제거' : '관리자 지정'}
          </button>
        )}
      />
    </AdminLayout>
  );
}

export default withAdminAuth(AdminRoleManager);
