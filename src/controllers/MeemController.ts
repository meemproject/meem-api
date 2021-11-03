import { Response } from 'express'
import meemWhitelist from '../lib/meem-whitelist.json'
import { IRequest, IResponse } from '../types/app'
import { MeemAPI } from '../types/meem.generated'

export default class MeemController {
	public static async getWhitelist(
		req: IRequest<MeemAPI.v1.GetWhitelist.IDefinition>,
		res: IResponse<MeemAPI.v1.GetWhitelist.IResponseBody>
	): Promise<Response> {
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

		return res.json({
			whitelist: {
				...list
			}
		})
	}

	public static async getMeem(
		req: IRequest<MeemAPI.v1.GetMeem.IDefinition>,
		res: IResponse<MeemAPI.v1.GetMeem.IResponseBody>
	): Promise<Response> {
		const { tokenId } = req.query
		const meemContract = services.meem.meemContract()

		const m = await meemContract.getMeem(tokenId)

		return res.json({ m })
	}
}
