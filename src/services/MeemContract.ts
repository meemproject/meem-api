/* eslint-disable import/no-extraneous-dependencies */
import * as path from 'path'
import * as meemContracts from '@meemproject/meem-contracts'
import { Chain, Permission } from '@meemproject/meem-contracts'
import { ethers } from 'ethers'
import fs from 'fs-extra'
import slug from 'slug'
import { MeemAPI } from '../types/meem.generated'

export default class MeemContractService {
	public static async generateSlug(
		baseSlug: string,
		depth?: number
	): Promise<string> {
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

	public static async createMeemContract(options: {
		name: string
		description: string
		clubContractAddress: string
		admins: string[]
	}): Promise<string> {
		const { name, description, admins, clubContractAddress } = options

		const imagePath = path.resolve(process.cwd(), 'src/lib/meem-badge.png')

		const image = await fs.readFile(imagePath)
		const imageBase64 = image.toString('base64')

		const provider = await services.ethers.getProvider()

		const wallet = new ethers.Wallet(config.WALLET_PRIVATE_KEY, provider)

		const contract = await meemContracts.deployProxy({
			signer: wallet
		})

		log.debug(
			`Deployed proxy at ${contract.address} w/ tx: ${contract.deployTransaction.hash}`
		)

		const clubSymbol = name.split(' ')[0].toUpperCase()

		// MAGS metadata
		// TODO: Abstract this to allow new types of contract metadata e.g. clubs, other project types
		// TODO: Generate the slug for the contract here and store the external URL
		// TOOD: How do we create associations between Clubs and their projects i.e MAGS?
		// TODO: Does each new (official) contract type have a model in our database?
		// TODO: Verify club exists before storing address in metadata?

		const contractMetadata = {
			meem_contract_type: 'mags',
			version: '1.0.0',
			spec: 'meem-1.0.0',
			name,
			description,
			external_url: '',
			image: imageBase64,
			club_contract_address: clubContractAddress
		}

		const uri = JSON.stringify(contractMetadata)

		const baseProperties = {
			// Total # of tokens available. -1 means unlimited.
			totalOriginalsSupply: -1,
			totalOriginalsSupplyLockedBy: MeemAPI.zeroAddress,
			// Specify who can mint originals
			mintPermissions: admins.map(admin => {
				return {
					permission: Permission.Addresses,
					addresses: [admin.toLowerCase()],
					numTokens: 0,
					costWei: 0,
					lockedBy: MeemAPI.zeroAddress
				}
			}),
			mintPermissionsLockedBy: MeemAPI.zeroAddress,
			// Payout of minting
			splits: [],
			splitsLockedBy: MeemAPI.zeroAddress,
			// Number of originals allowed to be held by the same wallet
			originalsPerWallet: -1,
			originalsPerWalletLockedBy: MeemAPI.zeroAddress,
			// Whether originals are transferrable
			isTransferrable: true,
			isTransferrableLockedBy: MeemAPI.zeroAddress,
			// Mint start unix timestamp
			mintStartTimestamp: -1,
			// Mint end unix timestamp
			mintEndTimestamp: -1,
			mintDatesLockedBy: MeemAPI.zeroAddress,
			// Prevent transfers until this unix timestamp
			transferLockupUntil: 0,
			transferLockupUntilLockedBy: MeemAPI.zeroAddress
		}

		log.debug(`baseProperties: ${JSON.stringify(baseProperties)}`)
		log.debug(`club symbol: ${clubSymbol}`)
		log.debug(`club admins: ${admins}`)

		const data = {
			name: name ?? '',
			symbol: clubSymbol,
			admins: admins ?? [],
			contractURI: uri,
			baseProperties,
			defaultProperties: meemContracts.defaultMeemProperties,
			defaultChildProperties: meemContracts.defaultMeemProperties,
			tokenCounterStart: 1,
			childDepth: -1,
			nonOwnerSplitAllocationAmount: 0
		}

		const tx = await meemContracts.initProxy({
			signer: wallet,
			proxyContractAddress: contract.address,
			...data,
			chain: Chain.Rinkeby,
			version: 'latest'
		})

		log.debug(`Initialized proxy w/ tx: ${tx.hash}`)

		return contract.address
	}
}
