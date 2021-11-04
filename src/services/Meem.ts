import { BigNumber } from 'bignumber.js'
import { ethers } from 'ethers'
import { isUndefined as _isUndefined, keys as _keys } from 'lodash'
import request from 'superagent'
import ERC721ABI from '../abis/ERC721.json'
import MeemABI from '../abis/Meem.json'
import meemWhitelist from '../lib/meem-whitelist.json'
import { Meem, ERC721 } from '../types'
import { MeemAPI } from '../types/meem.generated'
import { NetworkName } from '../types/shared/meem.shared'

export default class MeemService {
	/** Get generic ERC721 contract instance */
	public static erc721Contract(options: {
		networkName: NetworkName
		address: string
	}) {
		const { networkName, address } = options
		let provider: ethers.providers.Provider
		switch (networkName) {
			case NetworkName.Mainnet:
			case NetworkName.Rinkeby:
				provider = new ethers.providers.InfuraProvider(
					networkName,
					config.INFURA_ID
				)
				break

			case NetworkName.Polygon:
				provider = new ethers.providers.JsonRpcProvider(
					'https://polygon-rpc.com'
				)
				break

			default:
				throw new Error('INVALID_NETWORK')
		}

		const wallet = new ethers.Wallet(config.WALLET_PRIVATE_KEY, provider)

		const contract = new ethers.Contract(address, ERC721ABI, wallet) as ERC721

		return contract
	}

	/** Get a Meem contract instance */
	public static meemContract() {
		const provider = new ethers.providers.InfuraProvider(
			config.NETWORK,
			config.INFURA_ID
		)
		const wallet = new ethers.Wallet(config.WALLET_PRIVATE_KEY, provider)

		const meemContract = new ethers.Contract(
			config.MEEM_PROXY_ADDRESS,
			MeemABI,
			wallet
		) as Meem

		return meemContract
	}

	public static getWhitelist() {
		const list: Record<string, MeemAPI.IWhitelistItem> = {}
		Object.keys(meemWhitelist).forEach(k => {
			const item = (meemWhitelist as MeemAPI.IWhitelist)[k]
			const license = Object.keys(MeemAPI.License).includes(item.license)
				? item.license
				: MeemAPI.License.Unknown
			list[k] = {
				...item,
				license
			}
		})

		return list
	}

	public static async saveMeemMetadataasync(
		asset: OpenSeaAsset,
		imageBase64: string,
		meemId?: string
	): Promise<{ metadata: MeemMetadata; tokenUri: string }> {
		const id = meemId || uuidv4()

		const octokit = new Octokit({
			auth: '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'
		})

		const master = await octokit.git.getRef({
			owner: 'meemproject',
			repo: 'metadata',
			ref: 'heads/test'
		})

		const treeItems: {
			path: string
			mode: '100644'
			type: 'blob'
			sha: string
		}[] = []

		const imageGit = await octokit.git.createBlob({
			owner: 'meemproject',
			repo: 'metadata',
			content: imageBase64,
			encoding: 'base64'
		})

		treeItems.push({
			path: `meem/images/${id}.png`,
			sha: imageGit.data.sha,
			mode: '100644',
			type: 'blob'
		})

		const metadata: MeemMetadata = {
			name: asset.collection?.name
				? `${asset.collection.name} – ${asset.name || asset.tokenId}`
				: `${asset.name || asset.tokenId}`,
			description: asset.description,
			external_url: `https://meem.wtf/meem/${id}`,
			image: `https://raw.githubusercontent.com/meemproject/metadata/test/meem/images/${id}.png`,
			image_original_url: asset.imageUrlOriginal || asset.imageUrl,
			background_color: asset.backgroundColor,
			attributes: [
				...asset.traits,
				{
					display_type: 'number',
					trait_type: 'Meem Generation',
					value: 0
				}
			]
		}

		const metadataGit = await octokit.git.createBlob({
			owner: 'meemproject',
			repo: 'metadata',
			content: JSON.stringify(metadata),
			encoding: 'utf-8'
		})

		treeItems.push({
			path: `meem/${id}.json`,
			sha: metadataGit.data.sha,
			mode: '100644',
			type: 'blob'
		})

		const tree = await octokit.git.createTree({
			owner: 'meemproject',
			repo: 'metadata',
			tree: treeItems,
			base_tree: master.data.object.sha
		})

		const commit = await octokit.git.createCommit({
			owner: 'meemproject',
			repo: 'metadata',
			message: `New Meem Created: ${id}`,
			tree: tree.data.sha,
			parents: [master.data.object.sha]
		})

		await octokit.git.updateRef({
			owner: 'meemproject',
			repo: 'metadata',
			ref: 'heads/test',
			sha: commit.data.sha
		})

		return {
			metadata,
			tokenUri: `https://raw.githubusercontent.com/meemproject/metadata/test/meem/${id}.json`
		}
	}

	/** Mint a Meem */
	public static async mintMeem(data: MeemAPI.v1.MintMeem.IRequestBody) {
		if (!data.tokenAddress) {
			throw new Error('MISSING_TOKEN_ADDRESS')
		}

		if (_isUndefined(data.chain)) {
			throw new Error('MISSING_CHAIN_ID')
		}

		if (_isUndefined(data.tokenId)) {
			throw new Error('MISSING_TOKEN_ID')
		}

		if (!data.accountAddress) {
			throw new Error('MISSING_ACCOUNT_ADDRESS')
		}

		if (
			!data.permissions?.owner?.copyPermissions ||
			!data.permissions?.owner?.splits
		) {
			throw new Error('INVALID_PERMISSIONS')
		}

		const meemRegistry = await services.meem.getWhitelist()

		const validMeemProject = _keys(meemRegistry).find(
			contractId => contractId === data.tokenAddress
		)

		if (!validMeemProject) {
			throw new Error('INVALID_MEEM_PROJECT')
		}

		// const network = data.useTestnet ? Network.Rinkeby : Network.Main

		// const seaport = new OpenSeaPort(web3.currentProvider, {
		// 	networkName: Network.Main
		// })

		// const asset: OpenSeaAsset = await seaport.api.getAsset({
		// 	tokenAddress: data.tokenAddress, // string
		// 	tokenId: data.tokenId // string | number | null
		// })

		// const balance = await seaport.getAssetBalance({
		// 	accountAddress: data.accountAddress,
		// 	asset
		// })

		// const ownsNFT = data.useTestnet ? true : balance.greaterThan(0)
		const contract = this.erc721Contract({
			networkName: data.useTestnet ? NetworkName.Rinkeby : NetworkName.Mainnet,
			address: data.tokenAddress
		})
		const owner = await contract.ownerOf(data.tokenId)
		const isNFTOwner = owner.toLowerCase() === data.accountAddress.toLowerCase()

		if (!isNFTOwner) {
			throw new Error('TOKEN_NOT_OWNED')
		}

		const tokenURI = await contract.tokenURI(data.tokenId)
		let metadata: Record<string, any> = {}
		if (/^ipfs/.test(tokenURI)) {
			const result = await services.ipfs.getIPFSFile(tokenURI)
			if (result.type !== 'application/json') {
				throw new Error('INVALID_METADATA')
			}
			metadata = result.body
		} else {
			const result = await request.get(tokenURI)
			if (result.type !== 'application/json') {
				throw new Error('INVALID_METADATA')
			}
			metadata = result.body
		}

		log.debug(`Image: ${metadata.image}`)

		// TODO: Create image w/ sharp

		// const meemImage = await createMeemImage({
		// 	imageUrl: asset.imageUrl,
		// 	responseType: 'base64',
		// 	options: {} // TODO: Specify options if needed
		// })

		const meemMetadata = await saveMeemMetadata(asset, meemImage)

		const meemContract = this.meemContract()

		// Mint the Meem

		const splitsData: MeemSplit[] = []

		try {
			data.permissions.owner.splits.forEach(s => {
				if (s.toAddress && !_isUndefined(s.amount)) {
					splitsData.push({
						toAddress: s.toAddress,
						amount: s.amount,
						lockedBy: s.lockedBy
							? s.lockedBy
							: '0x0000000000000000000000000000000000000000'
					})
				} else {
					throw Error('Splits formatted incorrectly')
				}
			})
		} catch (e) {
			throw new Error(
				'invalid-argument',
				`Error validating splits format: ${e}`
			)
		}

		await meemContract.setNonOwnerSplitAllocationAmount(100)

		const meem = await meemContract.mint(
			data.accountAddress,
			meemMetadata.tokenUri,
			data.chain,
			data.tokenAddress,
			data.tokenId,
			data.tokenAddress,
			data.tokenId,
			{
				copyPermissions: data.permissions.owner.copyPermissions.map((p, i) => {
					return {
						permission: _isUndefined(
							data.permissions.owner.copyPermissions[i].permission
						)
							? 1
							: data.permissions.owner.copyPermissions[i].permission,
						addresses: _isUndefined(
							data.permissions.owner.copyPermissions[i].addresses
						)
							? []
							: data.permissions.owner.copyPermissions[i].addresses,
						numTokens: _isUndefined(
							data.permissions.owner.copyPermissions[i].numTokens
						)
							? 0
							: data.permissions.owner.copyPermissions[i].numTokens,
						lockedBy:
							data.permissions.owner.copyPermissions[i].lockedBy ||
							'0x0000000000000000000000000000000000000000'
					}
				}),
				remixPermissions: [
					{
						permission: 1,
						addresses: [],
						numTokens: 0,
						lockedBy: '0x0000000000000000000000000000000000000000'
					}
				],
				readPermissions: [
					{
						permission: 1,
						addresses: [],
						numTokens: 0,
						lockedBy: '0x0000000000000000000000000000000000000000'
					}
				],
				copyPermissionsLockedBy: '0x0000000000000000000000000000000000000000',
				remixPermissionsLockedBy: '0x0000000000000000000000000000000000000000',
				readPermissionsLockedBy: '0x0000000000000000000000000000000000000000',
				splits: splitsData,
				splitsLockedBy: '0x0000000000000000000000000000000000000000',
				childrenPerWallet: -1,
				childrenPerWalletLockedBy: '0x0000000000000000000000000000000000000000',
				totalChildren: _isUndefined(data.permissions?.owner?.totalChildren)
					? -1
					: data.permissions?.owner?.totalChildren,
				totalChildrenLockedBy: '0x0000000000000000000000000000000000000000'
			},
			{
				copyPermissions: [
					{
						permission: 0,
						addresses: [],
						numTokens: 0,
						lockedBy: '0x0000000000000000000000000000000000000000'
					}
				],
				remixPermissions: [
					{
						permission: 0,
						addresses: [],
						numTokens: 0,
						lockedBy: '0x0000000000000000000000000000000000000000'
					}
				],
				readPermissions: [
					{
						permission: 0,
						addresses: [],
						numTokens: 0,
						lockedBy: '0x0000000000000000000000000000000000000000'
					}
				],
				copyPermissionsLockedBy: '0x0000000000000000000000000000000000000000',
				remixPermissionsLockedBy: '0x0000000000000000000000000000000000000000',
				readPermissionsLockedBy: '0x0000000000000000000000000000000000000000',
				splits: splitsData,
				splitsLockedBy: '0x0000000000000000000000000000000000000000',
				childrenPerWallet: -1,
				childrenPerWalletLockedBy: '0x0000000000000000000000000000000000000000',
				totalChildren: 0,
				totalChildrenLockedBy: '0x0000000000000000000000000000000000000000'
			}
		)

		const receipt = await meem.wait()

		const transferEvent = receipt.events?.find(e => e.event === 'Transfer')

		if (transferEvent && transferEvent.args && transferEvent.args[2]) {
			const tokenId = (transferEvent.args[2] as BigNumber).toNumber()
			return {
				transactionHash: receipt.transactionHash,
				tokenId
			}
		}
		throw new Error('TRANSFER_EVENT_NOT_FOUND')
	}
}
