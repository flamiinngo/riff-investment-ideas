import {
  createPublicClient,
  getAddress,
  http,
  type Address,
  type Hex,
} from 'viem';
import { base } from 'viem/chains';
import { parseSiweMessage } from 'viem/siwe';
import { getDb } from '@/lib/server/db';
import {
  createSessionToken,
  getSessionAddress,
  hashSessionToken,
  noStoreJson,
  SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
  sessionCookie,
} from '@/lib/server/session';

const SIGN_IN_STATEMENT =
  'Sign in to create, buy and remix investment ideas on Riff.';
const client = createPublicClient({
  chain: base,
  transport: http(
    process.env.BASE_RPC_URL ?? 'https://base-rpc.publicnode.com',
  ),
});

type SessionRequest = {
  address?: string;
  message?: string;
  signature?: string;
};

function getPublicOrigin(request: Request) {
  const requestUrl = new URL(request.url);
  const forwardedHost = request.headers
    .get('x-forwarded-host')
    ?.split(',')[0]
    ?.trim()
    .toLowerCase();
  const isTrustedPublicHost =
    forwardedHost?.endsWith('.vercel.app') ||
    forwardedHost?.endsWith('.chatgpt.site') ||
    forwardedHost?.endsWith('.sites.openai.com');
  if (!forwardedHost || !isTrustedPublicHost) return requestUrl;
  const forwardedProtocol =
    request.headers.get('x-forwarded-proto')?.split(',')[0]?.trim() === 'http'
      ? 'http'
      : 'https';
  return new URL(`${forwardedProtocol}://${forwardedHost}`);
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as SessionRequest;
    if (
      !body.address ||
      !body.message ||
      !body.signature ||
      !/^0x[a-fA-F0-9]{130,20000}$/.test(body.signature) ||
      body.signature.length % 2 !== 0
    ) {
      return noStoreJson(
        { error: 'The sign-in proof is incomplete.' },
        { status: 400 },
      );
    }
    const address = getAddress(body.address) as Address;
    const parsed = parseSiweMessage(body.message);
    const origin = getPublicOrigin(request);
    if (
      !parsed.nonce ||
      parsed.address?.toLowerCase() !== address.toLowerCase() ||
      parsed.chainId !== base.id ||
      parsed.domain !== origin.host ||
      parsed.uri !== origin.origin ||
      parsed.statement !== SIGN_IN_STATEMENT
    ) {
      return noStoreJson(
        { error: 'The sign-in proof does not match Riff.' },
        { status: 400 },
      );
    }
    const now = Math.floor(Date.now() / 1000);
    const db = getDb();
    const nonce = await db
      .prepare(
        'SELECT nonce FROM auth_nonces WHERE nonce = ? AND expires_at > ? LIMIT 1',
      )
      .bind(parsed.nonce, now)
      .first<{ nonce: string }>();
    if (!nonce) {
      return noStoreJson(
        { error: 'This sign-in request expired. Try again.' },
        { status: 401 },
      );
    }
    const valid = await client.verifySiweMessage({
      address,
      domain: origin.host,
      nonce: parsed.nonce,
      message: body.message,
      signature: body.signature as Hex,
    });
    if (!valid) {
      return noStoreJson(
        { error: 'Your wallet could not verify this sign-in.' },
        { status: 401 },
      );
    }
    const consumed = await db
      .prepare('DELETE FROM auth_nonces WHERE nonce = ? AND expires_at > ?')
      .bind(parsed.nonce, now)
      .run();
    if (!consumed.meta.changes) {
      return noStoreJson(
        { error: 'This sign-in request was already used.' },
        { status: 409 },
      );
    }
    const token = createSessionToken();
    const tokenHash = await hashSessionToken(token);
    await db
      .prepare(
        'INSERT INTO sessions (token_hash, address, expires_at, created_at) VALUES (?, ?, ?, ?)',
      )
      .bind(
        tokenHash,
        address.toLowerCase(),
        now + SESSION_MAX_AGE_SECONDS,
        now,
      )
      .run();
    return noStoreJson(
      { address },
      { headers: { 'set-cookie': sessionCookie(token) } },
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'We could not verify this sign-in.';
    return noStoreJson({ error: message }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  const token = request.headers
    .get('cookie')
    ?.split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${SESSION_COOKIE}=`))
    ?.slice(SESSION_COOKIE.length + 1);
  if (token) {
    const tokenHash = await hashSessionToken(decodeURIComponent(token));
    await getDb()
      .prepare('DELETE FROM sessions WHERE token_hash = ?')
      .bind(tokenHash)
      .run();
  }
  return noStoreJson(
    { ok: true },
    { headers: { 'set-cookie': sessionCookie('', 0) } },
  );
}

export async function GET(request: Request) {
  const address = await getSessionAddress(request);
  return noStoreJson({ authenticated: Boolean(address) });
}
