'use client';

import type { ProviderInterface } from '@base-org/account';
import type { Address } from 'viem';

export type RiffAccount = {
  address: Address;
  handle: string;
  displayName: string;
  bio: string;
};

type WalletConnectResult = {
  accounts?: Array<{
    address: Address;
    capabilities?: {
      signInWithEthereum?:
        | { message?: string; signature?: `0x${string}` }
        | { code?: number };
    };
  }>;
};

let baseProvider: ProviderInterface | null = null;

export type RiffSessionState = {
  account: RiffAccount | null;
  followedIdeas: string[];
  followedCreators: string[];
};

export function getActiveBaseAccountProvider() {
  return baseProvider;
}

async function getProvider() {
  if (!baseProvider) {
    const { createBaseAccountSDK } = await import('@base-org/account');
    baseProvider = createBaseAccountSDK({
      appName: 'Riff',
      appLogoUrl:
        typeof location === 'undefined'
          ? null
          : `${location.origin}/riff-mark.svg`,
      appChainIds: [8453],
    }).getProvider();
  }
  return baseProvider;
}

export async function getBaseAccountProvider() {
  return getProvider();
}

async function jsonResponse<T>(response: Response) {
  const body = (await response.json()) as T & { error?: string };
  if (!response.ok)
    throw new Error(body.error ?? 'Riff could not complete this request.');
  return body;
}

export async function loadRiffSession(): Promise<RiffSessionState> {
  const response = await fetch('/api/me', {
    credentials: 'same-origin',
    cache: 'no-store',
  });
  return jsonResponse<RiffSessionState>(response);
}

export async function signInWithBase(): Promise<RiffSessionState> {
  const nonceResponse = await fetch('/api/auth/nonce', {
    credentials: 'same-origin',
    cache: 'no-store',
  });
  const { nonce } = await jsonResponse<{ nonce: string }>(nonceResponse);
  const provider = await getProvider();
  const result = (await provider.request({
    method: 'wallet_connect',
    params: [
      {
        version: '1',
        capabilities: {
          signInWithEthereum: {
            nonce,
            chainId: '0x2105',
            domain: location.host,
            uri: location.origin,
            statement:
              'Sign in to create, buy and remix investment ideas on Riff.',
          },
        },
      },
    ],
  })) as WalletConnectResult;
  const account = result.accounts?.[0];
  const proof = account?.capabilities?.signInWithEthereum;
  if (
    !account?.address ||
    !proof ||
    !('signature' in proof) ||
    !proof.signature ||
    !proof.message
  ) {
    throw new Error('Base Account did not return a completed sign-in proof.');
  }
  const sessionResponse = await fetch('/api/auth/session', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      address: account.address,
      message: proof.message,
      signature: proof.signature,
    }),
  });
  await jsonResponse<{ address: Address }>(sessionResponse);
  return loadRiffSession();
}

export async function saveRiffProfile(account: RiffAccount) {
  const response = await fetch('/api/profile', {
    method: 'PUT',
    credentials: 'same-origin',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      handle: account.handle,
      displayName: account.displayName,
      bio: account.bio,
    }),
  });
  return jsonResponse<{ account: RiffAccount }>(response);
}

export async function setRiffFollow(
  targetType: 'idea' | 'creator',
  targetId: string,
  followed: boolean,
) {
  const response = await fetch('/api/follows', {
    method: followed ? 'PUT' : 'DELETE',
    credentials: 'same-origin',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ targetType, targetId }),
  });
  return jsonResponse<{ followed: boolean }>(response);
}

export async function signOutBaseAccount() {
  await fetch('/api/auth/session', {
    method: 'DELETE',
    credentials: 'same-origin',
  }).catch(() => undefined);
  const provider = await getProvider();
  await provider.disconnect().catch(() => undefined);
  baseProvider = null;
}
