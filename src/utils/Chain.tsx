import { Chain } from 'wagmi'

export const XRPLDevnet = {
    id: 1440002,
    name: ' XRPL EVM Sidechain',
    network: ' XRPL EVM Sidechain',
    nativeCurrency: {
      decimals: 18,
      name: 'XRP',
      symbol: 'XRP',
    },
    rpcUrls: {
      public: { http: ['https://rpc-evm-sidechain.xrpl.org/'] },
      default: { http: ['https://rpc-evm-sidechain.xrpl.org/'] },
    },
    blockExplorers: {
      etherscan: { name: 'XRPL', url: 'https://evm-sidechain.xrpl.org/' },
      default: { name: 'XRPL', url: 'https://evm-sidechain.xrpl.org' },
    },
  
  } as const satisfies Chain