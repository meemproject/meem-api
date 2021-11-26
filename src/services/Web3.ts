import Moralis from 'moralis/node'
import { MeemAPI } from '../types/meem.generated'
import { AsyncReturnType } from '../types/shared/api.shared'

type MoralisChainList =
	| 'eth'
	| '0x1'
	| 'ropsten'
	| '0x3'
	| 'rinkeby'
	| '0x4'
	| 'goerli'
	| '0x5'
	| 'kovan'
	| '0x2a'
	| 'polygon'
	| '0x89'
	| 'mumbai'
	| '0x13881'
	| 'bsc'
	| '0x38'
	| 'bsc testnet'
	| '0x61'
	| 'avalanche'
	| '0xa86a'
	| 'fantom'
	| '0xfa'

export default class Web3 {
	public static async getNFTs(options: {
		address: string
		chains?: MeemAPI.Chain[]
		offset?: number
		limit?: number
	}): Promise<MeemAPI.IChainNFTsResult[]> {
		const { address, offset, limit } = options

		const chains = options.chains ?? [
			MeemAPI.Chain.Ethereum,
			MeemAPI.Chain.Polygon
		]

		await this.startMoralis()

		const promises = chains.map(chain =>
			Moralis.Web3API.account.getNFTs({
				chain: this.chainToMoralis(chain),
				address,
				offset,
				limit
			})
		)

		const nftResults = await Promise.all(promises)

		const result: MeemAPI.IChainNFTsResult[] = []

		chains.forEach((chain, i) => {
			result.push({
				chain,
				total: nftResults[i].total ?? 0,
				page: nftResults[i].page ?? 0,
				pageSize: nftResults[i].page_size ?? 0,
				nfts: this.normalizeMoralisNFTs(nftResults[i])
			})
		})

		return result
	}

	private static async startMoralis() {
		await Moralis.Web3API.initialize({
			apiKey: config.MORALIS_API_KEY
		})
	}

	private static chainToMoralis(chain: MeemAPI.Chain): MoralisChainList {
		switch (chain) {
			case MeemAPI.Chain.Rinkeby:
				return 'rinkeby'

			case MeemAPI.Chain.Polygon:
				return 'polygon'

			default:
			case MeemAPI.Chain.Ethereum:
				return 'eth'
		}
	}

	private static normalizeMoralisNFTs(
		nfts: AsyncReturnType<typeof Moralis.Web3API.account.getNFTs>
	): MeemAPI.INFT[] {
		return (
			nfts.result?.map(n => ({
				metadata: n.metadata,
				tokenAddress: n.token_address,
				tokenId: n.token_id,
				contractType: n.contract_type,
				ownerOf: n.owner_of,
				blockNumber: n.block_number,
				blockNumberMinted: n.block_number_minted,
				tokenUri: n.token_uri,
				syncedAt: n.synced_at,
				amount: n.amount,
				name: n.name,
				symbol: n.symbol
			})) ?? []
		)
	}
}
