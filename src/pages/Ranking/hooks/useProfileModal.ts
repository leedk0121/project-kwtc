import { useState, useCallback } from 'react';

/**
 * Custom hook for managing profile modal state
 */
export function useProfileModal() {
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);

  const openProfile = useCallback((memberId: string) => {
    setSelectedMemberId(memberId);
  }, []);

  const closeProfile = useCallback(() => {
    setSelectedMemberId(null);
  }, []);

  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      closeProfile();
    }
  }, [closeProfile]);

  return {
    selectedMemberId,
    openProfile,
    closeProfile,
    handleBackdropClick
  };
}
