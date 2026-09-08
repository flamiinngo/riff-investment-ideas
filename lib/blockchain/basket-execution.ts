import { encodeFunctionData, type Address, type Hex } from 'viem';
import { DATA_SUFFIX } from './wagmi';
import type { Idea } from '@/types';

type EthereumProvider = { request: (args: { method: string; params?: unknown[] }) => Promise<unknown> };
type QuoteTransaction = { to: Address; data: Hex; value?: string; gas?: string };
export type BasketQuote = { chainId: number; sellToken: Address; quotes: { symbol: string; sellAmount: string; allowanceTarget?: Address; transaction: QuoteTransaction }[] };

function provider() {
  const ethereum = (window as unknown as { ethereum?: EthereumProvider }).ethereum;
  if (!ethereum) throw new Error('Install or open a Base-compatible wallet to continue.');
  return ethereum;
}

export async function connectBaseWallet() {
  const ethereum = provider();
  const accounts = await ethereum.request({ method: 'eth_requestAccounts' }) as Address[];
  if (!accounts[0]) throw new Error('No wallet account was returned.');
  try { await ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: '0x2105' }] }); }
  catch { await ethereum.request({ method: 'wallet_addEthereumChain', params: [{ chainId: '0x2105', chainName: 'Base', nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 }, rpcUrls: ['https://mainnet.base.org'], blockExplorerUrls: ['https://basescan.org'] }] }); }
  return accounts[0];
}

export async function requestBasketQuote(idea: Idea, amount: number, taker: Address) {
  const response = await fetch('/api/trade/quote', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ taker, amountCents: Math.round(amount * 100), legs: idea.allocation.map(item => ({ symbol: item.symbol, weight: item.weight })) }) });
  const result = await response.json() as BasketQuote & { error?: string };
  if (!response.ok) throw new Error(result.error ?? 'A live basket quote is unavailable.');
  return result;
}

export async function sendAtomicBasket(quote: BasketQuote, account: Address) {
  const ethereum = provider();
  const allowanceTarget = quote.quotes.find(item => item.allowanceTarget)?.allowanceTarget;
  const calls: { to: Address; data: Hex; value?: Hex }[] = [];
  if (allowanceTarget) {
    const total = quote.quotes.reduce((sum, item) => sum + BigInt(item.sellAmount), 0n);
    calls.push({ to: quote.sellToken, data: encodeFunctionData({ abi: [{ type: 'function', name: 'approve', stateMutability: 'nonpayable', inputs: [{ name: 'spender', type: 'address' }, { name: 'amount', type: 'uint256' }], outputs: [{ type: 'bool' }] }], functionName: 'approve', args: [allowanceTarget, total] }) });
  }
  for (const item of quote.quotes) calls.push({ to: item.transaction.to, data: item.transaction.data, value: item.transaction.value ? `0x${BigInt(item.transaction.value).toString(16)}` : '0x0' });
  let callsId: string;
  try {
    callsId = await ethereum.request({ method: 'wallet_sendCalls', params: [{ version: '2.0.0', from: account, chainId: '0x2105', calls, capabilities: { dataSuffix: { value: DATA_SUFFIX, optional: true } } }] }) as string;
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (/unsupported|method/i.test(message)) throw new Error('This wallet cannot execute the basket atomically. Open Riff with Base Account.');
    throw error;
  }
  for (let attempt = 0; attempt < 80; attempt += 1) {
    await new Promise(resolve => window.setTimeout(resolve, 1500));
    const status = await ethereum.request({ method: 'wallet_getCallsStatus', params: [callsId] }) as { status?: number; receipts?: { transactionHash?: Hex }[] };
    if (status.status === 200) return status.receipts?.map(receipt => receipt.transactionHash).filter(Boolean) as Hex[];
    if (status.status === 400) throw new Error('The basket reverted. No partial purchase was accepted.');
  }
  throw new Error('The wallet is still confirming. Check BaseScan before trying again.');
}

