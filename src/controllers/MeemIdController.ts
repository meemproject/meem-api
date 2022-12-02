// eslint-disable-next-line import/no-extraneous-dependencies
// import AWS from 'aws-sdk'
import { Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import User from '../models/User'
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
		const { accessToken, address, signature, shouldConnectUser } = req.body

		let user: User | null = null

		if (shouldConnectUser) {
			if (!req.wallet) {
				throw new Error('USER_NOT_LOGGED_IN')
			}
			user = await services.meemId.getUserForWallet(req.wallet)
		}

		const { jwt } = await services.meemId.login({
			attachToUser: user,
			accessToken,
			address,
			signature
		})

		return res.json({
			jwt
		})
	}

	public static async detachUserIdentity(
		req: IRequest<MeemAPI.v1.DetachUserIdentity.IDefinition>,
		res: IResponse<MeemAPI.v1.DetachUserIdentity.IResponseBody>
	): Promise<Response> {
		const { integrationId } = req.params

		if (!req.wallet?.UserId) {
			throw new Error('USER_NOT_LOGGED_IN')
		}

		await services.meemId.detachUserIdentity({
			userId: req.wallet.UserId,
			identityIntegrationId: integrationId
		})

		return res.json({
			status: 'success'
		})
	}

	public static async createOrUpdateUser(
		req: IRequest<MeemAPI.v1.CreateOrUpdateUser.IDefinition>,
		res: IResponse<MeemAPI.v1.CreateOrUpdateUser.IResponseBody>
	): Promise<Response> {
		if (!req.wallet) {
			throw new Error('USER_NOT_LOGGED_IN')
		}

		const { profilePicBase64, displayName } = req.body

		const user = (await services.meemId.createOrUpdateUser({
			wallet: req.wallet,
			profilePicBase64,
			displayName
		})) as MeemAPI.IMeemUser

		return res.json({
			user
		})
	}

	public static async getMe(
		req: IRequest<MeemAPI.v1.GetMe.IDefinition>,
		res: IResponse<MeemAPI.v1.GetMe.IResponseBody>
	): Promise<Response> {
		if (!req.wallet) {
			throw new Error('USER_NOT_LOGGED_IN')
		}

		const user = (await services.meemId.getUserForWallet(
			req.wallet
		)) as MeemAPI.IMeemUser
		return res.json({
			walletId: req.wallet.id,
			address: req.wallet.address,
			user
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

	public static async updateUserIdentity(
		req: IRequest<MeemAPI.v1.UpdateUserIdentity.IDefinition>,
		res: IResponse<MeemAPI.v1.UpdateUserIdentity.IResponseBody>
	): Promise<Response> {
		if (!req.wallet) {
			throw new Error('USER_NOT_LOGGED_IN')
		}
		const { metadata, visibility } = req.body
		const { integrationId } = req.params
		const user = await services.meemId.getUserForWallet(req.wallet)

		try {
			const userIdentity = await services.meemId.updateUserIdentity({
				user,
				metadata,
				visibility,
				identityIntegrationId: integrationId
			})

			return res.json({
				userIdentity
			})
		} catch (e) {
			throw new Error('SERVER_ERROR')
		}
	}
}
