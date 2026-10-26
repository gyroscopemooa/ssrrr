const EZOIC_ADS_TXT_URL = 'https://srv.adstxtmanager.com/19390/ssrrr.net';
const GOOGLE_ADS_TXT_ENTRY =
  'google.com, pub-4323462792235659, DIRECT, f08c47fec0942fa0';

export async function GET() {
  let content = '';

  try {
    const response = await fetch(EZOIC_ADS_TXT_URL, {
      next: {revalidate: 3600},
    });

    if (response.ok) content = (await response.text()).trim();
  } catch {
    // Keep the Google authorization available if the manager is temporarily down.
  }

  if (!content.includes('pub-4323462792235659')) {
    content = [content, GOOGLE_ADS_TXT_ENTRY].filter(Boolean).join('\n');
  }

  return new Response(`${content}\n`, {
    headers: {
      'Cache-Control': 'public, max-age=3600',
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
}
