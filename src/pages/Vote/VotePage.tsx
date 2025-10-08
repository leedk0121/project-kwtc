import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../auth/supabaseClient";
import ShowPartInfo from "../../components/ShowPartInfo";
import "./VotePage.css";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

function getDaysInMonth(year: number, month: number) {
    return new Date(year, month + 1, 0).getDate();
}

const VotePage: React.FC = () => {
    const navigate = useNavigate();
    const [myId, setMyId] = useState<string | null>(null);
    
    useEffect(() => {
        const fetchUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) setMyId(user.id);
            else setMyId(null);
        };
        fetchUser();
    }, []);
    
    const today = new Date();
    const [currentYear, setCurrentYear] = useState(today.getFullYear());
    const [currentMonth, setCurrentMonth] = useState(today.getMonth());
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [votes, setVotes] = useState<any[]>([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [modalVote, setModalVote] = useState<any | null>(null);
    const [showMyVotes, setShowMyVotes] = useState(false);
    const [hostNames, setHostNames] = useState<{ [hostId: string]: string }>({});

    useEffect(() => {
        const fetchVotes = async () => {
            const { data, error } = await supabase
                .from("vote")
                .select("date, where, start_time, end_time, court_number, min_tier, max_people, Participants, color, participant_num, host, created_at");
            if (!error && data) {
                setVotes(data);

                // 호스트 아이디 목록 추출
                const hostIds = Array.from(new Set(data.map((v: any) => v.host).filter(Boolean)));
                if (hostIds.length > 0) {
                    // 호스트 이름들 가져오기
                    const { data: userData } = await supabase
                        .from("ranked_user")
                        .select("id, name")
                        .in("id", hostIds);
                    if (userData) {
                        const nameMap: { [hostId: string]: string } = {};
                        userData.forEach((u: any) => {
                            nameMap[u.id] = u.name;
                        });
                        setHostNames(nameMap);
                    }
                }
            }
        };
        fetchVotes();
    }, [currentYear, currentMonth]);

    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay();

    // 날짜 배열 생성 (항상 6줄)
    let calendarDays: (number | null)[] = Array(firstDayOfWeek).fill(null).concat(
        Array.from({ length: daysInMonth }, (_, i) => i + 1)
    );
    while (calendarDays.length < 42) {
        calendarDays.push(null);
    }

    const handlePrevMonth = () => {
        if (currentMonth === 0) {
            setCurrentYear(currentYear - 1);
            setCurrentMonth(11);
        } else {
            setCurrentMonth(currentMonth - 1);
        }
    };

    const handleNextMonth = () => {
        if (currentMonth === 11) {
            setCurrentYear(currentYear + 1);
            setCurrentMonth(0);
        } else {
            setCurrentMonth(currentMonth + 1);
        }
    };

    // 날짜별 vote 정보 중 where만 한 줄로 표시, 길면 ... 처리
    // 날짜별 모든 일정 반환
    const getVotesForDate = (date: number) => {
        if (!date) return [];
        const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(date).padStart(2, "0")}`;
        return votes.filter(v => v.date.startsWith(dateStr));
    };

    // 내 일정만 반환 (오늘 이전 일정은 제외)
    const getMyVotes = () => {
        if (!myId) return [];
        const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
        return votes.filter(v =>
            v.Participants &&
            v.Participants.includes(myId) &&
            v.date >= todayStr // 오늘 이후만
        );
    };

    // 날짜별 일정 반환 (내 일정 모드면 내 일정만)
    const getVotesForSelected = () => {
        if (showMyVotes) return getMyVotes();
        if (selectedDate) return getVotesForDate(selectedDate.getDate());
        return [];
    };

    // 내 일정들을 날짜별로 그룹화
    const groupVotesByDate = (votes: any[]) => {
        const grouped: { [date: string]: any[] } = {};
        votes.forEach(vote => {
            const dateStr = vote.date.split("T")[0]; // yyyy-mm-dd
            if (!grouped[dateStr]) grouped[dateStr] = [];
            grouped[dateStr].push(vote);
        });
        return grouped;
    };

    // VoteInfoBox 컴포넌트 분리
    const VoteInfoBox = ({ vote, idx }: { vote: any; idx: number }) => (
        <div
            key={idx}
            className="vote-info-box"
            style={{
                background: vote.color === 1 ? "linear-gradient(135deg, #FBC4D4 0%, #f8e8ec 100%)"
                    : vote.color === 2 ? "linear-gradient(135deg, #e5f0ff 0%, #f0f7ff 100%)"
                    : vote.color === 3 ? "linear-gradient(135deg, #e5ffe5 0%, #f0fff0 100%)"
                    : vote.color === 4 ? "linear-gradient(135deg, #D9C7F5 0%, #e8dcf7 100%)"
                    : vote.color === 5 ? "linear-gradient(135deg, #FFD8B5 0%, #ffe5cc 100%)"
                    : vote.color === 6 ? "linear-gradient(135deg, #FFF9B1 0%, #fffcc4 100%)"
                    : "linear-gradient(135deg, #ffffff 0%, #f8f9ff 100%)",
                "--accent-color": vote.color === 1 ? "#e91e63"
                    : vote.color === 2 ? "#2196f3"
                    : vote.color === 3 ? "#4caf50"
                    : vote.color === 4 ? "#9c27b0"
                    : vote.color === 5 ? "#ff9800"
                    : vote.color === 6 ? "#ffc107"
                    : "#667eea",
                "--accent-color-dark": vote.color === 1 ? "#c2185b"
                    : vote.color === 2 ? "#1976d2"
                    : vote.color === 3 ? "#388e3c"
                    : vote.color === 4 ? "#7b1fa2"
                    : vote.color === 5 ? "#f57c00"
                    : vote.color === 6 ? "#ffa000"
                    : "#4f7dca",
                color: vote.color === 1 ? "#4B0082"
                    : vote.color === 2 ? "#0D2C54"
                    : vote.color === 3 ? "#004225"
                    : vote.color === 4 ? "#46226dff"
                    : vote.color === 5 ? "#2C2C2C"
                    : vote.color === 6 ? "#333333"
                    : "#2d3748"
            } as React.CSSProperties}
        >
            {/* 참여중 표시 */}
            {myId && vote.Participants && vote.Participants.includes(myId) && (
                <div className="participation-badge">
                    참여중
                </div>
            )}
            
            <div className="vote-info-content">
                <div className="vote-info-item">
                    <span className="vote-info-label">장소:</span>
                    <span className="vote-info-value">{vote.where}</span>
                </div>
                
                <div className="vote-info-item">
                    <span className="vote-info-label">시간:</span>
                    <span className="vote-info-value">{vote.start_time?.slice(0,5)} ~ {vote.end_time?.slice(0,5)}</span>
                </div>
                
                <div className="vote-info-item">
                    <span className="vote-info-label">호스트:</span>
                    <span className="vote-info-value">{hostNames[vote.host] || vote.host}</span>
                </div>
                
                <div className="vote-info-item">
                    <span className="vote-info-label">코트:</span>
                    <span className="vote-info-value">{vote.court_number}번</span>
                </div>
                
                {vote.min_tier !== null && (
                    <div className="vote-info-item">
                        <span className="vote-info-label">최소티어:</span>
                        <span className="vote-info-value">{vote.min_tier} Tier</span>
                    </div>
                )}
                
                <div className="vote-info-item">
                    <span className="vote-info-label">인원:</span>
                    <span className="vote-info-value">{vote.participant_num} / {vote.max_people}</span>
                </div>
            </div>
            
            <div className="vote-participate-btn-container">
                <button 
                    className="vote-participate-btn" 
                    onClick={() => { setModalVote(vote); setModalOpen(true); }}
                >
                    참여하기
                </button>
            </div>
        </div>
    );

    return (
        <div className="vote-calendar-container">
            {/* 페이지 헤더 추가 */}
            <div className="vote-page-header">
                <h1 className="vote-page-title">
                    <span className="title-icon">📅</span>
                    일정 관리
                </h1>
                <p className="vote-page-subtitle">KWTC 테니스 일정을 확인하고 참여해보세요</p>
            </div>

            {/* 버튼 영역 */}
            <div className="calendar-action-buttons">
                <button
                    className="add-schedule-btn"
                    onClick={() => navigate("add")}
                >
                    일정 추가
                </button>
                <button
                    className="reserve-court-btn"
                    onClick={() => navigate("/reservation")}
                >
                    코트 예약
                </button>
            </div>

            <div className="calendar-container">
                <div className="vote-calendar-header">
                    <button className="month-move-button" onClick={handlePrevMonth}>&#9664;</button>
                    <span className="current-month">{currentYear}년 {currentMonth + 1}월</span>
                    <button className="month-move-button" onClick={handleNextMonth}>&#9654;</button>
                </div>
                
                <table className="custom-calendar">
                    <thead>
                        <tr>
                            {WEEKDAYS.map((day) => (
                                <th key={day}>{day}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {Array.from({ length: calendarDays.length / 7 }).map((_, weekIdx) => (
                            <tr key={weekIdx}>
                                {calendarDays.slice(weekIdx * 7, weekIdx * 7 + 7).map((date, idx) => {
                                    const isToday = date === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();
                                    const isSelected = selectedDate && date === selectedDate.getDate() && currentMonth === selectedDate.getMonth() && currentYear === selectedDate.getFullYear();
                                    const isSunday = idx === 0;
                                    const isSaturday = idx === 6;
                                    return (
                                        <td
                                            key={idx}
                                            className={[
                                                isToday ? "today" : "",
                                                isSelected ? "selected" : "",
                                                isSunday ? "sunday" : "",
                                                isSaturday ? "saturday" : ""
                                            ].join(" ")}
                                            onClick={() => date && setSelectedDate(new Date(currentYear, currentMonth, date))}
                                        >
                                            {date && (
                                                <div>
                                                    <div className="date">{date}</div>
                                                    {getVotesForDate(date).map((vote, idx) => (
                                                        <div
                                                            key={idx}
                                                            className="vote-where"
                                                            title={vote.where}
                                                            style={{
                                                                background: vote.color === 1 ? "#FBC4D4"
                                                                          : vote.color === 2 ? "#e5f0ff"
                                                                          : vote.color === 3 ? "#e5ffe5"
                                                                          : vote.color === 4 ? "#D9C7F5"
                                                                          : vote.color === 5 ? "#FFD8B5"
                                                                          : vote.color === 6 ? "#FFF9B1"
                                                                          :"#111",
                                                                color: vote.color === 1 ? "#4B0082"
                                                                     : vote.color === 2 ? "#0D2C54"
                                                                     : vote.color === 3 ? "#004225"
                                                                     : vote.color === 4 ? "#46226dff"
                                                                     : vote.color === 5 ? "#2C2C2C"
                                                                     : vote.color === 6 ? "#333333"
                                                                     : "#111"
                                                            }}
                                                        >
                                                            {vote.where}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>

                {selectedDate && (
                    <div className="selected-date-info">
                        <div className="selected-date-title-row">
                            <div className="selected-date-title">
                                {showMyVotes
                                    ? "내 일정"
                                    : `${selectedDate.getFullYear()}년 ${selectedDate.getMonth() + 1}월 ${selectedDate.getDate()}일 일정`
                                }
                            </div>
                            {!showMyVotes ? (
                                <button
                                    className="my-votes-btn"
                                    onClick={() => setShowMyVotes(true)}
                                >
                                    <span className="my-votes-btn-icon">👤</span>
                                    내 일정 보기
                                </button>
                            ) : (
                                <button
                                    className="my-votes-btn active"
                                    onClick={() => setShowMyVotes(false)}
                                >
                                    <span className="my-votes-btn-icon">📅</span>
                                    날짜별 일정 보기
                                </button>
                            )}
                        </div>
                        <div className="selected-date-votes-boxes">
                            {showMyVotes ? (
                                (() => {
                                    const grouped = groupVotesByDate(getMyVotes());
                                    const dates = Object.keys(grouped).sort();
                                    if (dates.length === 0) {
                                        return <div className="no-vote-box">일정이 없습니다.</div>;
                                    }
                                    return dates.map(dateStr => {
                                        const [year, month, day] = dateStr.split("-");
                                        // created_at 기준 오름차순 정렬
                                        const sortedVotes = grouped[dateStr].slice().sort((a, b) => {
                                            if (!a.created_at || !b.created_at) return 0;
                                            return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
                                        });
                                        return (
                                            <div key={dateStr} className="my-votes-date-group">
                                                <div className="my-votes-date-title">
                                                    {`${year}년 ${parseInt(month)}월 ${parseInt(day)}일`}
                                                </div>
                                                {sortedVotes.map((vote, idx) => (
                                                    <VoteInfoBox key={`my-${dateStr}-${idx}`} vote={vote} idx={idx} />
                                                ))}
                                            </div>
                                        );
                                    });
                                })()
                            ) : (
                                getVotesForSelected().length === 0 ? (
                                    <div className="no-vote-box">일정이 없습니다.</div>
                                ) : (
                                    getVotesForSelected().map((vote, idx) => (
                                        <VoteInfoBox key={`selected-${idx}`} vote={vote} idx={idx} />
                                    ))
                                )
                            )}
                        </div>
                    </div>
                )}
            </div>
            
            {/* Modal */}
            {modalOpen && modalVote && (
                <ShowPartInfo partInfo={modalVote} onClose={() => setModalOpen(false)} />
            )}
        </div>
    );
};

export default VotePage;