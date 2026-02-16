# 프로젝트 규칙 (절대 위반 금지)

## DB 보호
- prisma migrate reset 절대 사용 금지
- prisma migrate dev 실행 전 반드시 사용자에게 확인 요청
- seed 데이터 임의 삭제 금지
- DROP TABLE, TRUNCATE 등 데이터 삭제 쿼리 금지

## 배포
- git push는 명시적으로 "배포해줘" 또는 "푸시해줘"라고 할 때만 실행
- 자동으로 배포하지 말 것

## 파일 보호
- .env 파일 수정 금지
- prisma/schema.prisma 변경 시 반드시 사용자에게 확인 요청

---

# 권리샵 프로젝트 구조

## 기술 스택
- **프레임워크**: Next.js 16 (App Router) + React 19 + TypeScript 5
- **DB**: Prisma 7 + PostgreSQL (Neon) + `@prisma/adapter-pg`
- **인증**: NextAuth v5
- **결제**: TossPayments SDK
- **큐**: BullMQ + Redis (ioredis)
- **AWS**: S3(파일), KMS(암호화), SES(이메일)
- **CSS**: Tailwind CSS v4 (theme: `globals.css` @theme inline)
- **배포**: Vercel + AWS
- **브랜드**: navy=#1B3A5C, accent=#2EC4B6
- **폰트**: Noto Sans KR (본문), Montserrat (제목)
- **가격**: BigInt (KRW)
- **Zod**: `from "zod/v4"`

## 디렉토리 구조

```
kwonrishop/
├── prisma/                # 스키마, 마이그레이션, seed.ts
├── public/                # 정적 파일 (로고, 아이콘)
├── scripts/               # 빌드/유틸 스크립트
├── src/
│   ├── app/               # Next.js App Router
│   │   ├── (admin)/admin/ # 관리자 패널 (10 페이지)
│   │   ├── (auth)/        # 로그인/회원가입/인증
│   │   ├── (main)/        # 메인 앱 (모든 사용자 페이지)
│   │   ├── api/           # API 라우트 (95+)
│   │   ├── layout.tsx     # 루트 레이아웃
│   │   └── page.tsx       # 홈페이지
│   ├── components/        # 공유 컴포넌트
│   │   ├── listings/      # 매물 카드, 댓글, 비교, 진단 등 (21)
│   │   ├── notifications/ # 알림벨
│   │   └── ui/            # 버튼, 카드, 모달, 토스트 등 (11)
│   ├── hooks/             # 커스텀 훅 (debounce, infinite-scroll 등)
│   ├── lib/               # 핵심 라이브러리
│   │   ├── aws/           # S3, KMS, SES, Redis 클라이언트
│   │   ├── toss/          # TossPayments 연동
│   │   ├── fraud/         # 사기탐지 엔진 (3 규칙)
│   │   ├── etl/           # 일별 지표 집계
│   │   ├── settlement/    # 정산 처리
│   │   ├── report/        # PDF 리포트 생성
│   │   ├── notifications/ # 알림 생성
│   │   ├── utils/         # 유틸 함수 (format, constants 등)
│   │   ├── validators/    # Zod 스키마
│   │   ├── prisma.ts      # Prisma 클라이언트 (Lazy Proxy)
│   │   ├── auth.ts        # NextAuth 설정
│   │   └── rate-limit.ts  # 레이트 리미팅
│   └── types/             # TypeScript 타입 정의
├── CLAUDE.md              # 이 파일
├── docker-compose.yml     # PostgreSQL 16 + Redis 7
├── next.config.ts         # Next.js 설정
├── prisma.config.ts       # Prisma v7 설정
└── vercel.json            # Vercel 배포 설정
```

## 라우트 구조

### 페이지 (80+)
| 그룹 | 경로 | 설명 |
|---|---|---|
| 홈 | `/` | 랜딩 페이지 (배너, 프리미엄, 추천, 시뮬레이터, 요금) |
| 매물 | `/listings` | 점포찾기 (검색, 필터, 지도) |
| 매물상세 | `/listings/[id]` | 상세/수정/비교 |
| 매물등록 | `/listings/new` | 점포 등록 |
| 대시보드 | `/dashboard` | 내 매물, 문의, 알림, 분석, 정산 등 |
| 마이 | `/my/*` | 좋아요, 상담, 리포트, 구독, 설정 |
| 프리미엄 | `/premium/*` | 구독, 결제, 매물광고 |
| 리포트 | `/reports/*` | 권리진단서 구매/열람/샘플 |
| 전문가 | `/experts` | 전문가 디렉토리/프로필 |
| 프랜차이즈 | `/franchise` | 프랜차이즈 디렉토리 |
| 시뮬레이터 | `/simulator` | 창업 수익성 분석 |
| 게시판 | `/bbs` | 창업정보 게시판 |
| 관리자 | `/admin/*` | 매물심사, 유저관리, 사기탐지, 배너 등 |
| 법적고지 | `/legal/*` | 이용약관, 개인정보, 면책 |

### API 라우트 (95+)
| 그룹 | 주요 엔드포인트 |
|---|---|
| 인증 | `/api/auth/*`, `/api/auth/register`, `/api/user/settings` |
| 매물 | `/api/listings`, `/api/listings/[id]/*` (댓글, 이미지, 좋아요, 조회) |
| 문의 | `/api/inquiries/*`, `/api/expert-inquiries/*` |
| 결제 | `/api/payments/*`, `/api/subscription/*` |
| 리포트 | `/api/reports/*`, `/api/diagnosis/*`, `/api/report-purchases/*` |
| 프리미엄 | `/api/premium-listings`, `/api/paid-services` |
| 분석 | `/api/seller/*`, `/api/insights/*`, `/api/market-prices` |
| 관리자 | `/api/admin/*` (배너, 프랜차이즈, 게시글, 유저, 큐) |
| CRON | `/api/cron/*` (문서정리, 만료, 비교, ETL, 정산) |
| 기타 | `/api/franchise/*`, `/api/bbs/*`, `/api/experts/*` |

## Prisma 모델 (42개)

| 그룹 | 모델 |
|---|---|
| 유저/인증 | User, Account, Session, VerificationToken |
| 매물 | Listing, ListingImage, ListingLike, ListingComment, ListingComparison |
| 문의 | Inquiry |
| 문서 | Document |
| 결제 | Payment, Subscription, SubscriptionPlan |
| 프리미엄 | PremiumPlan, PremiumListing, PaidService, SinglePurchase |
| 리포트 | Report, ReportData, ReportPlan, ReportPurchase, DiagnosisReport |
| 사기탐지 | FraudRule, FraudViolation |
| 전문가 | Expert, ExpertInquiry, ExpertReview |
| 분석 | Event, DailyListingMetric, DailySellerMetric, MarketPrice |
| 정산 | Settlement |
| 알림 | Notification |
| 법적 | LegalDocument, UserConsent |
| 비즈니스 | Franchise, BoardPost, Banner, Simulation, SalesIntegration |
| 감사 | AdminAuditLog |

## 핵심 기능

- **사기탐지**: 중복사진(phash), 가격급등, 다중계정 — BullMQ 백그라운드
- **KMS 암호화**: 민감 문서 봉투암호화 (PUBLIC/BUYER_ONLY/ADMIN_ONLY/OWNER_ONLY)
- **결제**: TossPayments (구독/단건/프리미엄 광고/진단서)
- **정산**: 수수료 계산 + 셀러 정산 처리
- **ETL**: 일별 매물/셀러 지표 CRON 집계
- **권리진단서**: AI 진단 엔진 + PDF 리포트 생성
- **시뮬레이터**: 창업 수익성 분석 (초기투자, 월손익, 회수기간)
- **매물 카드**: 공유 컴포넌트 3 variant (premium/recommend/search)

## 공유 컴포넌트 (주요)

| 파일 | 설명 |
|---|---|
| `listing-card.tsx` | 매물 카드 (premium/recommend/search variant) |
| `listing-card-constants.ts` | 카테고리 이모지/그라데이션 상수 |
| `compare-button.tsx` | 매물 비교 버튼 |
| `diagnosis-card.tsx` | 권리진단서 카드 |
| `safety-badge.tsx` | 안전등급 배지 |
| `paywall-overlay.tsx` | 유료 콘텐츠 페이월 |
| `notification-bell.tsx` | 알림벨 드롭다운 |
| `kakao-map.tsx` | 카카오맵 연동 |

## 유틸 함수 (주요)

| 파일 | 설명 |
|---|---|
| `format.ts` | formatKRW, formatDate 등 |
| `format-location.ts` | 시/도 축약 (서울특별시→서울) |
| `constants.ts` | 업종, 층수, 면적, 프리미엄 설정 등 |
| `diagnosis-engine.ts` | 권리진단 점수 계산 |
| `safety-grade.ts` | 안전등급 산출 |
| `bigint-json.ts` | BigInt JSON 직렬화 |

## DB 연결

- **로컬**: Docker PostgreSQL (`localhost:5432/kwonrishop`)
- **프로덕션**: Neon PostgreSQL (pooled connection)
- **Prisma**: PrismaPg 어댑터 + Lazy Proxy 패턴 (`src/lib/prisma.ts`)
- **시드**: `DATABASE_URL="..." npx tsx prisma/seed.ts` (인라인 URL)

## 시드 데이터

- 유저 6명 (admin, seller, buyer, agent, franchise, expert)
- 매물 12개 (VIP x2, 추천 x6)
- 프랜차이즈 15개, 전문가 18명, 리뷰 73개
- 게시글 6개, 배너 3개, 시장가격 41개
