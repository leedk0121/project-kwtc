# 🚀 KWTC 웹 배포 전 최종 체크리스트

**배포 예정일**: _________
**담당자**: _________
**검토자**: _________

---

## ✅ 1. 보안 검토 (SECURITY.md 참고)

- [x] `.env` 파일이 Git에 추적되지 않음
- [x] 환경 변수가 `.gitignore`에 등록됨
- [x] Supabase Anon Key 노출 확인 (공개 OK, RLS로 보호됨)
- [x] XSS 취약점 점검 완료
- [x] SQL Injection 방어 확인
- [x] 관리자 권한 보호 확인
- [ ] **Supabase RLS 정책 활성화 및 테스트**
- [x] Edge Functions 보안 검증

**보안 점수**: 8.9/10 ✅

---

## ✅ 2. 코드 품질

- [x] 빌드 성공 확인 (`npm run build`)
  ```
  ✓ built in 6.30s
  ```
- [x] TypeScript 에러 없음
- [x] 모든 import 경로 정상
- [x] 이미지 및 정적 파일 경로 확인
- [ ] 사용하지 않는 코드 제거
- [ ] Console.log 정리 (190개 발견 - 선택사항)

---

## ✅ 3. 기능 테스트

### 인증 기능
- [ ] 회원가입 (이메일 인증)
- [ ] 로그인 (승인된 사용자)
- [ ] 로그아웃
- [ ] 비밀번호 재설정
- [ ] 프로필 수정

### 게시판 기능
- [ ] 게시글 목록 조회
- [ ] 게시글 작성
- [ ] 게시글 상세 보기
- [ ] 이미지 업로드
- [ ] 게시글 타입별 필터링

### 랭킹 시스템
- [ ] 랭킹 목록 조회
- [ ] 티어별 필터링
- [ ] 프로필 상세 보기

### 예약 시스템
- [ ] 노원구 코트 조회
- [ ] 도봉구 코트 조회
- [ ] 예약 신청
- [ ] 예약 내역 조회
- [ ] 예약 취소

### 관리자 기능
- [ ] 관리자 페이지 접근
- [ ] 사용자 승인
- [ ] 랭킹 관리 (드래그 앤 드롭)
- [ ] 랭킹 참여자 관리
- [ ] 게시글 관리
- [ ] 전공 관리
- [ ] 관리자 권한 부여

---

## ✅ 4. 환경 설정

### 로컬 환경 (.env)
- [x] `VITE_SUPABASE_URL` 설정됨
- [x] `VITE_SUPABASE_ANON_KEY` 설정됨

### 프로덕션 환경 (Vercel)
- [ ] Vercel 프로젝트 생성
- [ ] 환경 변수 등록:
  - [ ] `VITE_SUPABASE_URL`
  - [ ] `VITE_SUPABASE_ANON_KEY`
- [ ] 모든 환경(Production/Preview/Development)에 적용

### Supabase 설정
- [ ] Authentication → Site URL 업데이트
- [ ] Authentication → Redirect URLs 추가
- [ ] Edge Functions 배포 확인:
  - [ ] `admin-operations`
  - [ ] `check-approved-login`
  - [ ] `crawl-nowon-reservation`
  - [ ] `cancel-nowon-reservation`

---

## ✅ 5. Supabase RLS 정책 ⚠️ 중요!

### profile 테이블
- [ ] RLS 활성화됨
- [ ] 본인 프로필 읽기 정책
- [ ] 본인 프로필 수정 정책
- [ ] 테스트: 다른 사용자 프로필 접근 차단 확인

### tennis_reservation_profile 테이블
- [ ] RLS 활성화됨
- [ ] 본인 예약 프로필 읽기 정책
- [ ] 본인 예약 프로필 수정 정책
- [ ] 테스트: 다른 사용자 예약 정보 접근 차단 확인

### posts 테이블
- [ ] RLS 활성화됨
- [ ] 모든 사용자 읽기 허용
- [ ] 작성자만 수정/삭제 가능
- [ ] 테스트: 다른 사용자 게시글 수정 차단 확인

### ranked_user 테이블
- [ ] RLS 활성화됨
- [ ] 모든 사용자 읽기 허용
- [ ] 관리자만 수정 가능 (Edge Function)
- [ ] 테스트: 일반 사용자 랭킹 수정 차단 확인

### events 테이블
- [ ] RLS 활성화됨
- [ ] 모든 사용자 읽기 허용
- [ ] 관리자만 작성/수정/삭제

### leaders 테이블
- [ ] RLS 활성화됨
- [ ] 모든 사용자 읽기 허용
- [ ] 관리자만 수정 가능

### major_list 테이블
- [ ] RLS 활성화됨
- [ ] 모든 사용자 읽기 허용
- [ ] 관리자만 수정 가능

---

## ✅ 6. 성능 최적화

- [x] 코드 스플리팅 (react-vendor, supabase, calendar)
- [x] 이미지 최적화 (WebP 사용 권장 - 선택사항)
- [ ] Lighthouse 점수 확인:
  - [ ] Performance > 70
  - [ ] Accessibility > 80
  - [ ] Best Practices > 80
  - [ ] SEO > 70

---

## ✅ 7. 파일 확인

### 새로 생성된 파일
- [x] `SECURITY.md` - 보안 검토 보고서
- [x] `DEPLOYMENT.md` - 배포 가이드
- [x] `vercel.json` - Vercel 설정 (보안 헤더 + SPA 라우팅)
- [x] `PRE_DEPLOYMENT_CHECKLIST.md` - 이 파일

### 기존 중요 파일
- [x] `.env` (로컬만, Git 제외)
- [x] `.env.example` (템플릿)
- [x] `.gitignore` (환경 변수 제외 확인)
- [x] `package.json` (의존성 확인)
- [x] `vite.config.ts` (빌드 설정)

---

## ✅ 8. Git 및 GitHub

- [ ] 모든 변경사항 커밋
- [ ] `.env` 파일이 푸시되지 않았는지 재확인
- [ ] GitHub 리포지토리 생성 (private 권장)
- [ ] 코드 푸시
- [ ] README.md 업데이트 (프로젝트 설명)

```bash
# 확인 명령어
git status  # .env가 없어야 함
git log -1  # 최신 커밋 확인
```

---

## ✅ 9. 배포 실행

### Vercel 배포
- [ ] Vercel에서 GitHub 리포지토리 import
- [ ] 빌드 설정 확인:
  - Framework: Vite
  - Build Command: `npm run build`
  - Output Directory: `dist`
- [ ] 첫 배포 완료
- [ ] 배포 URL 확인: `https://project-name.vercel.app`

### 배포 후 즉시 테스트
- [ ] 홈페이지 로드
- [ ] 로그인 시도
- [ ] 이미지 로드 확인
- [ ] 페이지 새로고침 (404 에러 없어야 함)
- [ ] 모바일 환경 테스트

---

## ✅ 10. 도메인 연결 (선택사항)

- [ ] 도메인 구매 (가비아, Namecheap 등)
- [ ] Vercel에 도메인 추가
- [ ] DNS 설정 (A 레코드 또는 CNAME)
- [ ] SSL 인증서 자동 발급 확인
- [ ] Supabase Redirect URLs에 커스텀 도메인 추가

---

## ✅ 11. 모니터링 설정

### Vercel
- [ ] 알림 설정 (배포 실패 시 이메일)
- [ ] 분석(Analytics) 활성화 (Pro 플랜)

### Supabase
- [ ] 이메일 알림 설정
- [ ] 사용량 모니터링 (Free Tier 한도)

---

## ✅ 12. 문서화

- [ ] 관리자 가이드 작성 (사용자 승인 방법 등)
- [ ] 사용자 매뉴얼 작성 (선택사항)
- [ ] 트러블슈팅 가이드 업데이트

---

## ✅ 13. 팀 공유

- [ ] 배포 URL 공유
- [ ] 관리자 계정 생성 및 권한 부여
- [ ] 초기 데이터 입력:
  - [ ] 리더 정보
  - [ ] 전공 목록
  - [ ] 초기 랭킹 설정
- [ ] 팀원 교육 (필요시)

---

## 🚨 배포 전 마지막 확인

### Critical Items (필수)
- [ ] ✅ `.env` 파일이 Git에 없음
- [ ] ✅ Supabase RLS 정책 활성화
- [ ] ✅ 프로덕션 환경 변수 설정
- [ ] ✅ Edge Functions 배포
- [ ] ✅ 빌드 성공 확인

### Important Items (중요)
- [ ] ⚠️ 기능 테스트 완료
- [ ] ⚠️ Supabase URL 설정 업데이트
- [ ] ⚠️ 보안 헤더 설정 (vercel.json)

### Nice to Have (권장)
- [ ] 💡 Console.log 정리
- [ ] 💡 성능 최적화
- [ ] 💡 커스텀 도메인 연결

---

## 📋 배포 후 24시간 내 확인사항

- [ ] 에러 로그 확인 (Vercel Functions)
- [ ] Supabase 사용량 확인
- [ ] 사용자 피드백 수집
- [ ] 성능 모니터링
- [ ] 모바일 환경 문제 없음

---

## ✅ 최종 승인

**검토 완료**:
- [ ] 보안 검토자: _________ (서명/날짜)
- [ ] 기능 테스트: _________ (서명/날짜)
- [ ] 최종 승인자: _________ (서명/날짜)

**배포 승인**: [ ] ✅ **준비 완료**

---

## 📞 긴급 연락처

- **Vercel 지원**: https://vercel.com/help
- **Supabase 지원**: https://supabase.com/dashboard/support
- **프로젝트 담당자**: _________

---

## 🎉 배포 완료 후

**배포 완료 시각**: _________
**배포 URL**: _________
**상태**: [ ] 성공 / [ ] 실패

**비고**:
```
_____________________________________
_____________________________________
_____________________________________
```

---

**이 체크리스트를 완료하면 안전하게 배포할 수 있습니다!** 🚀
