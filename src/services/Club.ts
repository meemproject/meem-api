/* eslint-disable import/no-extraneous-dependencies */
import faker from 'faker'
import { Op } from 'sequelize'
import { v4 as uuidv4 } from 'uuid'

export default class ClubService {
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
}
