# KWTC 웹 애플리케이션 배포 가이드

## 📦 Vercel 배포 가이드 (권장)

### 1단계: Vercel 계정 준비
1. [Vercel](https://vercel.com)에 가입 (GitHub 계정 연동 권장)
2. GitHub 리포지토리 준비

### 2단계: GitHub에 코드 푸시
```bash
# Git 초기화 (아직 안 했다면)
git init
git add .
git commit -m "Initial commit"

# GitHub 리포지토리 생성 후
git remote add origin https://github.com/your-username/kwtc-web.git
git push -u origin master
```

**⚠️ 중요**: `.env` 파일이 푸시되지 않았는지 확인!
```bash
# .env 파일이 목록에 없어야 함
git status
```

### 3단계: Vercel에서 프로젝트 import
1. Vercel 대시보드 → "Add New..." → "Project"
2. GitHub 리포지토리 선택
3. 프로젝트 설정:
   - **Framework Preset**: Vite
   - **Root Directory**: `./` (기본값)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

### 4단계: 환경 변수 설정
**Settings → Environment Variables**에서 추가:

```
VITE_SUPABASE_URL=https://aftlhyhiskoeyflfiljr.supabase.co
VITE_SUPABASE_ANON_KEY=your_actual_anon_key_here
```

**모든 환경에 적용**: Production, Preview, Development 모두 체크

### 5단계: 배포
"Deploy" 버튼 클릭 → 자동 빌드 및 배포 시작

---

## 🌐 커스텀 도메인 연결

### Vercel에서 도메인 추가
1. **Settings → Domains**
2. "Add" 클릭, 도메인 입력 (예: kwtc.com)
3. DNS 설정 가이드에 따라 설정:

#### A 레코드 방식
```
Type: A
Name: @
Value: 76.76.21.21
TTL: 3600
```

#### CNAME 방식 (서브도메인)
```
Type: CNAME
Name: www (또는 다른 서브도메인)
Value: cname.vercel-dns.com
TTL: 3600
```

### 도메인 구매처
- [가비아](https://gabia.com) - 한국어 지원, 국내 신용카드 결제
- [Namecheap](https://namecheap.com) - 저렴한 .com 도메인
- [Cloudflare Registrar](https://cloudflare.com) - 도메인 + CDN 통합

---

## 🔐 Supabase 설정 업데이트

배포 후 Supabase 대시보드에서 설정 업데이트:

### 1. Authentication → URL Configuration
```
Site URL: https://your-domain.vercel.app
```

### 2. Authentication → Redirect URLs
```
https://your-domain.vercel.app/**
https://your-domain.vercel.app/login
https://your-domain.vercel.app/signup
```

### 3. Edge Functions
- Edge Functions가 제대로 작동하는지 테스트
- Function URL: `https://your-project.supabase.co/functions/v1/function-name`

---

## 🧪 배포 후 테스트

### 필수 테스트 항목
- [ ] 로그인/로그아웃
- [ ] 회원가입
- [ ] 게시글 작성/조회
- [ ] 랭킹 페이지 로드
- [ ] 예약 페이지 기능
- [ ] 관리자 페이지 접근 (관리자 계정)
- [ ] 이미지 업로드
- [ ] 프로필 수정

### 성능 테스트
```bash
# Lighthouse 점수 확인 (Chrome DevTools)
# Performance, Accessibility, Best Practices, SEO
```

---

## 🚨 트러블슈팅

### 빌드 오류: "Module not found"
```bash
# 로컬에서 빌드 테스트
npm run build

# node_modules 재설치
rm -rf node_modules package-lock.json
npm install
```

### 환경 변수가 작동하지 않음
1. Vercel 환경 변수에 `VITE_` 접두사가 있는지 확인
2. 재배포: Deployments → 점 3개 → "Redeploy"
3. 빌드 로그에서 환경 변수 확인 (값은 숨겨짐)

### 404 에러 (페이지 새로고침 시)
- `vercel.json` 파일이 있는지 확인 (이미 생성됨)
- SPA 라우팅을 위한 리다이렉트 설정 확인

### Supabase 연결 오류
1. Supabase URL과 Anon Key 재확인
2. Supabase 프로젝트가 "Paused" 상태가 아닌지 확인
3. CORS 설정 확인 (Supabase는 기본적으로 모든 도메인 허용)

---

## 📊 배포 체크리스트

### 배포 전
- [x] 보안 검토 완료 (`SECURITY.md` 참고)
- [x] `.env` 파일이 `.gitignore`에 등록됨
- [ ] 로컬에서 빌드 테스트 (`npm run build`)
- [ ] 모든 기능 로컬 테스트 완료
- [ ] Supabase Edge Functions 배포 완료

### 배포 중
- [ ] GitHub 리포지토리에 코드 푸시
- [ ] Vercel 프로젝트 생성
- [ ] 환경 변수 설정
- [ ] 초기 배포 성공

### 배포 후
- [ ] Supabase URL 설정 업데이트
- [ ] 전체 기능 테스트
- [ ] 성능 측정 (Lighthouse)
- [ ] 모바일 환경 테스트
- [ ] 관리자 기능 테스트

---

## 🔄 자동 배포 (CI/CD)

Vercel은 자동으로 CI/CD를 설정합니다:

- **master 브랜치 푸시** → 프로덕션 자동 배포
- **다른 브랜치 푸시** → 프리뷰 배포 (테스트용)
- **Pull Request** → 자동 프리뷰 배포 + 댓글로 URL 제공

### 배포 워크플로우
```
로컬 개발 → git push → Vercel 자동 빌드 → 배포 완료 → 알림
```

---

## 💰 비용

### Vercel Free Tier
- 무제한 배포
- 100GB 대역폭/월
- 빌드 시간: 6000분/월
- **예상 비용: $0** (KWTC 규모로는 충분)

### 도메인 비용
- .com 도메인: 약 $10~15/년
- .kr 도메인: 약 ₩20,000~30,000/년

### Supabase Free Tier
- 500MB 데이터베이스
- 1GB 파일 스토리지
- 50,000 월간 활성 사용자
- **예상 비용: $0** (소규모 동아리에 충분)

---

## 📱 배포 후 접근 방법

### 기본 Vercel URL
```
https://your-project-name.vercel.app
```

### 커스텀 도메인 (설정 시)
```
https://kwtc.com
https://www.kwtc.com
```

---

## 🎉 배포 완료!

배포가 완료되면:
1. 팀원들에게 URL 공유
2. 관리자 계정 생성 및 권한 부여
3. 첫 게시글 작성
4. 랭킹 시스템 초기 설정
5. 예약 시스템 테스트

---

## 📞 문제 발생 시

1. **Vercel 빌드 로그 확인**: Deployments → 해당 배포 클릭 → "Building"
2. **Vercel 런타임 로그**: Deployments → "Functions" 탭
3. **Supabase 로그**: Supabase Dashboard → Logs
4. **브라우저 콘솔**: F12 → Console 탭

---

## 🔗 유용한 링크

- [Vercel 문서](https://vercel.com/docs)
- [Vite 배포 가이드](https://vitejs.dev/guide/static-deploy.html)
- [Supabase 문서](https://supabase.com/docs)
- [React Router 설정](https://reactrouter.com/en/main/guides/spa)

---

**작성일**: 2025-10-31
**최종 업데이트**: 2025-10-31
**담당자**: KWTC 개발팀
