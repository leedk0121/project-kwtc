import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useEventActions } from './hooks';
import { HOUR_OPTIONS, MINUTE_OPTIONS, formatTimeString, validateEventForm } from './utils';
import "./styles/event-shared.css";

const EventAdd: React.FC = () => {
    const navigate = useNavigate();
    const [where, setWhere] = useState("");
    const [courtNumber, setCourtNumber] = useState("");
    const [date, setDate] = useState("");
    const [startHour, setStartHour] = useState("");
    const [startMinute, setStartMinute] = useState("");
    const [endHour, setEndHour] = useState("");
    const [endMinute, setEndMinute] = useState("");
    const [maxPeople, setMaxPeople] = useState<number | null>(null);
    const [minTier, setMinTier] = useState<number | null>(null);
    const [hostJoin, setHostJoin] = useState(true);
    const myId = localStorage.getItem("user_id");

    const { loading, success, addEvent, setSuccess } = useEventActions();

    const isFormValid = () => {
        return validateEventForm({
            where,
            courtNumber,
            date,
            startHour,
            startMinute,
            endHour,
            endMinute,
            maxPeople
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!isFormValid()) {
            alert("모든 필수 항목을 입력해주세요.");
            return;
        }

        const startTime = formatTimeString(startHour, startMinute);
        const endTime = formatTimeString(endHour, endMinute);

        const result = await addEvent({
            where,
            courtNumber,
            date,
            startTime,
            endTime,
            maxPeople: maxPeople!,
            minTier,
            hostJoin,
            hostId: myId
        });

        if (result.success) {
            alert(result.message);
            // 폼 리셋
            setWhere("");
            setCourtNumber("");
            setDate("");
            setStartHour("");
            setStartMinute("");
            setEndHour("");
            setEndMinute("");
            setMaxPeople(null);
            setMinTier(null);
            setHostJoin(false);
            navigate("/event");
        } else {
            alert(result.message);
        }
    };

    const handleCancel = () => {
        navigate("/participate");
    };

    return (
        <div className="event-add-container">
            <div className="event-add-header">
                <div className="event-add-header-row">
                    <h1 className="event-add-title">일정 추가하기</h1>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="event-add-form">
                <div className="field-group">
                    <label className="field-label">장소 및 코트 정보</label>
                    <div className="event-add-place-row">
                        <input
                            type="text"
                            placeholder="테니스장 이름을 입력하세요"
                            value={where}
                            onChange={e => setWhere(e.target.value)}
                            required
                        />
                        <div>
                            <input
                                type="text"
                                placeholder="코트 번호"
                                value={courtNumber}
                                onChange={e => setCourtNumber(e.target.value)}
                                required
                            />
                            <span className="court-number-hint">숫자로만 입력하세요</span>
                        </div>
                    </div>
                </div>

                <div className="field-group">
                    <label className="field-label">날짜</label>
                    <input
                        type="date"
                        value={date}
                        onChange={e => setDate(e.target.value)}
                        required
                    />
                </div>

                <div className="field-group">
                    <label className="field-label">시간</label>
                    <div className="event-add-time-row">
                        <select
                            value={startHour}
                            onChange={e => setStartHour(e.target.value)}
                            required
                        >
                            <option value="">시</option>
                            {HOUR_OPTIONS.map(h => (
                                <option key={h} value={h}>{h}</option>
                            ))}
                        </select>
                        <span>:</span>
                        <select
                            value={startMinute}
                            onChange={e => setStartMinute(e.target.value)}
                            required
                        >
                            <option value="">분</option>
                            {MINUTE_OPTIONS.map(m => (
                                <option key={m} value={m}>{m.toString().padStart(2, "0")}</option>
                            ))}
                        </select>
                        <span>~</span>
                        <select
                            value={endHour}
                            onChange={e => setEndHour(e.target.value)}
                            required
                        >
                            <option value="">시</option>
                            {HOUR_OPTIONS.map(h => (
                                <option key={h} value={h}>{h}</option>
                            ))}
                        </select>
                        <span>:</span>
                        <select
                            value={endMinute}
                            onChange={e => setEndMinute(e.target.value)}
                            required
                        >
                            <option value="">분</option>
                            {MINUTE_OPTIONS.map(m => (
                                <option key={m} value={m}>{m.toString().padStart(2, "0")}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="field-group">
                    <label className="field-label">참여 설정</label>
                    <div className="event-add-options-row">
                        <input
                            type="number"
                            placeholder="최대 참여 인원"
                            value={maxPeople === null ? "" : maxPeople}
                            onChange={e => {
                                const val = e.target.value;
                                setMaxPeople(val === "" ? null : Number(val));
                            }}
                            required
                        />
                        <label className="host-join-checkbox">
                            <input
                                type="checkbox"
                                checked={hostJoin}
                                onChange={e => setHostJoin(e.target.checked)}
                            />
                            호스트도 참여
                        </label>
                    </div>
                </div>

                <div className="field-group">
                    <label className="field-label">최소 티어 (선택사항)</label>
                    <input
                        type="number"
                        placeholder="최소 티어를 입력하세요 (선택사항)"
                        value={minTier === null ? "" : minTier}
                        onChange={e => {
                            const val = e.target.value;
                            setMinTier(val === "" ? null : Number(val));
                        }}
                    />
                </div>

                <div className="event-add-buttons">
                    <button type="button" onClick={handleCancel} className="event-add-cancel-btn" disabled={loading}>
                        취소
                    </button>

                    <button
                        type="submit"
                        disabled={loading || !isFormValid()}
                        className={`event-add-submit-btn ${!isFormValid() ? 'disabled' : ''}`}
                    >
                        {loading ? (
                            <>
                                <span className="loading-spinner"></span>
                                저장 중...
                            </>
                        ) : (
                            <>
                                <span>🚀</span>
                                일정 추가하기
                            </>
                        )}
                    </button>
                </div>

                {success && <div className="event-add-success">일정이 성공적으로 추가되었습니다!</div>}
            </form>
        </div>
    );
};

export default EventAdd;
