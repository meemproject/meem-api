/* eslint-disable import/no-extraneous-dependencies */
import * as meemContracts from '@meemproject/meem-contracts'
import { Chain, Permission } from '@meemproject/meem-contracts'
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
		const { metadata } = data

		const provider = await services.ethers.getProvider()

		const wallet = new ethers.Wallet(config.WALLET_PRIVATE_KEY, provider)

		const contract = await meemContracts.deployProxy({
			signer: wallet
		})

		log.debug(
			`Deployed proxy at ${contract.address} w/ tx: ${contract.deployTransaction.hash}`
		)

		// MAGS metadata
		// TODO: Abstract this to allow new types of contract metadata e.g. clubs, other project types
		// TODO: Generate the slug for the contract here and store the external URL
		// TOOD: How do we create associations between Clubs and their projects i.e MAGS?
		// TODO: Does each new (official) contract type have a model in our database?
		// TODO: Verify club exists before storing address in metadata?

		// TODO: Pass type-safe data in for contract types
		// TODO: 🚨 Parse/validate metadata
		// TODO: 🚨 Validate all properties!

		let isValidMetadata = false

		isValidMetadata =
			!!metadata.meem_contract_type && !!metadata.spec && !!metadata.version

		if (!isValidMetadata) {
			throw new Error('INVALID_PARAMETERS')
		}

		const uri = JSON.stringify(metadata)

		const contractData = {
			contractURI: uri,
			...data
		}

		// Add Meem admin to mintPermissions
		contractData.admins.push(wallet.address.toLowerCase())
		contractData.baseProperties.mintPermissions.push({
			permission: Permission.Addresses,
			addresses: [wallet.address.toLowerCase()],
			numTokens: BigNumber.from(0).toHexString(),
			costWei: BigNumber.from(0).toHexString(),
			lockedBy: MeemAPI.zeroAddress
		})

		const tx = await meemContracts.initProxy({
			signer: wallet,
			proxyContractAddress: contract.address,
			...contractData,
			baseProperties: {
				...contractData.baseProperties,
				mintStartTimestamp: BigNumber.from(
					contractData.baseProperties.mintStartAt ?? -1
				),
				mintEndTimestamp: BigNumber.from(
					contractData.baseProperties.mintEndAt ?? -1
				)
			},
			defaultProperties: contractData.defaultProperties
				? {
						...contractData.defaultProperties,
						mintStartTimestamp: BigNumber.from(
							contractData.defaultProperties.mintStartAt ?? -1
						),
						mintEndTimestamp: BigNumber.from(
							contractData.defaultProperties.mintEndAt ?? -1
						)
				  }
				: meemContracts.defaultMeemProperties,
			defaultChildProperties: contractData.defaultChildProperties
				? {
						...contractData.defaultChildProperties,
						mintStartTimestamp: BigNumber.from(
							contractData.defaultChildProperties.mintStartAt ?? -1
						),
						mintEndTimestamp: BigNumber.from(
							contractData.defaultChildProperties.mintEndAt ?? -1
						)
				  }
				: meemContracts.defaultMeemProperties,
			chain: Chain.Rinkeby,
			version: 'latest'
		})

		log.debug(`Initialized proxy w/ tx: ${tx.hash}`)

		return contract.address
	}
}
