/* eslint-disable import/no-extraneous-dependencies */
import {
	getCuts,
	IFacetVersion,
	diamondABI,
	upgrade
} from '@meemproject/meem-contracts'
import { Validator } from '@meemproject/metadata'
import { ethers } from 'ethers'
import _ from 'lodash'
import slug from 'slug'
import GnosisSafeABI from '../abis/GnosisSafe.json'
import GnosisSafeProxyABI from '../abis/GnosisSafeProxy.json'
import Wallet from '../models/Wallet'
import { InitParamsStruct, Mycontract__factory } from '../types/Meem'
import { MeemAPI } from '../types/meem.generated'

export default class MeemContractService {
	public static async generateSlug(
		baseSlug: string,
		depth?: number
	): Promise<string> {
		// TODO: 🚨 Figure out what to do with slugs. Do all contract types need slugs?
		const theSlug = slug(baseSlug, { lower: true })

		try {
			const isAvailable = await this.isSlugAvailable(theSlug)
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
			const finalSlug = await this.generateSlug(newSlug, newDepth)
			return finalSlug
		} catch (e) {
			log.crit(e)
			return baseSlug
		}
	}

	public static async isSlugAvailable(slugToCheck: string): Promise<boolean> {
		const existingSlug = await orm.models.MeemContract.findOne({
			where: {
				slug: slugToCheck
			}
		})
		return !existingSlug
	}

	public static async updateMeemContract(
		data: MeemAPI.v1.ReInitializeMeemContract.IRequestBody & {
			senderWalletAddress: string
			meemContractId: string
		}
	): Promise<string> {
		const { senderWalletAddress, meemContractId } = data
		try {
			const meemContractInstance = await orm.models.MeemContract.findOne({
				where: {
					id: meemContractId
				}
			})

			if (!meemContractInstance) {
				throw new Error('MEEM_CONTRACT_NOT_FOUND')
			}

			const { wallet, contractInitParams, cleanAdmins } =
				await this.prepareInitValues(data)

			let { recommendedGwei } = await services.web3.getGasEstimate()

			if (recommendedGwei > config.MAX_GAS_PRICE_GWEI) {
				// throw new Error('GAS_PRICE_TOO_HIGH')
				log.warn(`Recommended fee over max: ${recommendedGwei}`)
				recommendedGwei = config.MAX_GAS_PRICE_GWEI
			}

			const meemContract = Mycontract__factory.connect(
				meemContractInstance.address,
				wallet
			)

			const isAdmin = await this.isMeemContractAdmin({
				meemContractId: meemContractInstance.id,
				walletAddress: senderWalletAddress
			})

			if (!isAdmin) {
				throw new Error('NOT_AUTHORIZED')
			}

			// Find difference between current admins and new admins
			const currentAdmins = await orm.models.MeemContractWallet.findAll({
				where: {
					MeemContractId: meemContractInstance.id,
					role: config.ADMIN_ROLE
				},
				include: [orm.models.Wallet]
			})

			const newAdmins: string[] = []
			const removeAdmins: string[] = []

			for (let i = 0; i < cleanAdmins.length; i += 1) {
				// TODO: Bulk minting

				const currentAdmin = currentAdmins.find(
					a => a.Wallet?.address.toLowerCase() === cleanAdmins[i].user
				)
				if (!currentAdmin) {
					newAdmins.push(cleanAdmins[i].user)
				}
			}

			for (let i = 0; i < currentAdmins.length; i += 1) {
				const newAdmin = cleanAdmins.find(
					a =>
						a.user.toLowerCase() ===
						currentAdmins[i].Wallet?.address.toLowerCase()
				)
				if (!newAdmin) {
					removeAdmins.push(cleanAdmins[i].user)
				}
			}

			const params = {
				...contractInitParams,
				roles: [
					...newAdmins.map(a => ({
						role: config.ADMIN_ROLE,
						user: a,
						hasRole: true
					})),
					...removeAdmins.map(a => ({
						role: config.ADMIN_ROLE,
						user: a,
						hasRole: false
					}))
				]
			}

			log.debug(params)

			const tx = await meemContract.reinitialize(params, {
				gasLimit: config.MINT_GAS_LIMIT,
				gasPrice: services.web3.gweiToWei(recommendedGwei).toNumber()
			})

			log.debug(`Reinitialize tx: ${tx.hash}`)

			await tx.wait()

			return meemContract.address
		} catch (e: any) {
			await sockets?.emitError(
				e?.message ?? config.errors.CONTRACT_UPDATE_FAILED,
				senderWalletAddress
			)
			throw new Error('CONTRACT_UPDATE_FAILED')
		}
	}

	public static async createMeemContract(
		data: MeemAPI.v1.CreateMeemContract.IRequestBody & {
			senderWalletAddress: string
		}
	): Promise<string> {
		const { shouldMintAdminTokens, adminTokenMetadata, senderWalletAddress } =
			data
		try {
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
									include: [orm.models.ContractInstance]
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

			const { wallet, senderWallet, contractInitParams, cleanAdmins } =
				await this.prepareInitValues(data)

			const proxyContractFactory = new ethers.ContractFactory(
				dbContract.abi,
				{
					object: dbContract.bytecode
				},
				wallet
			)

			let { recommendedGwei } = await services.web3.getGasEstimate()

			if (recommendedGwei > config.MAX_GAS_PRICE_GWEI) {
				// throw new Error('GAS_PRICE_TOO_HIGH')
				log.warn(`Recommended fee over max: ${recommendedGwei}`)
				recommendedGwei = config.MAX_GAS_PRICE_GWEI
			}

			const proxyContract = (await proxyContractFactory.deploy(
				senderWallet.address,
				[senderWallet.address, wallet.address],
				{
					gasPrice: services.web3.gweiToWei(recommendedGwei).toNumber()
				}
			)) as any
			log.debug(
				`Deploying contract w/ tx: ${proxyContract.deployTransaction.hash}`
			)
			await proxyContract.deployed()

			log.debug(
				`Deployed proxy at ${proxyContract.address} w/ tx: ${proxyContract.deployTransaction.hash}`
			)

			const meemContract = Mycontract__factory.connect(
				proxyContract.address,
				wallet
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

			const facetCuts = cuts.map(c => ({
				target: c.facetAddress,
				action: c.action,
				selectors: c.functionSelectors
			}))

			const cutTx = await proxyContract.diamondCut(
				facetCuts,
				proxyContract.address,
				functionCall,
				{
					gasLimit: config.MINT_GAS_LIMIT,
					gasPrice: services.web3.gweiToWei(recommendedGwei).toNumber()
				}
			)

			log.debug(`Running diamond cut w/ TX: ${cutTx.hash}`)

			await cutTx.wait()

			if (shouldMintAdminTokens && adminTokenMetadata) {
				log.debug(`Minting admin tokens.`, cleanAdmins)

				for (let i = 0; i < cleanAdmins.length; i += 1) {
					// TODO: Bulk minting

					// Don't mint a token to our API wallet
					if (
						cleanAdmins[i].user.toLowerCase() !== wallet.address.toLowerCase()
					) {
						// eslint-disable-next-line no-await-in-loop
						await services.meem.mintOriginalMeem({
							meemContractAddress: meemContract.address,
							to: cleanAdmins[i].user.toLowerCase(),
							metadata: adminTokenMetadata,
							mintedBy: wallet.address
						})
					}
				}

				log.debug(`Finished minting admin tokens.`)
			}

			return meemContract.address
		} catch (e) {
			await sockets?.emitError(
				config.errors.CONTRACT_CREATION_FAILED,
				senderWalletAddress
			)
			log.crit(e)
			throw new Error('CONTRACT_CREATION_FAILED')
		}
	}

	private static async prepareInitValues(
		data: (
			| MeemAPI.v1.CreateMeemContract.IRequestBody
			| MeemAPI.v1.ReInitializeMeemContract.IRequestBody
		) & {
			senderWalletAddress: string
		}
	) {
		// TODO: Abstract this to allow new types of contract metadata e.g. clubs, other project types
		// TODO: Generate the slug for the contract here and store the external URL
		// TOOD: How do we create associations between Clubs and their projects i.e MAGS?
		// TODO: Does each new (official) contract type have a model in our database?
		// TODO: Verify club exists before storing address in metadata?

		// TODO: Pass type-safe data in for contract types
		// TODO: 🚨 Validate all properties!

		const {
			metadata,
			name,
			maxSupply,
			mintPermissions,
			splits,
			isTransferLocked,
			adminTokenMetadata,
			senderWalletAddress
		} = data
		let senderWallet = await orm.models.Wallet.findByAddress<Wallet>(
			senderWalletAddress
		)
		if (!senderWallet) {
			senderWallet = await orm.models.Wallet.create({
				address: senderWalletAddress
			})
		}

		const symbol = data.symbol ?? slug(data.name)
		const admins = data.admins ?? []
		const minters = data.minters ?? []

		if (!metadata?.meem_metadata_version) {
			throw new Error('INVALID_METADATA')
		}

		const contractMetadataValidator = new Validator(
			metadata.meem_metadata_version
		)
		const contractMetadataValidatorResult =
			contractMetadataValidator.validate(metadata)

		if (!contractMetadataValidatorResult.valid) {
			log.crit(
				contractMetadataValidatorResult.errors.map((e: any) => e.message)
			)
			throw new Error('INVALID_METADATA')
		}

		if (
			data.shouldMintAdminTokens &&
			!adminTokenMetadata?.meem_metadata_version
		) {
			throw new Error('INVALID_METADATA')
		}

		if (data.shouldMintAdminTokens && adminTokenMetadata) {
			const tokenMetadataValidator = new Validator(
				adminTokenMetadata.meem_metadata_version
			)
			const tokenMetadataValidatorResult =
				tokenMetadataValidator.validate(adminTokenMetadata)

			if (!tokenMetadataValidatorResult.valid) {
				log.crit(tokenMetadataValidatorResult.errors.map((e: any) => e.message))
				throw new Error('INVALID_METADATA')
			}
		}

		const provider = await services.ethers.getProvider()

		const wallet = new ethers.Wallet(config.WALLET_PRIVATE_KEY, provider)

		const result = await services.web3.saveToPinata({ json: metadata })
		const uri = `ipfs://${result.IpfsHash}`

		const cleanAdmins = _.uniqBy(
			[...admins, wallet.address.toLowerCase()],
			a => a && a.toLowerCase()
		).map(a => ({
			role: config.ADMIN_ROLE,
			user: a,
			hasRole: true
		}))

		const cleanMinters = _.uniqBy(
			[...minters, wallet.address.toLowerCase()],
			a => a && a.toLowerCase()
		).map(a => ({
			role: config.MINTER_ROLE,
			user: a,
			hasRole: true
		}))

		const contractInitParams: InitParamsStruct = {
			symbol,
			name,
			contractURI: uri,
			roles: [
				...cleanAdmins,
				...cleanMinters,
				// Give ourselves the upgrader role by default
				{
					role: config.UPGRADER_ROLE,
					user: wallet.address,
					hasRole: true
				}
			],
			maxSupply,
			mintPermissions: mintPermissions ?? [],
			splits: splits ?? [],
			isTransferLocked: isTransferLocked ?? false
		}

		return {
			provider,
			wallet,
			contractInitParams,
			senderWallet,
			cleanAdmins
		}
	}

	// Adapted from https://forum.openzeppelin.com/t/creating-gnosis-safes-via-the-api/12031/2
	// Gnosis safe deployments / abi: https://github.com/safe-global/safe-deployments/blob/main/src/assets/v1.3.0/gnosis_safe.json
	// Gnosis proxy factory deployments / abi: https://github.com/safe-global/safe-deployments/blob/main/src/assets/v1.3.0/proxy_factory.json
	public static async createClubSafe(
		options: MeemAPI.v1.CreateClubSafe.IRequestBody & {
			meemContractId: string
			senderWalletAddress: string
		}
	) {
		const { meemContractId, safeOwners, senderWalletAddress } = options
		try {
			const meemContract = await orm.models.MeemContract.findOne({
				where: {
					id: meemContractId
				}
			})

			if (!meemContract) {
				throw new Error('MEEM_CONTRACT_NOT_FOUND')
			}

			if (meemContract.gnosisSafeAddress) {
				throw new Error('CLUB_SAFE_ALREADY_EXISTS')
			}

			const isAdmin = await this.isMeemContractAdmin({
				meemContractId: meemContract.id,
				walletAddress: senderWalletAddress
			})

			if (!isAdmin) {
				throw new Error('NOT_AUTHORIZED')
			}

			// This is one of the topics emitted when a gnosis safe is created
			const topic =
				'0x141df868a6331af528e38c83b7aa03edc19be66e37ae67f9285bf4f8e3c6a1a8'

			const threshold = options.threshold ?? 1

			// gnosisSafeAbi is the Gnosis Safe ABI in JSON format,
			const provider = await services.ethers.getProvider()
			const signer = new ethers.Wallet(config.WALLET_PRIVATE_KEY, provider)
			const proxyContract = new ethers.Contract(
				config.GNOSIS_PROXY_CONTRACT_ADDRESS,
				GnosisSafeProxyABI,
				signer
			)
			const gnosisInterface = new ethers.utils.Interface(GnosisSafeABI)
			const safeSetupData = gnosisInterface.encodeFunctionData('setup', [
				safeOwners,
				threshold,
				'0x0000000000000000000000000000000000000000',
				'0x',
				'0x0000000000000000000000000000000000000000',
				'0x0000000000000000000000000000000000000000',
				'0',
				'0x0000000000000000000000000000000000000000'
			])

			// safeContractFactory is an instance of the "Contract" type from Ethers JS
			// see https://docs.ethers.io/v5/getting-started/#getting-started--contracts
			// for more details.
			const tx = await proxyContract.createProxy(
				config.GNOSIS_MASTER_CONTRACT_ADDRESS,
				safeSetupData
			)

			await tx.wait()

			const receipt = await provider.getTransactionReceipt(tx.hash)

			// Find the newly created Safe contract address in the transaction receipt
			for (let i = 0; i < receipt.logs.length; i += 1) {
				const receiptLog = receipt.logs[i]
				const foundTopic = receiptLog.topics.find(t => t === topic)
				if (foundTopic) {
					log.info(`address: ${receiptLog.address}`)
					meemContract.gnosisSafeAddress = receiptLog.address
					break
				}
			}

			await meemContract.save()
		} catch (e: any) {
			log.crit(e)
			await sockets?.emitError(
				e?.message ?? config.errors.SAFE_CREATE_FAILED,
				senderWalletAddress
			)
			throw new Error('SAFE_CREATE_FAILED')
		}
	}

	public static async upgradeClub(
		options: MeemAPI.v1.UpgradeClub.IRequestBody & {
			meemContractId: string
			senderWalletAddress: string
		}
	) {
		const { meemContractId, senderWalletAddress } = options
		try {
			const [meemContract, bundle] = await Promise.all([
				orm.models.MeemContract.findOne({
					where: {
						id: meemContractId
					},
					include: [orm.models.Wallet]
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
									include: [orm.models.ContractInstance]
								}
							]
						}
					]
				})
			])

			if (!meemContract) {
				throw new Error('MEEM_CONTRACT_NOT_FOUND')
			}

			const isAdmin = await this.isMeemContractAdmin({
				meemContractId: meemContract.id,
				walletAddress: senderWalletAddress
			})

			if (!isAdmin) {
				throw new Error('NOT_AUTHORIZED')
			}

			const fromVersion: IFacetVersion[] = []
			const toVersion: IFacetVersion[] = []

			const provider = await services.ethers.getProvider()
			const signer = new ethers.Wallet(config.WALLET_PRIVATE_KEY, provider)

			const diamond = new ethers.Contract(
				meemContract.address,
				diamondABI,
				signer
			)

			const facets = await diamond.facets()
			facets.forEach((facet: { target: string; selectors: string[] }) => {
				fromVersion.push({
					address: facet.target,
					functionSelectors: facet.selectors
				})
			})

			bundle?.BundleContracts?.forEach(bc => {
				if (
					!bc.Contract?.ContractInstances ||
					!bc.Contract?.ContractInstances[0]
				) {
					throw new Error('CONTRACT_INSTANCE_NOT_FOUND')
				}
				toVersion.push({
					address: bc.Contract.ContractInstances[0].address,
					functionSelectors: bc.functionSelectors
				})
			})

			const tx = await upgrade({
				signer,
				proxyContractAddress: meemContract.address,
				toVersion,
				fromVersion
			})

			log.debug(`Upgrading club ${meemContract.address} w/ tx ${tx?.hash}`)

			// console.log({
			// 	cuts,
			// 	fromVersion,
			// 	toVersion
			// })
		} catch (e: any) {
			log.crit(e)
			await sockets?.emitError(
				e?.message ?? config.errors.UPGRADE_CLUB_FAILED,
				senderWalletAddress
			)
			throw new Error('UPGRADE_CLUB_FAILED')
		}
	}

	public static async isMeemContractAdmin(options: {
		meemContractId: string
		walletAddress: string
	}) {
		const { meemContractId, walletAddress } = options
		const meemContractWallet = await orm.models.MeemContractWallet.findOne({
			where: {
				role: config.ADMIN_ROLE,
				MeemContractId: meemContractId
			},
			include: [
				{
					model: orm.models.Wallet,
					where: orm.sequelize.where(
						orm.sequelize.fn('lower', orm.sequelize.col('address')),
						walletAddress.toLowerCase()
					)
				}
			]
		})

		if (meemContractWallet) {
			return true
		}

		return false
	}
}
