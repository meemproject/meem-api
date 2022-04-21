/* eslint-disable import/no-extraneous-dependencies */
import faker from 'faker'
import request from 'superagent'
import { v4 as uuidv4 } from 'uuid'
import type ClubModel from '../models/Club'
import Instagram from '../models/Instagram'
import Twitter from '../models/Twitter'
import { IClub } from '../types/shared/meem.shared'

export default class ClubService {
	public static async createOrUpdateTwitterConnection(options: {
		clubId: string
		signature: string
		twitterAccessToken: string
		twitterAccessSecret: string
	}): Promise<Twitter> {
		const { clubId, signature, twitterAccessToken, twitterAccessSecret } =
			options
		try {
			const twitterUser = await services.twitter.getUser({
				accessToken: twitterAccessToken,
				accessSecret: twitterAccessSecret
			})

			if (!twitterUser.id) {
				throw new Error('NOT_AUTHORIZED')
			}

			let twitter: Twitter

			const existingTwitter = await orm.models.Twitter.findOne({
				where: {
					twitterId: twitterUser.id_str
				}
			})

			if (existingTwitter) {
				existingTwitter.ClubId = clubId
				const updatedTwitter = await existingTwitter.save()
				twitter = updatedTwitter
			} else {
				twitter = await orm.models.Twitter.create({
					twitterId: twitterUser.id_str,
					isDefault: false,
					ClubId: clubId
				})
			}

			log.debug(`Verified Twitter User: ${twitterUser.id} | ${signature}`)

			return twitter
		} catch (e) {
			log.crit(e)
			await sockets?.emitError(config.errors.SERVER_ERROR, clubId)
			throw new Error('SERVER_ERROR')
		}
	}

	public static async createOrUpdateInstagramConnection(options: {
		clubId: string
		signature: string
		instagramUserId: string
		instagramAuthCode: string
	}): Promise<Instagram> {
		const { clubId, signature, instagramUserId, instagramAuthCode } = options
		try {
			const instagramAuthResult = await request
				.post('https://api.instagram.com/oauth/access_token')
				.field('client_id', config.IG_APP_ID)
				.field('client_secret', config.IG_APP_SECRET)
				.field('grant_type', 'authorization_code')
				.field('redirect_uri', config.IG_AUTH_CALLBACK_URL)
				.field('code', instagramAuthCode)

			if (
				instagramAuthResult.body.access_token &&
				instagramAuthResult.body.user_id &&
				`${instagramAuthResult.body.user_id}` === instagramUserId
			) {
				let instagram: Instagram

				const existingInstagram = await orm.models.Instagram.findOne({
					where: {
						instagramId: instagramUserId
					}
				})

				if (existingInstagram) {
					existingInstagram.ClubId = clubId
					const updatedInstagram = await existingInstagram.save()
					instagram = updatedInstagram
				} else {
					instagram = await orm.models.Instagram.create({
						instagramId: instagramUserId,
						isDefault: false,
						ClubId: clubId
					})
				}

				log.debug(`Verified Instagram User: ${instagramUserId} | ${signature}`)

				return instagram
			}
			throw new Error('NOT_AUTHORIZED')
		} catch (e) {
			log.crit(e)
			throw new Error('SERVER_ERROR')
		}
	}

	public static async seedClubs() {
		const clubs = []

		for (let i = 0; i < 25; i += 1) {
			const clubName = `${faker.name.jobTitle()}s ${i + 1}`
			clubs.push({
				tokenName: clubName.toLowerCase().split(' ').join('-'),
				displayName: clubName,
				description: faker.company.bs(),
				tokenId: uuidv4()
			})
		}
		await orm.models.Club.sync({ force: true })
		const failedClubs: any[] = []
		for (let i = 0; i < clubs.length; i += 1) {
			try {
				log.debug(`Syncing ${i + 1} / ${clubs.length} clubs`)
				// eslint-disable-next-line no-await-in-loop
				await orm.models.Club.create(clubs[i])
			} catch (e) {
				failedClubs.push(clubs[i])
				log.crit(e)
				log.debug(clubs[i])
			}
		}
	}

	public static clubToIClub(club: ClubModel): IClub {
		return {
			tokenId: club.tokenId,
			tokenName: club.tokenName,
			displayName: club.displayName,
			description: club.description
		}
	}
}
