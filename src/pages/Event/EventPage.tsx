import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../Auth/supabaseClient";
import ShowPartInfo from "../../components/ShowPartInfo";
import { useEvents } from './hooks';
import {
    WEEKDAYS,
    TIER_OPTIONS,
    generateCalendarDays,
    formatDateString,
    isToday,
    isSelectedDate,
    getEventsForDate,
    getMyEvents,
    groupEventsByDate,
    getEventColorStyle
} from './utils';
import "./styles/event-shared.css";

const EventPage: React.FC = () => {
    const navigate = useNavigate();
    const [myId, setMyId] = useState<string | null>(null);
    const selectedDateInfoRef = useRef<HTMLDivElement>(null);

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
    const [modalOpen, setModalOpen] = useState(false);
    const [modalEvent, setModalEvent] = useState<any | null>(null);
    const [showMyEvents, setShowMyEvents] = useState(false);

    const { events, loading, hostNames, fetchEvents } = useEvents();

    useEffect(() => {
        fetchEvents();
    }, [currentYear, currentMonth, fetchEvents]);

    // 날짜 선택 시 일정 목록으로 자동 스크롤 (간단하고 빠른 방식)
    useEffect(() => {
        if (selectedDate && selectedDateInfoRef.current) {
            // 약간의 지연을 주어 DOM이 렌더링된 후 스크롤
            const timer = setTimeout(() => {
                const element = selectedDateInfoRef.current;
                if (element) {
                    // scrollIntoView - 모든 브라우저에서 작동
                    element.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            }, 100); // 빠른 응답을 위해 100ms로 단축

            return () => clearTimeout(timer);
        }
    }, [selectedDate, showMyEvents]);

    const calendarDays = generateCalendarDays(currentYear, currentMonth);

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

    const getEventsForSelected = () => {
        if (showMyEvents) return getMyEvents(events, myId, today);
        if (selectedDate) return getEventsForDate(events, currentYear, currentMonth, selectedDate.getDate());
        return [];
    };

    // EventInfoBox 컴포넌트
    const EventInfoBox = ({ event, idx }: { event: any; idx: number }) => {
        const colorStyle = getEventColorStyle(event.color);

        const getTierName = (tierValue: number | null): string => {
            if (tierValue === null) return '제한 없음';
            const tier = TIER_OPTIONS.find(t => t.value === tierValue);
            return tier ? tier.label : `${tierValue} Tier`;
        };

        return (
            <div
                key={idx}
                className="event-info-box"
                style={{
                    background: colorStyle.background,
                    '--accent-color': colorStyle.accent,
                    '--accent-color-dark': colorStyle.accentDark,
                    color: colorStyle.text
                } as React.CSSProperties}
            >
                {myId && event.Participants && event.Participants.includes(myId) && (
                    <div className="participation-badge">
                        참여중
                    </div>
                )}

                <div className="event-info-content">
                    <div className="event-info-item">
                        <span className="event-info-label">장소:</span>
                        <span className="event-info-value">{event.where}</span>
                    </div>

                    <div className="event-info-item">
                        <span className="event-info-label">시간:</span>
                        <span className="event-info-value">{event.start_time?.slice(0,5)} ~ {event.end_time?.slice(0,5)}</span>
                    </div>

                    <div className="event-info-item">
                        <span className="event-info-label">호스트:</span>
                        <span className="event-info-value">{hostNames[event.host] || event.host}</span>
                    </div>

                    <div className="event-info-item">
                        <span className="event-info-label">코트:</span>
                        <span className="event-info-value">{event.court_number}번</span>
                    </div>

                    {event.min_tier !== null && (
                        <div className="event-info-item">
                            <span className="event-info-label">최소티어:</span>
                            <span className="event-info-value">{getTierName(event.min_tier)}</span>
                        </div>
                    )}

                    <div className="event-info-item">
                        <span className="event-info-label">인원:</span>
                        <span className="event-info-value">{event.participant_num} / {event.max_people}</span>
                    </div>
                </div>

                <div className="event-participate-btn-container">
                    <button
                        className="event-participate-btn"
                        onClick={() => { setModalEvent(event); setModalOpen(true); }}
                    >
                        참여하기
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className="event-calendar-container">
            <div className="event-page-header">
                <h1 className="event-page-title">
                    <span className="event-title-icon">📅</span>
                    KWTC 일정
                </h1>
                <p className="event-page-subtitle">테니스 일정을 공유하고 참여해보세요</p>
                <div className="event-page-desc" style={{ fontSize: "0.95em", color: "#888", marginTop: "4px" }}>
                    ※ 코트 예약 버튼을 누르면 통합 예약 페이지로 이동합니다.
                </div>
            </div>

            <div className="calendar-action-buttons">
                <button
                    className="add-schedule-btn"
                    onClick={() => {
                        if (!myId) {
                            alert('로그인이 필요한 서비스입니다.');
                            navigate('/login');
                            return;
                        }
                        navigate("add");
                    }}
                >
                    일정 추가
                </button>
                <button
                    className="reserve-court-btn"
                    onClick={() => {
                        if (!myId) {
                            alert('로그인이 필요한 서비스입니다.');
                            navigate('/login');
                            return;
                        }
                        window.open("/reservation", "_blank");
                    }}
                >
                    코트 예약
                </button>
            </div>

            <div className="calendar-container">
                <div className="event-calendar-header">
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
                                    const isTodayDate = date ? isToday(date, currentMonth, currentYear, today) : false;
                                    const isSelected = date ? isSelectedDate(date, currentMonth, currentYear, selectedDate) : false;
                                    const isSunday = idx === 0;
                                    const isSaturday = idx === 6;
                                    return (
                                        <td
                                            key={idx}
                                            className={[
                                                isTodayDate ? "today" : "",
                                                isSelected ? "selected" : "",
                                                isSunday ? "sunday" : "",
                                                isSaturday ? "saturday" : ""
                                            ].join(" ")}
                                            onClick={() => date && setSelectedDate(new Date(currentYear, currentMonth, date))}
                                        >
                                            {date && (
                                                <div>
                                                    <div className="date">{date}</div>
                                                    {getEventsForDate(events, currentYear, currentMonth, date).map((event, idx) => {
                                                        const colorStyle = getEventColorStyle(event.color);
                                                        return (
                                                            <div
                                                                key={idx}
                                                                className="event-where"
                                                                title={event.where}
                                                                style={{
                                                                    background: colorStyle.badge,
                                                                    color: colorStyle.text
                                                                }}
                                                            >
                                                                {event.where}
                                                            </div>
                                                        );
                                                    })}
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
                    <div ref={selectedDateInfoRef} className="selected-date-info">
                        <div className="selected-date-title-row">
                            <div className="selected-date-title">
                                {showMyEvents
                                    ? "내 일정"
                                    : `${selectedDate.getFullYear()}년 ${selectedDate.getMonth() + 1}월 ${selectedDate.getDate()}일 일정`
                                }
                            </div>
                            {!showMyEvents ? (
                                <button
                                    className="my-events-btn"
                                    onClick={() => setShowMyEvents(true)}
                                >
                                    <span className="my-events-btn-icon">👤</span>
                                    내 일정 보기
                                </button>
                            ) : (
                                <button
                                    className="my-events-btn active"
                                    onClick={() => setShowMyEvents(false)}
                                >
                                    <span className="my-events-btn-icon">📅</span>
                                    날짜별 일정 보기
                                </button>
                            )}
                        </div>
                        <div className="selected-date-events-boxes">
                            {showMyEvents ? (
                                (() => {
                                    const grouped = groupEventsByDate(getMyEvents(events, myId, today));
                                    const dates = Object.keys(grouped).sort();
                                    if (dates.length === 0) {
                                        return <div className="no-event-box">일정이 없습니다.</div>;
                                    }
                                    return dates.map(dateStr => {
                                        const [year, month, day] = dateStr.split("-");
                                        const sortedEvents = grouped[dateStr].slice().sort((a, b) => {
                                            if (!a.created_at || !b.created_at) return 0;
                                            return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
                                        });
                                        return (
                                            <div key={dateStr} className="my-events-date-group">
                                                <div className="my-events-date-title">
                                                    {`${year}년 ${parseInt(month)}월 ${parseInt(day)}일`}
                                                </div>
                                                {sortedEvents.map((event, idx) => (
                                                    <EventInfoBox key={`my-${dateStr}-${idx}`} event={event} idx={idx} />
                                                ))}
                                            </div>
                                        );
                                    });
                                })()
                            ) : (
                                getEventsForSelected().length === 0 ? (
                                    <div className="no-event-box">일정이 없습니다.</div>
                                ) : (
                                    getEventsForSelected().map((event, idx) => (
                                        <EventInfoBox key={`selected-${idx}`} event={event} idx={idx} />
                                    ))
                                )
                            )}
                        </div>
                    </div>
                )}
            </div>

            {modalOpen && modalEvent && (
                <ShowPartInfo partInfo={modalEvent} onClose={() => setModalOpen(false)} />
            )}
        </div>
    );
};

export default EventPage;
