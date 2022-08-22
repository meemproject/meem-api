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
		await services.contractEvents.meemContractSync()

		return res.json({
			status: 'success'
		})
	}

	public static async meemSync(req: Request, res: Response): Promise<Response> {
		await services.contractEvents.meemSync()

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

	public static async seedIntegrations(
		req: Request,
		res: Response
	): Promise<Response> {
		const integrations = [
			{
				name: 'Twitter',
				icon: 'integration-twitter.png',
				description: "Add a link to your Club's Twitter account."
			},
			{
				name: 'Discord',
				icon: 'integration-discord.png',
				description: 'Add a link to invite Club members to your Discord server.'
			},
			{
				name: 'Guild',
				icon: 'integration-guild.png',
				description: 'Create a Guild for your Club.',
				guideUrl:
					'https://meemproject.notion.site/Guild-7c6f030bd5b4485998899d521fc3694a'
			},
			{
				name: 'SlikSafe',
				icon: 'integration-sliksafe.png',
				description: 'File storage and backup for Club members.',
				guideUrl:
					'https://meemproject.notion.site/Sliksafe-9ee759f735ac4f9cb52b5d849292188c'
			},
			{
				name: 'Tellie',
				icon: 'integration-tellie.png',
				description: 'Website builder for your Club.',
				guideUrl:
					'https://meemproject.notion.site/Tellie-5c176f1036ef4fe3b993b0137eec15a8'
			},
			{
				name: 'Clarity',
				icon: 'integration-clarity.png',
				description: 'Manage contributions and rewards for Club members.',
				guideUrl:
					'https://meemproject.notion.site/Clarity-b144c6bc1eae4e08b3af870ac87ce60d'
			},
			{
				name: 'Gnosis',
				icon: 'integration-gnosis.png',
				description: 'Manage Club funds in a secure way.',
				guideUrl:
					'https://meemproject.notion.site/Gnosis-af38757b9faf486f9900a5ea8f4a805d'
			},
			{
				name: 'Myco',
				icon: 'integration-myco.png',
				description: 'Turn your Club into a legal entity.',
				guideUrl:
					'https://meemproject.notion.site/Myco-5425597cd8ca413fa070bc55bf1428f8'
			},
			{
				name: 'Orca',
				icon: 'integration-orca.png',
				description: 'Organize working groups for your Club',
				guideUrl:
					'https://meemproject.notion.site/Orca-a67a9137657643609c3ae54183505ecf'
			}
		]

		await orm.models.Integration.sync({ force: true })

		const failedIntegratiosn: any[] = []

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
				failedIntegratiosn.push(integrations[i])
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
