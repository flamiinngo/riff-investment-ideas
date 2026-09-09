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

const STORAGE_KEY = 'riff.account.v1';
let baseProvider: ProviderInterface | null = null;

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

export function readRiffAccount(): RiffAccount | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value ? (JSON.parse(value) as RiffAccount) : null;
  } catch {
    return null;
  }
}

export async function signInWithBase(): Promise<Address> {
  const nonce = crypto.randomUUID().replaceAll('-', '');
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
    !proof.signature
  ) {
    throw new Error('Base Account did not return a completed sign-in proof.');
  }
  return account.address;
}

export function saveRiffAccount(account: RiffAccount) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(account));
}

export async function signOutBaseAccount() {
  localStorage.removeItem(STORAGE_KEY);
  const provider = await getProvider();
  await provider.disconnect().catch(() => undefined);
}
