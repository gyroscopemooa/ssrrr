export const YOUTUBE_REAUTH_MESSAGE =
  'YouTube 업로드 채널의 인증이 만료되었거나 취소되었습니다. 업로드 채널을 다시 인증한 뒤 기존 MP4의 YouTube 업로드를 재시도하세요. (invalid_grant)';

export function isYouTubeReauthRequired(error) {
  return /\bYOUTUBE_REAUTH_REQUIRED\b|\bYOUTUBE_OAUTH_FAILED:\s*invalid_grant\b/.test(
    String(error || ''),
  );
}
