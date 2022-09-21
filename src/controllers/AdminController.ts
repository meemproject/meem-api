import { Request, Response } from 'express'

export default class AdminController {
	public static async runMigrations(
		req: Request,
		res: Response
	): Promise<Response> {
		await orm.runMigrations()

		return res.json({
			status: 'success'
		})
	}

	public static async runSync(req: Request, res: Response): Promise<Response> {
		await orm.runSync()

		return res.json({
			status: 'success'
		})
	}

	public static async meemContractSync(
		req: Request,
		res: Response
	): Promise<Response> {
		// await services.contractEvents.meemContractSync()

		return res.json({
			status: 'success'
		})
	}

	public static async meemSync(req: Request, res: Response): Promise<Response> {
		// await services.contractEvents.meemSync()

		return res.json({
			status: 'success'
		})
	}

	// public static async meemSyncReactions(
	// 	req: Request,
	// 	res: Response
	// ): Promise<Response> {
	// 	await services.contractEvents.meemSyncReactions()

	// 	return res.json({
	// 		status: 'success'
	// 	})
	// }

	// public static async syncDbMeemIdsToContract(
	// 	req: Request,
	// 	res: Response
	// ): Promise<Response> {
	// 	const meemIds = await services.meemId.syncDbToContract()

	// 	return res.json({
	// 		meemIds
	// 	})
	// }

	public static async seedPrompts(
		req: Request,
		res: Response
	): Promise<Response> {
		// await services.prompts.seedPrompts()

		return res.json({
			status: 'success'
		})
	}

	public static async syncIntegrations(
		req: Request,
		res: Response
	): Promise<Response> {
		// eslint-disable-next-line
		const integrations = require('../lib/integrations.json')

		await orm.models.Integration.sync({ force: true })

		const failedIntegrations: any[] = []

		for (let i = 0; i < integrations.length; i += 1) {
			try {
				log.debug(`Syncing ${i + 1} / ${integrations.length} integrations`)
				// eslint-disable-next-line no-await-in-loop
				const existingIntegration = await orm.models.Integration.findOne({
					where: {
						name: integrations[i].name
					}
				})
				if (!existingIntegration) {
					// eslint-disable-next-line no-await-in-loop
					await orm.models.Integration.create(integrations[i])
				} else {
					// eslint-disable-next-line no-await-in-loop
					await existingIntegration.update(integrations[i])
				}
			} catch (e) {
				failedIntegrations.push(integrations[i])
				log.crit(e)
				log.debug(integrations[i])
			}
		}

		return res.json({
			status: 'success'
		})
	}

	public static async seedIdentityIntegrations(
		req: Request,
		res: Response
	): Promise<Response> {
		const integrations = [
			{
				name: 'Twitter',
				icon: 'integration-twitter.png',
				description: 'Verify your Twitter account.'
			},
			{
				name: 'Discord',
				icon: 'integration-discord.png',
				description: 'Verify your Discord account.'
			},
			{
				name: 'Email',
				icon: 'integration-email.png',
				description: 'Verify your Email.'
			}
		]

		await orm.models.IdentityIntegration.sync({ force: true })

		const failedIntegratiosn: any[] = []

		for (let i = 0; i < integrations.length; i += 1) {
			try {
				log.debug(`Syncing ${i + 1} / ${integrations.length} integrations`)
				const existingIntegration =
					// eslint-disable-next-line no-await-in-loop
					await orm.models.IdentityIntegration.findOne({
						where: {
							name: integrations[i].name
						}
					})
				if (!existingIntegration) {
					// eslint-disable-next-line no-await-in-loop
					await orm.models.IdentityIntegration.create(integrations[i])
				} else {
					// eslint-disable-next-line no-await-in-loop
					await existingIntegration.update(integrations[i])
				}
			} catch (e) {
				failedIntegratiosn.push(integrations[i])
				log.crit(e)
				log.debug(integrations[i])
			}
		}

		return res.json({
			status: 'success'
		})
	}

	public static async syncPins(req: Request, res: Response): Promise<Response> {
		await services.web3.syncPins()

		return res.json({
			status: 'success'
		})
	}
}
