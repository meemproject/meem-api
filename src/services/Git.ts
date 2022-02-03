import { Octokit } from '@octokit/rest'
import request from 'superagent'
import { MeemAPI } from '../types/meem.generated'
import { IMeemMetadata } from '../types/shared/meem.shared'

// https://www.reddit.com/r/ipfs/comments/lvwn4o/ipfs_http_gateways_ranked_by_performance/

export default class GitService {
	public static async saveMeemMetadata(data: {
		meemId: string
		imageBase64: string
		metadata: MeemAPI.ICreateMeemMetadata
	}): Promise<{ metadata: MeemAPI.IMeemMetadata; tokenURI: string }> {
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
			path: `meem/images/${data.meemId}.png`,
			sha: imageGit.data.sha,
			mode: '100644',
			type: 'blob'
		})

		const image = `https://raw.githubusercontent.com/meemproject/metadata/${branchName}/meem/images/${data.meemId}.png`

		const storedMetadata: MeemAPI.IMeemMetadata = {
			...data.metadata,
			meem_id: data.metadata.meem_id ?? '',
			external_url: data.metadata.external_url ?? '',
			image,
			image_original: image
		}

		const metadataGit = await octokit.git.createBlob({
			owner: 'meemproject',
			repo: 'metadata',
			content: JSON.stringify(storedMetadata),
			encoding: 'utf-8'
		})

		treeItems.push({
			path: `meem/${data.meemId}.json`,
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
			message: `New Meem Created: ${data.meemId}`,
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
			metadata: storedMetadata,
			tokenURI: `https://raw.githubusercontent.com/meemproject/metadata/${branchName}/meem/${data.meemId}.json`
		}
	}

	public static async updateMeemMetadata(data: {
		tokenURI: string
		generation: number
		tokenId: number
		metadataId: string
	}): Promise<IMeemMetadata> {
		const branchName =
			config.NETWORK === MeemAPI.NetworkName.Rinkeby ? `test` : `master`
		const result = await request.get(data.tokenURI)
		const metadata = JSON.parse(result.text)

		metadata.meem_properties.generation = data.generation
		metadata.meem_properties.token_id = data.tokenId
		metadata.external_url = `${config.MEEM_DOMAIN}/meems/${data.tokenId}`
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

		return metadata
	}
}
