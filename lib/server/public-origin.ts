const TRUSTED_PUBLIC_HOSTS = new Set([
  'riffbase.vercel.app',
  'riff-investment-ideas.vercel.app',
  'riff-investment-ideas.kobi6542.chatgpt.site',
  'riff-investment-ideas.sites.openai.com',
]);

function trustedOrigin(value: string | null) {
  if (!value) return null;
  try {
    const origin = new URL(value);
    if (
      (origin.protocol === 'https:' || origin.protocol === 'http:') &&
      TRUSTED_PUBLIC_HOSTS.has(origin.host.toLowerCase())
    ) {
      return origin.origin;
    }
  } catch {
    return null;
  }
  return null;
}

export function getPublicOrigin(request: Request) {
  const requestUrl = new URL(request.url);
  const browserOrigin = trustedOrigin(request.headers.get('origin'));
  if (browserOrigin) return browserOrigin;
  const forwardedHost = request.headers
    .get('x-forwarded-host')
    ?.split(',')[0]
    ?.trim()
    .toLowerCase();
  if (!forwardedHost || !TRUSTED_PUBLIC_HOSTS.has(forwardedHost))
    return requestUrl.origin;
  const forwardedProtocol =
    request.headers.get('x-forwarded-proto')?.split(',')[0]?.trim() === 'http'
      ? 'http'
      : 'https';
  return `${forwardedProtocol}://${forwardedHost}`;
}
