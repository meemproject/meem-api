import crypto from 'crypto'
import { Readable } from 'stream'
import {
	AuthenticationClient,
	ManagementClient,
	User as Auth0User
} from 'auth0'
import jsonwebtoken, { SignOptions } from 'jsonwebtoken'
import _ from 'lodash'
import { DateTime } from 'luxon'
import request from 'superagent'
import { TwitterApi, UserV2 } from 'twitter-api-v2'
import { v4 as uuidv4 } from 'uuid'
import type Agreement from '../models/Agreement'
import Discord from '../models/Discord'
import Twitter from '../models/Twitter'
import MeemIdentity from '../models/User'
import type User from '../models/User'
import UserIdentity from '../models/UserIdentity'
import type Wallet from '../models/Wallet'
import { MeemAPI } from '../types/meem.generated'
export default class MeemIdentityService {
	public static async getNonce(options: { address: string }) {
		// Generate a nonce and save it for the wallet
		const address = options.address.toLowerCase()

		let wallet = await orm.models.Wallet.findByAddress<Wallet>(address)

		if (!wallet) {
			wallet = orm.models.Wallet.build({
				address
			})
		}

		wallet.nonce = `Welcome! Sign this message to verify it's really you. This does not cost any gas fees.\n\nWallet: ${
			options.address
		}\n\nRandom key:\n${crypto.randomBytes(50).toString('hex')}`
		await wallet.save()

		return wallet.nonce
	}

	public static async updateENS(item: Wallet | Agreement) {
		const ens = await services.ethers.lookupAddress(item.address)
		// eslint-disable-next-line no-param-reassign
		item.ens = ens
		// eslint-disable-next-line no-param-reassign
		item.ensFetchedAt = DateTime.now().toJSDate()
		await item.save()
	}

	public static async removeUserIdentity(options: {
		userId: string
		userIdentityId: string
	}) {
		const { userId, userIdentityId } = options

		await orm.models.UserIdentity.destroy({
			where: {
				UserId: userId,
				id: userIdentityId
			}
		})
	}

	public static async login(options: {
		/** Attach the login method to an existing user */
		attachToUser?: User | null

		/** Auth0 access token */
		accessToken?: string

		/** Wallet address */
		address?: string

		/** Wallet signature */
		signature?: string
	}) {
		const { attachToUser, accessToken, address, signature } = options

		let wallet: Wallet | undefined | null
		let user: User | undefined | null = attachToUser

		if (attachToUser && attachToUser.DefaultWalletId) {
			wallet = await orm.models.Wallet.findOne({
				where: {
					id: attachToUser.DefaultWalletId
				}
			})
		}

		if (address && signature) {
			wallet = await this.verifySignature({ address, signature })

			if (wallet.UserId) {
				user = await orm.models.User.findOne({
					where: {
						id: wallet.UserId
					}
				})
			} else {
				const t = await orm.sequelize.transaction()
				user = await orm.models.User.create(
					{
						DefaultWalletId: wallet.id
					},
					{
						transaction: t
					}
				)

				wallet.UserId = user.id
				await wallet.save({
					transaction: t
				})

				await t.commit()
			}
		}

		if (accessToken) {
			const authClient = new AuthenticationClient({
				domain: config.AUTH0_APP_DOMAIN,
				clientId: config.AUTH0_CLIENT_ID,
				clientSecret: config.AUTH0_CLIENT_SECRET
			})

			// const mgmgtClient = new ManagementClient({
			// 	domain: config.AUTH0_APP_DOMAIN,
			// 	clientId: config.AUTH0_CLIENT_ID,
			// 	clientSecret: config.AUTH0_CLIENT_SECRET
			// })
			const userInfo = await authClient.getProfile(accessToken)
			log.debug(userInfo)

			if (!userInfo.sub) {
				throw new Error('INVALID_ACCESS_TOKEN')
			}

			const connectionId = userInfo.sub.replace(/^oauth2\|/, '').split('|')[0]

			// eslint-disable-next-line prefer-const
			let [userIdentity, identityProvider] = await Promise.all([
				orm.models.UserIdentity.findOne({
					where: {
						externalId: userInfo.sub
					},
					include: [
						{
							model: orm.models.User,
							include: [
								{
									model: orm.models.Wallet,
									as: 'DefaultWallet'
								}
							]
						}
					]
				}),
				orm.models.IdentityProvider.findOne({
					where: {
						connectionId
					}
				})
			])

			if (!identityProvider) {
				throw new Error('INTEGRATION_NOT_FOUND')
			}

			if (userIdentity) {
				if (attachToUser && attachToUser.id !== userIdentity.UserId) {
					throw new Error('IDENTITY_ASSOCIATED_TO_ANOTHER_USER')
				}
				user = userIdentity.User
				wallet = user?.DefaultWallet
			} else {
				const t = await orm.sequelize.transaction()
				user =
					attachToUser ??
					(await orm.models.User.create(
						{},
						{
							transaction: t
						}
					))
				userIdentity = await orm.models.UserIdentity.create(
					{
						externalId: userInfo.sub,
						UserId: user.id,
						IdentityProviderId: identityProvider.id
					},
					{
						transaction: t
					}
				)

				await t.commit()
			}
		}

		if (!user) {
			throw new Error('LOGIN_FAILED')
		}

		if (!wallet) {
			const { tokenId, address: pkpAddress } = await services.lit.mintPKP()
			wallet = await orm.models.Wallet.create({
				address: pkpAddress,
				UserId: user.id,
				pkpTokenId: tokenId
			})

			user.DefaultWalletId = wallet.id
			await user.save()
		}

		if (wallet.pkpTokenId === null && wallet.ensFetchedAt === null) {
			await this.updateENS(wallet)
		}

		return {
			user,
			jwt: this.generateJWT({
				walletAddress: wallet?.address ?? '',
				data: {
					'https://hasura.io/jwt/claims': {
						'x-hasura-allowed-roles': ['anonymous', 'user', 'mutualClubMember'],
						'x-hasura-default-role': 'user',
						'x-hasura-wallet-id': wallet?.id ?? '',
						'x-hasura-user-id': user?.id ?? ''
					}
				}
			})
		}
	}

	public static async verifySignature(options: {
		address: string
		signature: string
	}) {
		const ethers = services.ethers.getInstance()
		const { address, signature } = options

		const wallet = await orm.models.Wallet.findByAddress<Wallet>(address)

		if (!wallet || !wallet.nonce) {
			throw new Error('WALLET_NOT_FOUND')
		}

		if (!config.TESTING) {
			const signingAddress = ethers.utils.verifyMessage(wallet.nonce, signature)
			if (signingAddress.toLowerCase() !== address.toLowerCase()) {
				throw new Error('SIGNATURE_FAILED')
			}
		}

		return wallet
	}

	public static generateJWT(options: {
		walletAddress: string
		/** Additional data to encode in the JWT. Do not store sensitive information here. */
		data?: Record<string, any>
		expiresIn?: number | null
	}) {
		const { walletAddress, expiresIn, data } = options
		const jwtOptions: SignOptions = {
			algorithm: 'RS512',
			jwtid: uuidv4()
		}
		if (expiresIn !== null) {
			let exp = config.JWT_EXPIRES_IN
			if (expiresIn && +expiresIn > 0) {
				exp = +expiresIn
			}
			jwtOptions.expiresIn = exp
		}
		const token = jsonwebtoken.sign(
			{
				...data,
				walletAddress
			},
			config.JWT_RSA_PRIVATE_KEY,
			jwtOptions
		)

		return token
	}

	public static verifyJWT(token: string): Record<string, any> {
		const data = jsonwebtoken.verify(token, config.JWT_RSA_PUBLIC_KEY, {
			algorithms: ['RS512']
		})
		return data as Record<string, any>
	}

	public static async getUserForWallet(wallet: Wallet): Promise<User> {
		let user = await orm.models.User.findOne({
			include: [
				{
					model: orm.models.Wallet,
					where: {
						address: wallet.address
					}
				},
				{
					model: orm.models.Wallet,
					as: 'DefaultWallet'
				}
			]
		})

		if (!user) {
			user = await this.createOrUpdateUser({
				wallet
			})
		}

		return user
	}

	public static async getMeemIdentityForAddress(
		address: string
	): Promise<MeemIdentity> {
		let user = await orm.models.User.findOne({
			include: [
				{
					model: orm.models.Wallet,
					where: {
						address
					},
					attributes: ['id', 'address', 'ens'],
					through: {
						attributes: []
					}
				},
				{
					model: orm.models.Wallet,
					as: 'DefaultWallet',
					attributes: ['id', 'address', 'ens']
				}
			]
		})

		if (!user) {
			const wallet = await orm.models.Wallet.create({
				address
			})
			user = await this.createOrUpdateUser({
				wallet
			})
		}

		return user
	}

	public static async createUserIdentity(data: {
		identityProviderId: string
		metadata?: any
		visibility?: MeemAPI.UserIdentityVisibility
		user: User
	}): Promise<UserIdentity> {
		const { user, identityProviderId, metadata, visibility } = data

		const userIdentity = await orm.models.UserIdentity.findOne({
			where: {
				IdentityProviderId: identityProviderId
			}
		})

		if (!userIdentity) {
			throw new Error('INTEGRATION_NOT_FOUND')
		}

		if (userIdentity.UserId !== user.id) {
			throw new Error('NOT_AUTHORIZED')
		}

		try {
			const meemIdUserIdentityVisibility =
				visibility ?? MeemAPI.UserIdentityVisibility.JustMe

			if (
				visibility &&
				Object.values(MeemAPI.UserIdentityVisibility).includes(
					meemIdUserIdentityVisibility
				)
			) {
				userIdentity.visibility = meemIdUserIdentityVisibility
			}

			// TODO: Typecheck metadata
			userIdentity.metadata = {
				...userIdentity.metadata,
				...metadata
			}

			await userIdentity.save()
			return userIdentity
		} catch (e) {
			throw new Error('SERVER_ERROR')
		}
	}

	public static async updateUserIdentity(data: {
		userIdentityId: string
		metadata?: any
		visibility?: MeemAPI.UserIdentityVisibility
		user: User
	}): Promise<UserIdentity> {
		const { user, userIdentityId, metadata, visibility } = data

		const userIdentity = await orm.models.UserIdentity.findOne({
			where: {
				id: userIdentityId
			}
		})

		if (!userIdentity) {
			throw new Error('INTEGRATION_NOT_FOUND')
		}

		if (userIdentity.UserId !== user.id) {
			throw new Error('NOT_AUTHORIZED')
		}

		try {
			const meemIdUserIdentityVisibility =
				visibility ?? MeemAPI.UserIdentityVisibility.JustMe

			if (
				visibility &&
				Object.values(MeemAPI.UserIdentityVisibility).includes(
					meemIdUserIdentityVisibility
				)
			) {
				userIdentity.visibility = meemIdUserIdentityVisibility
			}

			// TODO: Typecheck metadata
			userIdentity.metadata = {
				...userIdentity.metadata,
				...metadata
			}

			await userIdentity.save()
			return userIdentity
		} catch (e) {
			throw new Error('SERVER_ERROR')
		}
	}

	public static async createOrUpdateUser(data: {
		wallet: Wallet
		profilePicBase64?: string
		displayName?: string
		isDefaultWallet?: boolean
	}): Promise<User> {
		// TODO: Add ability to add another wallet
		const { wallet, profilePicBase64, displayName } = data
		try {
			let user = await orm.models.User.findOne({
				include: [
					{
						model: orm.models.Wallet,
						where: {
							address: wallet.address
						}
					},
					{
						model: orm.models.Wallet,
						as: 'DefaultWallet'
					}
				]
			})

			let profilePicUrl: string | undefined

			if (!_.isUndefined(profilePicBase64)) {
				if (profilePicBase64 !== '') {
					const base64Data = /^data:image/.test(profilePicBase64)
						? profilePicBase64.split(',')[1]
						: profilePicBase64
					const buff = Buffer.from(base64Data, 'base64')
					const stream = Readable.from(buff)

					// @ts-ignore
					stream.path = `${user.id}/image.png`

					const imageResponse = await services.web3.saveToPinata({
						// file: Readable.from(Buffer.from(imgData, 'base64'))
						// file: buffStream
						file: stream
					})

					profilePicUrl = `ipfs://${imageResponse.IpfsHash}`
				} else {
					profilePicUrl = ''
				}
			}

			if (user) {
				const updates: any = {
					...(!_.isUndefined(profilePicUrl) && { profilePicUrl }),
					...(!_.isUndefined(displayName) && { displayName })
				}

				if (_.keys(updates).length > 0) await user.update(updates)
			} else {
				user = await orm.models.User.create({
					profilePicUrl: profilePicUrl ?? null,
					displayName: displayName ?? null,
					DefaultWalletId: wallet.id
				})

				const updatedUser = await orm.models.User.findOne({
					include: [
						{
							model: orm.models.Wallet,
							where: {
								address: wallet.address
							}
						},
						{
							model: orm.models.Wallet,
							as: 'DefaultWallet'
						}
					]
				})

				user = updatedUser ?? user
			}

			return user
		} catch (e) {
			log.crit(e)
			throw new Error('SERVER_ERROR')
		}
	}

	public static async verifyTwitter(data: {
		twitterUsername: string
		walletAddress: string
	}): Promise<UserV2> {
		const client = new TwitterApi(config.TWITTER_BEARER_TOKEN)
		const { twitterUsername, walletAddress } = data

		const twitterUserResult = await client.v2.userByUsername(twitterUsername, {
			'user.fields': ['id', 'username', 'name', 'profile_image_url']
		})

		if (!twitterUserResult) {
			log.crit('No Twitter user found for username')
			throw new Error('SERVER_ERROR')
		}

		const usersLatestTweets = await client.v2.userTimeline(
			twitterUserResult.data.id,
			{
				'tweet.fields': ['created_at', 'entities']
			}
		)

		const verifiedTweet = usersLatestTweets.data.data.find(tweet => {
			const isVerifiedTweet = tweet.text.toLowerCase().includes(walletAddress)
			return isVerifiedTweet
		})

		if (!verifiedTweet) {
			log.crit('Unable to find verification tweet')
			throw new Error('SERVER_ERROR')
		}

		let twitter: Twitter | undefined
		const existingTwitter = await orm.models.Twitter.findOne({
			where: {
				twitterId: twitterUserResult.data.id
			}
		})

		if (!existingTwitter) {
			twitter = await orm.models.Twitter.create({
				id: uuidv4(),
				twitterId: twitterUserResult.data.id
			})
		} else {
			twitter = existingTwitter
		}

		if (!twitter) {
			log.crit('Twitter not found or created')
			throw new Error('SERVER_ERROR')
		}

		return twitterUserResult.data
	}

	public static async verifyDiscord(options: {
		discordAuthCode: string
		redirectUri?: string
	}): Promise<Discord> {
		const { discordAuthCode, redirectUri } = options

		try {
			const discordAuthResult = await request
				.post('https://discord.com/api/oauth2/token')
				.field('client_id', config.DISCORD_CLIENT_ID)
				.field('client_secret', config.DISCORD_CLIENT_SECRET)
				.field('grant_type', 'authorization_code')
				.field('redirect_uri', redirectUri ?? config.DISCORD_AUTH_CALLBACK_URL)
				.field('code', discordAuthCode)

			if (!discordAuthResult.body.access_token) {
				throw new Error('NOT_AUTHORIZED')
			}

			const discordUserResult = await request
				.get('https://discord.com/api/oauth2/@me')
				.auth(discordAuthResult.body.access_token, {
					type: 'bearer'
				})

			if (!discordUserResult.body.user?.id) {
				throw new Error('NOT_AUTHORIZED')
			}

			const discordUser = discordUserResult.body.user
			let discord: Discord

			const existingDiscord = await orm.models.Discord.findOne({
				where: {
					discordId: discordUser.id
				}
			})

			if (existingDiscord) {
				existingDiscord.username = discordUser.username
				existingDiscord.avatar = discordUser.avatar
				const updatedDiscord = await existingDiscord.save()
				discord = updatedDiscord
			} else {
				discord = await orm.models.Discord.create({
					discordId: discordUser.id,
					username: discordUser.username,
					avatar: discordUser.avatar
				})
			}

			return discord
		} catch (e) {
			log.crit(e)
			throw new Error('SERVER_ERROR')
		}
	}

	public static async verifyEmail(options: {
		meemId: MeemIdentity
		email: string
		redirectUri?: string
	}): Promise<Auth0User> {
		const { meemId, email, redirectUri } = options

		try {
			const mgmgtClient = new ManagementClient({
				domain: config.AUTH0_APP_DOMAIN,
				clientId: config.AUTH0_CLIENT_ID,
				clientSecret: config.AUTH0_CLIENT_SECRET
			})

			const authClient = new AuthenticationClient({
				domain: config.AUTH0_APP_DOMAIN,
				clientId: config.AUTH0_CLIENT_ID,
				clientSecret: config.AUTH0_CLIENT_SECRET
			})

			const users = await mgmgtClient.getUsers({
				q: `app_metadata.internal_id:"${meemId.id}"`
			})

			let user = users[0] ?? null

			if (user && user.user_id) {
				if (users[0].email_verified && users[0].email === email) {
					return users[0]
				}

				if (user.email !== email) {
					user = await mgmgtClient.updateUser(
						{
							id: user.user_id
						},
						{
							email,
							email_verified: false
						}
					)
				}

				await authClient.requestMagicLink({
					email,
					authParams: {
						redirect_uri: redirectUri ?? config.AUTH0_VERIFY_EMAIL_CALLBACK_URL
					}
				})

				return user
			} else {
				user = await mgmgtClient.createUser({
					connection: 'email',
					email,
					email_verified: true, // Hack to prevent verification email from being automatically sent
					verify_email: false,
					app_metadata: {
						internal_id: meemId.id
					}
				})

				if (user.user_id) {
					// Immediately update email_verified to false after user is created. See note above about hack.
					user = await mgmgtClient.updateUser(
						{
							id: user.user_id
						},
						{
							email_verified: false
						}
					)
				}

				await authClient.requestMagicLink({
					email,
					authParams: {
						redirect_uri: redirectUri ?? config.AUTH0_VERIFY_EMAIL_CALLBACK_URL
					}
				})
				return user
			}
		} catch (e) {
			log.crit(e)
			throw new Error('SERVER_ERROR')
		}
	}
}
