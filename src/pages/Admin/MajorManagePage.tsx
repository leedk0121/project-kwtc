import { useState, useEffect } from 'react';
import { supabase } from '../auth/supabaseClient.tsx';
import { withAdminAuth } from '../../services/adminHOC';
import { useNavigate } from 'react-router-dom';
import './MajorManagePage.css';

function MajorManagePage() {
    const [majors, setMajors] = useState<{ id: number; major_name: string }[]>([]);
    const [newMajor, setNewMajor] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        fetchMajors();
    }, []);

    const fetchMajors = async () => {
        const { data, error } = await supabase
            .from('major_list')
            .select('*')
            .order('major_name', { ascending: true });

        if (error) {
            console.error('전공 목록 조회 실패:', error);
            alert('전공 목록을 불러오는데 실패했습니다.');
            return;
        }

        if (data) {
            setMajors(data);
        }
    };

    const handleAddMajor = async () => {
        if (!newMajor.trim()) {
            alert('전공명을 입력해주세요.');
            return;
        }

        // 중복 체크
        if (majors.some(m => m.major_name === newMajor.trim())) {
            alert('이미 존재하는 전공입니다.');
            return;
        }

        setLoading(true);
        const { error } = await supabase
            .from('major_list')
            .insert([{ major_name: newMajor.trim() }]);

        setLoading(false);

        if (error) {
            console.error('전공 추가 실패:', error);
            alert('전공 추가에 실패했습니다.');
            return;
        }

        alert('전공이 추가되었습니다.');
        setNewMajor('');
        fetchMajors();
    };

    const handleDeleteMajor = async (id: number, majorName: string) => {
        if (!confirm(`"${majorName}" 전공을 삭제하시겠습니까?`)) {
            return;
        }

        setLoading(true);
        const { error } = await supabase
            .from('major_list')
            .delete()
            .eq('id', id);

        setLoading(false);

        if (error) {
            console.error('전공 삭제 실패:', error);
            alert('전공 삭제에 실패했습니다.');
            return;
        }

        alert('전공이 삭제되었습니다.');
        fetchMajors();
    };

    return (
        <div className="major-manage-container">
            <div className="major-manage-header">
                <h1>🎓 전공 관리</h1>
                <p>전공 목록을 추가하고 관리합니다</p>
            </div>

            <div className="add-major-section">
                <h2>전공 추가</h2>
                <div className="add-major-form">
                    <input
                        type="text"
                        placeholder="전공명을 입력하세요"
                        value={newMajor}
                        onChange={(e) => setNewMajor(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleAddMajor()}
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

            <div className="major-manage-footer">
                <button 
                    className="back-btn"
                    onClick={() => navigate('/admin')}
                >
                    ← 관리자 페이지로 돌아가기
                </button>
            </div>
        </div>
    );
}

export default withAdminAuth(MajorManagePage);