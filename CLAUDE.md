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
