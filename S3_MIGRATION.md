# S3 Storage Migration Guide

## Overview

이미지 업로드가 Vercel의 serverless 환경에서 작동하도록 S3 호환 스토리지로 마이그레이션되었습니다.

## 지원되는 스토리지

- **AWS S3** (권장)
- **Cloudflare R2** (저렴한 대안)
- **MinIO** (자체 호스팅)
- **기타 S3 호환 스토리지**

## 설정 방법

### 1. 환경 변수 설정

`.env` 파일에 다음 변수를 추가하세요:

#### AWS S3 사용 시
```env
S3_REGION="ap-northeast-2"
S3_ENDPOINT=""  # 비워둠
S3_ACCESS_KEY_ID="your-access-key-id"
S3_SECRET_ACCESS_KEY="your-secret-access-key"
S3_BUCKET_NAME="kwonrishop-uploads"
S3_PUBLIC_URL=""  # 비워둠 (자동 생성됨)
```

#### Cloudflare R2 사용 시
```env
S3_REGION="auto"
S3_ENDPOINT="https://your-account-id.r2.cloudflarestorage.com"
S3_ACCESS_KEY_ID="your-r2-access-key-id"
S3_SECRET_ACCESS_KEY="your-r2-secret-access-key"
S3_BUCKET_NAME="kwonrishop-uploads"
S3_PUBLIC_URL="https://your-custom-domain.com"  # R2 Public URL
```

#### MinIO 사용 시
```env
S3_REGION="us-east-1"
S3_ENDPOINT="https://minio.yourdomain.com"
S3_ACCESS_KEY_ID="your-minio-access-key"
S3_SECRET_ACCESS_KEY="your-minio-secret-key"
S3_BUCKET_NAME="kwonrishop-uploads"
S3_PUBLIC_URL="https://minio.yourdomain.com/kwonrishop-uploads"
```

### 2. S3 버킷 설정

#### AWS S3
1. AWS Console에서 S3 버킷 생성
2. 퍼블릭 액세스 설정:
   - "Block all public access" 비활성화
   - Bucket Policy 설정:
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Sid": "PublicReadGetObject",
         "Effect": "Allow",
         "Principal": "*",
         "Action": "s3:GetObject",
         "Resource": "arn:aws:s3:::kwonrishop-uploads/*"
       }
     ]
   }
   ```
3. CORS 설정:
   ```json
   [
     {
       "AllowedHeaders": ["*"],
       "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
       "AllowedOrigins": ["https://yourdomain.com"],
       "ExposeHeaders": []
     }
   ]
   ```

#### Cloudflare R2
1. R2 대시보드에서 버킷 생성
2. "Public Access" 활성화 또는 Custom Domain 연결
3. API 토큰 생성 (R2 Read & Write 권한)

#### MinIO
1. MinIO Console에서 버킷 생성
2. Access Policy를 "public" 또는 "download"로 설정
3. Access Key와 Secret Key 생성

### 3. 로컬 개발

S3 환경 변수가 설정되지 않은 경우 자동으로 로컬 파일시스템(`public/uploads/`)을 사용합니다.

개발 환경에서는 S3 설정 없이도 정상 작동합니다.

## 작동 방식

### 업로드 플로우
1. 사용자가 이미지 업로드
2. `isS3Configured()` 체크
3. S3 설정이 있으면:
   - S3에 업로드
   - 공개 URL 반환
4. S3 설정이 없으면:
   - 로컬 `public/uploads/`에 저장 (개발용)
   - 로컬 경로 반환

### 파일 키 형식
```
uploads/{timestamp}-{random}.{ext}
```

예: `uploads/1710123456789-a3b5c7d9e1f.jpg`

### URL 형식
- **AWS S3**: `https://{bucket}.s3.{region}.amazonaws.com/{key}`
- **R2/MinIO**: `{S3_PUBLIC_URL}/{key}`

## 마이그레이션 체크리스트

- [x] AWS SDK 설치
- [x] S3 클라이언트 라이브러리 작성 (`src/lib/s3.ts`)
- [x] 업로드 API 수정 (`src/app/api/upload/route.ts`)
- [x] Next.js 이미지 최적화 설정 (`next.config.ts`)
- [x] 환경 변수 예제 추가 (`.env.example`)
- [x] 로컬 fallback 지원

## 비용 최적화

### AWS S3
- Standard 스토리지: $0.023/GB/월
- GET 요청: $0.0004/1000 요청
- PUT 요청: $0.005/1000 요청

### Cloudflare R2 (권장)
- 저장: $0.015/GB/월
- GET 요청: **무료** (egress 무료)
- PUT 요청: $4.50/백만 요청

### MinIO (자체 호스팅)
- 서버 비용만 발생
- 트래픽 무제한

## 보안 고려사항

1. **IAM 권한 최소화**: S3 버킷에 대한 PutObject, GetObject, DeleteObject 권한만 부여
2. **CORS 설정**: 허용된 도메인만 업로드 가능하도록 설정
3. **Content-Type 검증**: 업로드 API에서 이미지 파일만 허용
4. **파일 크기 제한**: 현재 10MB 제한 (필요시 조정 가능)

## 문제 해결

### S3 업로드 실패
1. 환경 변수가 올바르게 설정되었는지 확인
2. S3 버킷 권한 확인 (Public Access, Bucket Policy)
3. CORS 설정 확인
4. 네트워크 방화벽/프록시 확인

### 이미지 표시 안됨
1. `next.config.ts`의 `remotePatterns` 확인
2. S3_PUBLIC_URL이 올바르게 설정되었는지 확인
3. 브라우저 콘솔에서 네트워크 오류 확인

### 개발 환경 문제
- S3 설정 없이 로컬에서 작동해야 함
- `public/uploads/` 디렉토리 권한 확인

## 기존 이미지 마이그레이션

로컬 `public/uploads/`에 저장된 기존 이미지를 S3로 마이그레이션하려면:

```bash
# AWS CLI 사용
aws s3 sync public/uploads/ s3://kwonrishop-uploads/uploads/

# 또는 R2 사용 (rclone)
rclone sync public/uploads/ r2:kwonrishop-uploads/uploads/
```

## 참고 자료

- [AWS S3 Documentation](https://docs.aws.amazon.com/s3/)
- [Cloudflare R2 Documentation](https://developers.cloudflare.com/r2/)
- [MinIO Documentation](https://min.io/docs/)
- [Next.js Image Optimization](https://nextjs.org/docs/app/api-reference/components/image)
