import { Request, Response } from 'express'
import extensionsData from '../lib/extensions'
// import permissionsData from '../lib/permissions'

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
		await orm.runSync({
			force: req.query.force === 'true'
		})

		return res.json({
			status: 'success'
		})
	}

	public static async agreementSync(
		req: Request,
		res: Response
	): Promise<Response> {
		// await services.contractEvents.agreementSync()

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

	public static async syncExtensions(
		req: Request,
		res: Response
	): Promise<Response> {
		const failedExtensions: any[] = []

		for (let i = 0; i < extensionsData.length; i += 1) {
			try {
				log.debug(`Syncing ${i + 1} / ${extensionsData.length} extensions`)
				// eslint-disable-next-line no-await-in-loop
				const existingExtension = await orm.models.Extension.findOne({
					where: {
						name: extensionsData[i].name
					}
				})
				if (!existingExtension) {
					// eslint-disable-next-line no-await-in-loop
					await orm.models.Extension.create(extensionsData[i])
				} else {
					// eslint-disable-next-line no-await-in-loop
					await existingExtension.update(extensionsData[i])
				}
			} catch (e) {
				failedExtensions.push(extensionsData[i])
				log.crit(e)
				log.debug(extensionsData[i])
			}
		}

		return res.json({
			status: 'success'
		})
	}

	// public static async syncPermissions(
	// 	req: Request,
	// 	res: Response
	// ): Promise<Response> {
	// 	// await orm.models.RolePermission.sync({ force: true })

	// 	const failedPermissions: any[] = []

	// 	for (let i = 0; i < permissionsData.length; i += 1) {
	// 		try {
	// 			log.debug(`Syncing ${i + 1} / ${permissionsData.length} permissions`)
	// 			// eslint-disable-next-line no-await-in-loop
	// 			const existingPermission = await orm.models.RolePermission.findOne({
	// 				where: {
	// 					id: permissionsData[i].id
	// 				}
	// 			})
	// 			if (!existingPermission) {
	// 				// eslint-disable-next-line no-await-in-loop
	// 				await orm.models.RolePermission.create(permissionsData[i])
	// 			} else {
	// 				// eslint-disable-next-line no-await-in-loop
	// 				await existingPermission.update(permissionsData[i])
	// 			}
	// 		} catch (e) {
	// 			failedPermissions.push(permissionsData[i])
	// 			log.crit(e)
	// 			log.debug(permissionsData[i])
	// 		}
	// 	}

	// 	return res.json({
	// 		status: 'success'
	// 	})
	// }

	public static async seedIdentityProviders(
		req: Request,
		res: Response
	): Promise<Response> {
		const identityProviders = [
			{
				name: 'Twitter',
				icon: 'integration-twitter.png',
				description: 'Verify your Twitter account.',
				connectionName: 'twitter',
				connectionId: 'twitter'
			},
			{
				name: 'Discord',
				icon: 'integration-discord.png',
				description: 'Verify your Discord account.',
				connectionName: 'discord',
				connectionId: 'discord'
			},
			{
				name: 'Email',
				icon: 'integration-email.png',
				description: 'Verify your Email.',
				connectionName: 'Username-Password-Authentication',
				connectionId: 'auth0'
			},
			{
				name: 'Google',
				icon: 'integration-google.png',
				description: 'Verify your Google account.',
				connectionName: 'google-oauth2',
				connectionId: 'google-oauth2'
			}
		]

		// await orm.models.IdentityProvider.sync({ force: true })

		const failedIntegratiosn: any[] = []

		for (let i = 0; i < identityProviders.length; i += 1) {
			try {
				log.debug(`Syncing ${i + 1} / ${identityProviders.length} integrations`)
				const existingExtension =
					// eslint-disable-next-line no-await-in-loop
					await orm.models.IdentityProvider.findOne({
						where: {
							name: identityProviders[i].name
						}
					})
				if (!existingExtension) {
					// eslint-disable-next-line no-await-in-loop
					await orm.models.IdentityProvider.create(identityProviders[i])
				} else {
					// eslint-disable-next-line no-await-in-loop
					await existingExtension.update(identityProviders[i])
				}
			} catch (e) {
				failedIntegratiosn.push(identityProviders[i])
				log.crit(e)
				log.debug(identityProviders[i])
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
