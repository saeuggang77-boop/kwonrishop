# 권리샵 (KwonriShop) - 상가직거래 플랫폼

상가 권리금 직거래를 위한 올인원 플랫폼

## 주요 기능

- **매물 관리**: 7단계 위저드 등록, 상세필터 검색, 지도뷰
- **프랜차이즈 정보**: 공정거래위원회 API 연동
- **1:1 채팅**: 실시간 메시징
- **커뮤니티**: 게시판 및 댓글
- **사업자 인증**: 국세청 API 연동
- **광고 상품**: 프리미엄 매물 노출
- **결제 시스템**: 토스페이먼츠 연동
- **관리자 대시보드**: 매물/사용자/결제/신고 관리

## 기술 스택

- **Frontend**: Next.js 16 (App Router), React 19, Tailwind CSS v4
- **Backend**: Next.js API Routes, Prisma 7
- **Database**: PostgreSQL
- **Auth**: NextAuth.js (카카오, 네이버)
- **Payment**: 토스페이먼츠
- **Storage**: AWS S3 / Cloudflare R2
- **Map**: 카카오맵 API
- **Monitoring**: Sentry
- **Testing**: Playwright E2E
- **Deploy**: Vercel

## 시작하기

### 요구사항
- Node.js 20+
- PostgreSQL 15+
- npm

### 설치

1. 의존성 설치
```bash
npm install
```

2. 환경변수 설정
```bash
cp .env.example .env
# .env 파일에 실제 값 입력
```

3. DB 마이그레이션
```bash
npx prisma migrate dev
```

4. 시드 데이터
```bash
npx prisma db seed
```

5. 개발 서버
```bash
npm run dev
```

http://localhost:3000 에서 확인

### 주요 명령어

```bash
npm run dev          # 개발 서버
npm run build        # 프로덕션 빌드
npm run start        # 프로덕션 서버
npm run test:e2e     # E2E 테스트
npx prisma studio    # DB 관리 UI
npx prisma migrate dev  # 마이그레이션
```

## 프로젝트 구조

```
src/
├── app/              # Pages & API routes (App Router)
│   ├── (auth)/       # 로그인/회원가입
│   ├── (main)/       # 메인 서비스 (매물, 커뮤니티 등)
│   ├── admin/        # 관리자 대시보드
│   └── api/          # API 엔드포인트
├── components/       # React 컴포넌트
│   ├── ui/           # 재사용 UI 컴포넌트
│   ├── layout/       # 레이아웃 컴포넌트
│   └── features/     # 기능별 컴포넌트
├── lib/              # 유틸리티
│   ├── prisma.ts     # Prisma 클라이언트
│   ├── auth.ts       # NextAuth 설정
│   ├── s3.ts         # S3 업로드
│   └── toss.ts       # 토스페이먼츠
├── hooks/            # Custom React hooks
├── store/            # Zustand stores
├── types/            # TypeScript 타입
└── generated/        # Prisma 생성 파일
```

## 환경변수

`.env.example` 참고

주요 환경변수:
- `DATABASE_URL`: PostgreSQL 연결 문자열
- `AUTH_SECRET`: NextAuth 시크릿
- `AUTH_KAKAO_ID/SECRET`: 카카오 OAuth
- `AUTH_NAVER_ID/SECRET`: 네이버 OAuth
- `NEXT_PUBLIC_KAKAO_MAP_KEY`: 카카오맵 API 키
- `NTS_API_KEY`: 국세청 API 키
- `FTC_API_KEY`: 공정거래위원회 API 키
- `TOSS_CLIENT_KEY/SECRET`: 토스페이먼츠
- `S3_*`: S3 스토리지 설정
- `NEXT_PUBLIC_SENTRY_DSN`: Sentry 모니터링

## 배포

Vercel에 연결 후 환경변수 설정하면 자동 배포

### Vercel 환경변수 설정
1. Vercel 프로젝트 설정 > Environment Variables
2. `.env.example`의 모든 변수를 Production/Preview/Development에 설정
3. Git push 시 자동 배포

### DB 마이그레이션 (프로덕션)
```bash
npx prisma migrate deploy
```

## 라이선스

MIT

## 문의

이슈나 문의사항은 GitHub Issues로 등록해주세요.
