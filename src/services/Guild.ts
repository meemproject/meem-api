import {
	Chain,
	GetGuildResponse,
	guild,
	role as guildRole
} from '@guildxyz/sdk'
// eslint-disable-next-line import/no-extraneous-dependencies
import AWS from 'aws-sdk'
import type { Bytes } from 'ethers'
import _ from 'lodash'
import Agreement from '../models/Agreement'
import AgreementGuild from '../models/AgreementGuild'
import AgreementRole from '../models/AgreementRole'
import Meem from '../models/Token'
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

	public static async createAgreementGuild(data: {
		agreementId: string
		adminAddresses?: string[]
	}): Promise<{
		agreementGuild: AgreementGuild
		agreementRoles: AgreementRole[]
	}> {
		const { agreementId } = data
		let adminAddresses = data.adminAddresses

		const agreement = await orm.models.Agreement.findOne({
			where: {
				id: agreementId
			},
			include: [
				{
					model: orm.models.AgreementGuild,
					include: [
						{
							model: orm.models.AgreementRole
						}
					]
				}
			]
		})

		if (!agreement) {
			throw new Error('MEEM_CONTRACT_NOT_FOUND')
		}

		if (agreement.AgreementGuild) {
			return {
				agreementGuild: agreement.AgreementGuild,
				agreementRoles: agreement.AgreementGuild?.AgreementRoles ?? []
			}
		}

		const { wallet } = await services.ethers.getProvider({
			chainId: agreement.chainId
		})

		const sign = (signableMessage: string | Bytes) =>
			wallet.signMessage(signableMessage)

		if (!adminAddresses) {
			const adminWallets = await orm.models.AgreementWallet.findAll({
				where: {
					AgreementId: agreement.id,
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
			const guildChain = this.getGuildChain(agreement.chainId)
			const createGuildResponse = await guild.create(wallet.address, sign, {
				name: agreement.name,
				description: `Agreement Guild Details - Contract Address: ${agreement.address} | Chain ID: ${agreement.chainId}`,
				roles: [
					{
						name: `Token Holder`,
						logic: 'OR',
						requirements: [
							{
								type: 'ERC721',
								chain: guildChain,
								address: agreement.address,
								data: {
									minAmount: 1
								}
							}
						]
					}
				]
			})

			const agreementGuild = await orm.models.AgreementGuild.create({
				guildId: createGuildResponse.id,
				AgreementId: agreement.id
			})

			const guildResponse = await guild.get(createGuildResponse.id)

			const agreementRoles = await Promise.all(
				guildResponse.roles.map(async role => {
					const agreementRole = await orm.models.AgreementRole.create({
						guildRoleId: role.id,
						name: role.name,
						AgreementId: agreement.id,
						AgreementGuildId: agreementGuild.id,
						isDefaultRole: true
					})

					return agreementRole
				})
			)

			const adminRole = await this.createAgreementGuildRole({
				name: 'Admin',
				agreement,
				agreementGuild,
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
				agreementRoles.push(adminRole)
			}

			return {
				agreementGuild,
				agreementRoles
			}
		} catch (e) {
			log.crit(e)
			throw new Error('SERVER_ERROR')
		}
	}

	public static async deleteAgreementGuild(data: {
		agreementId: string
	}): Promise<void> {
		const { agreementId } = data
		const agreement = await orm.models.Agreement.findOne({
			where: {
				id: agreementId
			},
			include: [
				{
					model: orm.models.AgreementGuild,
					include: [
						{
							model: orm.models.AgreementRole,
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

		if (!agreement || !agreement.AgreementGuild) {
			throw new Error('MEEM_CONTRACT_NOT_FOUND')
		}

		const { wallet } = await services.ethers.getProvider({
			chainId: agreement.chainId
		})

		const sign = (signableMessage: string | Bytes) =>
			wallet.signMessage(signableMessage)

		try {
			await guild.delete(
				agreement.AgreementGuild.guildId,
				wallet.address,
				sign,
				true
			)

			const promises: Promise<any>[] = []
			const t = await orm.sequelize.transaction()

			promises.push(
				orm.models.AgreementRole.destroy({
					where: {
						id: agreement.AgreementGuild.AgreementRoles?.map(role => role.id)
					},
					transaction: t
				})
			)

			promises.push(
				orm.models.AgreementGuild.destroy({
					where: {
						id: agreement.AgreementGuild.id
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

	public static async getAgreementGuild(data: {
		agreementId: string
	}): Promise<GetGuildResponse | null> {
		try {
			const agreementGuild = await orm.models.AgreementGuild.findOne({
				where: {
					AgreementId: data.agreementId
				}
			})
			if (!agreementGuild) {
				return null
			}
			const guildResponse = await guild.get(agreementGuild.guildId)
			return guildResponse
		} catch (e) {
			log.crit(e)
			throw new Error('SERVER_ERROR')
		}
	}

	public static async createAgreementGuildRole(data: {
		name: string
		agreement: Agreement
		agreementGuild: AgreementGuild
		permissions?: string[]
		isTokenBasedRole: boolean
		isTokenTransferrable?: boolean
		members: string[]
		senderWalletAddress: string
		isAdminRole?: boolean
	}): Promise<AgreementRole | void> {
		const {
			name,
			agreement,
			agreementGuild,
			permissions,
			isTokenBasedRole,
			isTokenTransferrable,
			members,
			senderWalletAddress,
			isAdminRole
		} = data
		const { wallet } = await services.ethers.getProvider({
			chainId: agreement.chainId
		})

		const sign = (signableMessage: string | Bytes) =>
			wallet.signMessage(signableMessage)

		try {
			if (isTokenBasedRole) {
				const baseContract = Mycontract__factory.connect(
					agreement.address,
					wallet
				)
				const admins = await baseContract.getRoles(config.ADMIN_ROLE)
				const roleContractData = {
					chainId: agreement.chainId,
					shouldMintTokens: true,
					metadata: {
						meem_contract_type: 'meem-club-role',
						meem_metadata_version: 'MeemClubRole_Contract_20220718',
						name: `${agreement.name ?? ''} - ${name}`,
						description: name,
						image: '',
						associations: [
							{
								meem_contract_type: 'meem-club',
								address: agreement.address
							}
						],
						external_url: ''
					},
					name: `${agreement.name ?? ''} - ${name}`,
					admins,
					members,
					minters: admins,
					maxSupply: '0',
					// TODO: What do we want mintPermissions to be?
					mintPermissions: agreement.mintPermissions,
					splits: [],
					isTransferLocked: !isTokenTransferrable,
					tokenMetadata: {
						meem_metadata_version: 'MeemClubRole_Token_20220718',
						description: name,
						name: `${agreement.name ?? ''} - ${name}`,
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
						await services.agreement.createAgreement({
							...roleContractData,
							senderWalletAddress,
							agreementRoleData: {
								name,
								agreement,
								agreementGuild,
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
				const guildChain = this.getGuildChain(agreement.chainId)
				const createGuildRoleResponse = await guildRole.create(
					wallet.address,
					sign,
					{
						guildId: agreementGuild.guildId,
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
								address: agreement.address,
								data: {
									minAmount: 1
								}
							}
						]
					}
				)

				const agreementRole = await orm.models.AgreementRole.create({
					guildRoleId: createGuildRoleResponse.id,
					name,
					AgreementId: agreement.id,
					AgreementGuildId: agreementGuild.id
				})

				if (!_.isUndefined(permissions) && _.isArray(permissions)) {
					const promises: Promise<any>[] = []
					const t = await orm.sequelize.transaction()
					const roleIdsToAdd =
						permissions.filter(pid => {
							const existingPermission = agreementRole.RolePermissions?.find(
								rp => rp.id === pid
							)
							return !existingPermission
						}) ?? []

					if (roleIdsToAdd.length > 0) {
						const agreementRolePermissionsData: {
							AgreementRoleId: string
							RolePermissionId: string
						}[] = roleIdsToAdd.map(rid => {
							return {
								AgreementRoleId: agreementRole.id,
								RolePermissionId: rid
							}
						})
						promises.push(
							orm.models.AgreementRolePermission.bulkCreate(
								agreementRolePermissionsData,
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

	public static async updateAgreementGuildRole(data: {
		name?: string
		agreementId: string
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
	}): Promise<AgreementRole> {
		const {
			name,
			agreementId,
			guildRoleId,
			members,
			guildRoleData,
			senderWalletAddress
		} = data

		const agreement = await orm.models.Agreement.findOne({
			where: {
				id: agreementId
			},
			include: [
				{
					model: orm.models.AgreementGuild,
					include: [
						{
							model: orm.models.AgreementRole
						}
					]
				}
			]
		})

		const agreementRole = agreement?.AgreementGuild?.AgreementRoles?.find(
			r => r.guildRoleId === guildRoleId
		)

		if (!agreement || !agreementRole) {
			throw new Error('MEEM_CONTRACT_NOT_FOUND')
		}

		if (
			_.isUndefined(name) &&
			_.isUndefined(members) &&
			_.isUndefined(guildRoleData)
		) {
			return agreementRole
		}

		const { wallet } = await services.ethers.getProvider({
			chainId: agreement.chainId
		})

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
				await agreementRole.update({
					name
				})
			}

			if (members && agreementRole.tokenAddress) {
				const roleAgreement = await orm.models.Agreement.findOne({
					where: {
						address: agreementRole.tokenAddress
					}
				})
				// TODO: Allow other contracts besides Meem
				if (roleAgreement) {
					const memberMeems = await orm.models.Token.findAll({
						where: {
							AgreementId: roleAgreement.id
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
						// 	roleAgreement.address,
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
							name: `${agreement.name ?? ''} - ${name ?? agreementRole.name}`,
							description: name ?? agreementRole.name,
							image: '',
							associations: [
								{
									meem_contract_type: 'meem-club',
									address: agreement.address
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
									agreementId: agreement.id
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
										agreementId: agreement.id
									})
								})
								.promise()
						}
					}
				}
			}

			return agreementRole
		} catch (e) {
			// TODO: Re-create guild role if no longer exists?
			log.crit(e)
			throw new Error('SERVER_ERROR')
		}
	}

	public static async deleteAgreementGuildRole(data: {
		agreementId: string
		guildRoleId: number
	}): Promise<void> {
		const { agreementId, guildRoleId } = data

		const agreement = await orm.models.Agreement.findOne({
			where: {
				id: agreementId
			},
			include: [
				{
					model: orm.models.AgreementGuild,
					include: [
						{
							model: orm.models.AgreementRole
						}
					]
				}
			]
		})

		const agreementRole = agreement?.AgreementGuild?.AgreementRoles?.find(
			r => r.guildRoleId === guildRoleId
		)

		if (!agreement || !agreementRole) {
			throw new Error('MEEM_CONTRACT_NOT_FOUND')
		}

		const { wallet } = await services.ethers.getProvider({
			chainId: agreement.chainId
		})

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

	// public static async getAgreementGuilds(data: {
	// 	agreementId: string
	// }): Promise<any[]> {
	// 	const agreement = await orm.models.Agreement.findOne({
	// 		where: {
	// 			id: data.agreementId
	// 		}
	// 	})

	// 	if (!agreement) {
	// 		throw new Error('MEEM_CONTRACT_NOT_FOUND')
	// 	}

	// 	const guilds = await orm.models.Guild.findAll({
	// 		include: [
	// 			{
	// 				model: orm.models.Agreement,
	// 				where: {
	// 					id: data.agreementId
	// 				}
	// 			}
	// 		]
	// 	})

	// 	const guildsData = await Promise.all(guilds.map(g => guild.get(g.guildId)))

	// 	return guildsData
	// }

	// public static async getAgreementGuilds(data: {
	// 	agreementId: string
	// }): Promise<any[]> {
	// 	const agreement = await orm.models.Agreement.findOne({
	// 		where: {
	// 			id: data.agreementId
	// 		}
	// 	})

	// 	if (!agreement) {
	// 		throw new Error('MEEM_CONTRACT_NOT_FOUND')
	// 	}

	// 	const guilds = await orm.models.Guild.findAll({
	// 		include: [
	// 			{
	// 				model: orm.models.Agreement,
	// 				where: {
	// 					id: data.agreementId
	// 				}
	// 			}
	// 		]
	// 	})

	// 	const guildsData = await Promise.all(guilds.map(g => guild.get(g.guildId)))

	// 	return guildsData
	// }
}
