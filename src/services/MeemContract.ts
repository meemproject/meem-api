/* eslint-disable import/no-extraneous-dependencies */
import { getCuts, IFacetVersion } from '@meemproject/meem-contracts'
import { Validator } from '@meemproject/metadata'
import { ethers } from 'ethers'
import _ from 'lodash'
import slug from 'slug'
import {
	InitParamsStruct,
	MeemProxyV1,
	MeemProxyV1__factory
} from '../types/Meem'
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

	public static async createMeemContract(
		data: MeemAPI.v1.CreateMeemContract.IRequestBody
	): Promise<string> {
		try {
			const {
				metadata,
				name,
				maxSupply,
				isMaxSupplyLocked,
				mintPermissions,
				splits,
				isTransferLocked,
				shouldMintAdminTokens,
				adminTokenMetadata
			} = data

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
					log.crit(
						tokenMetadataValidatorResult.errors.map((e: any) => e.message)
					)
					throw new Error('INVALID_METADATA')
				}
			}

			const provider = await services.ethers.getProvider()

			const wallet = new ethers.Wallet(config.WALLET_PRIVATE_KEY, provider)

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

			const proxyContract = (await proxyContractFactory.deploy(wallet.address, {
				gasPrice: services.web3.gweiToWei(recommendedGwei).toNumber()
			})) as MeemProxyV1
			log.debug(
				`Deploying contract w/ tx: ${proxyContract.deployTransaction.hash}`
			)
			await proxyContract.deployed()

			log.debug(
				`Deployed proxy at ${proxyContract.address} w/ tx: ${proxyContract.deployTransaction.hash}`
			)

			const meemContract = MeemProxyV1__factory.connect(
				proxyContract.address,
				wallet
			)

			// TODO: Abstract this to allow new types of contract metadata e.g. clubs, other project types
			// TODO: Generate the slug for the contract here and store the external URL
			// TOOD: How do we create associations between Clubs and their projects i.e MAGS?
			// TODO: Does each new (official) contract type have a model in our database?
			// TODO: Verify club exists before storing address in metadata?

			// TODO: Pass type-safe data in for contract types
			// TODO: 🚨 Validate all properties!

			// const uri = JSON.stringify(metadata)
			const result = await services.web3.saveToPinata({ json: metadata })
			const uri = `ipfs://${result.IpfsHash}`

			const cleanAdmins = _.uniqBy(
				[...admins, wallet.address.toLowerCase()],
				a => a && a.toLowerCase()
			)

			const cleanMinters = _.uniqBy(
				[...minters, wallet.address.toLowerCase()],
				a => a && a.toLowerCase()
			)

			const contractInitParams: InitParamsStruct = {
				symbol,
				name,
				contractURI: uri,
				admins: cleanAdmins,
				minters: cleanMinters,
				maxSupply,
				isMaxSupplyLocked: isMaxSupplyLocked ?? false,
				mintPermissions: mintPermissions ?? [],
				splits: splits ?? [],
				isTransferLocked: isTransferLocked ?? false
			}

			log.debug(contractInitParams)

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

					// eslint-disable-next-line no-await-in-loop
					await services.meem.mintOriginalMeem({
						meemContractAddress: meemContract.address,
						to: cleanAdmins[i].toLowerCase(),
						metadata: adminTokenMetadata,
						mintedBy: wallet.address
					})
				}

				// await Promise.all(
				// 	cleanAdmins.map(a => {
				// 		const address = a.toLowerCase()
				// 		return services.meem.mintOriginalMeem({
				// 			meemContractAddress: meemContract.address,
				// 			to: address,
				// 			metadata: adminTokenMetadata,
				// 			mintedBy: wallet.address
				// 		})
				// 	})
				// )
				log.debug(`Finished minting admin tokens.`)
			}

			return meemContract.address
		} catch (e) {
			log.crit(e)
			throw new Error('SERVER_ERROR')
		}
	}

	/** Take a partial set of properties and return a full set w/ defaults */
	// public static buildProperties(
	// 	props?: Partial<MeemAPI.IMeemContractBaseProperties>
	// ): MeemAPI.IMeemContractBaseProperties {
	// 	return {
	// 		totalOriginalsSupply: services.web3
	// 			.toBigNumber(props?.totalOriginalsSupply ?? -1)
	// 			.toHexString(),
	// 		totalOriginalsSupplyLockedBy:
	// 			props?.totalOriginalsSupplyLockedBy ?? MeemAPI.zeroAddress,
	// 		mintPermissions: props?.mintPermissions ?? [
	// 			{
	// 				permission: MeemAPI.Permission.Anyone,
	// 				addresses: [],
	// 				numTokens: services.web3.toBigNumber(0).toHexString(),
	// 				lockedBy: MeemAPI.zeroAddress,
	// 				costWei: services.web3.toBigNumber(0).toHexString()
	// 			}
	// 		],
	// 		mintPermissionsLockedBy:
	// 			props?.mintPermissionsLockedBy ?? MeemAPI.zeroAddress,
	// 		splits: props?.splits ?? [],
	// 		splitsLockedBy: props?.splitsLockedBy ?? MeemAPI.zeroAddress,
	// 		originalsPerWallet: services.web3
	// 			.toBigNumber(props?.originalsPerWallet ?? -1)
	// 			.toHexString(),
	// 		originalsPerWalletLockedBy:
	// 			props?.originalsPerWalletLockedBy ?? MeemAPI.zeroAddress,
	// 		isTransferrable: props?.isTransferrable ?? false,
	// 		isTransferrableLockedBy:
	// 			props?.isTransferrableLockedBy ?? MeemAPI.zeroAddress,
	// 		mintStartAt: services.web3
	// 			.toBigNumber(props?.mintStartAt ?? 0)
	// 			.toNumber(),
	// 		mintEndAt: services.web3.toBigNumber(props?.mintEndAt ?? 0).toNumber(),
	// 		mintDatesLockedBy: props?.mintDatesLockedBy ?? MeemAPI.zeroAddress,
	// 		transferLockupUntil: services.web3
	// 			.toBigNumber(props?.transferLockupUntil ?? 0)
	// 			.toNumber(),
	// 		transferLockupUntilLockedBy:
	// 			props?.transferLockupUntilLockedBy ?? MeemAPI.zeroAddress
	// 	}
	// }

	// public static propertiesToBasePropertiesStruct(
	// 	props?: Partial<MeemAPI.IMeemContractBaseProperties>
	// ): BasePropertiesStruct {
	// 	return {
	// 		mintPermissions: props?.mintPermissions ?? [
	// 			{
	// 				permission: MeemAPI.Permission.Anyone,
	// 				addresses: [],
	// 				numTokens: services.web3.toBigNumber(0).toHexString(),
	// 				lockedBy: MeemAPI.zeroAddress,
	// 				costWei: services.web3.toBigNumber(0).toHexString()
	// 			}
	// 		],
	// 		mintPermissionsLockedBy:
	// 			props?.mintPermissionsLockedBy ?? MeemAPI.zeroAddress,
	// 		splits: props?.splits ?? [],
	// 		splitsLockedBy: props?.splitsLockedBy ?? MeemAPI.zeroAddress,
	// 		totalOriginalsSupply: services.web3
	// 			.toBigNumber(props?.totalOriginalsSupply ?? -1)
	// 			.toHexString(),
	// 		totalOriginalsSupplyLockedBy:
	// 			props?.totalOriginalsSupplyLockedBy ?? MeemAPI.zeroAddress,
	// 		originalsPerWallet: services.web3
	// 			.toBigNumber(props?.originalsPerWallet ?? 0)
	// 			.toHexString(),
	// 		originalsPerWalletLockedBy:
	// 			props?.originalsPerWalletLockedBy ?? MeemAPI.zeroAddress,
	// 		isTransferrable: props?.isTransferrable ?? false,
	// 		isTransferrableLockedBy:
	// 			props?.isTransferrableLockedBy ?? MeemAPI.zeroAddress,
	// 		mintStartTimestamp: services.web3.toBigNumber(props?.mintStartAt ?? 0),
	// 		mintEndTimestamp: services.web3
	// 			.toBigNumber(props?.mintEndAt ?? 0)
	// 			.toNumber(),
	// 		mintDatesLockedBy: props?.mintDatesLockedBy ?? MeemAPI.zeroAddress,
	// 		transferLockupUntil: services.web3
	// 			.toBigNumber(props?.transferLockupUntil ?? 0)
	// 			.toNumber(),
	// 		transferLockupUntilLockedBy:
	// 			props?.transferLockupUntilLockedBy ?? MeemAPI.zeroAddress
	// 	}
	// }
}
