export const USDC_BASE = '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913' as const;

// Coinbase-issued B20 contracts copied from the canonical Base stock directory.
// Never accept arbitrary addresses as Coinbase Tokenized Stocks.
export const TOKENIZED_STOCKS = {
  NVDA: { symbol: 'NVDAc', company: 'NVIDIA', address: '0xb20000000000000000000078ee7ce2fe4908108c' },
  META: { symbol: 'METAc', company: 'Meta', address: '0xb2000000000000000000008bc8786b856e61707c' },
  AAPL: { symbol: 'AAPLc', company: 'Apple', address: '0xb200000000000000000000c2e324d24d7eecd1fb' },
  GOOGL: { symbol: 'GOOGLc', company: 'Alphabet', address: '0xb2000000000000000000002d0ba3164cc74f58b7' },
  AMZN: { symbol: 'AMZNc', company: 'Amazon', address: '0xb200000000000000000000d9192b6b456483c2e8' },
  MSFT: { symbol: 'MSFTc', company: 'Microsoft', address: '0xb200000000000000000000ab99cfa739e253872b' },
  MSTR: { symbol: 'MSTRc', company: 'MicroStrategy', address: '0xb2000000000000000000004884b426556b92883d' },
  SNDK: { symbol: 'SNDKc', company: 'SanDisk', address: '0xb200000000000000000000397293cb8cda9a10c5' },
  SPCX: { symbol: 'SPCXc', company: 'SpaceX', address: '0xb2000000000000000000007b9fcbd005511acbd5' },
  TSLA: { symbol: 'TSLAc', company: 'Tesla', address: '0xb2000000000000000000001e800a7f5189430cd0' },
} as const;

export type SupportedStockSymbol = keyof typeof TOKENIZED_STOCKS;
export function getTokenizedStock(symbol: string) {
  return TOKENIZED_STOCKS[symbol as SupportedStockSymbol];
}
