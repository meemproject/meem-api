/* eslint-disable */
export const chains = [
	{
		name: 'Ethereum Mainnet',
		chain: 'ETH',
		icon: 'ethereum',
		rpc: ['https://cloudflare-eth.com/v1/mainnet'],
		faucets: [],
		nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
		infoURL: 'https://ethereum.org',
		shortName: 'eth',
		chainId: 1,
		networkId: 1,
		slip44: 60,
		ens: { registry: '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e' },
		explorers: [
			{ name: 'etherscan', url: 'https://etherscan.io', standard: 'EIP3091' }
		]
	},
	{
		name: 'Ropsten',
		title: 'Ethereum Testnet Ropsten',
		chain: 'ETH',
		network: 'testnet',
		rpc: [
			'https://ropsten.infura.io/v3/${INFURA_API_KEY}',
			'wss://ropsten.infura.io/ws/v3/${INFURA_API_KEY}'
		],
		faucets: [
			'http://fauceth.komputing.org?chain=3&address=${ADDRESS}',
			'https://faucet.ropsten.be?${ADDRESS}'
		],
		nativeCurrency: { name: 'Ropsten Ether', symbol: 'ROP', decimals: 18 },
		infoURL: 'https://github.com/ethereum/ropsten',
		shortName: 'rop',
		chainId: 3,
		networkId: 3,
		ens: { registry: '0x112234455c3a32fd11230c42e7bccd4a84e02010' },
		explorers: [
			{
				name: 'etherscan',
				url: 'https://ropsten.etherscan.io',
				standard: 'EIP3091'
			}
		]
	},
	{
		name: 'Rinkeby',
		title: 'Ethereum Testnet Rinkeby',
		chain: 'ETH',
		network: 'testnet',
		rpc: ['https://cloudflare-eth.com/v1/rinkeby'],
		faucets: [
			'http://fauceth.komputing.org?chain=4&address=${ADDRESS}',
			'https://faucet.rinkeby.io'
		],
		nativeCurrency: { name: 'Rinkeby Ether', symbol: 'RIN', decimals: 18 },
		infoURL: 'https://www.rinkeby.io',
		shortName: 'rin',
		chainId: 4,
		networkId: 4,
		ens: { registry: '0xe7410170f87102df0055eb195163a03b7f2bff4a' },
		explorers: [
			{
				name: 'etherscan-rinkeby',
				url: 'https://rinkeby.etherscan.io',
				standard: 'EIP3091'
			}
		]
	},
	{
		name: 'Göerli',
		title: 'Ethereum Testnet Göerli',
		chain: 'ETH',
		network: 'testnet',
		rpc: ['https://rpc.goerli.mudit.blog/'],
		faucets: [
			'http://fauceth.komputing.org?chain=5&address=${ADDRESS}',
			'https://goerli-faucet.slock.it?address=${ADDRESS}',
			'https://faucet.goerli.mudit.blog'
		],
		nativeCurrency: { name: 'Göerli Ether', symbol: 'GOR', decimals: 18 },
		infoURL: 'https://goerli.net/#about',
		shortName: 'gor',
		chainId: 5,
		networkId: 5,
		ens: { registry: '0x112234455c3a32fd11230c42e7bccd4a84e02010' },
		explorers: [
			{
				name: 'etherscan-goerli',
				url: 'https://goerli.etherscan.io',
				standard: 'EIP3091'
			}
		]
	},

	{
		name: 'Optimism',
		chain: 'ETH',
		rpc: ['https://mainnet.optimism.io/'],
		faucets: [],
		nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
		infoURL: 'https://optimism.io',
		shortName: 'oeth',
		chainId: 10,
		networkId: 10,
		explorers: [
			{
				name: 'etherscan',
				url: 'https://optimistic.etherscan.io',
				standard: 'none'
			}
		]
	},
	{
		name: 'Gnosis',
		chain: 'Gnosis',
		icon: 'gnosis',
		rpc: [
			'https://rpc.gnosischain.com',
			'https://rpc.ankr.com/gnosis',
			'https://gnosischain-rpc.gateway.pokt.network',
			'https://gnosis-mainnet.public.blastapi.io',
			'wss://rpc.gnosischain.com/wss'
		],
		faucets: [
			'https://faucet.gimlu.com/gnosis',
			'https://stakely.io/faucet/gnosis-chain-xdai',
			'https://faucet.prussia.dev/xdai'
		],
		nativeCurrency: { name: 'xDAI', symbol: 'xDAI', decimals: 18 },
		infoURL: 'https://developers.gnosischain.com',
		shortName: 'gno',
		chainId: 100,
		networkId: 100,
		slip44: 700,
		explorers: [
			{
				name: 'blockscout',
				url: 'https://blockscout.com/xdai/mainnet',
				icon: 'blockscout',
				standard: 'EIP3091'
			}
		]
	},
	{
		name: 'Polygon Mainnet',
		chain: 'Polygon',
		rpc: [
			'https://polygon-rpc.com/',
			'https://rpc-mainnet.matic.network',
			'https://matic-mainnet.chainstacklabs.com',
			'https://rpc-mainnet.maticvigil.com',
			'https://rpc-mainnet.matic.quiknode.pro',
			'https://matic-mainnet-full-rpc.bwarelabs.com'
		],
		faucets: [],
		nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
		infoURL: 'https://polygon.technology/',
		shortName: 'MATIC',
		chainId: 137,
		networkId: 137,
		slip44: 966,
		explorers: [
			{
				name: 'polygonscan',
				url: 'https://polygonscan.com',
				standard: 'EIP3091'
			}
		]
	},
	{
		name: 'Mumbai',
		title: 'Polygon Testnet Mumbai',
		chain: 'Polygon',
		rpc: [
			'https://matic-mumbai.chainstacklabs.com',
			'https://rpc-mumbai.maticvigil.com',
			'https://matic-testnet-archive-rpc.bwarelabs.com'
		],
		faucets: ['https://faucet.polygon.technology/'],
		nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
		infoURL: 'https://polygon.technology/',
		shortName: 'maticmum',
		chainId: 80001,
		networkId: 80001,
		explorers: [
			{
				name: 'polygonscan',
				url: 'https://mumbai.polygonscan.com',
				standard: 'EIP3091'
			}
		]
	},
	{
		name: 'Binance Smart Chain Mainnet',
		chain: 'BSC',
		rpc: [
			'https://bsc-dataseed1.binance.org',
			'https://bsc-dataseed2.binance.org',
			'https://bsc-dataseed3.binance.org',
			'https://bsc-dataseed4.binance.org',
			'https://bsc-dataseed1.defibit.io',
			'https://bsc-dataseed2.defibit.io',
			'https://bsc-dataseed3.defibit.io',
			'https://bsc-dataseed4.defibit.io',
			'https://bsc-dataseed1.ninicoin.io',
			'https://bsc-dataseed2.ninicoin.io',
			'https://bsc-dataseed3.ninicoin.io',
			'https://bsc-dataseed4.ninicoin.io',
			'wss://bsc-ws-node.nariox.org'
		],
		faucets: ['https://free-online-app.com/faucet-for-eth-evm-chains/'],
		nativeCurrency: {
			name: 'Binance Chain Native Token',
			symbol: 'BNB',
			decimals: 18
		},
		infoURL: 'https://www.binance.org',
		shortName: 'bnb',
		chainId: 56,
		networkId: 56,
		slip44: 714,
		explorers: [
			{ name: 'bscscan', url: 'https://bscscan.com', standard: 'EIP3091' }
		]
	},
	{
		name: 'Binance Smart Chain Testnet',
		chain: 'BSC',
		rpc: [
			'https://data-seed-prebsc-1-s1.binance.org:8545',
			'https://data-seed-prebsc-2-s1.binance.org:8545',
			'https://data-seed-prebsc-1-s2.binance.org:8545',
			'https://data-seed-prebsc-2-s2.binance.org:8545',
			'https://data-seed-prebsc-1-s3.binance.org:8545',
			'https://data-seed-prebsc-2-s3.binance.org:8545'
		],
		faucets: ['https://testnet.binance.org/faucet-smart'],
		nativeCurrency: {
			name: 'Binance Chain Native Token',
			symbol: 'tBNB',
			decimals: 18
		},
		infoURL: 'https://testnet.binance.org/',
		shortName: 'bnbt',
		chainId: 97,
		networkId: 97,
		explorers: [
			{
				name: 'bscscan-testnet',
				url: 'https://testnet.bscscan.com',
				standard: 'EIP3091'
			}
		]
	},
	{
		name: 'Avalanche Fuji Testnet',
		chain: 'AVAX',
		rpc: ['https://api.avax-test.network/ext/bc/C/rpc'],
		faucets: ['https://faucet.avax-test.network/'],
		nativeCurrency: { name: 'Avalanche', symbol: 'AVAX', decimals: 18 },
		infoURL: 'https://cchain.explorer.avax-test.network',
		shortName: 'Fuji',
		chainId: 43113,
		networkId: 1,
		explorers: [
			{
				name: 'snowtrace',
				url: 'https://testnet.snowtrace.io',
				standard: 'EIP3091'
			}
		]
	},
	{
		name: 'Avalanche C-Chain',
		chain: 'AVAX',
		rpc: ['https://api.avax.network/ext/bc/C/rpc'],
		faucets: ['https://free-online-app.com/faucet-for-eth-evm-chains/'],
		nativeCurrency: { name: 'Avalanche', symbol: 'AVAX', decimals: 18 },
		infoURL: 'https://www.avax.network/',
		shortName: 'Avalanche',
		chainId: 43114,
		networkId: 43114,
		slip44: 9005,
		explorers: [
			{ name: 'snowtrace', url: 'https://snowtrace.io', standard: 'EIP3091' }
		]
	},
	{
		name: 'Optimistic Ethereum Testnet Goerli',
		chain: 'ETH',
		rpc: ['https://goerli.optimism.io/'],
		faucets: [],
		nativeCurrency: { name: 'Göerli Ether', symbol: 'GOR', decimals: 18 },
		infoURL: 'https://optimism.io',
		shortName: 'ogor',
		chainId: 420,
		networkId: 420
	},
	{
		name: 'Optimism Kovan',
		title: 'Optimism Testnet Kovan',
		chain: 'ETH',
		rpc: ['https://kovan.optimism.io/'],
		faucets: ['http://fauceth.komputing.org?chain=69&address=${ADDRESS}'],
		nativeCurrency: { name: 'Kovan Ether', symbol: 'KOR', decimals: 18 },
		explorers: [
			{
				name: 'etherscan',
				url: 'https://kovan-optimistic.etherscan.io',
				standard: 'EIP3091'
			}
		],
		infoURL: 'https://optimism.io',
		shortName: 'okov',
		chainId: 69,
		networkId: 69
	},
	{
		name: 'Arbitrum on xDai',
		chain: 'AOX',
		rpc: ['https://arbitrum.xdaichain.com/'],
		faucets: [],
		nativeCurrency: { name: 'xDAI', symbol: 'xDAI', decimals: 18 },
		infoURL: 'https://xdaichain.com',
		shortName: 'aox',
		chainId: 200,
		networkId: 200,
		explorers: [
			{
				name: 'blockscout',
				url: 'https://blockscout.com/xdai/arbitrum',
				standard: 'EIP3091'
			}
		],
		parent: { chain: 'eip155-100', type: 'L2' }
	},
	{
		name: 'Arbitrum One',
		chainId: 42161,
		shortName: 'arb1',
		chain: 'ETH',
		networkId: 42161,
		nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
		rpc: [
			'https://arbitrum-mainnet.infura.io/v3/${INFURA_API_KEY}',
			'https://arb-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}',
			'https://arb1.arbitrum.io/rpc'
		],
		faucets: [],
		explorers: [
			{ name: 'Arbiscan', url: 'https://arbiscan.io', standard: 'EIP3091' },
			{
				name: 'Arbitrum Explorer',
				url: 'https://explorer.arbitrum.io',
				standard: 'EIP3091'
			}
		],
		infoURL: 'https://arbitrum.io',
		parent: {
			type: 'L2',
			chain: 'eip155-1',
			bridges: [{ url: 'https://bridge.arbitrum.io' }]
		}
	},
	{
		name: 'Arbitrum Rinkeby',
		title: 'Arbitrum Testnet Rinkeby',
		chainId: 421611,
		shortName: 'arb-rinkeby',
		chain: 'ETH',
		networkId: 421611,
		nativeCurrency: {
			name: 'Arbitrum Rinkeby Ether',
			symbol: 'ARETH',
			decimals: 18
		},
		rpc: ['https://rinkeby.arbitrum.io/rpc'],
		faucets: ['http://fauceth.komputing.org?chain=421611&address=${ADDRESS}'],
		infoURL: 'https://arbitrum.io',
		explorers: [
			{
				name: 'arbiscan-testnet',
				url: 'https://testnet.arbiscan.io',
				standard: 'EIP3091'
			},
			{
				name: 'arbitrum-rinkeby',
				url: 'https://rinkeby-explorer.arbitrum.io',
				standard: 'EIP3091'
			}
		],
		parent: {
			type: 'L2',
			chain: 'eip155-4',
			bridges: [{ url: 'https://bridge.arbitrum.io' }]
		}
	},
	{
		name: 'Moonbeam',
		chain: 'MOON',
		rpc: ['https://rpc.api.moonbeam.network', 'wss://wss.api.moonbeam.network'],
		faucets: [],
		nativeCurrency: { name: 'Glimmer', symbol: 'GLMR', decimals: 18 },
		infoURL: 'https://moonbeam.network/networks/moonbeam/',
		shortName: 'mbeam',
		chainId: 1284,
		networkId: 1284,
		explorers: [
			{
				name: 'moonscan',
				url: 'https://moonbeam.moonscan.io',
				standard: 'none'
			}
		]
	},
	{
		name: 'Moonriver',
		chain: 'MOON',
		rpc: [
			'https://rpc.api.moonriver.moonbeam.network',
			'wss://wss.api.moonriver.moonbeam.network'
		],
		faucets: [],
		nativeCurrency: { name: 'Moonriver', symbol: 'MOVR', decimals: 18 },
		infoURL: 'https://moonbeam.network/networks/moonriver/',
		shortName: 'mriver',
		chainId: 1285,
		networkId: 1285,
		explorers: [
			{
				name: 'moonscan',
				url: 'https://moonriver.moonscan.io',
				standard: 'none'
			}
		]
	},
	{
		name: 'Celo Mainnet',
		chainId: 42220,
		shortName: 'CELO',
		chain: 'CELO',
		networkId: 42220,
		nativeCurrency: { name: 'CELO', symbol: 'CELO', decimals: 18 },
		rpc: ['https://forno.celo.org', 'wss://forno.celo.org/ws'],
		faucets: ['https://free-online-app.com/faucet-for-eth-evm-chains/'],
		infoURL: 'https://docs.celo.org/',
		explorers: [
			{
				name: 'blockscout',
				url: 'https://explorer.celo.org',
				standard: 'none'
			}
		]
	},
	{
		name: 'Fantom Opera',
		chain: 'FTM',
		rpc: ['https://rpc.ftm.tools'],
		faucets: ['https://free-online-app.com/faucet-for-eth-evm-chains/'],
		nativeCurrency: { name: 'Fantom', symbol: 'FTM', decimals: 18 },
		infoURL: 'https://fantom.foundation',
		shortName: 'ftm',
		chainId: 250,
		networkId: 250,
		icon: 'fantom',
		explorers: [
			{
				name: 'ftmscan',
				url: 'https://ftmscan.com',
				icon: 'ftmscan',
				standard: 'EIP3091'
			}
		]
	},
	{
		name: 'Fantom Testnet',
		chain: 'FTM',
		rpc: ['https://rpc.testnet.fantom.network'],
		faucets: ['https://faucet.fantom.network'],
		nativeCurrency: { name: 'Fantom', symbol: 'FTM', decimals: 18 },
		infoURL:
			'https://docs.fantom.foundation/quick-start/short-guide#fantom-testnet',
		shortName: 'tftm',
		chainId: 4002,
		networkId: 4002,
		icon: 'fantom',
		explorers: [
			{
				name: 'ftmscan',
				url: 'https://testnet.ftmscan.com',
				icon: 'ftmscan',
				standard: 'EIP3091'
			}
		]
	},
	{
		name: 'Boba Network Rinkeby Testnet',
		chain: 'ETH',
		rpc: ['https://rinkeby.boba.network/'],
		faucets: [],
		nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
		infoURL: 'https://boba.network',
		shortName: 'Boba Rinkeby',
		chainId: 28,
		networkId: 28,
		explorers: [
			{
				name: 'Blockscout',
				url: 'https://blockexplorer.rinkeby.boba.network',
				standard: 'none'
			}
		],
		parent: {
			type: 'L2',
			chain: 'eip155-4',
			bridges: [{ url: 'https://gateway.rinkeby.boba.network' }]
		}
	},
	{
		name: 'Optimism on Gnosis Chain',
		chain: 'OGC',
		rpc: [
			'https://optimism.gnosischain.com',
			'wss://optimism.gnosischain.com/wss'
		],
		faucets: ['https://faucet.gimlu.com/gnosis'],
		nativeCurrency: { name: 'xDAI', symbol: 'xDAI', decimals: 18 },
		infoURL:
			'https://www.xdaichain.com/for-developers/optimism-optimistic-rollups-on-gc',
		shortName: 'ogc',
		chainId: 300,
		networkId: 300,
		explorers: [
			{
				name: 'blockscout',
				url: 'https://blockscout.com/xdai/optimism',
				icon: 'blockscout',
				standard: 'EIP3091'
			}
		]
	},
	{
		name: 'OKExChain Testnet',
		chain: 'okexchain',
		rpc: ['https://exchaintestrpc.okex.org'],
		faucets: ['https://www.okex.com/drawdex'],
		nativeCurrency: {
			name: 'OKExChain Global Utility Token in testnet',
			symbol: 'OKT',
			decimals: 18
		},
		infoURL: 'https://www.okex.com/okexchain',
		shortName: 'tokt',
		chainId: 65,
		networkId: 65,
		explorers: [
			{
				name: 'OKLink',
				url: 'https://www.oklink.com/okexchain-test',
				standard: 'EIP3091'
			}
		]
	},
	{
		name: 'OKXChain Mainnet',
		chain: 'okxchain',
		rpc: [
			'https://exchainrpc.okex.org',
			'https://okc-mainnet.gateway.pokt.network/v1/lb/6275309bea1b320039c893ff'
		],
		faucets: ['https://free-online-app.com/faucet-for-eth-evm-chains/?'],
		nativeCurrency: {
			name: 'OKXChain Global Utility Token',
			symbol: 'OKT',
			decimals: 18
		},
		infoURL: 'https://www.okex.com/okc',
		shortName: 'okt',
		chainId: 66,
		networkId: 66,
		explorers: [
			{
				name: 'OKLink',
				url: 'https://www.oklink.com/en/okc',
				standard: 'EIP3091'
			}
		]
	},
	{
		name: 'Fuse Mainnet',
		chain: 'FUSE',
		rpc: ['https://rpc.fuse.io'],
		faucets: [],
		nativeCurrency: { name: 'Fuse', symbol: 'FUSE', decimals: 18 },
		infoURL: 'https://fuse.io/',
		shortName: 'fuse',
		chainId: 122,
		networkId: 122
	},
	{
		name: 'Fuse Sparknet',
		chain: 'fuse',
		rpc: ['https://rpc.fusespark.io'],
		faucets: ['https://get.fusespark.io'],
		nativeCurrency: { name: 'Spark', symbol: 'SPARK', decimals: 18 },
		infoURL:
			'https://docs.fuse.io/general/fuse-network-blockchain/fuse-testnet',
		shortName: 'spark',
		chainId: 123,
		networkId: 123
	},
	{
		name: 'Harmony Mainnet Shard 0',
		chain: 'Harmony',
		rpc: ['https://api.harmony.one', 'https://api.s0.t.hmny.io'],
		faucets: ['https://free-online-app.com/faucet-for-eth-evm-chains/'],
		nativeCurrency: { name: 'ONE', symbol: 'ONE', decimals: 18 },
		infoURL: 'https://www.harmony.one/',
		shortName: 'hmy-s0',
		chainId: 1666600000,
		networkId: 1666600000,
		explorers: [
			{
				name: 'Harmony Block Explorer',
				url: 'https://explorer.harmony.one',
				standard: 'EIP3091'
			}
		]
	},
	{
		name: 'Harmony Mainnet Shard 1',
		chain: 'Harmony',
		rpc: ['https://api.s1.t.hmny.io'],
		faucets: [],
		nativeCurrency: { name: 'ONE', symbol: 'ONE', decimals: 18 },
		infoURL: 'https://www.harmony.one/',
		shortName: 'hmy-s1',
		chainId: 1666600001,
		networkId: 1666600001
	},
	{
		name: 'Harmony Mainnet Shard 2',
		chain: 'Harmony',
		rpc: ['https://api.s2.t.hmny.io'],
		faucets: [],
		nativeCurrency: { name: 'ONE', symbol: 'ONE', decimals: 18 },
		infoURL: 'https://www.harmony.one/',
		shortName: 'hmy-s2',
		chainId: 1666600002,
		networkId: 1666600002
	},
	{
		name: 'Harmony Mainnet Shard 3',
		chain: 'Harmony',
		rpc: ['https://api.s3.t.hmny.io'],
		faucets: [],
		nativeCurrency: { name: 'ONE', symbol: 'ONE', decimals: 18 },
		infoURL: 'https://www.harmony.one/',
		shortName: 'hmy-s3',
		chainId: 1666600003,
		networkId: 1666600003
	},
	{
		name: 'Harmony Testnet Shard 0',
		chain: 'Harmony',
		rpc: ['https://api.s0.b.hmny.io'],
		faucets: ['https://faucet.pops.one'],
		nativeCurrency: { name: 'ONE', symbol: 'ONE', decimals: 18 },
		infoURL: 'https://www.harmony.one/',
		shortName: 'hmy-b-s0',
		chainId: 1666700000,
		networkId: 1666700000,
		explorers: [
			{
				name: 'Harmony Testnet Block Explorer',
				url: 'https://explorer.pops.one',
				standard: 'EIP3091'
			}
		]
	},
	{
		name: 'Harmony Testnet Shard 1',
		chain: 'Harmony',
		rpc: ['https://api.s1.b.hmny.io'],
		faucets: [],
		nativeCurrency: { name: 'ONE', symbol: 'ONE', decimals: 18 },
		infoURL: 'https://www.harmony.one/',
		shortName: 'hmy-b-s1',
		chainId: 1666700001,
		networkId: 1666700001
	},
	{
		name: 'Harmony Testnet Shard 2',
		chain: 'Harmony',
		rpc: ['https://api.s2.b.hmny.io'],
		faucets: [],
		nativeCurrency: { name: 'ONE', symbol: 'ONE', decimals: 18 },
		infoURL: 'https://www.harmony.one/',
		shortName: 'hmy-b-s2',
		chainId: 1666700002,
		networkId: 1666700002
	},
	{
		name: 'Harmony Testnet Shard 3',
		chain: 'Harmony',
		rpc: ['https://api.s3.b.hmny.io'],
		faucets: [],
		nativeCurrency: { name: 'ONE', symbol: 'ONE', decimals: 18 },
		infoURL: 'https://www.harmony.one/',
		shortName: 'hmy-b-s3',
		chainId: 1666700003,
		networkId: 1666700003
	},
	{
		name: 'Aurora Mainnet',
		chain: 'NEAR',
		rpc: ['https://mainnet.aurora.dev'],
		faucets: [],
		nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
		infoURL: 'https://aurora.dev',
		shortName: 'aurora',
		chainId: 1313161554,
		networkId: 1313161554,
		explorers: [
			{
				name: 'aurorascan.dev',
				url: 'https://aurorascan.dev',
				standard: 'EIP3091'
			}
		]
	},
	{
		name: 'Aurora Testnet',
		chain: 'NEAR',
		rpc: ['https://testnet.aurora.dev/'],
		faucets: [],
		nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
		infoURL: 'https://aurora.dev',
		shortName: 'aurora-testnet',
		chainId: 1313161555,
		networkId: 1313161555,
		explorers: [
			{
				name: 'aurorascan.dev',
				url: 'https://testnet.aurorascan.dev',
				standard: 'EIP3091'
			}
		]
	},
	{
		name: 'Aurora Betanet',
		chain: 'NEAR',
		rpc: ['https://betanet.aurora.dev/'],
		faucets: [],
		nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
		infoURL: 'https://aurora.dev',
		shortName: 'aurora-betanet',
		chainId: 1313161556,
		networkId: 1313161556
	}
]
