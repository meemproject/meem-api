import { Octokit } from '@octokit/rest'
import { v4 as uuidv4 } from 'uuid'
import { MeemAPI } from '../types/meem.generated'

// https://www.reddit.com/r/ipfs/comments/lvwn4o/ipfs_http_gateways_ranked_by_performance/

export default class GitService {
	public static async saveMeemMetadata(
		imageBase64: string,
		meemId?: string
	): Promise<{ metadata: MeemAPI.IMeemMetadata; tokenUri: string }> {
		const id = meemId || uuidv4()

		const octokit = new Octokit({
			auth: config.GITHUB_KEY
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

		const metadata: MeemAPI.IMeemMetadata = {
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
}
