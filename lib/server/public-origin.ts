const TRUSTED_PUBLIC_HOST_SUFFIXES = [
  '.vercel.app',
  '.chatgpt.site',
  '.sites.openai.com',
] as const;

export function getPublicOrigin(request: Request) {
  const requestUrl = new URL(request.url);
  const forwardedHost = request.headers
    .get('x-forwarded-host')
    ?.split(',')[0]
    ?.trim()
    .toLowerCase();
  const isTrustedPublicHost = TRUSTED_PUBLIC_HOST_SUFFIXES.some((suffix) =>
    forwardedHost?.endsWith(suffix),
  );
  if (!forwardedHost || !isTrustedPublicHost) return requestUrl.origin;
  const forwardedProtocol =
    request.headers.get('x-forwarded-proto')?.split(',')[0]?.trim() === 'http'
      ? 'http'
      : 'https';
  return `${forwardedProtocol}://${forwardedHost}`;
}
