import { useRef, useCallback } from 'react';

/**
 * Custom hook for tier scrolling functionality
 */
export function useTierScroll(tiersLength: number) {
  const tierRefs = useRef<(HTMLDivElement | null)[]>(Array(tiersLength).fill(null));

  const scrollToTier = useCallback((tierIdx: number) => {
    const ref = tierRefs.current[tierIdx];
    if (ref) {
      ref.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  const scrollToTerini = useCallback(() => {
    const terinSection = document.querySelector('.terini-section');
    if (terinSection) {
      terinSection.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  return {
    tierRefs,
    scrollToTier,
    scrollToTerini
  };
}
