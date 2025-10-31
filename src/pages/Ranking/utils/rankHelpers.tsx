import React from 'react';

/**
 * Get rank medal component based on rank and racket type
 */
export function getRankMedal(rank: number, raket?: string): React.ReactNode {
  if (rank === 1) {
    return (
      <span className="rank-medal-img-wrapper rank-medal-only">
        <span className="rank-medal-number rank-medal-number-1">1</span>
        <img
          src={
            raket && raket !== 'none'
              ? `/rank-top/rank-top-${raket}.png`
              : `/rank-top/rank-top.png`
          }
          alt={`${raket && raket !== 'none' ? raket + ' 라켓' : '1등 메달'}`}
          className="rank-top-medal"
        />
      </span>
    );
  }

  if (rank === 2) {
    return (
      <span className="rank-medal-img-wrapper rank-medal-only">
        <span className="rank-medal-number rank-medal-number-2">2</span>
        <img
          src={
            raket && raket !== 'none'
              ? `/rank-second/rank-second-${raket}.png`
              : `/rank-second/rank-second.png`
          }
          alt={`${raket && raket !== 'none' ? raket + ' 라켓' : '2등 메달'}`}
          className="rank-second-medal"
        />
      </span>
    );
  }

  if (rank === 3) {
    return (
      <span className="rank-medal-img-wrapper rank-medal-only">
        <span className="rank-medal-number rank-medal-number-3">3</span>
        <img
          src={
            raket && raket !== 'none'
              ? `/rank-third/rank-third-${raket}.png`
              : `/rank-third/rank-third.png`
          }
          alt={`${raket && raket !== 'none' ? raket + ' 라켓' : '3등 메달'}`}
          className="rank-third-medal"
        />
      </span>
    );
  }

  return null;
}

/**
 * Get default profile image URL
 */
export function getDefaultProfileImage(): string {
  return "https://aftlhyhiskoeyflfiljr.supabase.co/storage/v1/object/public/profile-image/base_profile.png";
}
