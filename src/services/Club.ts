/* eslint-disable import/no-extraneous-dependencies */
import faker from 'faker'
import { v4 as uuidv4 } from 'uuid'
import type ClubModel from '../models/Club'
import { IClub } from '../types/shared/meem.shared'

export default class ClubService {
	public static async createOrUpdateTwitterConnection(options: {
		tokenId: string
		signature: string
		twitterAccessToken: string
		twitterAccessSecret: string
	}) {
		const { tokenId, signature, twitterAccessToken, twitterAccessSecret } =
			options
		try {
			const twitterUser = await services.twitter.getUser({
				accessToken: twitterAccessToken,
				accessSecret: twitterAccessSecret
			})

			log.debug(`Verified Twitter User: ${twitterUser.id} | ${signature}`)
		} catch (e) {
			log.crit(e)
			await sockets?.emitError(config.errors.SERVER_ERROR, tokenId)
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
