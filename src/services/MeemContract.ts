/* eslint-disable import/no-extraneous-dependencies */
import * as meemContracts from '@meemproject/meem-contracts'
import { Chain, Permission } from '@meemproject/meem-contracts'
import { BasePropertiesStruct } from '@meemproject/meem-contracts/dist/types/Meem'
import { Validator } from '@meemproject/metadata'
import { BigNumber, ethers } from 'ethers'
import slug from 'slug'
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
			const { metadata, adminTokenMetadata } = data

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

			if (data.mintAdminTokens && !adminTokenMetadata?.meem_metadata_version) {
				throw new Error('INVALID_METADATA')
			}

			if (data.mintAdminTokens && adminTokenMetadata) {
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

			const contract = await meemContracts.deployProxy({
				signer: wallet
			})

			log.debug(
				`Deployed proxy at ${contract.address} w/ tx: ${contract.deployTransaction.hash}`
			)

			// TODO: Abstract this to allow new types of contract metadata e.g. clubs, other project types
			// TODO: Generate the slug for the contract here and store the external URL
			// TOOD: How do we create associations between Clubs and their projects i.e MAGS?
			// TODO: Does each new (official) contract type have a model in our database?
			// TODO: Verify club exists before storing address in metadata?

			// TODO: Pass type-safe data in for contract types
			// TODO: 🚨 Validate all properties!

			const uri = JSON.stringify(metadata)

			// Add Meem admin to mintPermissions
			data.baseProperties.mintPermissions.push({
				permission: Permission.Addresses,
				addresses: [wallet.address.toLowerCase()],
				numTokens: BigNumber.from(0).toHexString(),
				costWei: BigNumber.from(0).toHexString(),
				lockedBy: MeemAPI.zeroAddress
			})

			const contractInitParams = {
				signer: wallet,
				proxyContractAddress: contract.address,
				contractURI: uri,
				name: data.name,
				symbol: data.symbol,
				admins: [...data.admins, wallet.address.toLowerCase()],
				childDepth: data.childDepth,
				tokenCounterStart: data.tokenCounterStart,
				nonOwnerSplitAllocationAmount: data.nonOwnerSplitAllocationAmount,
				baseProperties: this.propertiesToBasePropertiesStruct(
					this.buildProperties(data.baseProperties)
				),
				defaultProperties: data.defaultProperties
					? services.meem.propertiesToMeemPropertiesStruct(
							services.meem.buildProperties(data.defaultProperties)
					  )
					: meemContracts.defaultMeemProperties,
				defaultChildProperties: data.defaultChildProperties
					? services.meem.propertiesToMeemPropertiesStruct(
							services.meem.buildProperties(data.defaultChildProperties)
					  )
					: meemContracts.defaultMeemProperties,
				chain: (config.NETWORK === 'matic' ? Chain.Polygon : Chain.Rinkeby) as
					| Chain.Polygon
					| Chain.Rinkeby,
				version: 'latest'
			}

			const tx = await meemContracts.initProxy(contractInitParams)

			log.debug(`Initialized proxy w/ tx: ${tx.hash}`)

			if (data.mintAdminTokens && adminTokenMetadata) {
				await tx.wait()
				log.debug(`Minting admin tokens.`, data.admins)

				await Promise.all(
					data.admins.map(a => {
						const address = a.toLowerCase()
						return services.meem.mintOriginalMeem({
							meemContractAddress: contract.address,
							to: address,
							metadata: adminTokenMetadata,
							chain: MeemAPI.networkNameToChain(config.NETWORK),
							properties: data.defaultProperties,
							childProperties: data.defaultChildProperties,
							mintedBy: wallet.address
						})
					})
				)
				log.debug(`Finished minting admin tokens.`)
			}

			return contract.address
		} catch (e) {
			log.crit(e)
			throw new Error('SERVER_ERROR')
		}
	}

	/** Take a partial set of properties and return a full set w/ defaults */
	public static buildProperties(
		props?: Partial<MeemAPI.IMeemContractBaseProperties>
	): MeemAPI.IMeemContractBaseProperties {
		return {
			totalOriginalsSupply: services.web3
				.toBigNumber(props?.totalOriginalsSupply ?? -1)
				.toHexString(),
			totalOriginalsSupplyLockedBy:
				props?.totalOriginalsSupplyLockedBy ?? MeemAPI.zeroAddress,
			mintPermissions: props?.mintPermissions ?? [
				{
					permission: MeemAPI.Permission.Anyone,
					addresses: [],
					numTokens: services.web3.toBigNumber(0).toHexString(),
					lockedBy: MeemAPI.zeroAddress,
					costWei: services.web3.toBigNumber(0).toHexString()
				}
			],
			mintPermissionsLockedBy:
				props?.mintPermissionsLockedBy ?? MeemAPI.zeroAddress,
			splits: props?.splits ?? [],
			splitsLockedBy: props?.splitsLockedBy ?? MeemAPI.zeroAddress,
			originalsPerWallet: services.web3
				.toBigNumber(props?.originalsPerWallet ?? -1)
				.toHexString(),
			originalsPerWalletLockedBy:
				props?.originalsPerWalletLockedBy ?? MeemAPI.zeroAddress,
			isTransferrable: props?.isTransferrable ?? false,
			isTransferrableLockedBy:
				props?.isTransferrableLockedBy ?? MeemAPI.zeroAddress,
			mintStartAt: services.web3
				.toBigNumber(props?.mintStartAt ?? 0)
				.toNumber(),
			mintEndAt: services.web3.toBigNumber(props?.mintEndAt ?? 0).toNumber(),
			mintDatesLockedBy: props?.mintDatesLockedBy ?? MeemAPI.zeroAddress,
			transferLockupUntil: services.web3
				.toBigNumber(props?.transferLockupUntil ?? 0)
				.toNumber(),
			transferLockupUntilLockedBy:
				props?.transferLockupUntilLockedBy ?? MeemAPI.zeroAddress
		}
	}

	public static propertiesToBasePropertiesStruct(
		props?: Partial<MeemAPI.IMeemContractBaseProperties>
	): BasePropertiesStruct {
		return {
			mintPermissions: props?.mintPermissions ?? [
				{
					permission: MeemAPI.Permission.Anyone,
					addresses: [],
					numTokens: services.web3.toBigNumber(0).toHexString(),
					lockedBy: MeemAPI.zeroAddress,
					costWei: services.web3.toBigNumber(0).toHexString()
				}
			],
			mintPermissionsLockedBy:
				props?.mintPermissionsLockedBy ?? MeemAPI.zeroAddress,
			splits: props?.splits ?? [],
			splitsLockedBy: props?.splitsLockedBy ?? MeemAPI.zeroAddress,
			totalOriginalsSupply: services.web3
				.toBigNumber(props?.totalOriginalsSupply ?? -1)
				.toHexString(),
			totalOriginalsSupplyLockedBy:
				props?.totalOriginalsSupplyLockedBy ?? MeemAPI.zeroAddress,
			originalsPerWallet: services.web3
				.toBigNumber(props?.originalsPerWallet ?? 0)
				.toHexString(),
			originalsPerWalletLockedBy:
				props?.originalsPerWalletLockedBy ?? MeemAPI.zeroAddress,
			isTransferrable: props?.isTransferrable ?? false,
			isTransferrableLockedBy:
				props?.isTransferrableLockedBy ?? MeemAPI.zeroAddress,
			mintStartTimestamp: services.web3.toBigNumber(props?.mintStartAt ?? 0),
			mintEndTimestamp: services.web3
				.toBigNumber(props?.mintEndAt ?? 0)
				.toNumber(),
			mintDatesLockedBy: props?.mintDatesLockedBy ?? MeemAPI.zeroAddress,
			transferLockupUntil: services.web3
				.toBigNumber(props?.transferLockupUntil ?? 0)
				.toNumber(),
			transferLockupUntilLockedBy:
				props?.transferLockupUntilLockedBy ?? MeemAPI.zeroAddress
		}
	}
}
