import { randomBytes } from 'crypto'
// eslint-disable-next-line import/no-extraneous-dependencies
import { Wallet as AlchemyWallet } from 'alchemy-sdk'
import AWS from 'aws-sdk'
import { ethers } from 'ethers'
import { keccak256, toUtf8Bytes } from 'ethers/lib/utils'
import { Response } from 'express'
import _ from 'lodash'
import request from 'superagent'
import { IRequest, IResponse } from '../types/app'
import { Mycontract__factory } from '../types/Meem'
import { MeemAPI } from '../types/meem.generated'
export default class MeemContractController {
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

		const isSlugAvailable = await services.meemContract.isSlugAvailable({
			slugToCheck: req.body.slug,
			chainId: req.body.chainId
		})

		return res.json({
			isSlugAvailable
		})
	}

	public static async updateMeemContract(
		req: IRequest<MeemAPI.v1.UpdateMeemContract.IDefinition>,
		res: IResponse<MeemAPI.v1.UpdateMeemContract.IResponseBody>
	): Promise<Response> {
		if (!req.wallet) {
			throw new Error('USER_NOT_LOGGED_IN')
		}

		await req.wallet.enforceTXLimit()

		const adminRole = config.ADMIN_ROLE
		const meemContract = await orm.models.MeemContract.findOne({
			where: {
				id: req.params.meemContractId
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
				}
			]
		})

		if (!meemContract) {
			throw new Error('MEEM_CONTRACT_NOT_FOUND')
		}

		if (meemContract.Wallets && meemContract.Wallets.length < 1) {
			throw new Error('NOT_AUTHORIZED')
		}

		if (req.body.slug && req.body.slug !== meemContract.slug) {
			const isAvailable = await services.meemContract.isSlugAvailable({
				slugToCheck: req.body.slug,
				chainId: meemContract.chainId
			})
			if (!isAvailable) {
				throw new Error('SLUG_UNAVAILABLE')
			}

			const slug = await services.meemContract.generateSlug({
				baseSlug: req.body.slug,
				chainId: meemContract.chainId
			})

			if (req.body.slug !== slug) {
				throw new Error('INVALID_SLUG')
			}

			meemContract.slug = slug
		}

		await meemContract.save()

		return res.json({
			status: 'success'
		})
	}

	public static async createMeemContract(
		req: IRequest<MeemAPI.v1.CreateMeemContract.IDefinition>,
		res: IResponse<MeemAPI.v1.CreateMeemContract.IResponseBody>
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
				await services.meemContract.createMeemContract({
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

	public static async createOrUpdateMeemContractIntegration(
		req: IRequest<MeemAPI.v1.CreateOrUpdateMeemContractIntegration.IDefinition>,
		res: IResponse<MeemAPI.v1.CreateOrUpdateMeemContractIntegration.IResponseBody>
	): Promise<Response> {
		if (!req.wallet) {
			throw new Error('USER_NOT_LOGGED_IN')
		}

		const integrationMetadata = req.body.metadata ?? {}
		const adminRole = config.ADMIN_ROLE
		const meemContract = await orm.models.MeemContract.findOne({
			where: {
				id: req.params.meemContractId
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
					model: orm.models.Integration
				}
			]
		})

		if (!meemContract) {
			throw new Error('MEEM_CONTRACT_NOT_FOUND')
		}

		if (meemContract.Wallets && meemContract.Wallets.length < 1) {
			throw new Error('NOT_AUTHORIZED')
		}

		const integration = await orm.models.Integration.findOne({
			where: {
				id: req.params.integrationId
			}
		})

		if (!integration) {
			throw new Error('INTEGRATION_NOT_FOUND')
		}

		const existingMeemContractIntegration =
			await orm.models.MeemContractIntegration.findOne({
				where: {
					MeemContractId: meemContract.id,
					IntegrationId: integration.id
				}
			})

		// Integration Verification
		// Can allow for third-party endpoint requests to verify information and return custom metadata
		switch (integration.id) {
			case config.TWITTER_INTEGRATION_ID: {
				let twitterUsername = req.body.metadata?.twitterUsername
					? (req.body.metadata?.twitterUsername as string)
					: null
				twitterUsername = twitterUsername?.replace(/^@/g, '').trim() ?? null
				const integrationError = new Error('INTEGRATION_FAILED')
				integrationError.message = 'Twitter verification failed.'

				if (
					existingMeemContractIntegration &&
					existingMeemContractIntegration.metadata?.isVerified &&
					(!twitterUsername ||
						twitterUsername ===
							existingMeemContractIntegration.metadata?.twitterUsername)
				) {
					break
				}

				if (!twitterUsername) {
					throw integrationError
				}

				integrationMetadata.isVerified = false

				const verifiedTwitter =
					await services.twitter.verifyMeemContractTwitter({
						twitterUsername,
						meemContract
					})

				if (!verifiedTwitter) {
					throw integrationError
				}

				integrationMetadata.isVerified = true
				integrationMetadata.twitterUsername = verifiedTwitter.username
				integrationMetadata.twitterProfileImageUrl =
					verifiedTwitter.profile_image_url
				integrationMetadata.twitterDisplayName = verifiedTwitter.name
				integrationMetadata.twitterUserId = verifiedTwitter.id
				integrationMetadata.externalUrl = `https://twitter.com/${verifiedTwitter.username}`

				break
			}
			default:
				break
		}

		if (!existingMeemContractIntegration) {
			await orm.models.MeemContractIntegration.create({
				MeemContractId: meemContract.id,
				IntegrationId: integration.id,
				isEnabled: req.body.isEnabled ?? true,
				isPublic: req.body.isPublic ?? true,
				metadata: integrationMetadata
			})
		} else {
			if (!_.isUndefined(req.body.isEnabled)) {
				existingMeemContractIntegration.isEnabled = req.body.isEnabled
			}

			if (!_.isUndefined(req.body.isPublic)) {
				existingMeemContractIntegration.isPublic = req.body.isPublic
			}

			if (integrationMetadata) {
				// TODO: Typecheck metadata
				existingMeemContractIntegration.metadata = integrationMetadata
			}

			await existingMeemContractIntegration.save()
		}

		return res.json({
			status: 'success'
		})
	}

	public static async reInitialize(
		req: IRequest<MeemAPI.v1.ReInitializeMeemContract.IDefinition>,
		res: IResponse<MeemAPI.v1.ReInitializeMeemContract.IResponseBody>
	): Promise<Response> {
		if (!req.wallet) {
			throw new Error('USER_NOT_LOGGED_IN')
		}

		await req.wallet.enforceTXLimit()

		const { meemContractId } = req.params

		if (config.DISABLE_ASYNC_MINTING) {
			try {
				await services.meemContract.updateMeemContract({
					...req.body,
					meemContractId,
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
						meemContractId,
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

		const { meemContractId } = req.params

		if (config.DISABLE_ASYNC_MINTING) {
			try {
				await services.meemContract.createClubSafe({
					...req.body,
					meemContractId,
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
						meemContractId,
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

		const { meemContractId } = req.params

		if (config.DISABLE_ASYNC_MINTING) {
			try {
				await services.meemContract.upgradeClub({
					...req.body,
					meemContractId,
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
						meemContractId,
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

		const { meemContractId } = req.params

		const meemContract = await orm.models.MeemContract.findOne({
			where: {
				id: meemContractId
			}
		})

		if (!meemContract) {
			throw new Error('MEEM_CONTRACT_NOT_FOUND')
		}

		const { proof } = await meemContract.getMintingPermission(
			req.wallet.address
		)

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

		const { meemContractId } = req.params

		const meemContract = await orm.models.MeemContract.findOne({
			where: {
				id: meemContractId
			}
		})

		if (!meemContract) {
			throw new Error('MEEM_CONTRACT_NOT_FOUND')
		}

		const canMint = await meemContract.canMint(req.wallet.address)
		if (!canMint) {
			throw new Error('NOT_AUTHORIZED')
		}

		if (config.DISABLE_ASYNC_MINTING) {
			try {
				await services.meem.bulkMint({
					...req.body,
					mintedBy: req.wallet.address,
					meemContractId
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
						meemContractId
					})
				})
				.promise()
		}

		return res.json({
			status: 'success'
		})
	}

	public static async createMeemContractGuild(
		req: IRequest<any>,
		res: IResponse<any>
	): Promise<Response> {
		if (!req.wallet) {
			throw new Error('USER_NOT_LOGGED_IN')
		}

		const { meemContractId } = req.params

		if (!meemContractId) {
			throw new Error('SERVER_ERROR')
		}

		const meemContractGuild = await services.guild.createMeemContractGuild({
			meemContractId: meemContractId as string
		})

		return res.json({
			meemContractGuild
		})
	}

	public static async deleteMeemContractGuild(
		req: IRequest<any>,
		res: IResponse<any>
	): Promise<Response> {
		if (!req.wallet) {
			throw new Error('USER_NOT_LOGGED_IN')
		}

		const { meemContractId } = req.params

		if (!meemContractId) {
			throw new Error('SERVER_ERROR')
		}

		const meemContractGuild = await services.guild.deleteMeemContractGuild({
			meemContractId: meemContractId as string
		})

		return res.json({
			meemContractGuild
		})
	}

	public static async createMeemContractRole(
		req: IRequest<MeemAPI.v1.CreateMeemContractRole.IDefinition>,
		res: IResponse<MeemAPI.v1.CreateMeemContractRole.IResponseBody>
	): Promise<Response> {
		if (!req.wallet) {
			throw new Error('USER_NOT_LOGGED_IN')
		}

		const {
			name,
			permissions,
			isTokenBasedRole,
			isTokenTransferrable,
			members
		} = req.body

		// TODO: Check if the user has permission to update and not just admin contract role

		const isAdmin = await services.meemContract.isMeemContractAdmin({
			meemContractId: req.params.meemContractId,
			walletAddress: req.wallet.address
		})

		if (!isAdmin) {
			throw new Error('NOT_AUTHORIZED')
		}

		const meemContract = await orm.models.MeemContract.findOne({
			where: {
				id: req.params.meemContractId
			},
			include: [
				{
					model: orm.models.MeemContractGuild
				}
			]
		})

		if (!meemContract) {
			throw new Error('MEEM_CONTRACT_NOT_FOUND')
		}

		if (!meemContract.MeemContractGuild) {
			throw new Error('MEEM_CONTRACT_GUILD_NOT_FOUND')
		}

		await services.guild.createMeemContractGuildRole({
			name,
			meemContract,
			meemContractGuild: meemContract.MeemContractGuild,
			permissions,
			members: members ?? [],
			isTokenBasedRole,
			isTokenTransferrable,
			senderWalletAddress: req.wallet.address
		})

		return res.json({
			status: 'success'
		})
	}

	public static async updateMeemContractRole(
		req: IRequest<MeemAPI.v1.UpdateMeemContractRole.IDefinition>,
		res: IResponse<MeemAPI.v1.UpdateMeemContractRole.IResponseBody>
	): Promise<Response> {
		if (!req.wallet) {
			throw new Error('USER_NOT_LOGGED_IN')
		}

		const { meemContractId } = req.params
		const { roleIntegrationsData } = req.body

		// TODO: Check if the user has permission to update and not just admin contract role

		const isAdmin = await services.meemContract.isMeemContractAdmin({
			meemContractId,
			walletAddress: req.wallet.address
		})

		if (!isAdmin) {
			throw new Error('NOT_AUTHORIZED')
		}

		const meemContract = await orm.models.MeemContract.findOne({
			where: {
				id: req.params.meemContractId
			}
		})

		if (!meemContract) {
			throw new Error('MEEM_CONTRACT_NOT_FOUND')
		}

		const meemContractRole = await orm.models.MeemContractRole.findOne({
			where: {
				id: req.params.meemContractRoleId
			},
			include: [
				{
					model: orm.models.RolePermission
				},
				{
					model: orm.models.MeemContractGuild
				}
			]
		})

		if (!meemContractRole) {
			throw new Error('MEEM_CONTRACT_ROLE_NOT_FOUND')
		}

		if (
			!_.isUndefined(req.body.permissions) &&
			_.isArray(req.body.permissions)
		) {
			const promises: Promise<any>[] = []
			const t = await orm.sequelize.transaction()
			const permissions = req.body.permissions
			const roleIdsToAdd =
				permissions.filter(pid => {
					const existingPermission = meemContractRole.RolePermissions?.find(
						rp => rp.id === pid
					)
					return !existingPermission
				}) ?? []
			const rolesToRemove: string[] =
				meemContractRole.RolePermissions?.filter(rp => {
					const existingPermission = permissions.find(pid => rp.id === pid)
					return !existingPermission
				})?.map((rp: any) => {
					return rp.MeemContractRolePermission.id as string
				}) ?? []

			if (rolesToRemove.length > 0) {
				promises.push(
					orm.models.MeemContractRolePermission.destroy({
						where: {
							id: rolesToRemove
						},
						transaction: t
					})
				)
			}

			if (roleIdsToAdd.length > 0) {
				const meemContractRolePermissionsData: {
					MeemContractRoleId: string
					RolePermissionId: string
				}[] = roleIdsToAdd.map(rid => {
					return {
						MeemContractRoleId: meemContractRole.id,
						RolePermissionId: rid
					}
				})
				promises.push(
					orm.models.MeemContractRolePermission.bulkCreate(
						meemContractRolePermissionsData,
						{
							transaction: t
						}
					)
				)
			}

			try {
				await Promise.all(promises)
				await t.commit()
			} catch (e) {
				log.crit(e)
				throw new Error('SERVER_ERROR')
			}
		}

		let members = req.body.members?.map(m => m.toLowerCase())

		try {
			if (meemContractRole.isAdminRole && members) {
				members = await services.meemContract.updateMeemContractAdmins({
					meemContractId: meemContract.id,
					admins: members,
					senderWallet: req.wallet
				})
			}
			if (meemContractRole.guildRoleId) {
				let guildRoleData
				let discordServerData
				const integrationsMetadata = meemContractRole.integrationsMetadata
				const meemContractRoleDiscordIntegrationDataIndex =
					integrationsMetadata?.findIndex(i => !!i.discordServerData)
				const guildRoleDiscordIntegrationData = roleIntegrationsData?.find(
					(d: any) => d.discordServerId
				)
				if (guildRoleDiscordIntegrationData) {
					const discordServerResult = await request
						.post(
							`https://api.guild.xyz/v1/discord/server/${guildRoleDiscordIntegrationData.discordServerId}`
						)
						.send({
							payload: {
								authorization:
									guildRoleDiscordIntegrationData.discordAccessToken
							}
						})
					discordServerData = discordServerResult.body
					// TODO: This creates a new role on discord no matter if isNew set to true or false
					guildRoleData = {
						rolePlatforms: [
							{
								guildPlatform: {
									platformName: 'DISCORD',
									platformGuildId:
										guildRoleDiscordIntegrationData.discordServerId,
									isNew: meemContractRoleDiscordIntegrationDataIndex < 0
								},
								platformRoleData: {
									gatedChannels:
										guildRoleDiscordIntegrationData.discordGatedChannels ?? []
								}
							}
						]
					}
				}

				await services.guild.updateMeemContractGuildRole({
					guildRoleId: meemContractRole.guildRoleId,
					meemContractId: meemContract.id,
					name: req.body.name,
					members,
					guildRoleData,
					senderWalletAddress: req.wallet.address
				})

				if (guildRoleDiscordIntegrationData?.discordAccessToken) {
					const updatedDiscordServerResult = await request
						.post(
							`https://api.guild.xyz/v1/discord/server/${guildRoleDiscordIntegrationData.discordServerId}`
						)
						.send({
							payload: {
								authorization:
									guildRoleDiscordIntegrationData.discordAccessToken
							}
						})

					discordServerData = updatedDiscordServerResult.body

					if (meemContractRoleDiscordIntegrationDataIndex > -1) {
						integrationsMetadata[meemContractRoleDiscordIntegrationDataIndex] =
							{
								discordServerData
							}
					} else {
						integrationsMetadata.push({
							discordServerData
						})
					}

					meemContractRole.integrationsMetadata = integrationsMetadata
					meemContractRole.changed('integrationsMetadata', true)

					await meemContractRole.save()
				}
			}

			if (
				!_.isUndefined(req.body.isTokenTransferrable) &&
				meemContractRole.tokenAddress
			) {
				const roleMeemContract = await orm.models.MeemContract.findOne({
					where: {
						address: meemContractRole.tokenAddress
					}
				})

				if (
					roleMeemContract &&
					roleMeemContract.isTransferrable !== req.body.isTokenTransferrable
				) {
					const provider = await services.ethers.getProvider({
						chainId: meemContract.chainId
					})
					const wallet = new AlchemyWallet(config.WALLET_PRIVATE_KEY, provider)

					const roleSmartContract = Mycontract__factory.connect(
						meemContract.address,
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
							await services.meemContract.updateMeemContract({
								admins: roleContractAdmins,
								mintPermissions,
								isTransferLocked: !req.body.isTokenTransferrable,
								meemContractId: roleMeemContract.id,
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
									meemContractId: roleMeemContract.id,
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

	public static async deleteMeemContractRole(
		req: IRequest<MeemAPI.v1.DeleteMeemContractRole.IDefinition>,
		res: IResponse<MeemAPI.v1.DeleteMeemContractRole.IResponseBody>
	): Promise<Response> {
		if (!req.wallet) {
			throw new Error('USER_NOT_LOGGED_IN')
		}

		const { meemContractId } = req.params

		// TODO: Check if the user has permission to delete and not just admin contract role

		const isAdmin = await services.meemContract.isMeemContractAdmin({
			meemContractId,
			walletAddress: req.wallet.address
		})

		if (!isAdmin) {
			throw new Error('NOT_AUTHORIZED')
		}

		const meemContract = await orm.models.MeemContract.findOne({
			where: {
				id: req.params.meemContractId
			}
		})

		if (!meemContract) {
			throw new Error('MEEM_CONTRACT_NOT_FOUND')
		}

		const meemContractRole = await orm.models.MeemContractRole.findOne({
			where: {
				id: req.params.meemContractRoleId
			},
			include: [
				{
					model: orm.models.RolePermission
				},
				{
					model: orm.models.MeemContractGuild
				}
			]
		})

		if (!meemContractRole) {
			throw new Error('MEEM_CONTRACT_ROLE_NOT_FOUND')
		}

		const promises: Promise<any>[] = []
		const t = await orm.sequelize.transaction()

		if (meemContractRole?.guildRoleId) {
			await services.guild.deleteMeemContractGuildRole({
				guildRoleId: meemContractRole.guildRoleId,
				meemContractId: meemContract.id
			})
		}

		promises.push(
			orm.models.MeemContractRolePermission.destroy({
				where: {
					MeemContractRoleId: meemContractRole.id
				},
				transaction: t
			})
		)

		promises.push(
			orm.models.MeemContractRole.destroy({
				where: {
					id: meemContractRole.id
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

	public static async getMeemContractGuild(
		req: IRequest<MeemAPI.v1.GetMeemContractGuild.IDefinition>,
		res: IResponse<MeemAPI.v1.GetMeemContractGuild.IResponseBody>
	): Promise<Response> {
		if (!req.wallet) {
			throw new Error('USER_NOT_LOGGED_IN')
		}

		try {
			const guildResponse = await services.guild.getMeemContractGuild({
				meemContractId: req.params.meemContractId
			})

			let guildPlatforms: any = guildResponse?.guildPlatforms

			if (guildPlatforms) {
				guildPlatforms = await Promise.all(
					guildPlatforms.map(async (gp: any) => {
						const gpData = gp

						if (gpData.platformId === 1) {
							const discordDataResponse = await request.post(
								`https://api.guild.xyz/v1/discord/server/${gp.platformGuildId}`
							)
							gpData.platformGuildData = {
								...gpData.platformGuildData,
								...discordDataResponse.body
							}
						}

						return gpData
					})
				)
			}

			const guild = guildResponse
				? {
						id: guildResponse.id,
						name: guildResponse.name,
						guildPlatforms
				  }
				: null

			return res.json({
				guild
			})
		} catch (e) {
			log.crit(e)
			throw new Error('SERVER_ERROR')
		}
	}

	public static async getMeemContractRoles(
		req: IRequest<MeemAPI.v1.GetMeemContractRoles.IDefinition>,
		res: IResponse<MeemAPI.v1.GetMeemContractRoles.IResponseBody>
	): Promise<Response> {
		if (!req.wallet) {
			throw new Error('USER_NOT_LOGGED_IN')
		}

		try {
			const roles = await services.meemContract.getMeemContractRoles({
				meemContractId: req.params.meemContractId
			})
			return res.json({
				roles
			})
		} catch (e) {
			log.crit(e)
			throw new Error('SERVER_ERROR')
		}
	}

	public static async getMeemContractRole(
		req: IRequest<MeemAPI.v1.GetMeemContractRole.IDefinition>,
		res: IResponse<MeemAPI.v1.GetMeemContractRole.IResponseBody>
	): Promise<Response> {
		if (!req.wallet) {
			throw new Error('USER_NOT_LOGGED_IN')
		}

		try {
			const roles = await services.meemContract.getMeemContractRoles({
				meemContractId: req.params.meemContractId,
				meemContractRoleId: req.params.meemContractRoleId
			})
			return res.json({
				role: roles[0]
			})
		} catch (e) {
			log.crit(e)
			throw new Error('SERVER_ERROR')
		}
	}

	public static async getUserMeemContractRolesAccess(
		req: IRequest<MeemAPI.v1.GetUserMeemContractRolesAccess.IDefinition>,
		res: IResponse<MeemAPI.v1.GetUserMeemContractRolesAccess.IResponseBody>
	): Promise<Response> {
		if (!req.wallet) {
			throw new Error('USER_NOT_LOGGED_IN')
		}

		try {
			const rolesAccess =
				await services.meemContract.getUserMeemContractRolesAccess({
					meemContractId: req.params.meemContractId,
					walletAddress: req.wallet.address
				})
			return res.json(rolesAccess)
		} catch (e) {
			log.crit(e)
			throw new Error('SERVER_ERROR')
		}
	}

	public static async getJoinGuildMessage(
		req: IRequest<MeemAPI.v1.GetJoinGuildMessage.IDefinition>,
		res: IResponse<MeemAPI.v1.GetJoinGuildMessage.IResponseBody>
	): Promise<Response> {
		if (!req.wallet) {
			throw new Error('USER_NOT_LOGGED_IN')
		}

		const meemContract = await orm.models.MeemContract.findOne({
			where: {
				id: req.params.meemContractId
			},
			include: [
				{
					model: orm.models.MeemContractGuild
				}
			]
		})

		if (!meemContract || !meemContract.MeemContractGuild) {
			throw new Error('MEEM_CONTRACT_NOT_FOUND')
		}

		const payload = {
			guildId: meemContract.MeemContractGuild.guildId,
			platforms: []
		}
		const msg = 'Please sign this message.'
		const chainId = undefined // services.guild.getGuildChain(meemContract.chainId)
		const addr = req.wallet.address
		const method = 1 // Guild method for authentication
		const nonce = randomBytes(32).toString('base64')
		const hash =
			Object.keys(payload).length > 0
				? keccak256(toUtf8Bytes(JSON.stringify(payload)))
				: undefined
		const ts = Date.now().toString()

		const messageToSign = `${msg}\n\nAddress: ${addr}\nMethod: ${method}${
			chainId ? `\nChainId: ${chainId}` : ''
		}${hash ? `\nHash: ${hash}` : ''}\nNonce: ${nonce}\nTimestamp: ${ts}`

		return res.json({
			message: messageToSign,
			params: { chainId, msg, method, addr, nonce, hash, ts }
		})
	}

	public static async joinMeemContractGuild(
		req: IRequest<MeemAPI.v1.JoinGuild.IDefinition>,
		res: IResponse<MeemAPI.v1.JoinGuild.IResponseBody>
	): Promise<Response> {
		if (!req.wallet) {
			throw new Error('USER_NOT_LOGGED_IN')
		}

		const meemContract = await orm.models.MeemContract.findOne({
			where: {
				id: req.params.meemContractId
			},
			include: [
				{
					model: orm.models.MeemContractGuild
				}
			]
		})

		if (!meemContract || !meemContract.MeemContractGuild) {
			throw new Error('MEEM_CONTRACT_NOT_FOUND')
		}

		// If user does not have a token, mint it before joining guild or request will fail.
		if (req.body.mintToken) {
			try {
				await services.meem.mintOriginalMeem({
					meemContractAddress: meemContract.address,
					to: req.wallet.address.toLowerCase(),
					metadata: meemContract.metadata,
					mintedBy: req.wallet.address.toLowerCase(),
					chainId: meemContract.chainId
				})
			} catch (e) {
				log.crit(e)
				sockets?.emitError(config.errors.MINT_FAILED, req.wallet.address)
			}
		}

		try {
			const response = await request
				.post(`https://api.guild.xyz/v1/user/join`)
				.send({
					payload: {
						guildId: meemContract.MeemContractGuild.guildId,
						platforms: []
					},
					params: req.body.params,
					sig: req.body.sig
				})

			log.debug(response.body)
		} catch (e) {
			log.crit(e)
			throw new Error('SERVER_ERROR')
		}

		return res.json({
			status: 'success'
		})
	}
}
