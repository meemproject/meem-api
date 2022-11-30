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
}
