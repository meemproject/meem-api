import {
	Chain,
	GetGuildResponse,
	guild,
	role as guildRole
} from '@guildxyz/sdk'
import { Wallet as AlchemyWallet } from 'alchemy-sdk'
// eslint-disable-next-line import/no-extraneous-dependencies
import AWS from 'aws-sdk'
import type { Bytes } from 'ethers'
import _ from 'lodash'
import Meem from '../models/Meem'
import MeemContract from '../models/MeemContract'
import MeemContractGuild from '../models/MeemContractGuild'
import MeemContractRole from '../models/MeemContractRole'
import { Mycontract__factory } from '../types/Meem'

export default class GuildService {
	public static getGuildChain(chainId: number): Chain {
		switch (chainId) {
			case 1:
				return 'ETHEREUM'
				break
			case 4:
				return 'RINKEBY' as Chain
				break
			case 5:
				return 'GOERLI'
				break
			case 137:
				return 'POLYGON'
				break
			case 420:
				return 'OPTIMISM'
				break
			case 421613:
				return 'ARBITRUM'
				break
			default:
				return 'POLYGON'
		}
	}

	public static async createMeemContractGuild(data: {
		meemContractId: string
		adminAddresses?: string[]
	}): Promise<{
		meemContractGuild: MeemContractGuild
		meemContractRoles: MeemContractRole[]
	}> {
		const { meemContractId } = data
		let adminAddresses = data.adminAddresses

		const meemContract = await orm.models.MeemContract.findOne({
			where: {
				id: meemContractId
			},
			include: [
				{
					model: orm.models.MeemContractGuild,
					include: [
						{
							model: orm.models.MeemContractRole
						}
					]
				}
			]
		})

		if (!meemContract) {
			throw new Error('MEEM_CONTRACT_NOT_FOUND')
		}

		if (meemContract.MeemContractGuild) {
			return {
				meemContractGuild: meemContract.MeemContractGuild,
				meemContractRoles:
					meemContract.MeemContractGuild?.MeemContractRoles ?? []
			}
		}

		const provider = await services.ethers.getProvider({
			chainId: meemContract.chainId
		})
		const wallet = new AlchemyWallet(config.WALLET_PRIVATE_KEY, provider)

		const sign = (signableMessage: string | Bytes) =>
			wallet.signMessage(signableMessage)

		if (!adminAddresses) {
			const adminWallets = await orm.models.MeemContractWallet.findAll({
				where: {
					MeemContractId: meemContract.id,
					role: config.ADMIN_ROLE
				},
				include: [orm.models.Wallet]
			})

			adminAddresses = adminWallets.map(aw => aw.Wallet?.address ?? '')
		}

		adminAddresses = adminAddresses.filter(
			a => a !== '' && a !== wallet.address.toLowerCase()
		)

		try {
			const guildChain = this.getGuildChain(meemContract.chainId)
			const createGuildResponse = await guild.create(wallet.address, sign, {
				name: meemContract.name,
				description: `MeemContract Guild Details - Contract Address: ${meemContract.address} | Chain ID: ${meemContract.chainId}`,
				roles: [
					{
						name: `Token Holder`,
						logic: 'OR',
						requirements: [
							{
								type: 'ERC721',
								chain: guildChain,
								address: meemContract.address,
								data: {
									minAmount: 1
								}
							}
						]
					}
				]
			})

			const meemContractGuild = await orm.models.MeemContractGuild.create({
				guildId: createGuildResponse.id,
				MeemContractId: meemContract.id
			})

			const guildResponse = await guild.get(createGuildResponse.id)

			const meemContractRoles = await Promise.all(
				guildResponse.roles.map(async role => {
					const meemContractRole = await orm.models.MeemContractRole.create({
						guildRoleId: role.id,
						name: role.name,
						MeemContractId: meemContract.id,
						MeemContractGuildId: meemContractGuild.id,
						isDefaultRole: true
					})

					return meemContractRole
				})
			)

			const adminRole = await this.createMeemContractGuildRole({
				name: 'Admin',
				meemContract,
				meemContractGuild,
				permissions: [
					'clubs.admin.editProfile',
					'clubs.admin.manageMembershipSettings',
					'clubs.admin.manageRoles',
					'clubs.apps.manageApps',
					'clubs.apps.viewApps'
				],
				isTokenBasedRole: true,
				isTokenTransferrable: false,
				members: adminAddresses,
				senderWalletAddress: wallet.address,
				isAdminRole: true
			})

			if (adminRole) {
				meemContractRoles.push(adminRole)
			}

			return {
				meemContractGuild,
				meemContractRoles
			}
		} catch (e) {
			log.crit(e)
			throw new Error('SERVER_ERROR')
		}
	}

	public static async deleteMeemContractGuild(data: {
		meemContractId: string
	}): Promise<void> {
		const { meemContractId } = data
		const meemContract = await orm.models.MeemContract.findOne({
			where: {
				id: meemContractId
			},
			include: [
				{
					model: orm.models.MeemContractGuild,
					include: [
						{
							model: orm.models.MeemContractRole,
							include: [
								{
									model: orm.models.RolePermission
								}
							]
						}
					]
				}
			]
		})

		if (!meemContract || !meemContract.MeemContractGuild) {
			throw new Error('MEEM_CONTRACT_NOT_FOUND')
		}

		const provider = await services.ethers.getProvider({
			chainId: meemContract.chainId
		})
		const wallet = new AlchemyWallet(config.WALLET_PRIVATE_KEY, provider)

		const sign = (signableMessage: string | Bytes) =>
			wallet.signMessage(signableMessage)

		try {
			await guild.delete(
				meemContract.MeemContractGuild.guildId,
				wallet.address,
				sign,
				true
			)

			const promises: Promise<any>[] = []
			const t = await orm.sequelize.transaction()

			promises.push(
				orm.models.MeemContractRole.destroy({
					where: {
						id: meemContract.MeemContractGuild.MeemContractRoles?.map(
							role => role.id
						)
					},
					transaction: t
				})
			)

			promises.push(
				orm.models.MeemContractGuild.destroy({
					where: {
						id: meemContract.MeemContractGuild.id
					},
					transaction: t
				})
			)

			await Promise.all(promises)
			await t.commit()

			return
		} catch (e) {
			log.crit(e)
			throw new Error('SERVER_ERROR')
		}
	}

	public static async getMeemContractGuild(data: {
		meemContractId: string
	}): Promise<GetGuildResponse | null> {
		try {
			const meemContractGuild = await orm.models.MeemContractGuild.findOne({
				where: {
					MeemContractId: data.meemContractId
				}
			})
			if (!meemContractGuild) {
				return null
			}
			const guildResponse = await guild.get(meemContractGuild.guildId)
			return guildResponse
		} catch (e) {
			log.crit(e)
			throw new Error('SERVER_ERROR')
		}
	}

	public static async createMeemContractGuildRole(data: {
		name: string
		meemContract: MeemContract
		meemContractGuild: MeemContractGuild
		permissions?: string[]
		isTokenBasedRole: boolean
		isTokenTransferrable?: boolean
		members: string[]
		senderWalletAddress: string
		isAdminRole?: boolean
	}): Promise<MeemContractRole | void> {
		const {
			name,
			meemContract,
			meemContractGuild,
			permissions,
			isTokenBasedRole,
			isTokenTransferrable,
			members,
			senderWalletAddress,
			isAdminRole
		} = data
		const provider = await services.ethers.getProvider({
			chainId: meemContract.chainId
		})
		const wallet = new AlchemyWallet(config.WALLET_PRIVATE_KEY, provider)

		const sign = (signableMessage: string | Bytes) =>
			wallet.signMessage(signableMessage)

		try {
			if (isTokenBasedRole) {
				const baseContract = Mycontract__factory.connect(
					meemContract.address,
					wallet
				)
				const admins = await baseContract.getRoles(config.ADMIN_ROLE)
				const roleContractData = {
					chainId: meemContract.chainId,
					shouldMintTokens: true,
					metadata: {
						meem_contract_type: 'meem-club-role',
						meem_metadata_version: 'MeemClubRole_Contract_20220718',
						name: `${meemContract.name ?? ''} - ${name}`,
						description: name,
						image: '',
						associations: [
							{
								meem_contract_type: 'meem-club',
								address: meemContract.address
							}
						],
						external_url: ''
					},
					name: `${meemContract.name ?? ''} - ${name}`,
					admins,
					members,
					minters: admins,
					maxSupply: '0',
					// TODO: What do we want mintPermissions to be?
					mintPermissions: meemContract.mintPermissions,
					splits: [],
					isTransferLocked: !isTokenTransferrable,
					tokenMetadata: {
						meem_metadata_version: 'MeemClubRole_Token_20220718',
						description: name,
						name: `${meemContract.name ?? ''} - ${name}`,
						// TODO: Token image?
						image: '',
						associations: [],
						external_url: ''
					}
				}

				// log.debug(JSON.stringify(data))
				log.debug(roleContractData)

				if (config.DISABLE_ASYNC_MINTING) {
					try {
						await services.meemContract.createMeemContract({
							...roleContractData,
							senderWalletAddress,
							meemContractRoleData: {
								name,
								meemContract,
								meemContractGuild,
								permissions,
								isAdminRole
							}
						})
					} catch (e) {
						log.crit(e)
						sockets?.emitError(
							config.errors.CONTRACT_CREATION_FAILED,
							senderWalletAddress
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
								...roleContractData,
								senderWalletAddress
							})
						})
						.promise()
				}
			} else {
				const guildChain = this.getGuildChain(meemContract.chainId)
				const createGuildRoleResponse = await guildRole.create(
					wallet.address,
					sign,
					{
						guildId: meemContractGuild.guildId,
						name,
						logic: 'AND',
						requirements: [
							{
								type: 'ALLOWLIST',
								data: {
									addresses: members
								}
							},
							{
								type: 'ERC721',
								chain: guildChain,
								address: meemContract.address,
								data: {
									minAmount: 1
								}
							}
						]
					}
				)

				const meemContractRole = await orm.models.MeemContractRole.create({
					guildRoleId: createGuildRoleResponse.id,
					name,
					MeemContractId: meemContract.id,
					MeemContractGuildId: meemContractGuild.id
				})

				if (!_.isUndefined(permissions) && _.isArray(permissions)) {
					const promises: Promise<any>[] = []
					const t = await orm.sequelize.transaction()
					const roleIdsToAdd =
						permissions.filter(pid => {
							const existingPermission = meemContractRole.RolePermissions?.find(
								rp => rp.id === pid
							)
							return !existingPermission
						}) ?? []

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
			}
		} catch (e) {
			log.crit(e)
			throw new Error('SERVER_ERROR')
		}
	}

	public static async updateMeemContractGuildRole(data: {
		name?: string
		meemContractId: string
		guildRoleId: number
		members?: string[]
		guildRoleData?: {
			rolePlatforms?: {
				guildPlatform: {
					platformName: string
					platformGuildId: string
					isNew: boolean
				}
				platformRoleData?: {
					[key: string]: string
				}
			}[]
		}
		senderWalletAddress: string
	}): Promise<MeemContractRole> {
		const {
			name,
			meemContractId,
			guildRoleId,
			members,
			guildRoleData,
			senderWalletAddress
		} = data

		const meemContract = await orm.models.MeemContract.findOne({
			where: {
				id: meemContractId
			},
			include: [
				{
					model: orm.models.MeemContractGuild,
					include: [
						{
							model: orm.models.MeemContractRole
						}
					]
				}
			]
		})

		const meemContractRole =
			meemContract?.MeemContractGuild?.MeemContractRoles?.find(
				r => r.guildRoleId === guildRoleId
			)

		if (!meemContract || !meemContractRole) {
			throw new Error('MEEM_CONTRACT_NOT_FOUND')
		}

		if (
			_.isUndefined(name) &&
			_.isUndefined(members) &&
			_.isUndefined(guildRoleData)
		) {
			return meemContractRole
		}

		const provider = await services.ethers.getProvider({
			chainId: meemContract.chainId
		})

		const wallet = new AlchemyWallet(config.WALLET_PRIVATE_KEY, provider)

		const sign = (signableMessage: string | Bytes) =>
			wallet.signMessage(signableMessage)

		try {
			const existingGuildRole = await guildRole.get(guildRoleId)
			const requirements = existingGuildRole.requirements
			const allowListRoleIndex = requirements.findIndex(
				r => r.type === 'ALLOWLIST'
			)

			if (allowListRoleIndex > -1 && members) {
				requirements[allowListRoleIndex] = {
					type: 'ALLOWLIST',
					data: {
						addresses: members
					}
				}
			}

			if ((allowListRoleIndex > -1 && members) || name || guildRoleData) {
				const rolePlatforms:
					| {
							guildPlatform: {
								platformName: string
								platformGuildId: string
								isNew: boolean
							}
							platformRoleData?: {
								[key: string]: string
							}
					  }[]
					| undefined = guildRoleData?.rolePlatforms
					? guildRoleData.rolePlatforms
					: existingGuildRole.rolePlatforms?.map(rp => {
							return {
								guildPlatform: {
									platformGuildId: rp.guildPlatform.platformGuildId,
									platformName: rp.guildPlatform.platformName,
									isNew: false
								},
								platformRoleData: rp.platformRoleData
							}
					  })

				await guildRole.update(guildRoleId, wallet.address, sign, {
					name: name ?? existingGuildRole.name,
					logic: existingGuildRole.logic,
					rolePlatforms,
					requirements
				})
			}

			if (name) {
				await meemContractRole.update({
					name
				})
			}

			if (members && meemContractRole.tokenAddress) {
				const roleMeemContract = await orm.models.MeemContract.findOne({
					where: {
						address: meemContractRole.tokenAddress
					}
				})
				// TODO: Allow other contracts besides Meem
				if (roleMeemContract) {
					const memberMeems = await orm.models.Meem.findAll({
						where: {
							MeemContractId: roleMeemContract.id
						},
						include: [
							{
								model: orm.models.Wallet,
								as: 'Owner'
							}
						]
					})

					const removeMemberMeems: Meem[] = []

					memberMeems.forEach(meem => {
						if (meem.Owner !== null) {
							if (
								members.findIndex(
									m => m.toLowerCase() === meem.Owner.address.toLowerCase()
								) < 0
							) {
								removeMemberMeems.push(meem)
							}
						}
					})

					if (removeMemberMeems.length > 0) {
						// const roleContract = Mycontract__factory.connect(
						// 	roleMeemContract.address,
						// 	wallet
						// )

						log.debug(
							'BURN MEMBER TOKENS',
							removeMemberMeems.map(m => m.id)
						)

						// for (let i = 0; i < removeMemberMeems.length; i += 1) {
						// 	await roleContract.burn(removeMemberMeems[i].tokenId)
						// }
					}

					const membersToAdd: string[] = members.filter((m: string) => {
						const existingMemberIndex = memberMeems.findIndex(
							meem => meem.Owner?.address.toLowerCase() === m.toLowerCase()
						)
						return existingMemberIndex < 0
					})

					log.debug('ADD MEMBERS', membersToAdd)

					// TODO: Do we need this to be async?
					// Need to get token metadata
					if (membersToAdd.length > 0) {
						const roleTokenMetadata = {
							meem_metadata_version: 'MeemClubRole_Token_20220718',
							name: `${meemContract.name ?? ''} - ${
								name ?? meemContractRole.name
							}`,
							description: name ?? meemContractRole.name,
							image: '',
							associations: [
								{
									meem_contract_type: 'meem-club',
									address: meemContract.address
								}
							],
							external_url: ''
						}
						const tokens = membersToAdd.map(a => {
							return {
								to: a,
								metadata: roleTokenMetadata
							}
						})
						if (config.DISABLE_ASYNC_MINTING) {
							try {
								await services.meem.bulkMint({
									tokens,
									mintedBy: senderWalletAddress,
									meemContractId: meemContract.id
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
										tokens,
										mintedBy: senderWalletAddress,
										meemContractId: meemContract.id
									})
								})
								.promise()
						}
					}
				}
			}

			return meemContractRole
		} catch (e) {
			// TODO: Re-create guild role if no longer exists?
			log.crit(e)
			throw new Error('SERVER_ERROR')
		}
	}

	public static async deleteMeemContractGuildRole(data: {
		meemContractId: string
		guildRoleId: number
	}): Promise<void> {
		const { meemContractId, guildRoleId } = data

		const meemContract = await orm.models.MeemContract.findOne({
			where: {
				id: meemContractId
			},
			include: [
				{
					model: orm.models.MeemContractGuild,
					include: [
						{
							model: orm.models.MeemContractRole
						}
					]
				}
			]
		})

		const meemContractRole =
			meemContract?.MeemContractGuild?.MeemContractRoles?.find(
				r => r.guildRoleId === guildRoleId
			)

		if (!meemContract || !meemContractRole) {
			throw new Error('MEEM_CONTRACT_NOT_FOUND')
		}

		const provider = await services.ethers.getProvider({
			chainId: meemContract.chainId
		})

		const wallet = new AlchemyWallet(config.WALLET_PRIVATE_KEY, provider)

		const sign = (signableMessage: string | Bytes) =>
			wallet.signMessage(signableMessage)

		try {
			await guildRole.delete(guildRoleId, wallet.address, sign)

			return
		} catch (e) {
			log.crit(e)
			throw new Error('SERVER_ERROR')
		}
	}

	// public static async getUserGuilds(data: {
	// 	walletAddress: string
	// }): Promise<any[]> {
	// 	const guildMemberships =
	// 		(await user.getMemberships(data.walletAddress)) ?? []

	// 	const guilds = await Promise.all(
	// 		guildMemberships?.map(async gm =>
	// 			orm.models.Guild.findOne({
	// 				where: {
	// 					guildId: gm.guildId
	// 				}
	// 			})
	// 		)
	// 	)

	// 	return guilds ?? []
	// }

	// public static async getMeemContractGuilds(data: {
	// 	meemContractId: string
	// }): Promise<any[]> {
	// 	const meemContract = await orm.models.MeemContract.findOne({
	// 		where: {
	// 			id: data.meemContractId
	// 		}
	// 	})

	// 	if (!meemContract) {
	// 		throw new Error('MEEM_CONTRACT_NOT_FOUND')
	// 	}

	// 	const guilds = await orm.models.Guild.findAll({
	// 		include: [
	// 			{
	// 				model: orm.models.MeemContract,
	// 				where: {
	// 					id: data.meemContractId
	// 				}
	// 			}
	// 		]
	// 	})

	// 	const guildsData = await Promise.all(guilds.map(g => guild.get(g.guildId)))

	// 	return guildsData
	// }

	// public static async getMeemContractGuilds(data: {
	// 	meemContractId: string
	// }): Promise<any[]> {
	// 	const meemContract = await orm.models.MeemContract.findOne({
	// 		where: {
	// 			id: data.meemContractId
	// 		}
	// 	})

	// 	if (!meemContract) {
	// 		throw new Error('MEEM_CONTRACT_NOT_FOUND')
	// 	}

	// 	const guilds = await orm.models.Guild.findAll({
	// 		include: [
	// 			{
	// 				model: orm.models.MeemContract,
	// 				where: {
	// 					id: data.meemContractId
	// 				}
	// 			}
	// 		]
	// 	})

	// 	const guildsData = await Promise.all(guilds.map(g => guild.get(g.guildId)))

	// 	return guildsData
	// }
}
