# 전체 시스템 연결 개요

## 데이터 흐름 1: 유머 자동수집
Source Best Page
→ Source Adapter
→ Candidate Pool
→ Dedup/Filter
→ New-first Selection
→ Publish Queue
→ Posts + Media + Comments
→ Site

## 데이터 흐름 2: 쇼츠
Published Posts
→ Shorts Candidate
→ Analyzer
→ Duration Estimate
→ Planner
→ Remotion Scenes
→ FFmpeg/ffprobe
→ QC
→ Preview/Approval
→ YouTube

## 데이터 흐름 3: 경제게시판
ChatGPT Task Email
→ Personal Gmail Filter
→ Dedicated Gmail
→ Mail Ingest
→ Privacy Scan
→ Economy Post / Review Queue

## 공통 운영 원칙
- 일반 웹 요청과 background work 분리
- 관리자 override 지원
- 모든 자동화는 로그/상태 추적
- 긴급 pause
- 중복 실행 idempotency
- Preview URL 독립
