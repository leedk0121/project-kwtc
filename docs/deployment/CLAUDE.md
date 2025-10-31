# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a React + TypeScript + Vite application for a tennis club management system (KWTC - Korea Weekday Tennis Club). The application includes member management, court reservations, rankings, voting, and a community board.

## Development Commands

### Running the Application
```bash
npm run dev          # Start development server (Vite)
npm run build        # Build for production (runs TypeScript compiler + Vite build)
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

### TypeScript
- The project uses TypeScript ~5.8.3 with React 19
- Type checking is done during build via `tsc -b`
- Config split into `tsconfig.json` (root), `tsconfig.app.json`, and `tsconfig.node.json`

## Architecture

### Frontend Structure

**Routing (src/App.tsx)**
- Uses React Router with two layout patterns:
  - `LayoutWithHeader`: Standard pages with header navigation
  - Standalone: Pages without header (admin, reservation success)
- Main routes: `/board`, `/ranking`, `/intro`, `/participate` (voting), `/reservation`, `/admin/*`

**Pages Organization**
- `pages/auth/`: Authentication (login, signup, profile)
- `pages/Board/`: Community board with posts
- `pages/Admin/`: Admin dashboard, role management, rank editing, post editing, login approvals
- `pages/reservation/`: Court reservation system
- `pages/Vote/`: Member voting/participation features
- `pages/Intro/`: Introduction pages
- `components/`: Shared UI components (Header, ProfileDetail, ShowMember, etc.)

**Services Layer**
- `services/adminService.ts`: Admin operations via Supabase Edge Functions (bypasses RLS)
- `services/adminHOC.tsx`: Higher-order component for admin route protection
- `services/dobongCrawler.ts`: Web scraping service for court availability (calls external PHP proxy)

### Backend (Supabase)

**Edge Functions (supabase/functions/)**
All Edge Functions use Deno runtime v2 and JWT verification:
- `admin-operations`: Handles admin operations (user management, role changes, RLS bypass)
- `check-approved-login`: Validates user approval status
- `set-admin-role`: Sets/removes admin privileges
- `crawl-tennis`: Tennis court availability scraping
- `crawl-nowon-reservation`: Nowon district court scraping
- `nowon-reservation`: Make reservations for Nowon courts
- `cancel-nowon-reservation`: Cancel Nowon court reservations

**Database Client**
- Supabase client configured in `src/pages/auth/supabaseClient.tsx`
- Uses Row Level Security (RLS) for data access control
- Admin operations bypass RLS via Edge Functions using service role key

**Local Development**
- Supabase local development available (config in `supabase/config.toml`)
- API runs on port 54321, DB on 54322, Studio on 54323
- Project ID: `project_kwtc`

### Authentication & Authorization

**User Roles**
- Regular users: Can view content, make reservations, post on board
- Admin users: Identified by `profile.is_admin` field
- Admin approval required: Users need approval before full access (`check-approved-login`)

**Admin Protection Pattern**
```typescript
// Wrap admin pages with HOC
import { withAdminAuth } from '../services/adminHOC';
export default withAdminAuth(YourAdminPage);
```

**Admin Service Usage**
```typescript
import { adminService } from '../services/adminService';

// Check admin status
const isAdmin = await adminService.checkIsAdmin();

// Admin operations (all call Edge Functions)
await adminService.approveUser(userId);
await adminService.setAdminRole(userId, true);
await adminService.deleteUser(userId);
const users = await adminService.getAllUsers();
```

### Key Technical Patterns

**Web Scraping Architecture**
- External PHP proxy at `http://kwtc.dothome.co.kr/proxy.php` handles scraping
- `dobongCrawler.ts` sends requests with credentials and date
- Returns parsed court availability data
- Includes health check endpoint

**Data Flow**
1. Frontend (React) → Supabase Client (RLS applied)
2. Admin operations → `adminService` → Edge Functions → Supabase (RLS bypassed with service role)
3. Court scraping → `dobongCrawler` → External PHP proxy → District websites

**State Management**
- Component-level state with React hooks
- No global state management library
- Supabase real-time subscriptions for live updates

## Important Notes

- Admin credentials and service role keys should ONLY be in Edge Functions (server-side)
- The public Supabase anon key in `supabaseClient.tsx` is safe to commit (as it's client-facing)
- All user-facing operations use RLS for security
- Edge Functions have `verify_jwt: true` enabled for authentication
