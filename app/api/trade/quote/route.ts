import {
  createPublicClient,
  decodeFunctionResult,
  encodeFunctionData,
  encodePacked,
  http,
  type Address,
} from 'viem';
import { base } from 'viem/chains';
import { getTokenizedStock, USDC_BASE } from '@/lib/stocks/tokenized-stocks';

type QuoteRequest = {
  taker: string;
  amountCents: number;
  legs: { symbol: string; weight: number }[];
};

const AERODROME_QUOTER = '0xcd2a7d98e82d6107eac1828ce8deaa6acb65b555' as Address;
const AERODROME_SWAP_ROUTER = '0x698cb2b6dd822994581fea6ea4fc755d1363a92f' as Address;
const STOCK_POOL_PARAM = 0x08000a;
const STOCK_TICK_SPACING = 10;
const SLIPPAGE_BPS = 100n;

const quoterAbi = [{
  type: 'function',
  name: 'quoteExactInput',
  stateMutability: 'nonpayable',
  inputs: [
    { name: 'path', type: 'bytes' },
    { name: 'amountIn', type: 'uint256' },
  ],
  outputs: [
    { name: 'amountOut', type: 'uint256' },
    { name: 'sqrtPriceAfterList', type: 'uint160[]' },
    { name: 'initializedTicksCrossedList', type: 'uint32[]' },
    { name: 'gasEstimate', type: 'uint256' },
  ],
}] as const;

const swapRouterAbi = [{
  type: 'function',
  name: 'exactInputSingle',
  stateMutability: 'payable',
  inputs: [{
    name: 'params',
    type: 'tuple',
    components: [
      { name: 'tokenIn', type: 'address' },
      { name: 'tokenOut', type: 'address' },
      { name: 'tickSpacing', type: 'int24' },
      { name: 'recipient', type: 'address' },
      { name: 'deadline', type: 'uint256' },
      { name: 'amountIn', type: 'uint256' },
      { name: 'amountOutMinimum', type: 'uint256' },
      { name: 'sqrtPriceLimitX96', type: 'uint160' },
    ],
  }],
  outputs: [{ name: 'amountOut', type: 'uint256' }],
}] as const;

const client = createPublicClient({
  chain: base,
  transport: http(process.env.BASE_RPC_URL ?? 'https://base-rpc.publicnode.com'),
});

export async function POST(request: Request) {
  try {
    const body = await request.json() as QuoteRequest;
    if (!/^0x[a-fA-F0-9]{40}$/.test(body.taker)
      || !Number.isInteger(body.amountCents)
      || body.amountCents < 1000
      || body.amountCents > 10_000_000) {
      return Response.json({ error: 'Enter an amount between $10 and $100,000.' }, { status: 400 });
    }
    if (body.legs.length < 2
      || body.legs.length > 12
      || body.legs.some(leg => !Number.isInteger(leg.weight) || leg.weight <= 0)
      || body.legs.reduce((sum, leg) => sum + leg.weight, 0) !== 100) {
      return Response.json({ error: 'Allocation must contain 2–12 assets and total exactly 100%.' }, { status: 400 });
    }

    const taker = body.taker.toLowerCase() as Address;
    const totalAtomic = BigInt(body.amountCents) * 10_000n;
    const deadline = BigInt(Math.floor(Date.now() / 1000) + 300);

    const quotes = await Promise.all(body.legs.map(async leg => {
      const stock = getTokenizedStock(leg.symbol);
      if (!stock) throw new Error(`${leg.symbol} is not an official Coinbase Tokenized Stock supported by Riff.`);

      const stockAddress = stock.address.toLowerCase() as Address;
      const sellAmount = totalAtomic * BigInt(leg.weight) / 100n;
      const path = encodePacked(
        ['address', 'uint24', 'address'],
        [USDC_BASE.toLowerCase() as Address, STOCK_POOL_PARAM, stockAddress],
      );
      const quoteData = encodeFunctionData({
        abi: quoterAbi,
        functionName: 'quoteExactInput',
        args: [path, sellAmount],
      });
      const rawQuote = await client.call({ to: AERODROME_QUOTER, data: quoteData });
      if (!rawQuote.data) throw new Error(`No executable ${stock.symbol} quote is available.`);
      const [buyAmount] = decodeFunctionResult({
        abi: quoterAbi,
        functionName: 'quoteExactInput',
        data: rawQuote.data,
      });
      if (buyAmount <= 0n) throw new Error(`No executable ${stock.symbol} liquidity is available.`);
      const minBuyAmount = buyAmount * (10_000n - SLIPPAGE_BPS) / 10_000n;
      const transactionData = encodeFunctionData({
        abi: swapRouterAbi,
        functionName: 'exactInputSingle',
        args: [{
          tokenIn: USDC_BASE.toLowerCase() as Address,
          tokenOut: stockAddress,
          tickSpacing: STOCK_TICK_SPACING,
          recipient: taker,
          deadline,
          amountIn: sellAmount,
          amountOutMinimum: minBuyAmount,
          sqrtPriceLimitX96: 0n,
        }],
      });

      return {
        symbol: stock.symbol,
        stockAddress,
        sellAmount: sellAmount.toString(),
        buyAmount: buyAmount.toString(),
        minBuyAmount: minBuyAmount.toString(),
        allowanceTarget: AERODROME_SWAP_ROUTER,
        transaction: { to: AERODROME_SWAP_ROUTER, data: transactionData, value: '0' },
      };
    }));

    return Response.json({ chainId: base.id, sellToken: USDC_BASE, quotes });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'A live basket quote is unavailable.';
    return Response.json({ error: message }, { status: 502 });
  }
}
