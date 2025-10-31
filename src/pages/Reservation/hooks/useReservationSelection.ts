import { useState, useCallback } from 'react';

export type SelectedReservation = {
  court: string;
  court_num: string;
  time: string;
  date: string;
};

export function useReservationSelection() {
  const [selectedReservations, setSelectedReservations] = useState<SelectedReservation[]>([]);

  const handleReservationSelect = useCallback((
    court: string,
    court_num: string,
    time: string,
    date: string,
    status: string | undefined
  ) => {
    if (status !== '가능') return;

    setSelectedReservations(prev => {
      const existing = prev.findIndex(
        r => r.court === court && r.court_num === court_num && r.time === time && r.date === date
      );

      if (existing !== -1) {
        // 이미 선택된 경우 제거
        return prev.filter((_, index) => index !== existing);
      } else {
        // 새로 선택
        return [...prev, { court, court_num, time, date }];
      }
    });
  }, []);

  const clearSelections = useCallback(() => {
    setSelectedReservations([]);
  }, []);

  const isSelected = useCallback((court: string, court_num: string, time: string) => {
    return selectedReservations.some(
      r => r.court === court && r.court_num === court_num && r.time === time
    );
  }, [selectedReservations]);

  const getSelectionCount = useCallback(() => {
    return selectedReservations.length;
  }, [selectedReservations]);

  const removeSelection = useCallback((court: string, court_num: string, time: string, date: string) => {
    setSelectedReservations(prev =>
      prev.filter(r => !(r.court === court && r.court_num === court_num && r.time === time && r.date === date))
    );
  }, []);

  return {
    selectedReservations,
    setSelectedReservations,
    handleReservationSelect,
    clearSelections,
    isSelected,
    getSelectionCount,
    removeSelection
  };
}
