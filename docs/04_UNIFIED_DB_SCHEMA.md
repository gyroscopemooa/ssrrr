# 통합 DB 개념 스키마

> 실제 DB/ORM/PK 타입에 맞게 조정. 아래는 개념 모델이다.

## auto_sources
id
name
adapter_type
list_url
enabled
board_id
scan_mode
scan_item_limit
daily_limit
prefer_new_candidates
fallback_to_old_unused
max_candidate_age_days
title_prefix
comment_enabled
comment_limit
image_enabled
gif_enabled
video_enabled
crawl_interval_minutes
min_views
min_likes
min_comments
selection_mode
like_weight
comment_weight
view_weight
selector_config json
filter_config json
last_run_at
last_success_at
created_at
updated_at

## auto_candidates
id
source_id
external_post_id
canonical_url
original_title
final_title
body
published_at
first_seen_at
last_seen_at
selected_at
used_at
metrics json
score
media json
normalized_title_hash
content_fingerprint
primary_media_hash
status
created_at
updated_at

## crawl_runs
id
source_id
started_at
finished_at
scanned_count
new_count
existing_count
used_count
duplicate_count
filtered_count
valid_count
selected_count
failure_count
error_log
created_at

## auto_post_jobs
id
candidate_id
scheduled_at
status
attempts
last_error
post_id

## comments 확장
origin
source_id nullable
external_comment_id nullable
imported_at nullable

## shorts_settings
id
site_id nullable
default_background_asset_id
default_bgm_asset_id
bgm_enabled
bgm_volume
original_audio_volume
video_audio_policy
effects_level
intro_enabled
outro_enabled
watermark_enabled
cta_enabled
min_duration_sec
target_duration_sec
max_duration_sec
max_posts_per_short
include_best_comments
max_comments
default_privacy
created_at
updated_at

## shorts_assets
id
type(background,bgm,sfx,logo)
name
storage_key
mime_type
duration_ms
is_default
is_active
created_at

## shorts_jobs
id
status
created_by
config_json
plan_json
progress
error_code
error_message
retry_count
output_asset_id
youtube_video_id
scheduled_publish_at
created_at
started_at
completed_at

## shorts_job_posts
id
short_job_id
post_id
sequence
include_comments
estimated_duration_ms
created_at

## shorts_outputs
id
short_job_id
storage_key
width
height
fps
duration_ms
file_size
audio_mode
qc_status
qc_json
created_at

## shorts_publications
id
short_job_id
platform
external_id
privacy
status
published_at
scheduled_at
metadata_json
last_synced_at
created_at

## shorts_metrics
id
publication_id
measured_at
views
likes
comments
shares
watch_time
raw_json

## email_ingest_messages
id
provider_message_id
message_id
subject
received_at
content_hash
parsed_title
parsed_body
privacy_status
parse_status
publish_status
post_id
error
created_at

## posts 관련
가능하면 기존 source relation 재사용.
필요 시 개념 필드:
short_excluded
short_last_created_at
source_url
source_name
source_collected_at
rights_note

## 인덱스/제약
- unique(source_id, external_post_id) 가능한 경우
- auto_candidates(status, first_seen_at)
- auto_post_jobs(status, scheduled_at)
- shorts_jobs(status, created_at)
- shorts_job_posts(post_id)
- email_ingest_messages(message_id) unique 가능한 경우
- content_hash index
