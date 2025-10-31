/**
 * Tier configuration and information
 */

export interface TierInfo {
  name: string;
  color: string;
  icon: string;
  gradient: string;
}

export type TierInfoMap = {
  [key: number]: TierInfo;
};

export const TIER_INFO: TierInfoMap = {
  1: {
    name: 'Challenger',
    color: '#B9F2FF',
    icon: '/rank-tier-icon/tier_challenger.png',
    gradient: 'linear-gradient(135deg, #B9F2FF, #87CEEB)'
  },
  2: {
    name: 'Master',
    color: '#d1b3ff',
    icon: '/rank-tier-icon/tier_master.png',
    gradient: 'linear-gradient(135deg, #d1b3ff, #b39ddb)'
  },
  3: {
    name: 'Emerald',
    color: '#50C878',
    icon: '/rank-tier-icon/tier_emerald.png',
    gradient: 'linear-gradient(135deg, #E6E6FA, #50C878)'
  },
  4: {
    name: 'Gold',
    color: '#FFE135',
    icon: '/rank-tier-icon/tier_gold.png',
    gradient: 'linear-gradient(135deg, #FFE135, #DAA520)'
  },
  5: {
    name: 'Silver',
    color: '#C0C0C0',
    icon: '/rank-tier-icon/tier_silver.png',
    gradient: 'linear-gradient(135deg, #C0C0C0, #A9A9A9)'
  },
  0: {
    name: 'Bronze',
    color: '#CD7F32',
    icon: '/rank-tier-icon/tier_bronze.png',
    gradient: 'linear-gradient(135deg, #CD7F32, #A0522D)'
  }
};

export const TIERS = [1, 2, 3, 4, 5];
export const TERINI_TIER = 0;
