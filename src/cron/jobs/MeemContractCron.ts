/* eslint-disable no-param-reassign */
/* eslint-disable no-await-in-loop */
import { diamondABI } from '@meemproject/meem-contracts'
import { Alchemy, Wallet as AlchemyWallet } from 'alchemy-sdk'
import Cron from 'cron'
import { ethers } from 'ethers'
import { DateTime } from 'luxon'
import { Op } from 'sequelize'
import { wait } from '../../lib/utils'
import Wallet from '../../models/Wallet'
import CronJob from '../CronJob'

export default class MeemContractCron extends CronJob {
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
		log.info('Running MeemContractCron!')
		log.info(new Date())

		const meemContracts = await orm.models.MeemContract.findAll({
			where: {
				[Op.or]: [
					{
						ownerFetchedAt: null
					},
					{
						ownerFetchedAt: {
							[Op.gt]: DateTime.now()
								.plus({
									days: 7
								})
								.toJSDate()
						}
					}
				]
			},
			order: [['ownerFetchedAt', 'ASC NULLS FIRST']],
			limit: 20
		})

		const providers: Record<number, Alchemy> = {}

		for (let i = 0; i < meemContracts.length; i++) {
			const meemContract = meemContracts[i]
			try {
				if (!providers[meemContract.chainId]) {
					const { provider } = await services.ethers.getProvider({
						chainId: meemContract.chainId
					})
					providers[meemContract.chainId] = provider
				}

				const signer = new AlchemyWallet(
					config.WALLET_PRIVATE_KEY,
					providers[meemContract.chainId]
				)

				const instance = new ethers.Contract(
					meemContract.address,
					diamondABI,
					signer
				)

				const owner = await instance.owner()

				// Find wallet
				let wallet = await orm.models.Wallet.findByAddress<Wallet>(owner)

				if (!wallet) {
					wallet = orm.models.Wallet.build({
						owner
					})
				}
				if (wallet.id !== meemContract.OwnerId) {
					meemContract.OwnerId = wallet.id
				}
			} catch (e) {
				log.warn(e)
			}

			meemContract.ownerFetchedAt = new Date()
			await meemContract.save()
			await wait(1000)
		}
	}
}
