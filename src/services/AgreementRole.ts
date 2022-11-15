/* eslint-disable import/no-extraneous-dependencies */
import { getCuts, IFacetVersion } from '@meemproject/meem-contracts'
import { Validator } from '@meemproject/metadata'
import AWS from 'aws-sdk'
import { ethers } from 'ethers'
import _ from 'lodash'
import slug from 'slug'
import { v4 as uuidv4 } from 'uuid'
import errors from '../config/errors'
import AgreementRole from '../models/AgreementRole'
import Wallet from '../models/Wallet'
import { Mycontract, Mycontract__factory } from '../types/Meem'
import { MeemAPI } from '../types/meem.generated'

export default class AgreementRoleService {
	public static async generateSlug(options: {
		baseSlug: string
		chainId: number
		depth?: number
	}): Promise<string> {
		const { baseSlug, chainId, depth } = options
		const theSlug = slug(baseSlug, { lower: true })

		try {
			const isAvailable = await this.isSlugAvailable({
				slugToCheck: theSlug,
				chainId
			})
			if (isAvailable) {
				return theSlug
			}
		} catch (e) {
			log.debug(e)
		}

		const newDepth = depth ? depth + 1 : 1

		if (newDepth > 5) {
			throw new Error('INVALID_SLUG')
		}

		try {
			// Slug is not available so try to create one w/ a random number...
			const rand = Math.floor(Math.random() * 10000) + 1
			const randStr = Math.random().toString(36).substring(3)
			const newSlug = `${randStr}-${theSlug}-${rand}`
			const finalSlug = await this.generateSlug({
				baseSlug: newSlug,
				chainId,
				depth: newDepth
			})
			return finalSlug
		} catch (e) {
			log.crit(e)
			return baseSlug
		}
	}

	public static async isSlugAvailable(options: {
		slugToCheck: string
		chainId: number
	}): Promise<boolean> {
		const { slugToCheck, chainId } = options
		const existingSlug = await orm.models.AgreementRole.findOne({
			where: {
				slug: slugToCheck,
				chainId
			}
		})
		return !existingSlug
	}

	// TODO: Combine this with createAgreement?
	public static async createAgreementRole(
		data: MeemAPI.v1.CreateAgreementRole.IRequestBody & {
			agreementId: string
			senderWalletAddress: string
			isAdminRole?: boolean
		}
	): Promise<AgreementRole> {
		const {
			shouldMintTokens,
			tokenMetadata,
			members,
			senderWalletAddress,
			chainId,
			agreementId
		} = data

		try {
			const agreement = await orm.models.Agreement.findOne({
				where: {
					id: agreementId
				}
			})

			if (!agreement) {
				throw new Error('MEEM_CONTRACT_NOT_FOUND')
			}

			const [dbContract, bundle] = await Promise.all([
				orm.models.Contract.findOne({
					where: {
						id: config.MEEM_PROXY_CONTRACT_ID
					}
				}),
				orm.models.Bundle.findOne({
					where: {
						id: config.MEEM_BUNDLE_ID
					},
					include: [
						{
							model: orm.models.BundleContract,
							include: [
								{
									model: orm.models.Contract,
									include: [
										{
											model: orm.models.ContractInstance,
											where: {
												chainId
											}
										}
									]
								}
							]
						}
					]
				})
			])

			if (!dbContract) {
				throw new Error('CONTRACT_NOT_FOUND')
			}

			if (!bundle) {
				throw new Error('BUNDLE_NOT_FOUND')
			}

			const {
				wallet,
				senderWallet,
				contractInitParams,
				cleanAdmins,
				fullMintPermissions
			} = await services.agreement.prepareInitValues({ ...data, chainId })

			const proxyContractFactory = new ethers.ContractFactory(
				dbContract.abi,
				{
					object: dbContract.bytecode
				},
				wallet
			)

			const proxyContract = await services.ethers.runTransaction({
				chainId,
				fn: proxyContractFactory.deploy.bind(proxyContractFactory),
				params: [senderWallet.address, [senderWallet.address, wallet.address]],
				gasLimit: ethers.BigNumber.from(config.MINT_GAS_LIMIT)
			})

			log.debug(
				`Deploying contract w/ tx: ${proxyContract.deployTransaction.hash}`
			)

			await orm.models.Transaction.create({
				hash: proxyContract.deployTransaction.hash,
				chainId,
				WalletId: senderWallet.id
			})

			await proxyContract.deployed()

			log.debug(
				`Deployed proxy at ${proxyContract.address} w/ tx: ${proxyContract.deployTransaction.hash}`
			)

			const toVersion: IFacetVersion[] = []

			bundle.BundleContracts?.forEach(bc => {
				const contractInstance =
					bc.Contract?.ContractInstances && bc.Contract?.ContractInstances[0]
				if (!contractInstance) {
					throw new Error('FACET_NOT_DEPLOYED')
				}

				toVersion.push({
					address: contractInstance.address,
					functionSelectors: bc.functionSelectors
				})
			})

			const cuts = getCuts({
				proxyContractAddress: proxyContract.address,
				fromVersion: [],
				toVersion
			})

			const iFace = new ethers.utils.Interface(bundle.abi)

			const functionCall = iFace.encodeFunctionData('initialize', [
				contractInitParams
			])

			log.debug(contractInitParams)

			const facetCuts = cuts.map(c => ({
				target: c.facetAddress,
				action: c.action,
				selectors: c.functionSelectors
			}))

			let contractSlug = uuidv4()

			if (data.name) {
				try {
					contractSlug = await this.generateSlug({
						baseSlug: data.name,
						chainId
					})
				} catch (e) {
					log.crit('Something went wrong while creating slug', e)
				}
			}

			const agreementRole = await orm.models.AgreementRole.create({
				address: proxyContract.address,
				mintPermissions: fullMintPermissions,
				slug: contractSlug,
				name: data.name,
				isTransferrable: !data.isTransferLocked,
				chainId,
				AgreementId: agreement.id
			})

			const cutTx = await services.ethers.runTransaction({
				chainId,
				fn: proxyContract.diamondCut.bind(proxyContract),
				params: [facetCuts, proxyContract.address, functionCall],
				gasLimit: ethers.BigNumber.from(config.MINT_GAS_LIMIT)
			})

			log.debug(`Running diamond cut w/ TX: ${cutTx.hash}`)

			await orm.models.Transaction.create({
				hash: cutTx.hash,
				chainId,
				WalletId: senderWallet.id
			})

			await cutTx.wait()

			if (shouldMintTokens && tokenMetadata) {
				log.debug(`Minting admin/member tokens.`, cleanAdmins)
				const addresses = [...cleanAdmins.map(a => a.user), ...(members ?? [])]

				const tokens = addresses.map(a => {
					return {
						to: a,
						metadata: tokenMetadata
					}
				})

				if (config.DISABLE_ASYNC_MINTING) {
					try {
						await this.bulkMint({
							tokens,
							mintedBy: senderWalletAddress,
							agreementRoleId: agreementRole.id
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
								agreementId: agreementRole.id
							})
						})
						.promise()
				}

				log.debug(`Finished minting admin/member tokens.`)
			}

			try {
				// const sign = (signableMessage: string | Bytes) =>
				// 	wallet.signMessage(signableMessage)
				// const createGuildRoleResponse = await guildRole.create(
				// 	wallet.address,
				// 	sign,
				// 	{
				// 		guildId: agreementGuild.guildId,
				// 		name: roleName,
				// 		logic: 'AND',
				// 		requirements: [
				// 			{
				// 				type: 'ERC721',
				// 				chain: services.guild.getGuildChain(
				// 					agreementInstance.chainId
				// 				),
				// 				address: agreement.address,
				// 				data: {
				// 					minAmount: 1
				// 				}
				// 			}
				// 		]
				// 	}
				// )
				// await orm.models.AgreementRole.create({
				// 	// guildRoleId: createGuildRoleResponse.id,
				// 	name: data.name,
				// 	AgreementId: agreement.id,
				// 	RoleAgreementId: agreementInstance.id,
				// 	// tokenAddress: agreement.address,
				// 	isAdminRole: isAdminRole ?? false
				// })
			} catch (e) {
				log.crit('Failed to create Guild', e)
			}

			return agreementRole
		} catch (e) {
			await sockets?.emitError(
				config.errors.CONTRACT_CREATION_FAILED,
				senderWalletAddress
			)
			log.crit(e)
			throw new Error('CONTRACT_CREATION_FAILED')
		}
	}

	public static async updateRole(data: {
		senderWallet: Wallet
		agreementId: string
		agreementRoleId: string
		name?: string
		permissions?: string[]
		members?: string[]
		guildRoleData?: any
	}): Promise<AgreementRole> {
		const {
			senderWallet,
			agreementId,
			agreementRoleId,
			members: roleMembers
		} = data
		const isAdmin = await services.agreement.isAgreementAdmin({
			agreementId,
			walletAddress: senderWallet.address
		})

		if (!isAdmin) {
			throw new Error('NOT_AUTHORIZED')
		}

		const agreement = await orm.models.Agreement.findOne({
			where: {
				id: agreementId
			}
		})

		if (!agreement) {
			throw new Error('MEEM_CONTRACT_NOT_FOUND')
		}

		const agreementRole = await orm.models.AgreementRole.findOne({
			where: {
				id: agreementRoleId
			}
		})

		if (!agreementRole) {
			throw new Error('MEEM_CONTRACT_ROLE_NOT_FOUND')
		}

		// const updatedName = name
		let updatedMembers = roleMembers?.map(m => m.toLowerCase())

		if (
			agreementRole.isAdminRole &&
			!_.isUndefined(updatedMembers) &&
			_.isArray(updatedMembers)
		) {
			try {
				if (agreementRole.isAdminRole && updatedMembers) {
					const admins = await services.agreement.updateAgreementAdmins({
						agreementId: agreement.id,
						admins: updatedMembers,
						senderWallet
					})
					updatedMembers = admins
				}
			} catch (e) {
				log.crit(e)
				throw new Error('SERVER_ERROR')
			}
		}

		// if (agreementRole.guildRoleId) {
		// 	await services.guild.updateAgreementGuildRole({
		// 		guildRoleId: agreementRole.guildRoleId,
		// 		agreementId: agreement.id,
		// 		name: updatedName,
		// 		members: updatedMembers,
		// 		guildRoleData,
		// 		senderWalletAddress: senderWallet.address
		// 	})
		// }

		return agreementRole
	}

	/** Mint an Agreement Token */
	public static async bulkMint(
		data: MeemAPI.v1.BulkMintAgreementToken.IRequestBody & {
			mintedBy: string
			agreementRoleId: string
		}
	) {
		try {
			if (!data.agreementRoleId) {
				throw new Error('MISSING_CONTRACT_ADDRESS')
			}

			const [agreementRole, minterWallet] = await Promise.all([
				orm.models.AgreementRole.findOne({
					where: {
						id: data.agreementRoleId
					}
				}),
				orm.models.Wallet.findByAddress<Wallet>(data.mintedBy)
			])

			if (!minterWallet) {
				throw new Error('WALLET_NOT_FOUND')
			}

			if (!agreementRole) {
				throw new Error('MEEM_CONTRACT_NOT_FOUND')
			}

			const builtData: {
				to: string
				metadata: MeemAPI.ITokenMetadataLike
				ipfs?: string
			}[] = []

			// Validate metadata
			data.tokens.forEach(token => {
				if (!token.to) {
					throw new Error('MISSING_ACCOUNT_ADDRESS')
				}

				if (!token.metadata?.meem_metadata_version) {
					throw new Error('INVALID_METADATA')
				}

				const validator = new Validator(token.metadata.meem_metadata_version)
				const validatorResult = validator.validate(token.metadata)

				if (!validatorResult.valid) {
					log.crit(validatorResult.errors.map((e: any) => e.message))
					throw new Error('INVALID_METADATA')
				}

				builtData.push({
					...token,
					metadata: token.metadata
				})
			})

			// Pin to IPFS
			for (let i = 0; i < builtData.length; i++) {
				const item = builtData[i]
				const result = await services.web3.saveToPinata({
					json: item.metadata
				})
				item.ipfs = `ipfs://${result.IpfsHash}`
			}

			const { wallet } = await services.ethers.getProvider({
				chainId: agreementRole.chainId
			})
			const contract = Mycontract__factory.connect(
				agreementRole.address,
				wallet
			)

			const mintParams: Parameters<Mycontract['bulkMint']> = [
				builtData.map(item => ({
					to: item.to,
					tokenType: MeemAPI.MeemType.Original,
					tokenURI: item.ipfs as string
				}))
			]

			log.debug('Bulk Minting meem w/ params', { mintParams })

			const mintTx = await services.ethers.runTransaction({
				chainId: agreementRole.chainId,
				fn: contract.bulkMint.bind(contract),
				params: mintParams,
				gasLimit: ethers.BigNumber.from(config.MINT_GAS_LIMIT)
			})

			log.debug(`Bulk Minting w/ transaction hash: ${mintTx.hash}`)

			await orm.models.Transaction.create({
				hash: mintTx.hash,
				chainId: agreementRole.chainId,
				WalletId: minterWallet.id
			})

			await mintTx.wait()
		} catch (e) {
			const err = e as any
			log.warn(err, data)

			await sockets?.emitError(errors.SERVER_ERROR, data.mintedBy)
			throw new Error('SERVER_ERROR')
		}
	}
}
