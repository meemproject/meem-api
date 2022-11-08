import { Request, Response } from 'express'
import integrationsData from '../lib/integrations'
import permissionsData from '../lib/permissions'

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
		const failedIntegrations: any[] = []

		for (let i = 0; i < integrationsData.length; i += 1) {
			try {
				log.debug(`Syncing ${i + 1} / ${integrationsData.length} integrations`)
				// eslint-disable-next-line no-await-in-loop
				const existingIntegration = await orm.models.Integration.findOne({
					where: {
						name: integrationsData[i].name
					}
				})
				if (!existingIntegration) {
					// eslint-disable-next-line no-await-in-loop
					await orm.models.Integration.create(integrationsData[i])
				} else {
					// eslint-disable-next-line no-await-in-loop
					await existingIntegration.update(integrationsData[i])
				}
			} catch (e) {
				failedIntegrations.push(integrationsData[i])
				log.crit(e)
				log.debug(integrationsData[i])
			}
		}

		return res.json({
			status: 'success'
		})
	}

	public static async syncPermissions(
		req: Request,
		res: Response
	): Promise<Response> {
		// await orm.models.RolePermission.sync({ force: true })

		const failedPermissions: any[] = []

		for (let i = 0; i < permissionsData.length; i += 1) {
			try {
				log.debug(`Syncing ${i + 1} / ${permissionsData.length} permissions`)
				// eslint-disable-next-line no-await-in-loop
				const existingPermission = await orm.models.RolePermission.findOne({
					where: {
						id: permissionsData[i].id
					}
				})
				if (!existingPermission) {
					// eslint-disable-next-line no-await-in-loop
					await orm.models.RolePermission.create(permissionsData[i])
				} else {
					// eslint-disable-next-line no-await-in-loop
					await existingPermission.update(permissionsData[i])
				}
			} catch (e) {
				failedPermissions.push(permissionsData[i])
				log.crit(e)
				log.debug(permissionsData[i])
			}
		}

		return res.json({
			status: 'success'
		})
	}

	public static async createMeemContractRoles(
		req: Request,
		res: Response
	): Promise<Response> {
		// TODO

		return res.json({
			status: 'success'
		})
	}

	public static async seedIdentityIntegrations(
		req: Request,
		res: Response
	): Promise<Response> {
		const identityIntegrations = [
			{
				name: 'Twitter',
				icon: 'integration-twitter.png',
				description: 'Verify your Twitter account.',
				connectionName: 'twitter'
			},
			{
				name: 'Discord',
				icon: 'integration-discord.png',
				description: 'Verify your Discord account.',
				connectionName: 'discord'
			},
			{
				name: 'Email',
				icon: 'integration-email.png',
				description: 'Verify your Email.',
				connectionName: 'email'
			}
		]

		// await orm.models.IdentityIntegration.sync({ force: true })

		const failedIntegratiosn: any[] = []

		for (let i = 0; i < identityIntegrations.length; i += 1) {
			try {
				log.debug(
					`Syncing ${i + 1} / ${identityIntegrations.length} integrations`
				)
				const existingIntegration =
					// eslint-disable-next-line no-await-in-loop
					await orm.models.IdentityIntegration.findOne({
						where: {
							name: identityIntegrations[i].name
						}
					})
				if (!existingIntegration) {
					// eslint-disable-next-line no-await-in-loop
					await orm.models.IdentityIntegration.create(identityIntegrations[i])
				} else {
					// eslint-disable-next-line no-await-in-loop
					await existingIntegration.update(identityIntegrations[i])
				}
			} catch (e) {
				failedIntegratiosn.push(identityIntegrations[i])
				log.crit(e)
				log.debug(identityIntegrations[i])
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
