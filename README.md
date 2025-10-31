# 🎾 KWTC - 광운대학교 테니스 동아리

광운대학교 테니스 동아리 KWTC의 공식 웹사이트입니다.

## 📋 주요 기능

- **🏠 홈**: 동아리 소개 및 메인 대시보드
- **📝 게시판**: 공지사항 및 자유게시판
- **🏆 랭킹**: 멤버 실력 랭킹 시스템 (티어 기반)
- **📅 일정**: 동아리 이벤트 및 일정 관리
- **🎯 예약**: 테니스 코트 예약 시스템 (도봉, 노원 구립 코트)
- **👤 프로필**: 개인 프로필 및 예약 이력 관리
- **🔐 인증**: 회원가입, 로그인, 관리자 승인 시스템

## 🛠️ 기술 스택

### Frontend
- **React 19** - UI 라이브러리
- **TypeScript 5.8** - 타입 안정성
- **Vite 7** - 빌드 도구
- **React Router 7** - 라우팅

### Backend & Database
- **Supabase** - BaaS (PostgreSQL, Authentication, Storage)

## 🚀 시작하기

### 설치

```bash
# 의존성 설치
npm install

# 환경 변수 설정
cp .env.example .env
# .env 파일에 Supabase 정보 입력

# 개발 서버 실행
npm run dev
```

### 빌드

```bash
# 프로덕션 빌드
npm run build

# 미리보기
npm run preview
```

## 📁 프로젝트 구조

```
kwtc-web/
├── src/
│   ├── components/     # 재사용 컴포넌트
│   ├── pages/          # 페이지
│   └── services/       # API 서비스
├── public/             # 정적 파일
└── docs/               # 문서
```

## 📄 라이선스

MIT License

---

**광운대학교 테니스 동아리 KWTC** 🎾
