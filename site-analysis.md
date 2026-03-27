# 권리샵 사이트 구조 분석

> 최종 업데이트: 2026-03-28 (보완작업: 크론잡/리뷰/커뮤니티수정/역할별관리/이용가이드/고객센터/Step7연동UI/알림톡)

---

## 기술 스택

| 항목 | 기술 |
|------|------|
| 프레임워크 | Next.js 16.1.6 (App Router, Turbopack) |
| 언어 | TypeScript 5 |
| React | 19.2.3 |
| DB/ORM | PostgreSQL + Prisma 7.4.2 |
| 인증 | NextAuth 4.24 (카카오/네이버 소셜) |
| 스타일링 | Tailwind CSS 4 |
| 상태관리 | Zustand 5 |
| 폼 | React Hook Form 7 + Zod 4 |
| 실시간 | Pusher (채팅) |
| 파일 업로드 | AWS S3 (presigned URL) |
| 이메일 | Resend |
| 모니터링 | Sentry |
| E2E 테스트 | Playwright |
| 배포 | Vercel |

---

## 사용자 역할 (5종)

| 역할 코드 | 한글명 | 가입 조건 | 핵심 기능 |
|-----------|--------|----------|----------|
| BUYER | 예비창업자 | 소셜 로그인만 | 매물 검색/찜/채팅 |
| SELLER | 사장님 | 소셜 로그인 + 사업자 인증 | 매물 1건 등록/관리 |
| FRANCHISE | 프랜차이즈 본사 | 소셜 로그인 + 사업자 인증 | 브랜드 페이지 편집 |
| PARTNER | 협력업체 | 소셜 로그인 + 사업자 인증 | 서비스 1건 등록/관리 |
| ADMIN | 관리자 | 시스템 계정 | 전체 관리 |

### 가입 플로우
1. 소셜 로그인 → `/select-role`에서 역할 선택
2. BUYER → 즉시 완료 (홈 이동)
3. SELLER/FRANCHISE/PARTNER → `/verify-business?role=XXX`에서 사업자 인증

---

## 유료 등급제

### 광고 상품 (AdProduct, categoryScope별)

**사장님 매물 (LISTING):**
| 등급 | 가격 | 기간 | 핵심 혜택 |
|------|------|------|----------|
| 베이직 | 10만 | 30일 | 사진10장, 인증배지, 끌어올리기2회 |
| 프리미엄 | 30만 | 30일 | 상위노출, 사진20장, 통계, 끌어올리기5회 |
| VIP | 50만 | 30일 | 최상위노출, 메인추천, 사진무제한, 영상1개 |

**프랜차이즈 (FRANCHISE):**
| 등급 | 가격 | 기간 | 핵심 혜택 |
|------|------|------|----------|
| 브론즈 | 30만 | 30일 | 로고+소개 편집 |
| 실버 | 60만 | 30일 | 상위노출, 추천연동, 문의접수 |
| 골드 | 100만 | 30일 | 메인배너, 자동매칭, 월간리포트 |

**협력업체 (PARTNER):**
| 등급 | 가격 | 기간 | 핵심 혜택 |
|------|------|------|----------|
| 베이직 | 10만 | 30일 | 사진10장, 배지 |
| 프리미엄 | 30만 | 30일 | 상위노출, 포트폴리오20건 |
| VIP | 50만 | 30일 | 최상위노출, 추천업체 연동 |

**공통 단건 (COMMON):**
| 이름 | 가격 | 설명 |
|------|------|------|
| 끌어올리기 | 3,000원 | 목록 최상단 1회 |
| 강조배지 | 10,000원/30일 | 강조 배지 |
| 지역TOP | 50,000원/7일 | 지역 검색 상단 배너 |

---

## 라우트 구조 (페이지)

### (main) 레이아웃 — Header + Footer + CompareBar 포함

| 경로 | 페이지 | 설명 |
|------|--------|------|
| `/` | 메인(홈) | 검색바, 업종카테고리, 최신/인기 매물, 추천 프랜차이즈, 추천 협력업체, 이용안내, CTA |
| `/listings` | 매물 목록 | **프리미엄 캐러셀**(유료광고 매물 VIP/PREMIUM/BASIC) + 검색/필터/정렬, 지도보기 토글 |
| `/listings/[id]` | 매물 상세 | 사진, 금액, 위치, 수익, 리뷰, 크로스셀 추천, 채팅하기, 찜, 공유 |
| `/listings/compare` | 매물 비교 | 선택한 매물 병렬 비교 |
| `/franchise` | 프랜차이즈 목록 | **프리미엄 캐러셀**(GOLD/SILVER/BRONZE) + 브랜드 검색/필터 |
| `/franchise/[id]` | 프랜차이즈 상세 | 공정위 데이터, 본사 정보, 문의, 크로스셀 추천 |
| `/partners` | 협력업체 목록 | **프리미엄 캐러셀**(VIP/PREMIUM/BASIC) + 검색/필터/그리드 |
| `/partners/[id]` | 협력업체 상세 | 업체 정보, 이미지, 연락처, 크로스셀 추천 |
| `/partners/register` | 협력업체 등록 | 단일 페이지 등록 폼 (PARTNER만) |
| `/community` | 커뮤니티(게시판) | 글 목록, 카테고리 태그 |
| `/community/[id]` | 게시글 상세 | 댓글/대댓글, 신고, 수정/삭제 버튼(작성자만) |
| `/community/[id]/edit` | 글 수정 | 기존 글 수정 (작성자 권한 확인) |
| `/community/write` | 글 작성 | 제목, 내용, 태그 |
| `/chat` | 채팅 목록 | 1:1 채팅방 리스트 |
| `/mypage` | 마이페이지 | 프로필, 내 매물, 내 서비스(PARTNER), 내 브랜드(FRANCHISE), 관심매물 |
| `/mypage/edit` | 프로필 수정 | 이름, 전화번호 등 |
| `/mypage/favorites` | 관심매물 | 찜한 매물 목록 |
| `/mypage/stats` | 매물 통계 | 조회수, 관심수 리포트 |
| `/mypage/reviews` | 내 리뷰 | 받은 리뷰/작성한 리뷰 탭 |
| `/payments/checkout` | 결제 | 토스페이먼츠 결제창 |
| `/payments/success` | 결제 성공 | 결제 완료 확인 |
| `/payments/fail` | 결제 실패 | 결제 오류 안내 |
| `/pricing` | 요금제 | 탭별 (사장님/프랜차이즈/협력업체) 광고 상품 안내/구매 |
| `/users/[id]` | 사용자 프로필 | 공개 프로필, 리뷰 |
| `/about` | 회사소개 | 서비스 소개 |
| `/faq` | FAQ | 자주 묻는 질문 |
| `/terms` | 이용약관 | 서비스 이용약관 |
| `/privacy` | 개인정보처리방침 | 개인정보 정책 |
| `/guide` | 이용가이드 | 역할별(예비창업자/사장님/프랜차이즈/협력업체) 이용 안내 |
| `/contact` | 고객센터 | 문의 폼, 연락처, 운영시간 안내 |

### (auth) 레이아웃 — Header/Footer 없음

| 경로 | 페이지 | 설명 |
|------|--------|------|
| `/login` | 로그인 | 카카오/네이버 소셜 로그인 |
| `/select-role` | 역할 선택 | 최초 가입 시 4종 역할 선택 |
| `/verify-business` | 사업자 인증 | 국세청 API 진위확인 (role 파라미터 지원) |

### /sell — 별도 레이아웃

| 경로 | 페이지 | 설명 |
|------|--------|------|
| `/sell` | 매물등록 위저드 | 7단계 위저드 (신규 등록) |
| `/sell/edit` | 매물수정 | 기존 매물 수정 |

### /admin — 관리자 레이아웃

| 경로 | 페이지 | 설명 |
|------|--------|------|
| `/admin` | 대시보드 | 6개 통계카드 + 역할별 회원분포 |
| `/admin/listings` | 매물 관리 | 매물 상태 변경/삭제 |
| `/admin/partners` | 협력업체 관리 | 협력업체 상태변경/삭제 |
| `/admin/franchise` | 프랜차이즈 관리 | 공정위 데이터 동기화 |
| `/admin/products` | 광고상품 관리 | categoryScope별 CRUD, 가격/기간 인라인 수정 |
| `/admin/reports` | 신고 관리 | 신고 접수/처리 |
| `/admin/users` | 회원 관리 | 회원 목록/5종 역할 변경 |
| `/admin/notices` | 공지사항 관리 | 공지 CRUD |

---

## API 엔드포인트

### 인증
| 메서드 | 경로 | 설명 |
|--------|------|------|
| * | `/api/auth/[...nextauth]` | NextAuth 핸들러 |
| POST | `/api/auth/business-verify` | 국세청 사업자 진위확인 (SELLER/FRANCHISE/PARTNER 분기) |
| GET | `/api/auth/check-verification` | 사업자인증 상태 확인 |
| POST | `/api/auth/select-role` | 역할 선택 (BUYER/SELLER/FRANCHISE/PARTNER) |

### 매물
| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET/POST | `/api/listings` | 매물 목록 조회 / 등록 |
| GET/PUT/DELETE | `/api/listings/[id]` | 매물 상세 / 수정 / 삭제 |
| POST | `/api/listings/[id]/bump` | 끌어올리기 |
| POST | `/api/listings/[id]/extend` | 노출기간 연장 |
| POST/DELETE | `/api/listings/[id]/favorite` | 찜 토글 |
| GET/POST | `/api/listings/[id]/reviews` | 리뷰 조회/작성 |
| GET | `/api/listings/compare` | 매물 비교 데이터 |
| GET | `/api/listings/compare-preview` | 비교 미리보기 |
| GET | `/api/listings/new-count` | 신규 매물 수 |

### 협력업체
| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET/POST | `/api/partners` | 협력업체 목록/등록 (PARTNER만 등록가능) |
| GET/PUT/DELETE | `/api/partners/[id]` | 협력업체 상세/수정/삭제 |

### 프랜차이즈
| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/api/franchise` | 브랜드 목록 |
| GET/PUT | `/api/franchise/[id]` | 브랜드 상세/수정 |
| POST | `/api/franchise/[id]/inquiry` | 가맹 문의 |
| GET | `/api/franchise/search` | 브랜드 검색 |

### 채팅
| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET/POST | `/api/chat` | 채팅방 목록/생성 |
| GET/POST | `/api/chat/[roomId]/messages` | 메시지 조회/전송 |

### 커뮤니티
| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET/POST | `/api/community` | 게시글 목록/작성 |
| GET/PUT/DELETE | `/api/community/[id]` | 게시글 상세/수정/삭제 |
| GET/POST | `/api/community/[id]/comments` | 댓글 조회/작성 |

### 마이페이지
| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/api/mypage` | 마이페이지 데이터 |
| GET/PUT | `/api/mypage/profile` | 프로필 조회/수정 |
| GET | `/api/mypage/favorites` | 관심매물 목록 |
| GET | `/api/mypage/stats` | 매물 통계 |

### 결제
| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET/POST | `/api/payments` | 결제 내역/요청 (역할↔categoryScope 검증) |
| POST | `/api/payments/confirm` | 결제 승인 + tier 활성화 (FRANCHISE→브론즈/실버/골드, PARTNER→베이직/프리미엄/VIP) |

### 추천
| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/api/recommendations` | 크로스셀 추천 (?type=listing/franchise/partner&id=xxx) |

### 관리자
| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/api/admin` | 대시보드 통계 (6종 + 역할별 회원분포) |
| GET | `/api/admin/listings` | 매물 관리 목록 |
| PUT/DELETE | `/api/admin/listings/[id]` | 매물 상태변경/삭제 |
| GET | `/api/admin/partners` | 협력업체 관리 목록 |
| PUT/DELETE | `/api/admin/partners/[id]` | 협력업체 상태변경/삭제 |
| GET | `/api/admin/users` | 회원 목록 |
| GET/POST | `/api/admin/notices` | 공지사항 CRUD |
| PUT/DELETE | `/api/admin/notices/[id]` | 공지 수정/삭제 |
| GET/PUT | `/api/admin/reports` | 신고 관리 |
| GET/POST | `/api/admin/products` | 광고상품 목록/추가 |
| PUT/DELETE | `/api/admin/products/[id]` | 광고상품 수정/비활성화 |
| POST | `/api/admin/franchise/sync` | 공정위 데이터 동기화 |

### 기타
| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/api/categories` | 업종 카테고리 목록 |
| GET | `/api/ad-products` | 광고 상품 목록 (?scope=LISTING/FRANCHISE/PARTNER/COMMON) |
| GET | `/api/notifications` | 알림 목록 |
| POST | `/api/reports` | 신고 접수 |
| POST | `/api/reviews` | 리뷰 작성 |
| POST | `/api/upload` | 파일 업로드 (S3 presigned) |
| GET | `/api/users/[id]` | 사용자 공개 프로필 |
| GET | `/api/cron/expire-listings` | 만료 매물 처리 (크론) |
| GET | `/api/cron/expire-ads` | 광고 만료 + 티어 다운그레이드 (크론) |
| GET | `/api/mypage/reviews` | 내 리뷰 (받은/작성) |
| GET | `/api/external/commercial-district` | 상권분석 외부API |
| GET | `/api/external/industry-revenue` | 업종 매출 외부API |

---

## DB 모델 (Prisma)

| 모델 | 설명 |
|------|------|
| User | 사용자 (BUYER/SELLER/FRANCHISE/PARTNER/ADMIN), roleSelectedAt |
| Account / Session / VerificationToken | NextAuth 표준 |
| BusinessVerification | 사업자 인증 정보 |
| Category / SubCategory | 업종 대분류/소분류 |
| Listing | 매물 (핵심, 1인1매물) |
| ListingImage / ListingDocument | 매물 이미지/증빙서류 |
| ListingExternalData | 외부 연동 데이터 (홈택스 등) |
| PartnerService | 협력업체 서비스 (1업체1등록, PartnerTier: FREE/BASIC/PREMIUM/VIP) |
| PartnerImage | 협력업체 이미지 |
| FranchiseBrand | 프랜차이즈 브랜드 (FranchiseTier: FREE/BRONZE/SILVER/GOLD) |
| FranchiseInquiry | 가맹 문의 |
| AdProduct | 광고 상품 (AdCategoryScope: LISTING/FRANCHISE/PARTNER/COMMON) |
| AdPurchase | 광고 구매 내역 (listingId/partnerServiceId 지원) |
| ChatRoom / ChatParticipant / Message | 채팅 시스템 |
| Post / Comment | 커뮤니티 게시판 |
| Favorite | 관심매물 |
| Review | 블라인드 리뷰 |
| Notification | 알림 |
| Report | 신고 |

---

## 주요 컴포넌트

### 레이아웃
- `Header.tsx` — 로고, 네비게이션 (매물검색/프랜차이즈/협력업체/커뮤니티), 알림벨, 사용자메뉴, 모바일메뉴
- `Footer.tsx` — 회사정보, 서비스/고객지원/회사 링크 (협력업체 포함)
- `CompareBar.tsx` — 매물 비교 하단 바 (Zustand `compareStore`)

### 공통 (shared)
- `UnifiedCard.tsx` — 3개 카테고리 공통 카드 (매물/프랜차이즈/협력업체)
- `TierBadge.tsx` — 등급 배지 (FREE/BASIC/PREMIUM/VIP/BRONZE/SILVER/GOLD)
- `CrossSellSection.tsx` — 크로스셀 추천 (상세 페이지 하단, 수평 스크롤)
- `PremiumCarousel.tsx` — 프리미엄 캐러셀 (목록 페이지 상단, 유료 등급별 수평 스크롤)

### 매물등록 위저드 (7단계)
- `StepIndicator.tsx` — 단계 표시
- `Step1Location.tsx` — 카카오 주소검색
- `Step2Category.tsx` — 업종 선택 + 금액
- `Step3BasicInfo.tsx` — 브랜드/상호/층수/평수/테마/주차
- `Step4Additional.tsx` — 매출/지출/인력/순이익
- `Step5Description.tsx` — 매물 설명
- `Step6Photos.tsx` — 사진 + 증빙자료 업로드
- `Step7Confirm.tsx` — 최종 확인 + 제출

### 매물 관련
- `ListingCard.tsx` — 매물 카드 UI
- `ReviewSection.tsx` — 리뷰 표시/작성
- `ShareButton.tsx` — SNS 공유
- `AlertSetup.tsx` — 매물 알림 설정
- `CommercialDistrictSection.tsx` — 상권분석 정보

### 지도
- `KakaoMap.tsx` — 카카오맵 컴포넌트
- `ListingMapView.tsx` — 지도 기반 매물 표시

### 프랜차이즈
- `IndustryRevenueSection.tsx` — 업종별 매출 정보

### 결제
- `TossPayment.tsx` — 토스페이먼츠 결제 컴포넌트

### UI/유틸
- `SkipLink.tsx` — 접근성 스킵 링크
- `ThemeToggle.tsx` — 다크모드 토글
- `NoticeBanner.tsx` — 상단 공지 배너
- `JsonLd.tsx` — SEO 구조화 데이터

---

## 미들웨어

- **보호 경로**: `/sell`, `/mypage`, `/verify-business`, `/admin`, `/partners/register` → 미로그인 시 로그인 리다이렉트
- **역할 선택**: roleSelectedAt이 null인 인증 유저 → `/select-role`로 리다이렉트
- **로그인 경로**: 이미 로그인 시 홈으로 리다이렉트
- **보안 헤더**: X-Content-Type-Options, X-Frame-Options, X-XSS-Protection, Referrer-Policy, Permissions-Policy

---

## 상태관리 (Zustand)

- `compareStore.ts` — 매물 비교 목록 상태
- `listingForm.ts` — 매물등록 7단계 폼 데이터

---

## 외부 API 연동

| API | 파일 | 용도 |
|-----|------|------|
| 국세청 사업자 진위확인 | `lib/api/nts.ts` | 사업자등록 인증 |
| 공정위 정보공개서 | `lib/api/ftc.ts` | 프랜차이즈 데이터 |
| 공정위 매출정보 | `lib/api/ftc-revenue.ts` | 업종별 매출 |
| 소상공인진흥공단 | `lib/api/small-biz.ts` | 상권분석 |

---

## 유틸/라이브러리

| 파일 | 용도 |
|------|------|
| `lib/auth.ts` | NextAuth 설정 (roleSelectedAt JWT 포함) |
| `lib/auth-adapter.ts` | Prisma Auth 어댑터 |
| `lib/prisma.ts` | Prisma 클라이언트 싱글톤 |
| `lib/constants.ts` | SERVICE_TYPE_LABELS, REGION_OPTIONS |
| `lib/s3.ts` | S3 파일 업로드 |
| `lib/email.ts` + `email-templates.ts` | 이메일 발송 (Resend) |
| `lib/pusher.ts` + `pusher-client.ts` | 실시간 채팅 (Pusher) |
| `lib/csrf.ts` | CSRF 토큰 검증 |
| `lib/rate-limit.ts` | API Rate Limiting |
| `lib/sanitize.ts` | 입력값 살균 |
| `lib/utils.ts` | 공통 유틸 함수 |
| `lib/kakao-alimtalk.ts` | 카카오 알림톡 발송 (dev: console, prod: API 연동 대기) |
| `hooks/useDebounce.ts` | 디바운스 훅 |

---

## 사용자 흐름

### 예비창업자 (BUYER)
1. 소셜 로그인 → 역할 선택 → 매물 검색/필터 → 매물 상세 확인 → 찜/채팅/문의 → 직거래

### 사장님 (SELLER)
1. 소셜 로그인 → 역할 선택 → 사업자 인증 → 매물등록 7단계 위저드 → 매물 관리 → 광고 상품 구매 (베이직/프리미엄/VIP) → 채팅 응대

### 프랜차이즈 본사 (FRANCHISE)
1. 소셜 로그인 → 역할 선택 → 사업자 인증 → 공정위 자동 매칭 → 브랜드 페이지 편집 → 유료 구독 (브론즈/실버/골드)

### 협력업체 (PARTNER)
1. 소셜 로그인 → 역할 선택 → 사업자 인증 → 서비스 등록 (단일 페이지) → 서비스 관리 → 광고 상품 구매 (베이직/프리미엄/VIP)

### 관리자 (ADMIN)
1. 로그인 → 대시보드 (6개 통계 + 역할별 분포) → 매물/협력업체/회원/신고/공지/광고상품 관리 → 프랜차이즈 데이터 동기화
