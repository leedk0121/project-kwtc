import { useState, useEffect, useCallback } from 'react';
import { adminService } from '../../../services/adminService';
import { AdminUser, AdminStats, FilterType } from '../types';

interface UseAdminUsersOptions {
  autoFetch?: boolean;
  filterApproved?: boolean;
}

export function useAdminUsers(options: UseAdminUsersOptions = {}) {
  const { autoFetch = true, filterApproved } = options;

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const allUsers = await adminService.getAllUsers();
      let filteredUsers = allUsers || [];

      if (filterApproved !== undefined) {
        filteredUsers = filteredUsers.filter(user => user.approved === filterApproved);
      }

      setUsers(filteredUsers);
    } catch (err: any) {
      console.error('사용자 조회 오류:', err);
      setError(err.message || '사용자를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [filterApproved]);

  useEffect(() => {
    if (autoFetch) {
      fetchUsers();
    }
  }, [autoFetch, fetchUsers]);

  const approveUser = async (userId: string) => {
    setUpdating(userId);
    try {
      const result = await adminService.approveUser(userId);
      if (result.success) {
        setUsers(users.map(u =>
          u.id === userId ? { ...u, approved: true } : u
        ));
        return { success: true, message: result.message };
      }
      return { success: false, message: result.message };
    } catch (err: any) {
      console.error('승인 오류:', err);
      return { success: false, message: err.message };
    } finally {
      setUpdating(null);
    }
  };

  const unapproveUser = async (userId: string) => {
    setUpdating(userId);
    try {
      const result = await adminService.updateUserProfile(userId, { approved: false });
      if (result.success) {
        setUsers(users.map(u =>
          u.id === userId ? { ...u, approved: false } : u
        ));
        return { success: true, message: '승인이 취소되었습니다.' };
      }
      return { success: false, message: result.message };
    } catch (err: any) {
      console.error('승인 취소 오류:', err);
      return { success: false, message: err.message };
    } finally {
      setUpdating(null);
    }
  };

  const deleteUser = async (userId: string) => {
    setUpdating(userId);
    try {
      const result = await adminService.deleteUser(userId);
      if (result.success) {
        setUsers(users.filter(u => u.id !== userId));
        return { success: true, message: result.message };
      }
      return { success: false, message: result.message };
    } catch (err: any) {
      console.error('삭제 오류:', err);
      return { success: false, message: err.message };
    } finally {
      setUpdating(null);
    }
  };

  const toggleAdminRole = async (userId: string, currentStatus: boolean) => {
    setUpdating(userId);
    try {
      const result = await adminService.setAdminRole(userId, !currentStatus);
      if (result.success) {
        setUsers(users.map(u =>
          u.id === userId ? { ...u, is_admin: !currentStatus } : u
        ));
        return { success: true, message: result.message };
      }
      return { success: false, message: result.message };
    } catch (err: any) {
      console.error('권한 변경 오류:', err);
      return { success: false, message: err.message };
    } finally {
      setUpdating(null);
    }
  };

  const updateUser = async (userId: string, updates: Partial<AdminUser>) => {
    setUpdating(userId);
    try {
      const result = await adminService.updateUserProfile(userId, updates);
      if (result.success) {
        setUsers(users.map(u =>
          u.id === userId ? { ...u, ...updates } : u
        ));
        return { success: true, message: '수정되었습니다.' };
      }
      return { success: false, message: result.message };
    } catch (err: any) {
      console.error('수정 오류:', err);
      return { success: false, message: err.message };
    } finally {
      setUpdating(null);
    }
  };

  const getStats = useCallback((): AdminStats => {
    return {
      total: users.length,
      admins: users.filter(u => u.is_admin).length,
      users: users.filter(u => !u.is_admin).length,
      approved: users.filter(u => u.approved).length,
      pending: users.filter(u => !u.approved).length,
    };
  }, [users]);

  return {
    users,
    loading,
    updating,
    error,
    fetchUsers,
    approveUser,
    unapproveUser,
    deleteUser,
    toggleAdminRole,
    updateUser,
    getStats,
  };
}
