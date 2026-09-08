import { Attribution } from 'ox/erc8021';
import { createConfig, http } from 'wagmi';
import { base } from 'wagmi/chains';
import { BUILDERS_CODE } from '@/config/base';

// ERC-8021 attribution is configured once at the client boundary so every
// future production transaction receives the official Base Builder Code.
export const DATA_SUFFIX = Attribution.toDataSuffix({ codes: [BUILDERS_CODE] });

export const activeChain = base;
export const wagmiConfig = createConfig({
  chains: [base],
  transports: { [base.id]: http() },
  dataSuffix: DATA_SUFFIX,
});
