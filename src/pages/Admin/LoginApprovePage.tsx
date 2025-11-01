import { useState, useMemo } from 'react';
import { withAdminAuth } from '../../services/adminHOC';
import { AdminLayout } from './components/AdminLayout';
import { SearchFilter } from './components/SearchFilter';
import { UserTable } from './components/UserTable';
import { useAdminUsers } from './hooks/useAdminUsers';
import { AdminUser, FilterType } from './types';
import '../Admin/styles/admin-shared.css';

function LoginApprove() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterType>('all');

  const {
    users,
    loading,
    updating,
    approveUser,
    unapproveUser,
    deleteUser,
    getStats
  } = useAdminUsers();

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
        filterStatus === 'all' ||
        (filterStatus === 'approved' && user.approved) ||
        (filterStatus === 'pending' && !user.approved);

      return matchesSearch && matchesFilter;
    });
  }, [users, searchTerm, filterStatus]);

  const handleToggleApproval = async (user: AdminUser) => {
    const confirmMessage = user.approved
      ? `${user.name}님의 승인을 취소하시겠습니까?`
      : `${user.name}님의 가입을 승인하시겠습니까?`;

    if (!window.confirm(confirmMessage)) return;

    const result = user.approved
      ? await unapproveUser(user.id)
      : await approveUser(user.id);

    if (result.success) {
      alert(result.message);
    } else {
      alert(`실패: ${result.message}`);
    }
  };

  const handleDeleteUser = async (user: AdminUser) => {
    if (!window.confirm(
      `⚠️ 경고: ${user.name}님의 계정을 완전히 삭제하시겠습니까?\n\n` +
      '이 작업은 되돌릴 수 없으며, 다음 데이터가 모두 삭제됩니다:\n' +
      '- 인증 정보 (Auth)\n' +
      '- 프로필 정보\n' +
      '- 작성한 게시글/댓글\n' +
      '- 예약 내역'
    )) return;

    const result = await deleteUser(user.id);

    if (result.success) {
      alert(result.message || '사용자가 삭제되었습니다.');
    } else {
      alert(`삭제 실패: ${result.message}`);
    }
  };

  const filterOptions = [
    { value: 'all' as FilterType, label: `전체 (${stats.total})` },
    { value: 'approved' as FilterType, label: `승인됨 (${stats.approved})` },
    { value: 'pending' as FilterType, label: `대기중 (${stats.pending})` }
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
      width: '25%'
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
      header: '상태',
      accessor: (user: AdminUser) => (
        <span className={user.approved ? 'admin-badge admin-badge-approved' : 'admin-badge admin-badge-pending'}>
          {user.approved ? '승인됨' : '대기중'}
        </span>
      ),
      width: '10%'
    },
    {
      header: '가입일',
      accessor: (user: AdminUser) => new Date(user.created_at).toLocaleDateString('ko-KR'),
      width: '15%'
    }
  ];

  return (
    <AdminLayout
      title="✅ 사용자 승인 관리"
      subtitle="신규 회원 가입 승인 및 사용자 관리"
    >
      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="admin-stat-value">{stats.total}</div>
          <div className="admin-stat-label">전체 사용자</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-value">{stats.approved}</div>
          <div className="admin-stat-label">승인된 사용자</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-value">{stats.pending}</div>
          <div className="admin-stat-label">대기중인 사용자</div>
        </div>
      </div>

      <SearchFilter
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        filterType={filterStatus}
        onFilterChange={setFilterStatus}
        filterOptions={filterOptions}
      />

      <UserTable
        users={filteredUsers}
        columns={columns}
        loading={loading}
        updatingId={updating}
        emptyMessage="조건에 맞는 사용자가 없습니다."
        actions={(user) => (
          <>
            <button
              className={user.approved ? 'admin-action-btn admin-action-btn-secondary' : 'admin-action-btn admin-action-btn-success'}
              onClick={() => handleToggleApproval(user)}
              disabled={updating === user.id}
            >
              {user.approved ? '승인 취소' : '승인'}
            </button>
            <button
              className="admin-action-btn admin-action-btn-danger"
              onClick={() => handleDeleteUser(user)}
              disabled={updating === user.id}
            >
              삭제
            </button>
          </>
        )}
      />
    </AdminLayout>
  );
}

export default withAdminAuth(LoginApprove);
