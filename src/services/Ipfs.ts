import request from 'superagent'

// https://www.reddit.com/r/ipfs/comments/lvwn4o/ipfs_http_gateways_ranked_by_performance/

export default class IpfsService {
	public static async getIPFSFile(filename: string) {
		const ipfsId = filename.replace('ipfs://', '')
		const url = `${config.IPFS_CONTENT_GATEWAY_URL}/ipfs/${ipfsId}`
		const { body, type } = await request.get(url)

		return { body, type }
	}
}
