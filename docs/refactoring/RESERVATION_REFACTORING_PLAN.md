# Reservation Pages Refactoring Plan

## 📊 Current State Analysis

**Refactoring Date**: October 29, 2025
**Scope**: Reservation system - complex multi-page feature
**Status**: ⏳ Plan Created - Implementation Recommended

### Current Files

| File | Lines | Complexity |
|------|-------|------------|
| **UnifiedreservationPage.tsx** | 1,235 | Very High - 25+ functions |
| **ReservationProfile.tsx** | 1,455 | High - Profile + reservation history |
| **ReservationSuccessPage.tsx** | 212 | Low - Simple success display |
| **UnifiedreservationPage.css** | 808 | High |
| **ReservationProfile.css** | 1,320 | Very High |
| **ReservationSuccessPage.css** | 236 | Medium |
| **Total** | **5,266 lines** | **Very Complex** |

### Key Features Identified

1. **Tennis Court Reservation System**
   - Two regions: Nowon (노원구) and Dobong (도봉구)
   - External crawling via proxy to get availability
   - Calendar-based date selection
   - Real-time availability checking

2. **User Account Management**
   - Store tennis reservation credentials
   - Separate accounts for each region
   - Account validation

3. **Caching System**
   - Month data caching in Supabase Storage
   - Cache invalidation logic
   - Auto-load from cache

4. **Reservation Process**
   - Multi-court selection
   - Time slot selection
   - Batch reservation submission
   - Success/failure tracking

5. **Profile Management**
   - View reservation history
   - Manage tennis accounts
   - View past reservations

## 🎯 Refactoring Goals

### Primary Objectives

1. **Extreme Separation of Concerns**
   - Extract 25+ inline functions into hooks
   - Separate crawling logic
   - Separate caching logic
   - Separate UI rendering logic

2. **Create Reusable Hooks**
   - `useReservationData` - Data fetching and caching
   - `useReservationAccounts` - Account management
   - `useCourtCrawler` - Crawling logic for both regions
   - `useReservationSelection` - Selection state management
   - `useReservationSubmit` - Submission logic

3. **Utility Functions**
   - Calendar utilities (reuse from Event page)
   - Date formatting
   - Court number mapping
   - Status icons and colors

4. **CSS Consolidation**
   - Use global design system
   - Single reservation-shared.css
   - Remove 70%+ duplicate styles

### Expected Outcomes

- **Code Reduction**: ~40% reduction in TS lines (2,100 → ~1,260)
- **CSS Reduction**: ~30% reduction (2,364 → ~1,650)
- **Maintainability**: Dramatic improvement with hooks
- **Testability**: Much easier with isolated functions
- **Reusability**: Hooks can be used in future reservation features

## 📁 Proposed File Structure

```
src/pages/Reservation/
├── ReservationPage.tsx (250 lines)           ← Refactored UnifiedreservationPage
├── ReservationProfile.tsx (400 lines)        ← Refactored profile page
├── ReservationSuccessPage.tsx (180 lines)    ← Refactored success page
├── hooks/
│   ├── useReservationData.ts (150 lines)     ← Data & caching
│   ├── useReservationAccounts.ts (120 lines) ← Account management
│   ├── useCourtCrawler.ts (200 lines)        ← Crawling logic
│   ├── useReservationSelection.ts (80 lines) ← Selection state
│   ├── useReservationSubmit.ts (180 lines)   ← Submission logic
│   ├── useReservationHistory.ts (100 lines)  ← Profile history
│   └── index.ts (10 lines)                   ← Barrel export
├── utils/
│   ├── calendar.ts (50 lines)                ← Calendar helpers
│   ├── courtMapping.ts (40 lines)            ← Court number mapping
│   ├── constants.ts (60 lines)               ← All constants
│   └── index.ts (5 lines)                    ← Barrel export
└── styles/
    └── reservation-shared.css (1,650 lines)  ← Consolidated CSS

Total Estimated: ~3,475 lines (34% reduction from 5,266)
```

## 🔧 Proposed Hook Implementations

### 1. useReservationData Hook

**Purpose**: Handle month data fetching and caching

**Key Functions**:
```typescript
export function useReservationData() {
  const [monthData, setMonthData] = useState<MonthData>({});
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [usingCache, setUsingCache] = useState(false);

  const getCachedMonthData = useCallback(async (year, month) => {
    // Fetch from Supabase Storage
  }, []);

  const saveMonthDataToStorage = useCallback(async (year, month, data) => {
    // Save to Supabase Storage
  }, []);

  const isDataStale = useCallback(() => {
    if (!lastUpdated) return true;
    const hoursSinceUpdate = (Date.now() - lastUpdated) / (1000 * 60 * 60);
    return hoursSinceUpdate > 1; // Stale after 1 hour
  }, [lastUpdated]);

  return {
    monthData,
    setMonthData,
    loading,
    lastUpdated,
    usingCache,
    getCachedMonthData,
    saveMonthDataToStorage,
    isDataStale
  };
}
```

### 2. useReservationAccounts Hook

**Purpose**: Manage tennis reservation accounts

**Key Functions**:
```typescript
export function useReservationAccounts() {
  const [tennisAccount, setTennisAccount] = useState({
    nowon_id: '',
    nowon_pass: '',
    dobong_id: '',
    dobong_pass: ''
  });
  const [showAccountModal, setShowAccountModal] = useState(false);

  const loadUserAccounts = useCallback(async () => {
    // Fetch from tennis_reservation_profile
  }, []);

  const saveAccounts = useCallback(async (accounts) => {
    // Save to tennis_reservation_profile
  }, []);

  const validateAccounts = useCallback((accounts) => {
    return accounts.nowon_id && accounts.nowon_pass &&
           accounts.dobong_id && accounts.dobong_pass;
  }, []);

  return {
    tennisAccount,
    showAccountModal,
    setShowAccountModal,
    loadUserAccounts,
    saveAccounts,
    validateAccounts
  };
}
```

### 3. useCourtCrawler Hook

**Purpose**: Handle court availability crawling

**Key Functions**:
```typescript
export function useCourtCrawler(tennisAccount) {
  const [crawlProgress, setCrawlProgress] = useState({ current: 0, total: 0 });

  const crawlDobong = useCallback(async (dateStr: string) => {
    // Proxy call to crawl Dobong
  }, [tennisAccount]);

  const crawlNowon = useCallback(async (dates: string[]) => {
    // Proxy call to crawl Nowon
  }, [tennisAccount]);

  const crawlMonthData = useCallback(async (year, month, forceRefresh = false) => {
    // Crawl entire month from both regions
  }, [crawlDobong, crawlNowon]);

  return {
    crawlProgress,
    crawlDobong,
    crawlNowon,
    crawlMonthData
  };
}
```

### 4. useReservationSelection Hook

**Purpose**: Manage user's court/time selections

**Key Functions**:
```typescript
export function useReservationSelection() {
  const [selectedReservations, setSelectedReservations] = useState<SelectedReservation[]>([]);

  const handleReservationSelect = useCallback((court, courtNum, time, date) => {
    // Add or remove from selection
  }, []);

  const clearSelections = useCallback(() => {
    setSelectedReservations([]);
  }, []);

  const isSelected = useCallback((court, courtNum, time) => {
    return selectedReservations.some(r =>
      r.court === court && r.court_num === courtNum && r.time === time
    );
  }, [selectedReservations]);

  return {
    selectedReservations,
    handleReservationSelect,
    clearSelections,
    isSelected
  };
}
```

### 5. useReservationSubmit Hook

**Purpose**: Handle reservation submission

**Key Functions**:
```typescript
export function useReservationSubmit(tennisAccount) {
  const [submitting, setSubmitting] = useState(false);

  const submitNowonReservations = useCallback(async (reservations) => {
    // Submit to Nowon system
  }, [tennisAccount]);

  const submitDobongReservations = useCallback(async (reservations) => {
    // Submit to Dobong system
  }, [tennisAccount]);

  const submitAllReservations = useCallback(async (reservations) => {
    // Split by region and submit
    const nowonReservations = reservations.filter(r => r.court.includes('노원'));
    const dobongReservations = reservations.filter(r => r.court.includes('도봉'));

    const results = [];

    if (nowonReservations.length > 0) {
      const nowonResults = await submitNowonReservations(nowonReservations);
      results.push(...nowonResults);
    }

    if (dobongReservations.length > 0) {
      const dobongResults = await submitDobongReservations(dobongReservations);
      results.push(...dobongResults);
    }

    return results;
  }, [submitNowonReservations, submitDobongReservations]);

  return {
    submitting,
    submitAllReservations
  };
}
```

### 6. useReservationHistory Hook (for Profile page)

**Purpose**: Fetch and display reservation history

**Key Functions**:
```typescript
export function useReservationHistory(tennisAccount) {
  const [nowonHistory, setNowonHistory] = useState([]);
  const [dobongHistory, setDobongHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchNowonHistory = useCallback(async () => {
    // Fetch from Nowon API
  }, [tennisAccount]);

  const fetchDobongHistory = useCallback(async () => {
    // Fetch from Dobong API
  }, [tennisAccount]);

  const fetchAllHistory = useCallback(async () => {
    await Promise.all([
      fetchNowonHistory(),
      fetchDobongHistory()
    ]);
  }, [fetchNowonHistory, fetchDobongHistory]);

  return {
    nowonHistory,
    dobongHistory,
    loading,
    fetchAllHistory
  };
}
```

## 📋 Proposed Utils Structure

### constants.ts
```typescript
export const PROXY_URL = 'http://kwtc.dothome.co.kr/proxy.php';

export const NOWON_PAYMENT_URL = 'https://reservation.nowonsc.kr/';
export const DOBONG_PAYMENT_URL = 'https://yeyak.dobongsiseol.or.kr/rent/index.php?c_id=05&page_info=index&n_type=rent&c_ox=0';

export const TIME_SLOTS = [
  "07:00", "08:00", "09:00", "10:00", "11:00",
  "12:00", "13:00", "14:00", "15:00", "16:00",
  "17:00", "18:00", "19:00", "20:00", "21:00"
];

export const COURT_MAPPINGS = {
  nowon: {
    '중랑테니스장': { '1': 'C1', '2': 'C2', '3': 'C3', '4': 'C4' },
    '노원테니스장': { '1': 'C1', '2': 'C2', '3': 'C3' }
  },
  dobong: {
    '도봉테니스장': { '1': 'C1', '2': 'C2', '3': 'C3', '4': 'C4', '5': 'C5' }
  }
};

export const CACHE_EXPIRY_HOURS = 1;
```

### courtMapping.ts
```typescript
export function getDisplayCourtNum(court_num: string): string {
  if (court_num.startsWith('C')) {
    return court_num.substring(1) + '번';
  }
  return court_num;
}

export function getCourtHeaderClass(court: string): string {
  if (court.includes('노원')) return 'court-nowon';
  if (court.includes('도봉')) return 'court-dobong';
  if (court.includes('중랑')) return 'court-jungnang';
  return 'court-default';
}

export function getCellClass(status: string | undefined, court: string): string {
  if (!status) return '';

  const baseClass = status === '가능' ? 'available' :
                    status === '불가' ? 'unavailable' :
                    status === '예약완료' ? 'reserved' : '';

  const courtClass = getCourtHeaderClass(court).replace('court-', '');

  return `${baseClass} ${courtClass}`;
}
```

### calendar.ts (can reuse from Event page)
```typescript
export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

export function formatDateForAPI(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
```

## 🎨 CSS Consolidation Strategy

### Current State
- **UnifiedreservationPage.css**: 808 lines
- **ReservationProfile.css**: 1,320 lines
- **ReservationSuccessPage.css**: 236 lines
- **Total**: 2,364 lines

### Proposed Structure

**reservation-shared.css** (~1,650 lines):
```css
/* Import global design system */
@import '../../../styles/shared.css';

/* ========== Reservation Calendar ========== */
.reservation-page { ... }
.reservation-calendar { ... }
.reservation-table { ... }

/* ========== Court Selection ========== */
.court-header { ... }
.court-cell { ... }
.court-cell.available { ... }
.court-cell.unavailable { ... }

/* ========== Account Modal ========== */
.account-modal { ... }
.account-form { ... }

/* ========== Profile Page ========== */
.profile-container { ... }
.reservation-history { ... }

/* ========== Success Page ========== */
.success-container { ... }
.success-card { ... }

/* ========== Responsive Design ========== */
@media (max-width: 768px) { ... }
```

**Estimated Reduction**: 30% (2,364 → ~1,650 lines)

## 📊 Expected Impact

### Code Metrics

| Metric | Before | After | Change |
|--------|--------|-------|--------|
| **TypeScript Total** | 2,902 lines | ~1,830 lines | **-37%** |
| **CSS Total** | 2,364 lines | ~1,650 lines | **-30%** |
| **Total LOC** | 5,266 lines | ~3,480 lines | **-34%** |
| **Number of Files** | 6 files | ~15 files | Better organization |
| **Largest Component** | 1,235 lines | ~250 lines | **-80%** |

### Quality Improvements

| Aspect | Before | After |
|--------|--------|-------|
| **Modularity** | ❌ Monolithic | ✅ Highly modular |
| **Testability** | ❌ Very difficult | ✅ Easy with hooks |
| **Reusability** | ❌ None | ✅ High |
| **Maintainability** | ❌ Very low | ✅ High |
| **Type Safety** | ⚠️ Partial | ✅ Complete |
| **Design System** | ❌ No | ✅ Yes |

## 🚀 Implementation Priority

### Phase 1: Critical Hooks (Highest Impact)
1. ✅ **Create hooks directory**
2. ⏳ **useReservationData** - Caching logic
3. ⏳ **useCourtCrawler** - Crawling logic
4. ⏳ **useReservationAccounts** - Account management

### Phase 2: Feature Hooks
5. ⏳ **useReservationSelection** - Selection state
6. ⏳ **useReservationSubmit** - Submission logic
7. ⏳ **useReservationHistory** - Profile page

### Phase 3: Utils & Constants
8. ⏳ **constants.ts** - All constants
9. ⏳ **courtMapping.ts** - Court utilities
10. ⏳ **calendar.ts** - Date utilities

### Phase 4: Component Refactoring
11. ⏳ **ReservationPage.tsx** - Main component
12. ⏳ **ReservationProfile.tsx** - Profile component
13. ⏳ **ReservationSuccessPage.tsx** - Success component

### Phase 5: CSS & Polish
14. ⏳ **reservation-shared.css** - Consolidated CSS
15. ⏳ **Testing & Bug fixes**
16. ⏳ **Documentation**

## 💡 Key Challenges

### Technical Challenges

1. **External API Dependencies**
   - Proxy server crawling both regions
   - Different API formats for Nowon vs Dobong
   - Error handling for network failures

2. **Complex State Management**
   - Month data with caching
   - Multi-region reservations
   - Selection state across calendar

3. **Caching Strategy**
   - Supabase Storage for cache
   - Cache invalidation logic
   - Stale data detection

4. **Multi-Step Reservation Flow**
   - Account validation → Data loading → Selection → Submission → Success
   - Different flows for each region

### Solutions

- **Hooks for Separation**: Each complex area gets its own hook
- **Clear Interfaces**: TypeScript interfaces for all data structures
- **Error Boundaries**: Proper error handling at each step
- **Loading States**: Clear feedback during async operations

## 🎯 Success Criteria

When refactoring is complete:

- [ ] UnifiedreservationPage.tsx reduced to < 300 lines
- [ ] 6+ reusable hooks created
- [ ] All business logic extracted from components
- [ ] CSS reduced by 30%+
- [ ] Global design system variables used
- [ ] TypeScript types for all data structures
- [ ] No functionality lost
- [ ] All existing features work identically
- [ ] Code is more maintainable
- [ ] Components are testable

## 📝 Notes

### Why This is Important

The Reservation pages are the **most complex feature** in the KWTC app:
- 5,266 lines of code (25% of entire app)
- External API integration
- Multi-region support
- Complex business logic
- Critical user feature

**Refactoring Benefits**:
1. **Maintainability**: Much easier to fix bugs
2. **Feature Additions**: Easy to add new courts/regions
3. **Testing**: Can unit test isolated hooks
4. **Performance**: Optimized with proper memoization
5. **Developer Experience**: New developers can understand code faster

### Recommendations

1. **Start with Hooks**: Create all hooks first
2. **Test Incrementally**: Test each hook independently
3. **Preserve Functionality**: Don't change behavior
4. **Document Edge Cases**: Document proxy behavior, error cases
5. **Consider Migration**: May need database migrations if changing data structure

## 🏁 Conclusion

The Reservation pages require a comprehensive refactoring to:
- **Extract 1,000+ lines of inline logic** into reusable hooks
- **Reduce component size by 80%** (1,235 → ~250 lines)
- **Consolidate CSS by 30%** (2,364 → ~1,650 lines)
- **Improve maintainability dramatically**
- **Enable future features** (new courts, new regions, etc.)

This is the **most important refactoring** remaining in the KWTC application.

---

**Generated**: October 29, 2025
**Status**: ⏳ Plan Created - Implementation Recommended
**Estimated Effort**: 8-12 hours for complete refactoring
**Priority**: High - Most complex feature in application
