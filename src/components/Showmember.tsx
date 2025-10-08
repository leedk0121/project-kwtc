import { useEffect, useState } from "react";
import { supabase } from "../pages/auth/supabaseClient";
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
            {/* <h2 className="showmember-title">Member Information</h2> */}
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
                        {/* 2명이 안될 때 빈 칸 추가 */}
                        {row.length < 2 && <div className="showmember-item empty"></div>}
                    </li>
                ))}
            </ul>
            {modalVisible && (
                <div className="showmember-modal-bg" style={{position:'fixed',top:0,left:0,width:'100vw',height:'100vh',background:'rgba(0,0,0,0.4)',zIndex:9999,display:'flex',alignItems:'center',justifyContent:'center'}}>
                    <div className="showmember-modal-content" style={{background:'#fff',padding:'32px',borderRadius:'16px',position:'relative',maxWidth:'600px',width:'90vw',maxHeight:'90vh',overflowY:'auto'}}>
                        <button style={{position:'absolute',top:12,right:12,fontSize:'1.5rem',background:'none',border:'none',cursor:'pointer'}} onClick={() => setModalVisible(false)}>×</button>
                        <ProfileDetailPage id={selectedMemberId} />
                    </div>
                </div>
            )}
        </div>
    );
}

export default Showmember;