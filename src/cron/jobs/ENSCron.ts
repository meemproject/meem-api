/* eslint-disable no-param-reassign */
/* eslint-disable no-await-in-loop */
import Cron from 'cron'
import { DateTime } from 'luxon'
import { Op } from 'sequelize'
import { wait } from '../../lib/utils'
import CronJob from '../CronJob'

export default class ENSCron extends CronJob {
	private job?: Cron.CronJob

	public start() {
		this.job = new Cron.CronJob({
			cronTime: '00 * * * * *',
			onTick: this.run,
			context: this
		})

		this.job.start()
	}

	public async run() {
		log.info('Running ENSCron!')
		log.info(new Date())
		const [meemContracts, wallets] = await Promise.all([
			orm.models.MeemContract.findAll({
				where: {
					[Op.or]: [
						{
							ensFetchedAt: null
						},
						{
							ensFetchedAt: {
								[Op.gt]: DateTime.now()
									.plus({
										days: 7
									})
									.toJSDate()
							}
						}
					]
				},
				order: [['ensFetchedAt', 'ASC NULLS FIRST']],
				limit: 20
			}),
			orm.models.Wallet.findAll({
				where: {
					[Op.or]: [
						{
							ensFetchedAt: null
						},
						{
							ensFetchedAt: {
								[Op.gt]: DateTime.now()
									.plus({
										days: 7
									})
									.toJSDate()
							}
						}
					]
				},
				order: [['ensFetchedAt', 'ASC NULLS FIRST']],
				limit: 20
			})
		])

		const itemsToCheck = [...meemContracts, ...wallets]

		for (let i = 0; i < itemsToCheck.length; i += 1) {
			const item = itemsToCheck[i]
			try {
				const ens = await services.ethers.lookupAddress(item.address)
				log.debug({ address: item.address, ens })
				if (ens) {
					item.ens = ens
				}
			} catch (e) {
				log.warn(e)
			}
			item.ensFetchedAt = DateTime.now().toJSDate()
			await item.save()
			// Limit the number of requests to avoid alchemy rate-limiting
			await wait(1000)
		}
	}
}
