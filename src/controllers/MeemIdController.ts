// eslint-disable-next-line import/no-extraneous-dependencies
// import AWS from 'aws-sdk'
import { Response } from 'express'
import _ from 'lodash'
import { v4 as uuidv4 } from 'uuid'
import { IRequest, IResponse } from '../types/app'
import { MeemAPI } from '../types/meem.generated'
import { IMeemIdIntegrationVisibility } from '../types/shared/meem.shared'

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

		const integrationMetadata = req.body.metadata ?? {}
		const meemId = await services.meemId.getMeemIdentityForWallet(req.wallet)

		const integration = await orm.models.IdentityIntegration.findOne({
			where: {
				id: req.params.integrationId
			}
		})

		if (!integration) {
			throw new Error('INTEGRATION_NOT_FOUND')
		}

		const existingMeemIdIntegration =
			await orm.models.MeemIdentityIntegration.findOne({
				where: {
					MeemIdentityId: meemId.id,
					IdentityIntegrationId: integration.id
				}
			})

		// Integration Verification
		// Can allow for third-party endpoint requests to verify information and return custom metadata

		const visibilityTypes = [
			IMeemIdIntegrationVisibility.Anyone.toString(),
			IMeemIdIntegrationVisibility.MutualClubMembers.toString(),
			IMeemIdIntegrationVisibility.JustMe.toString()
		]
		switch (integration.id) {
			case config.TWITTER_IDENTITY_INTEGRATION_ID: {
				let twitterUsername = req.body.metadata?.twitterUsername
					? (req.body.metadata?.twitterUsername as string)
					: null
				twitterUsername = twitterUsername?.replace(/^@/g, '').trim() ?? null
				const integrationError = new Error('INTEGRATION_FAILED')
				integrationError.message = 'Twitter verification failed.'

				if (
					existingMeemIdIntegration &&
					existingMeemIdIntegration.metadata?.isVerified &&
					(!twitterUsername ||
						twitterUsername ===
							existingMeemIdIntegration.metadata?.twitterUsername)
				) {
					break
				}

				if (!twitterUsername) {
					throw integrationError
				}

				integrationMetadata.isVerified = false

				const verifiedTwitter = await services.meemId.verifyTwitter({
					twitterUsername,
					walletAddress: req.wallet.address
				})

				if (!verifiedTwitter) {
					throw integrationError
				}

				integrationMetadata.isVerified = true
				integrationMetadata.twitterUsername = verifiedTwitter.username
				integrationMetadata.twitterProfileImageUrl =
					verifiedTwitter.profile_image_url
				integrationMetadata.twitterDisplayName = verifiedTwitter.name
				integrationMetadata.twitterUserId = verifiedTwitter.id
				integrationMetadata.twitterProfileUrl = `https://twitter.com/${verifiedTwitter.username}`

				break
			}
			case config.DISCORD_IDENTITY_INTEGRATION_ID: {
				const discordAuthCode = req.body.metadata?.discordAuthCode
					? (req.body.metadata?.discordAuthCode as string)
					: null
				const integrationError = new Error('INTEGRATION_FAILED')
				integrationError.message = 'Discord verification failed.'

				if (!discordAuthCode) {
					throw integrationError
				}

				integrationMetadata.isVerified = false

				const verifiedDiscord = await services.meemId.verifyDiscord({
					discordAuthCode
				})

				if (!verifiedDiscord) {
					throw integrationError
				}

				integrationMetadata.isVerified = true
				integrationMetadata.discordUsername = verifiedDiscord.username
				integrationMetadata.discordAvatarUrl = `https://cdn.discordapp.com/avatars/${verifiedDiscord.discordId}/${verifiedDiscord.avatar}.png`
				integrationMetadata.discordUserId = verifiedDiscord.discordId

				break
			}
			default:
				break
		}

		let meemIdIntegrationVisibility =
			req.body.visibility ?? IMeemIdIntegrationVisibility.JustMe

		if (!existingMeemIdIntegration) {
			if (!visibilityTypes.includes(meemIdIntegrationVisibility))
				meemIdIntegrationVisibility = IMeemIdIntegrationVisibility.JustMe
			await orm.models.MeemIdentityIntegration.create({
				MeemIdentityId: meemId.id,
				IdentityIntegrationId: integration.id,
				visibility: meemIdIntegrationVisibility,
				metadata: integrationMetadata
			})
		} else {
			if (
				!_.isUndefined(req.body.visibility) &&
				visibilityTypes.includes(meemIdIntegrationVisibility)
			) {
				existingMeemIdIntegration.visibility = meemIdIntegrationVisibility
			}

			if (integrationMetadata) {
				// TODO: Typecheck metadata
				existingMeemIdIntegration.metadata = integrationMetadata
			}

			await existingMeemIdIntegration.save()
		}

		return res.json({
			status: 'success'
		})
	}
}
