import { Readable } from 'stream'
import { IRequest, IResponse } from '../types/app'
import { MeemAPI } from '../types/meem.generated'

export default class MeemController {
	public static async getIPFSFile(
		req: IRequest<MeemAPI.v1.GetIPFSFile.IDefinition>,
		res: IResponse<MeemAPI.v1.GetIPFSFile.IResponseBody>
	): Promise<any> {
		const { filename } = req.query
		const { body, type } = await services.ipfs.getIPFSFile(filename)

		if (type === 'application/json') {
			return res.json({ metadata: { ...body } })
		}

		res.setHeader('content-type', type)
		return res.end(body, 'binary')
	}

	public static async saveToIPFS(
		req: IRequest<MeemAPI.v1.SaveToIPFS.IDefinition>,
		res: IResponse<MeemAPI.v1.SaveToIPFS.IResponseBody>
	): Promise<any> {
		const { data, json } = req.body
		const body = data ? { file: Readable.from(data) } : { json }

		if (body.file) {
			// Pinata hack https://github.com/PinataCloud/Pinata-SDK/issues/28
			// @ts-ignore
			body.file.path = 'data.txt'
		}

		const result = await services.web3.saveToPinata(body)

		return res.json({
			ipfsHash: result.IpfsHash
		})
	}
}
