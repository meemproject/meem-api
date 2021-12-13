import { Response } from 'express'
import { IRequest, IResponse } from '../types/app'
import { MeemAPI } from '../types/meem.generated'

export default class AuthController {
	public static async getNonce(
		req: IRequest<MeemAPI.v1.GetNonce.IDefinition>,
		res: IResponse<MeemAPI.v1.GetNonce.IResponseBody>
	): Promise<Response> {
		if (!req.query.address) {
			throw new Error('MISSING_PARAMETERS')
		}
		// Generate a nonce and save it for the wallet
		const nonce = await services.meemId.getNonce({
			address: req.query.address as string
		})

		return res.json({
			nonce
		})
	}

	public static async login(
		req: IRequest<MeemAPI.v1.Login.IDefinition>,
		res: IResponse<MeemAPI.v1.Login.IResponseBody>
	): Promise<Response> {
		const { meemId, jwt } = await services.meemId.login({
			address: req.body.address,
			signature: req.body.signature,
			twitterAccessToken: req.body.twitterAccessToken,
			twitterAccessSecret: req.body.twitterAccessSecret
		})

		return res.json({
			meemId,
			jwt
		})
	}

	public static async createOrUpdateMeemId(
		req: IRequest<MeemAPI.v1.CreateOrUpdateMeemId.IDefinition>,
		res: IResponse<MeemAPI.v1.CreateOrUpdateMeemId.IResponseBody>
	): Promise<Response> {
		// Verify twitter and wallet, create MeemId and return JWT
		const { meemId, jwt } = await services.meemId.createOrUpdateMeemId({
			address: req.body.address,
			signature: req.body.signature,
			twitterAccessToken: req.body.twitterAccessToken,
			twitterAccessSecret: req.body.twitterAccessSecret
		})
		return res.json({
			meemId,
			jwt
		})
	}

	public static async getMeemId(
		req: IRequest<MeemAPI.v1.GetMeemId.IDefinition>,
		res: IResponse<MeemAPI.v1.GetMeemId.IResponseBody>
	): Promise<Response> {
		// Verify twitter and wallet, create MeemId and return JWT
		const item = await (req.query.address
			? orm.models.Wallet.findByAddress(req.query.address)
			: orm.models.Twitter.findOne({
					where: {
						twitterId: req.query.twitterId
					}
			  }))

		if (!item || !item.MeemIdentificationId) {
			throw new Error('MEEM_ID_NOT_FOUND')
		}

		const meemId = await services.meemId.getMeemId({
			meemIdentificationId: item.MeemIdentificationId
		})
		return res.json({
			meemId
		})
	}

	public static async getMe(
		req: IRequest<MeemAPI.v1.GetMe.IDefinition>,
		res: IResponse<MeemAPI.v1.GetMe.IResponseBody>
	): Promise<Response> {
		if (!req.meemId) {
			throw new Error('USER_NOT_LOGGED_IN')
		}
		const meemId = await services.meemId.getMeemId({
			meemIdentification: req.meemId
		})
		return res.json({
			meemId
		})
	}
}
