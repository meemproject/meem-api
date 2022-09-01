// eslint-disable-next-line import/no-extraneous-dependencies
// import AWS from 'aws-sdk'
import { Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { IRequest, IResponse } from '../types/app'
import { MeemAPI } from '../types/meem.generated'

export default class MeemIdController {
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
		const { jwt } = await services.meemId.login({
			accessToken: req.body.accessToken,
			address: req.body.address,
			signature: req.body.signature
		})

		return res.json({
			jwt
		})
	}

	public static async createOrUpdateMeemId(
		req: IRequest<MeemAPI.v1.CreateOrUpdateMeemId.IDefinition>,
		res: IResponse<MeemAPI.v1.CreateOrUpdateMeemId.IResponseBody>
	): Promise<Response> {
		if (!req.wallet) {
			throw new Error('USER_NOT_LOGGED_IN')
		}

		const { profilePicBase64, displayName } = req.body

		await services.meemId.createOrUpdateMeemIdentity({
			wallet: req.wallet,
			profilePicBase64,
			displayName
		})

		return res.json({
			status: 'success'
		})
	}

	public static async getMe(
		req: IRequest<MeemAPI.v1.GetMe.IDefinition>,
		res: IResponse<MeemAPI.v1.GetMe.IResponseBody>
	): Promise<Response> {
		if (!req.wallet) {
			throw new Error('USER_NOT_LOGGED_IN')
		}

		const meemId = await services.meemId.getMeemIdentityForWallet(req.wallet)
		return res.json({
			walletId: req.wallet.id,
			address: req.wallet.address,
			meemIdentity: meemId
		})
	}

	public static async refreshENS(
		req: IRequest<MeemAPI.v1.RefreshENS.IDefinition>,
		res: IResponse<MeemAPI.v1.RefreshENS.IResponseBody>
	): Promise<Response> {
		if (!req.wallet) {
			throw new Error('USER_NOT_LOGGED_IN')
		}

		await services.meemId.updateENS(req.wallet)

		return res.json({
			status: 'success'
		})
	}

	public static async getApiKey(
		req: IRequest<MeemAPI.v1.GetApiKey.IDefinition>,
		res: IResponse<MeemAPI.v1.GetApiKey.IResponseBody>
	): Promise<Response> {
		if (!req.wallet) {
			throw new Error('USER_NOT_LOGGED_IN')
		}

		const newApiKey = uuidv4()
		req.wallet.apiKey = newApiKey
		await req.wallet.save()

		return res.json({
			jwt: services.meemId.generateJWT({
				walletAddress: req.wallet.address,
				data: {
					apiKey: newApiKey
				},
				expiresIn: null
			})
		})
	}

	public static async createOrUpdateMeemIdIntegration(
		req: IRequest<MeemAPI.v1.CreateOrUpdateMeemIdIntegration.IDefinition>,
		res: IResponse<MeemAPI.v1.CreateOrUpdateMeemIdIntegration.IResponseBody>
	): Promise<Response> {
		if (!req.wallet) {
			throw new Error('USER_NOT_LOGGED_IN')
		}
		const { metadata, visibility } = req.body
		const { integrationId } = req.params
		const meemId = await services.meemId.getMeemIdentityForWallet(req.wallet)

		try {
			await services.meemId.createOrUpdateMeemIdIntegration({
				meemId,
				metadata,
				visibility,
				integrationId,
				walletAddress: req.wallet.address
			})

			return res.json({
				status: 'success'
			})
		} catch (e) {
			throw new Error('SERVER_ERROR')
		}
	}
}
