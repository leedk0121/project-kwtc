import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../Auth/supabaseClient';
import { withAdminAuth } from '../../services/adminHOC';
import { AdminLayout } from './components';
import './MajorManagePage.css';

interface Major {
  id: number;
  major_name: string;
}

function MajorManagePage() {
  const [majors, setMajors] = useState<Major[]>([]);
  const [newMajor, setNewMajor] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchMajors = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('major_list')
        .select('*')
        .order('major_name', { ascending: true });

      if (error) throw error;
      setMajors(data || []);
    } catch (error) {
      console.error('전공 목록 조회 실패:', error);
      alert('전공 목록을 불러오는데 실패했습니다.');
    }
  }, []);

  useEffect(() => {
    fetchMajors();
  }, [fetchMajors]);

  const handleAddMajor = useCallback(async () => {
    const trimmedMajor = newMajor.trim();

    if (!trimmedMajor) {
      alert('전공명을 입력해주세요.');
      return;
    }

    if (majors.some(m => m.major_name === trimmedMajor)) {
      alert('이미 존재하는 전공입니다.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('major_list')
        .insert([{ major_name: trimmedMajor }]);

      if (error) throw error;

      alert('전공이 추가되었습니다.');
      setNewMajor('');
      fetchMajors();
    } catch (error) {
      console.error('전공 추가 실패:', error);
      alert('전공 추가에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [newMajor, majors, fetchMajors]);

  const handleDeleteMajor = useCallback(async (id: number, majorName: string) => {
    if (!confirm(`"${majorName}" 전공을 삭제하시겠습니까?`)) {
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('major_list')
        .delete()
        .eq('id', id);

      if (error) throw error;

      alert('전공이 삭제되었습니다.');
      fetchMajors();
    } catch (error) {
      console.error('전공 삭제 실패:', error);
      alert('전공 삭제에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [fetchMajors]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleAddMajor();
    }
  }, [handleAddMajor]);

  return (
    <AdminLayout
      title="🎓 전공 관리"
      subtitle="전공 목록을 추가하고 관리합니다"
      backPath="/admin"
    >
      <div className="add-major-section">
        <h2>전공 추가</h2>
        <div className="add-major-form">
          <input
            type="text"
            placeholder="전공명을 입력하세요"
            value={newMajor}
            onChange={(e) => setNewMajor(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={loading}
          />
          <button
            onClick={handleAddMajor}
            disabled={loading}
            className="add-btn"
          >
            {loading ? '추가 중...' : '추가'}
          </button>
        </div>
      </div>

      <div className="major-list-section">
        <h2>전공 목록 ({majors.length}개)</h2>
        <div className="major-list">
          {majors.length === 0 ? (
            <p className="no-data">등록된 전공이 없습니다.</p>
          ) : (
            majors.map((major) => (
              <div key={major.id} className="major-item">
                <span className="major-name">{major.major_name}</span>
                <button
                  onClick={() => handleDeleteMajor(major.id, major.major_name)}
                  disabled={loading}
                  className="delete-btn"
                >
                  삭제
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

export default withAdminAuth(MajorManagePage);
