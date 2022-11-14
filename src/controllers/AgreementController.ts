// import { randomBytes } from 'crypto'
// eslint-disable-next-line import/no-extraneous-dependencies
import AWS from 'aws-sdk'
import { ethers } from 'ethers'
// import { keccak256, toUtf8Bytes } from 'ethers/lib/utils'
import { Response } from 'express'
import _ from 'lodash'
// import request from 'superagent'
import { IRequest, IResponse } from '../types/app'
import { Mycontract__factory } from '../types/Meem'
import { MeemAPI } from '../types/meem.generated'
export default class AgreementController {
	public static async isSlugAvailable(
		req: IRequest<MeemAPI.v1.IsSlugAvailable.IDefinition>,
		res: IResponse<MeemAPI.v1.IsSlugAvailable.IResponseBody>
	): Promise<Response> {
		// if (!req.meemId) {
		// 	throw new Error('USER_NOT_LOGGED_IN')
		// }

		// if (!req.meemId.MeemPass) {
		// 	throw new Error('MEEMPASS_NOT_FOUND')
		// }

		if (!req.body.slug) {
			return res.json({
				isSlugAvailable: false
			})
		}

		const isSlugAvailable = await services.agreement.isSlugAvailable({
			slugToCheck: req.body.slug,
			chainId: req.body.chainId
		})

		return res.json({
			isSlugAvailable
		})
	}

	// public static async updateAgreement(
	// 	req: IRequest<MeemAPI.v1.UpdateAgreement.IDefinition>,
	// 	res: IResponse<MeemAPI.v1.UpdateAgreement.IResponseBody>
	// ): Promise<Response> {
	// 	if (!req.wallet) {
	// 		throw new Error('USER_NOT_LOGGED_IN')
	// 	}

	// 	await req.wallet.enforceTXLimit()

	// 	const adminRole = config.ADMIN_ROLE
	// 	const agreement = await orm.models.Agreement.findOne({
	// 		where: {
	// 			id: req.params.agreementId
	// 		},
	// 		include: [
	// 			{
	// 				model: orm.models.Wallet,
	// 				where: {
	// 					address: req.wallet.address
	// 				},
	// 				through: {
	// 					where: {
	// 						role: adminRole
	// 					}
	// 				}
	// 			}
	// 		]
	// 	})

	// 	if (!agreement) {
	// 		throw new Error('MEEM_CONTRACT_NOT_FOUND')
	// 	}

	// 	if (agreement.Wallets && agreement.Wallets.length < 1) {
	// 		throw new Error('NOT_AUTHORIZED')
	// 	}

	// 	if (req.body.slug && req.body.slug !== agreement.slug) {
	// 		const isAvailable = await services.agreement.isSlugAvailable({
	// 			slugToCheck: req.body.slug,
	// 			chainId: agreement.chainId
	// 		})
	// 		if (!isAvailable) {
	// 			throw new Error('SLUG_UNAVAILABLE')
	// 		}

	// 		const slug = await services.agreement.generateSlug({
	// 			baseSlug: req.body.slug,
	// 			chainId: agreement.chainId
	// 		})

	// 		if (req.body.slug !== slug) {
	// 			throw new Error('INVALID_SLUG')
	// 		}

	// 		agreement.slug = slug
	// 	}

	// 	await agreement.save()

	// 	return res.json({
	// 		status: 'success'
	// 	})
	// }

	public static async createAgreement(
		req: IRequest<MeemAPI.v1.CreateAgreement.IDefinition>,
		res: IResponse<MeemAPI.v1.CreateAgreement.IResponseBody>
	): Promise<Response> {
		if (!req.wallet) {
			throw new Error('USER_NOT_LOGGED_IN')
		}

		if (!req.body.name) {
			throw new Error('MISSING_PARAMETERS')
		}

		if (!req.body.metadata) {
			throw new Error('MISSING_PARAMETERS')
		}

		await req.wallet.enforceTXLimit()

		if (config.DISABLE_ASYNC_MINTING) {
			try {
				await services.agreement.createAgreement({
					...req.body,
					senderWalletAddress: req.wallet.address
				})
			} catch (e) {
				log.crit(e)
				sockets?.emitError(
					config.errors.CONTRACT_CREATION_FAILED,
					req.wallet.address
				)
			}
		} else {
			const lambda = new AWS.Lambda({
				accessKeyId: config.APP_AWS_ACCESS_KEY_ID,
				secretAccessKey: config.APP_AWS_SECRET_ACCESS_KEY,
				region: 'us-east-1'
			})

			await lambda
				.invoke({
					InvocationType: 'Event',
					FunctionName: config.LAMBDA_CREATE_CONTRACT_FUNCTION,
					Payload: JSON.stringify({
						...req.body,
						senderWalletAddress: req.wallet.address
					})
				})
				.promise()
		}

		return res.json({
			status: 'success'
		})
	}

	public static async createOrUpdateAgreementExtension(
		req: IRequest<MeemAPI.v1.CreateOrUpdateAgreementExtension.IDefinition>,
		res: IResponse<MeemAPI.v1.CreateOrUpdateAgreementExtension.IResponseBody>
	): Promise<Response> {
		if (!req.wallet) {
			throw new Error('USER_NOT_LOGGED_IN')
		}

		const integrationMetadata = req.body.metadata ?? {}
		const adminRole = config.ADMIN_ROLE
		const agreement = await orm.models.Agreement.findOne({
			where: {
				id: req.params.agreementId
			},
			include: [
				{
					model: orm.models.Wallet,
					where: {
						address: req.wallet.address
					},
					through: {
						where: {
							role: adminRole
						}
					}
				},
				{
					model: orm.models.Extension
				}
			]
		})

		if (!agreement) {
			throw new Error('MEEM_CONTRACT_NOT_FOUND')
		}

		if (agreement.Wallets && agreement.Wallets.length < 1) {
			throw new Error('NOT_AUTHORIZED')
		}

		const integration = await orm.models.Extension.findOne({
			where: {
				id: req.params.integrationId
			}
		})

		if (!integration) {
			throw new Error('INTEGRATION_NOT_FOUND')
		}

		const existingAgreementExtension =
			await orm.models.AgreementExtension.findOne({
				where: {
					AgreementId: agreement.id,
					IntegrationId: integration.id
				}
			})

		// Integration Verification
		// Can allow for third-party endpoint requests to verify information and return custom metadata
		switch (integration.id) {
			case config.TWITTER_INTEGRATION_ID: {
				// let twitterUsername = req.body.metadata?.twitterUsername
				// 	? (req.body.metadata?.twitterUsername as string)
				// 	: null
				// twitterUsername = twitterUsername?.replace(/^@/g, '').trim() ?? null
				// const integrationError = new Error('INTEGRATION_FAILED')
				// integrationError.message = 'Twitter verification failed.'

				// if (
				// 	existingAgreementExtension &&
				// 	existingAgreementExtension.metadata?.isVerified &&
				// 	(!twitterUsername ||
				// 		twitterUsername ===
				// 			existingAgreementExtension.metadata?.twitterUsername)
				// ) {
				// 	break
				// }

				// if (!twitterUsername) {
				// 	throw integrationError
				// }

				// integrationMetadata.isVerified = false

				// const verifiedTwitter = await services.twitter.verifyAgreementTwitter({
				// 	twitterUsername,
				// 	agreement
				// })

				// if (!verifiedTwitter) {
				// 	throw integrationError
				// }

				// integrationMetadata.isVerified = true
				// integrationMetadata.twitterUsername = verifiedTwitter.username
				// integrationMetadata.twitterProfileImageUrl =
				// 	verifiedTwitter.profile_image_url
				// integrationMetadata.twitterDisplayName = verifiedTwitter.name
				// integrationMetadata.twitterUserId = verifiedTwitter.id
				// integrationMetadata.externalUrl = `https://twitter.com/${verifiedTwitter.username}`

				break
			}
			default:
				break
		}

		if (!existingAgreementExtension) {
			await orm.models.AgreementExtension.create({
				AgreementId: agreement.id,
				IntegrationId: integration.id,
				isEnabled: req.body.isEnabled ?? true,
				isPublic: req.body.isPublic ?? true,
				metadata: integrationMetadata
			})
		} else {
			if (!_.isUndefined(req.body.isEnabled)) {
				existingAgreementExtension.isEnabled = req.body.isEnabled
			}

			if (!_.isUndefined(req.body.isPublic)) {
				// existingAgreementExtension.isPublic = req.body.isPublic
			}

			if (integrationMetadata) {
				// TODO: Typecheck metadata
				// existingAgreementExtension.metadata = integrationMetadata
			}

			await existingAgreementExtension.save()
		}

		return res.json({
			status: 'success'
		})
	}

	public static async reInitialize(
		req: IRequest<MeemAPI.v1.ReInitializeAgreement.IDefinition>,
		res: IResponse<MeemAPI.v1.ReInitializeAgreement.IResponseBody>
	): Promise<Response> {
		if (!req.wallet) {
			throw new Error('USER_NOT_LOGGED_IN')
		}

		await req.wallet.enforceTXLimit()

		const { agreementId } = req.params

		if (config.DISABLE_ASYNC_MINTING) {
			try {
				await services.agreement.updateAgreement({
					...req.body,
					agreementId,
					senderWalletAddress: req.wallet.address
				})
			} catch (e) {
				log.crit(e)
				sockets?.emitError(config.errors.MINT_FAILED, req.wallet.address)
			}
		} else {
			const lambda = new AWS.Lambda({
				accessKeyId: config.APP_AWS_ACCESS_KEY_ID,
				secretAccessKey: config.APP_AWS_SECRET_ACCESS_KEY,
				region: 'us-east-1'
			})
			await lambda
				.invoke({
					InvocationType: 'Event',
					FunctionName: config.LAMBDA_REINITIALIZE_FUNCTION_NAME,
					Payload: JSON.stringify({
						...req.body,
						agreementId,
						senderWalletAddress: req.wallet.address
					})
				})
				.promise()
		}

		return res.json({
			status: 'success'
		})
	}

	public static async createClubSafe(
		req: IRequest<MeemAPI.v1.CreateClubSafe.IDefinition>,
		res: IResponse<MeemAPI.v1.CreateClubSafe.IResponseBody>
	): Promise<Response> {
		if (!req.wallet) {
			throw new Error('USER_NOT_LOGGED_IN')
		}

		await req.wallet.enforceTXLimit()

		const { agreementId } = req.params

		if (config.DISABLE_ASYNC_MINTING) {
			try {
				await services.agreement.createClubSafe({
					...req.body,
					agreementId,
					senderWalletAddress: req.wallet.address
				})
			} catch (e) {
				log.crit(e)
			}
		} else {
			const lambda = new AWS.Lambda({
				accessKeyId: config.APP_AWS_ACCESS_KEY_ID,
				secretAccessKey: config.APP_AWS_SECRET_ACCESS_KEY,
				region: 'us-east-1'
			})
			await lambda
				.invoke({
					InvocationType: 'Event',
					FunctionName: config.LAMBDA_CREATE_CLUB_SAFE_FUNCTION_NAME,
					Payload: JSON.stringify({
						...req.body,
						agreementId,
						senderWalletAddress: req.wallet.address
					})
				})
				.promise()
		}

		return res.json({
			status: 'success'
		})
	}

	public static async upgradeClub(
		req: IRequest<MeemAPI.v1.UpgradeClub.IDefinition>,
		res: IResponse<MeemAPI.v1.UpgradeClub.IResponseBody>
	): Promise<Response> {
		if (!req.wallet) {
			throw new Error('USER_NOT_LOGGED_IN')
		}

		await req.wallet.enforceTXLimit()

		const { agreementId } = req.params

		if (config.DISABLE_ASYNC_MINTING) {
			try {
				await services.agreement.upgradeClub({
					...req.body,
					agreementId,
					senderWalletAddress: req.wallet.address
				})
			} catch (e) {
				log.crit(e)
			}
		} else {
			const lambda = new AWS.Lambda({
				accessKeyId: config.APP_AWS_ACCESS_KEY_ID,
				secretAccessKey: config.APP_AWS_SECRET_ACCESS_KEY,
				region: 'us-east-1'
			})
			await lambda
				.invoke({
					InvocationType: 'Event',
					FunctionName: config.UPGRADE_CLUB_FUNCTION_NAME,
					Payload: JSON.stringify({
						...req.body,
						agreementId,
						senderWalletAddress: req.wallet.address
					})
				})
				.promise()
		}

		return res.json({
			status: 'success'
		})
	}

	public static async getMintingProof(
		req: IRequest<MeemAPI.v1.GetMintingProof.IDefinition>,
		res: IResponse<MeemAPI.v1.GetMintingProof.IResponseBody>
	): Promise<Response> {
		if (!req.wallet) {
			throw new Error('USER_NOT_LOGGED_IN')
		}

		const { agreementId } = req.params

		const agreement = await orm.models.Agreement.findOne({
			where: {
				id: agreementId
			}
		})

		if (!agreement) {
			throw new Error('MEEM_CONTRACT_NOT_FOUND')
		}

		const { proof } = await agreement.getMintingPermission(req.wallet.address)

		return res.json({
			proof
		})
	}

	public static async bulkMint(
		req: IRequest<MeemAPI.v1.BulkMint.IDefinition>,
		res: IResponse<MeemAPI.v1.BulkMint.IResponseBody>
	): Promise<Response> {
		if (!req.wallet) {
			throw new Error('USER_NOT_LOGGED_IN')
		}

		await req.wallet.enforceTXLimit()

		const { agreementId } = req.params

		const agreement = await orm.models.Agreement.findOne({
			where: {
				id: agreementId
			}
		})

		if (!agreement) {
			throw new Error('MEEM_CONTRACT_NOT_FOUND')
		}

		const canMint = await agreement.canMint(req.wallet.address)
		if (!canMint) {
			throw new Error('NOT_AUTHORIZED')
		}

		if (config.DISABLE_ASYNC_MINTING) {
			try {
				await services.meem.bulkMint({
					...req.body,
					mintedBy: req.wallet.address,
					agreementId
				})
			} catch (e) {
				log.crit(e)
			}
		} else {
			const lambda = new AWS.Lambda({
				accessKeyId: config.APP_AWS_ACCESS_KEY_ID,
				secretAccessKey: config.APP_AWS_SECRET_ACCESS_KEY,
				region: 'us-east-1'
			})
			await lambda
				.invoke({
					InvocationType: 'Event',
					FunctionName: config.LAMBDA_BULK_MINT_FUNCTION_NAME,
					Payload: JSON.stringify({
						...req.body,
						mintedBy: req.wallet.address,
						agreementId
					})
				})
				.promise()
		}

		return res.json({
			status: 'success'
		})
	}

	// public static async createAgreementGuild(
	// 	req: IRequest<any>,
	// 	res: IResponse<any>
	// ): Promise<Response> {
	// 	if (!req.wallet) {
	// 		throw new Error('USER_NOT_LOGGED_IN')
	// 	}

	// 	const { agreementId } = req.params

	// 	if (!agreementId) {
	// 		throw new Error('SERVER_ERROR')
	// 	}

	// 	const agreementGuild = await services.guild.createAgreementGuild({
	// 		agreementId: agreementId as string
	// 	})

	// 	return res.json({
	// 		agreementGuild
	// 	})
	// }

	// public static async deleteAgreementGuild(
	// 	req: IRequest<any>,
	// 	res: IResponse<any>
	// ): Promise<Response> {
	// 	if (!req.wallet) {
	// 		throw new Error('USER_NOT_LOGGED_IN')
	// 	}

	// 	const { agreementId } = req.params

	// 	if (!agreementId) {
	// 		throw new Error('SERVER_ERROR')
	// 	}

	// 	const agreementGuild = await services.guild.deleteAgreementGuild({
	// 		agreementId: agreementId as string
	// 	})

	// 	return res.json({
	// 		agreementGuild
	// 	})
	// }

	public static async createAgreementRole(
		req: IRequest<MeemAPI.v1.CreateAgreementRole.IDefinition>,
		res: IResponse<MeemAPI.v1.CreateAgreementRole.IResponseBody>
	): Promise<Response> {
		if (!req.wallet) {
			throw new Error('USER_NOT_LOGGED_IN')
		}

		// const {
		// 	name,
		// 	permissions,
		// 	isTokenBasedRole,
		// 	isTokenTransferrable,
		// 	members
		// } = req.body

		// TODO: Check if the user has permission to update and not just admin contract role

		const isAdmin = await services.agreement.isAgreementAdmin({
			agreementId: req.params.agreementId,
			walletAddress: req.wallet.address
		})

		if (!isAdmin) {
			throw new Error('NOT_AUTHORIZED')
		}

		const agreement = await orm.models.Agreement.findOne({
			where: {
				id: req.params.agreementId
			}
		})

		if (!agreement) {
			throw new Error('MEEM_CONTRACT_NOT_FOUND')
		}

		// await services.guild.createAgreementGuildRole({
		// 	name,
		// 	agreement,
		// 	agreementGuild: agreement.AgreementGuild,
		// 	permissions,
		// 	members: members ?? [],
		// 	isTokenBasedRole,
		// 	isTokenTransferrable,
		// 	senderWalletAddress: req.wallet.address
		// })

		return res.json({
			status: 'success'
		})
	}

	public static async updateAgreementRole(
		req: IRequest<MeemAPI.v1.UpdateAgreementRole.IDefinition>,
		res: IResponse<MeemAPI.v1.UpdateAgreementRole.IResponseBody>
	): Promise<Response> {
		if (!req.wallet) {
			throw new Error('USER_NOT_LOGGED_IN')
		}

		const { agreementId } = req.params
		// const { roleIntegrationsData } = req.body

		// TODO: Check if the user has permission to update and not just admin contract role

		const isAdmin = await services.agreement.isAgreementAdmin({
			agreementId,
			walletAddress: req.wallet.address
		})

		if (!isAdmin) {
			throw new Error('NOT_AUTHORIZED')
		}

		const agreement = await orm.models.Agreement.findOne({
			where: {
				id: req.params.agreementId
			},
			include: [
				{
					model: orm.models.AgreementRole,
					where: {
						id: req.params.agreementRoleId
					}
				}
			]
		})

		if (!agreement || !agreement.AgreementRoles) {
			throw new Error('MEEM_CONTRACT_NOT_FOUND')
		}

		const agreementRole = agreement.AgreementRoles[0]

		if (!agreementRole) {
			throw new Error('MEEM_CONTRACT_ROLE_NOT_FOUND')
		}

		if (
			!_.isUndefined(req.body.permissions) &&
			_.isArray(req.body.permissions)
		) {
			// const promises: Promise<any>[] = []
			// const t = await orm.sequelize.transaction()
			// const permissions = req.body.permissions
			// const roleIdsToAdd =
			// 	permissions.filter(pid => {
			// 		const existingPermission = agreementRole.RolePermissions?.find(
			// 			rp => rp.id === pid
			// 		)
			// 		return !existingPermission
			// 	}) ?? []
			// const rolesToRemove: string[] =
			// 	agreementRole.RolePermissions?.filter(rp => {
			// 		const existingPermission = permissions.find(pid => rp.id === pid)
			// 		return !existingPermission
			// 	})?.map((rp: any) => {
			// 		return rp.AgreementRolePermission.id as string
			// 	}) ?? []
			// if (rolesToRemove.length > 0) {
			// 	promises.push(
			// 		orm.models.AgreementRolePermission.destroy({
			// 			where: {
			// 				id: rolesToRemove
			// 			},
			// 			transaction: t
			// 		})
			// 	)
			// }
			// if (roleIdsToAdd.length > 0) {
			// 	const agreementRolePermissionsData: {
			// 		AgreementRoleId: string
			// 		RolePermissionId: string
			// 	}[] = roleIdsToAdd.map(rid => {
			// 		return {
			// 			AgreementRoleId: agreementRole.id,
			// 			RolePermissionId: rid
			// 		}
			// 	})
			// 	promises.push(
			// 		orm.models.AgreementRolePermission.bulkCreate(
			// 			agreementRolePermissionsData,
			// 			{
			// 				transaction: t
			// 			}
			// 		)
			// 	)
			// }
			// try {
			// 	await Promise.all(promises)
			// 	await t.commit()
			// } catch (e) {
			// 	log.crit(e)
			// 	throw new Error('SERVER_ERROR')
			// }
		}

		let members = req.body.members?.map(m => m.toLowerCase())

		try {
			if (agreementRole.isAdminRole && members) {
				members = await services.agreement.updateAgreementAdmins({
					agreementId: agreement.id,
					admins: members,
					senderWallet: req.wallet
				})
			}
			// if (agreementRole.guildRoleId) {
			// 	let guildRoleData
			// 	let discordServerData
			// 	const integrationsMetadata = agreementRole.integrationsMetadata
			// 	const agreementRoleDiscordIntegrationDataIndex =
			// 		integrationsMetadata?.findIndex(i => !!i.discordServerData)
			// 	const guildRoleDiscordIntegrationData = roleIntegrationsData?.find(
			// 		(d: any) => d.discordServerId
			// 	)
			// 	if (guildRoleDiscordIntegrationData) {
			// 		const discordServerResult = await request
			// 			.post(
			// 				`https://api.guild.xyz/v1/discord/server/${guildRoleDiscordIntegrationData.discordServerId}`
			// 			)
			// 			.send({
			// 				payload: {
			// 					authorization:
			// 						guildRoleDiscordIntegrationData.discordAccessToken
			// 				}
			// 			})
			// 		discordServerData = discordServerResult.body
			// 		// TODO: This creates a new role on discord no matter if isNew set to true or false
			// 		guildRoleData = {
			// 			rolePlatforms: [
			// 				{
			// 					guildPlatform: {
			// 						platformName: 'DISCORD',
			// 						platformGuildId:
			// 							guildRoleDiscordIntegrationData.discordServerId,
			// 						isNew: agreementRoleDiscordIntegrationDataIndex < 0
			// 					},
			// 					platformRoleData: {
			// 						gatedChannels:
			// 							guildRoleDiscordIntegrationData.discordGatedChannels ?? []
			// 					}
			// 				}
			// 			]
			// 		}
			// 	}

			// 	await services.guild.updateAgreementGuildRole({
			// 		guildRoleId: agreementRole.guildRoleId,
			// 		agreementId: agreement.id,
			// 		name: req.body.name,
			// 		members,
			// 		guildRoleData,
			// 		senderWalletAddress: req.wallet.address
			// 	})

			// 	if (guildRoleDiscordIntegrationData?.discordAccessToken) {
			// 		const updatedDiscordServerResult = await request
			// 			.post(
			// 				`https://api.guild.xyz/v1/discord/server/${guildRoleDiscordIntegrationData.discordServerId}`
			// 			)
			// 			.send({
			// 				payload: {
			// 					authorization:
			// 						guildRoleDiscordIntegrationData.discordAccessToken
			// 				}
			// 			})

			// 		discordServerData = updatedDiscordServerResult.body

			// 		if (agreementRoleDiscordIntegrationDataIndex > -1) {
			// 			integrationsMetadata[agreementRoleDiscordIntegrationDataIndex] = {
			// 				discordServerData
			// 			}
			// 		} else {
			// 			integrationsMetadata.push({
			// 				discordServerData
			// 			})
			// 		}

			// 		agreementRole.integrationsMetadata = integrationsMetadata
			// 		agreementRole.changed('integrationsMetadata', true)

			// 		await agreementRole.save()
			// 	}
			// }

			if (!_.isUndefined(req.body.isTokenTransferrable)) {
				const roleAgreement = agreementRole.Agreement

				if (
					roleAgreement &&
					roleAgreement.isTransferrable !== req.body.isTokenTransferrable
				) {
					const { wallet } = await services.ethers.getProvider({
						chainId: agreement.chainId
					})

					const roleSmartContract = Mycontract__factory.connect(
						agreement.address,
						wallet
					)

					const contractInfo = await roleSmartContract.getContractInfo()
					const mintPermissions = contractInfo.mintPermissions.map(p => ({
						permission: p.permission,
						addresses: p.addresses,
						numTokens: ethers.BigNumber.from(p.numTokens).toHexString(),
						mintEndTimestamp: ethers.BigNumber.from(
							p.mintEndTimestamp
						).toHexString(),
						mintStartTimestamp: ethers.BigNumber.from(
							p.mintStartTimestamp
						).toHexString(),
						costWei: ethers.BigNumber.from(p.costWei).toHexString(),
						merkleRoot: p.merkleRoot
					}))

					const roleContractAdmins = await roleSmartContract.getRoles(
						config.ADMIN_ROLE
					)

					// TODO: Verify that admins who hold admin token can update the role contract
					if (config.DISABLE_ASYNC_MINTING) {
						try {
							await services.agreement.updateAgreement({
								admins: roleContractAdmins,
								mintPermissions,
								isTransferLocked: !req.body.isTokenTransferrable,
								agreementId: roleAgreement.id,
								senderWalletAddress: req.wallet.address
							})
						} catch (e) {
							log.crit(e)
							sockets?.emitError(config.errors.MINT_FAILED, req.wallet.address)
						}
					} else {
						const lambda = new AWS.Lambda({
							accessKeyId: config.APP_AWS_ACCESS_KEY_ID,
							secretAccessKey: config.APP_AWS_SECRET_ACCESS_KEY,
							region: 'us-east-1'
						})
						await lambda
							.invoke({
								InvocationType: 'Event',
								FunctionName: config.LAMBDA_REINITIALIZE_FUNCTION_NAME,
								Payload: JSON.stringify({
									mintPermissions,
									isTransferLocked: !req.body.isTokenTransferrable,
									agreementId: roleAgreement.id,
									senderWalletAddress: req.wallet.address
								})
							})
							.promise()
					}
				}
			}
		} catch (e) {
			log.crit(e)
			throw new Error('SERVER_ERROR')
		}

		return res.json({
			status: 'success'
		})
	}

	public static async deleteAgreementRole(
		req: IRequest<MeemAPI.v1.DeleteAgreementRole.IDefinition>,
		res: IResponse<MeemAPI.v1.DeleteAgreementRole.IResponseBody>
	): Promise<Response> {
		if (!req.wallet) {
			throw new Error('USER_NOT_LOGGED_IN')
		}

		const { agreementId } = req.params

		// TODO: Check if the user has permission to delete and not just admin contract role

		const isAdmin = await services.agreement.isAgreementAdmin({
			agreementId,
			walletAddress: req.wallet.address
		})

		if (!isAdmin) {
			throw new Error('NOT_AUTHORIZED')
		}

		const agreement = await orm.models.Agreement.findOne({
			where: {
				id: req.params.agreementId
			}
		})

		if (!agreement) {
			throw new Error('MEEM_CONTRACT_NOT_FOUND')
		}

		const agreementRole = await orm.models.AgreementRole.findOne({
			where: {
				id: req.params.agreementRoleId
			}
		})

		if (!agreementRole) {
			throw new Error('MEEM_CONTRACT_ROLE_NOT_FOUND')
		}

		const promises: Promise<any>[] = []
		const t = await orm.sequelize.transaction()

		// if (agreementRole?.guildRoleId) {
		// 	await services.guild.deleteAgreementGuildRole({
		// 		guildRoleId: agreementRole.guildRoleId,
		// 		agreementId: agreement.id
		// 	})
		// }

		// promises.push(
		// 	orm.models.AgreementRolePermission.destroy({
		// 		where: {
		// 			AgreementRoleId: agreementRole.id
		// 		},
		// 		transaction: t
		// 	})
		// )

		promises.push(
			orm.models.AgreementRole.destroy({
				where: {
					id: agreementRole.id
				},
				transaction: t
			})
		)

		try {
			await Promise.all(promises)
			await t.commit()

			return res.json({
				status: 'success'
			})
		} catch (e) {
			log.crit(e)
			throw new Error('SERVER_ERROR')
		}
	}

	// public static async getAgreementGuild(
	// 	req: IRequest<MeemAPI.v1.GetAgreementGuild.IDefinition>,
	// 	res: IResponse<MeemAPI.v1.GetAgreementGuild.IResponseBody>
	// ): Promise<Response> {
	// 	if (!req.wallet) {
	// 		throw new Error('USER_NOT_LOGGED_IN')
	// 	}

	// 	try {
	// 		const guildResponse = await services.guild.getAgreementGuild({
	// 			agreementId: req.params.agreementId
	// 		})

	// 		let guildPlatforms: any = guildResponse?.guildPlatforms

	// 		if (guildPlatforms) {
	// 			guildPlatforms = await Promise.all(
	// 				guildPlatforms.map(async (gp: any) => {
	// 					const gpData = gp

	// 					if (gpData.platformId === 1) {
	// 						const discordDataResponse = await request.post(
	// 							`https://api.guild.xyz/v1/discord/server/${gp.platformGuildId}`
	// 						)
	// 						gpData.platformGuildData = {
	// 							...gpData.platformGuildData,
	// 							...discordDataResponse.body
	// 						}
	// 					}

	// 					return gpData
	// 				})
	// 			)
	// 		}

	// 		const guild = guildResponse
	// 			? {
	// 					id: guildResponse.id,
	// 					name: guildResponse.name,
	// 					guildPlatforms
	// 			  }
	// 			: null

	// 		return res.json({
	// 			guild
	// 		})
	// 	} catch (e) {
	// 		log.crit(e)
	// 		throw new Error('SERVER_ERROR')
	// 	}
	// }

	public static async getAgreementRoles(
		req: IRequest<MeemAPI.v1.GetAgreementRoles.IDefinition>,
		res: IResponse<MeemAPI.v1.GetAgreementRoles.IResponseBody>
	): Promise<Response> {
		if (!req.wallet) {
			throw new Error('USER_NOT_LOGGED_IN')
		}

		try {
			const roles = await services.agreement.getAgreementRoles({
				agreementId: req.params.agreementId
			})
			return res.json({
				roles
			})
		} catch (e) {
			log.crit(e)
			throw new Error('SERVER_ERROR')
		}
	}

	public static async getAgreementRole(
		req: IRequest<MeemAPI.v1.GetAgreementRole.IDefinition>,
		res: IResponse<MeemAPI.v1.GetAgreementRole.IResponseBody>
	): Promise<Response> {
		if (!req.wallet) {
			throw new Error('USER_NOT_LOGGED_IN')
		}

		try {
			const roles = await services.agreement.getAgreementRoles({
				agreementId: req.params.agreementId,
				agreementRoleId: req.params.agreementRoleId
			})
			return res.json({
				role: roles[0]
			})
		} catch (e) {
			log.crit(e)
			throw new Error('SERVER_ERROR')
		}
	}

	// public static async getUserAgreementRolesAccess(
	// 	req: IRequest<MeemAPI.v1.GetUserAgreementRolesAccess.IDefinition>,
	// 	res: IResponse<MeemAPI.v1.GetUserAgreementRolesAccess.IResponseBody>
	// ): Promise<Response> {
	// 	if (!req.wallet) {
	// 		throw new Error('USER_NOT_LOGGED_IN')
	// 	}

	// 	try {
	// 		const rolesAccess = await services.agreement.getUserAgreementRolesAccess({
	// 			agreementId: req.params.agreementId,
	// 			walletAddress: req.wallet.address
	// 		})
	// 		return res.json(rolesAccess)
	// 	} catch (e) {
	// 		log.crit(e)
	// 		throw new Error('SERVER_ERROR')
	// 	}
	// }

	// public static async getJoinGuildMessage(
	// 	req: IRequest<MeemAPI.v1.GetJoinGuildMessage.IDefinition>,
	// 	res: IResponse<MeemAPI.v1.GetJoinGuildMessage.IResponseBody>
	// ): Promise<Response> {
	// 	if (!req.wallet) {
	// 		throw new Error('USER_NOT_LOGGED_IN')
	// 	}

	// 	const agreement = await orm.models.Agreement.findOne({
	// 		where: {
	// 			id: req.params.agreementId
	// 		},
	// 		include: [
	// 			{
	// 				model: orm.models.AgreementGuild
	// 			}
	// 		]
	// 	})

	// 	if (!agreement || !agreement.AgreementGuild) {
	// 		throw new Error('MEEM_CONTRACT_NOT_FOUND')
	// 	}

	// 	const payload = {
	// 		guildId: agreement.AgreementGuild.guildId,
	// 		platforms: []
	// 	}
	// 	const msg = 'Please sign this message.'
	// 	const chainId = undefined // services.guild.getGuildChain(agreement.chainId)
	// 	const addr = req.wallet.address
	// 	const method = 1 // Guild method for authentication
	// 	const nonce = randomBytes(32).toString('base64')
	// 	const hash =
	// 		Object.keys(payload).length > 0
	// 			? keccak256(toUtf8Bytes(JSON.stringify(payload)))
	// 			: undefined
	// 	const ts = Date.now().toString()

	// 	const messageToSign = `${msg}\n\nAddress: ${addr}\nMethod: ${method}${
	// 		chainId ? `\nChainId: ${chainId}` : ''
	// 	}${hash ? `\nHash: ${hash}` : ''}\nNonce: ${nonce}\nTimestamp: ${ts}`

	// 	return res.json({
	// 		message: messageToSign,
	// 		params: { chainId, msg, method, addr, nonce, hash, ts }
	// 	})
	// }

	// public static async joinAgreementGuild(
	// 	req: IRequest<MeemAPI.v1.JoinGuild.IDefinition>,
	// 	res: IResponse<MeemAPI.v1.JoinGuild.IResponseBody>
	// ): Promise<Response> {
	// 	if (!req.wallet) {
	// 		throw new Error('USER_NOT_LOGGED_IN')
	// 	}

	// 	const agreement = await orm.models.Agreement.findOne({
	// 		where: {
	// 			id: req.params.agreementId
	// 		},
	// 		include: [
	// 			{
	// 				model: orm.models.AgreementGuild
	// 			}
	// 		]
	// 	})

	// 	if (!agreement || !agreement.AgreementGuild) {
	// 		throw new Error('MEEM_CONTRACT_NOT_FOUND')
	// 	}

	// 	// If user does not have a token, mint it before joining guild or request will fail.
	// 	if (req.body.mintToken) {
	// 		try {
	// 			await services.meem.mintOriginalMeem({
	// 				agreementAddress: agreement.address,
	// 				to: req.wallet.address.toLowerCase(),
	// 				metadata: agreement.metadata,
	// 				mintedBy: req.wallet.address.toLowerCase(),
	// 				chainId: agreement.chainId
	// 			})
	// 		} catch (e) {
	// 			log.crit(e)
	// 			sockets?.emitError(config.errors.MINT_FAILED, req.wallet.address)
	// 		}
	// 	}

	// 	try {
	// 		const response = await request
	// 			.post(`https://api.guild.xyz/v1/user/join`)
	// 			.send({
	// 				payload: {
	// 					guildId: agreement.AgreementGuild.guildId,
	// 					platforms: []
	// 				},
	// 				params: req.body.params,
	// 				sig: req.body.sig
	// 			})

	// 		log.debug(response.body)
	// 	} catch (e) {
	// 		log.crit(e)
	// 		throw new Error('SERVER_ERROR')
	// 	}

	// 	return res.json({
	// 		status: 'success'
	// 	})
	// }
}
