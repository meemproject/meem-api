import { Octokit } from '@octokit/rest'
import request from 'superagent'
import { v4 as uuidv4 } from 'uuid'
import { MeemAPI } from '../types/meem.generated'

// https://www.reddit.com/r/ipfs/comments/lvwn4o/ipfs_http_gateways_ranked_by_performance/

export default class GitService {
	public static async saveMeemMetadata(data: {
		name: string
		description: string
		imageBase64: string
		originalImage: string
		tokenURI: string
		tokenAddress: string
		tokenId?: number
		tokenMetadata: any
		rootTokenURI?: string
		rootTokenAddress?: string
		rootTokenId?: number
		rootTokenMetadata?: any
		collectionName?: string
		meemId?: string
	}): Promise<{ metadata: MeemAPI.IMeemMetadata; tokenURI: string }> {
		// TODO: Get/Normalize collection name
		// TODO: Get/Normalize content description
		// TODO: Get generation?
		const id = data.meemId || uuidv4()
		const branchName =
			config.NETWORK === MeemAPI.NetworkName.Rinkeby ? `test` : `master`

		const octokit = new Octokit({
			auth: config.GITHUB_KEY
		})

		const master = await octokit.git.getRef({
			owner: 'meemproject',
			repo: 'metadata',
			ref: `heads/${branchName}`
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
			content: data.imageBase64,
			encoding: 'base64'
		})

		treeItems.push({
			path: `meem/images/${id}.png`,
			sha: imageGit.data.sha,
			mode: '100644',
			type: 'blob'
		})

		const etherscanUrl = `https://etherscan.io/token/${data.tokenAddress}?a=${data.tokenId}`

		let metadataDescription = `Meem Content Description\n\n${data.description}`

		metadataDescription += '\n\nMeem Content Details'

		metadataDescription += `\n\nContract Address: ${data.tokenAddress}`

		if (data.tokenId) {
			metadataDescription += `\n\nToken ID: ${data.tokenId}`
		}

		metadataDescription += `\n\nView on Etherscan: ${etherscanUrl}`

		const metadata: MeemAPI.IMeemMetadata = {
			name: data.collectionName
				? `${data.collectionName} – ${data.name || data.tokenId}`
				: `${data.name || data.tokenId}`,
			description: metadataDescription,
			external_url: `https://raw.githubusercontent.com/meemproject/metadata/${branchName}/meem/${id}.json`,
			meem_properties: {
				root_token_uri: data.rootTokenURI || data.tokenURI,
				root_token_address: data.rootTokenAddress || data.tokenAddress,
				root_token_id: data.rootTokenId || data.tokenId || null,
				root_token_metadata: data.rootTokenMetadata || data.tokenMetadata,
				parent_token_uri: data.tokenURI,
				parent_token_id: data.tokenId || null,
				parent_token_address: data.tokenAddress,
				parent_token_metadata: data.tokenMetadata
			},
			image: `https://raw.githubusercontent.com/meemproject/metadata/${branchName}/meem/images/${id}.png`,
			image_original: data.originalImage
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
			ref: `heads/${branchName}`,
			sha: commit.data.sha
		})

		return {
			metadata,
			tokenURI: `https://raw.githubusercontent.com/meemproject/metadata/${branchName}/meem/${id}.json`
		}
	}

	public static async updateMeemMetadata(data: {
		tokenURI: string
		generation: number
		tokenId: number
		metadataId: string
	}): Promise<{ metadata: any }> {
		const branchName =
			config.NETWORK === MeemAPI.NetworkName.Rinkeby ? `test` : `master`
		const result = await request.get(data.tokenURI)
		const metadata = JSON.parse(result.text)

		const meemDomain =
			config.NETWORK === MeemAPI.NetworkName.Rinkeby
				? `https://dev.meem.wtf`
				: `https://meem.wtf`

		metadata.meem_properties.generation = data.generation
		metadata.meem_properties.token_id = data.tokenId
		metadata.external_url = `${meemDomain}/meems/${data.tokenId}`
		metadata.attributes = [
			{
				display_type: 'number',
				trait_type: 'Meem Generation',
				value: data.generation
			}
		]

		const octokit = new Octokit({
			auth: config.GITHUB_KEY
		})

		const fileBlob = await octokit.repos.getContent({
			owner: 'meemproject',
			repo: 'metadata',
			ref: `heads/${branchName}`,
			path: `meem/${data.metadataId}.json`
		})

		const { sha } = fileBlob.data as any
		const metadataString = JSON.stringify(metadata)
		const base64EncodedMetadata = Buffer.from(metadataString).toString('base64')

		await octokit.repos.createOrUpdateFileContents({
			owner: 'meemproject',
			repo: 'metadata',
			content: base64EncodedMetadata,
			encoding: 'utf-8',
			branch: branchName,
			path: `meem/${data.metadataId}.json`,
			message: `Meem Updated: ${data.metadataId}`,
			sha
		})

		return {
			metadata
		}
	}
}
