import { useEffect, useState } from "react";
import { supabase } from "../pages/Auth/supabaseClient";
import "./Showmember.css";
import ProfileDetailPage from "./ProfileDetailPage";

function Showmember() {
    const [members, setMembers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);

    useEffect(() => {
        const fetchMembers = async () => {
            const { data, error } = await supabase
                .from('ranked_user')
                .select('id, name, major, stnum, image_url');
            if (!error && data) setMembers(data);
            setLoading(false);
        };
        fetchMembers();
    }, []);

    if (loading) return <div className="showmember-loading">로딩 중...</div>;

    // 2명씩 묶어서 행으로 만들기
    const rows = [];
    for (let i = 0; i < members.length; i += 2) {
        rows.push(members.slice(i, i + 2));
    }

    return (
        <div className="showmember-container">
            <ul className="showmember-list">
                {rows.map((row, idx) => (
                    <li key={idx} className="showmember-row">
                        {row.map(member => (
                            <div key={member.id} className="showmember-item">
                                <img
                                    src={member.image_url
                                        ? member.image_url
                                        : "https://aftlhyhiskoeyflfiljr.supabase.co/storage/v1/object/public/profile-image/base_profile.png"
                                    }
                                    alt="프로필"
                                    className="showmember-img"
                                />
                                <button
                                    className="showmember-info"
                                    onClick={() => {
                                        setSelectedMemberId(member.id);
                                        setModalVisible(true);
                                    }}
                                >
                                    <span className="showmember-major">{member.major} ({member.stnum})</span>
                                    <span className="showmember-name">{member.name}</span>
                                </button>
                            </div>
                        ))}
                        {row.length < 2 && <div className="showmember-item empty"></div>}
                    </li>
                ))}
            </ul>
            {modalVisible && (
                <div
                    className="profile-modal-overlay"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) {
                            setModalVisible(false);
                        }
                    }}
                >
                    <div className="profile-modal-container">
                        <button
                            className="profile-modal-close"
                            onClick={() => setModalVisible(false)}
                        >
                            ×
                        </button>
                        <div className="profile-modal-content">
                            <ProfileDetailPage id={selectedMemberId} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Showmember;