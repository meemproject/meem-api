import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import chai, { assert } from 'chai'
import chaiAsPromised from 'chai-as-promised'
import faker from 'faker'
import { ethers } from 'hardhat'
import { v4 as uuidv4 } from 'uuid'
import { deployMeemDiamond } from '../../../tasks'
import { MeemAPI } from '../../types/meem.generated'
import BaseTest from '../BaseTest'

chai.use(chaiAsPromised)

class MintTweetsTests extends BaseTest {
	private signers!: SignerWithAddress[]

	private contractAddress!: string

	protected async beforeEach() {
		this.signers = await ethers.getSigners()
		this.setSigner(this.signers[0])
		const { DiamondProxy: contractAddress } = await deployMeemDiamond({
			ethers
		})
		this.contractAddress = contractAddress
		config.MEEM_PROXY_ADDRESS = contractAddress
		config.TWITTER_WALLET_PRIVATE_KEY = config.HARDHAT_MEEM_CONTRACT_WALLET
	}

	protected async setup() {
		// it('Can mint a Tweet', () => this.mintTweet())
		// it('Can not mint a Tweet as non-minter', () => this.nonMinterTweet())
		// // TODO: Why does this test fail on CI but pass locally?
		// // it('Can mint remix tweet', () => this.mintAndRemixTweet())
		// it('Can claim a Tweet', () => this.claimTweet())
		// it('Can claim a Wrapped Meem', () => this.claimWrappedMeem())
		// it('Can not claim a Tweet as non-owner', () => this.claimTweetNonOwner())
	}

	private async mintTweet() {
		const meemContract = await services.meem.getMeemContract()

		await services.meem.createMeemProject({
			name: 'Twitter project',
			description: 'blah blah',
			minterAddresses: [this.signers[0].address]
		})

		config.TWITTER_PROJECT_TOKEN_ID = '100000'

		const project = await meemContract.getMeem(config.TWITTER_PROJECT_TOKEN_ID)
		assert.equal(project.meemType, MeemAPI.MeemType.Original)

		await services.twitter.mintTweet({
			tweetData: {
				id: uuidv4(),
				text: faker.lorem.words()
			},
			twitterUser: {
				id: uuidv4(),
				name: faker.name.firstName(),
				username: faker.lorem.word()
			}
		})

		const meem = await meemContract.connect(this.signers[0]).getMeem(100001)
		assert.equal(meem.meemType, MeemAPI.MeemType.Remix)
		assert.equal(meem.parent, this.contractAddress)
		assert.equal(meem.parentTokenId.toNumber(), 100000)
		assert.equal(meem.root, this.contractAddress)
		assert.equal(meem.rootTokenId.toNumber(), 100000)
		assert.equal(meem.generation.toNumber(), 1)
		assert.notEqual(meem.properties.splits[0].lockedBy, MeemAPI.zeroAddress)
		assert.equal(meem.properties.splits[0].amount.toNumber(), 100)
		assert.equal(meem.properties.splits[0].toAddress, config.DAO_WALLET)
	}

	private async nonMinterTweet() {
		await services.meem.createMeemProject({
			name: 'Twitter project',
			description: 'blah blah',
			minterAddresses: [this.signers[0].address]
		})

		config.TWITTER_PROJECT_TOKEN_ID = '100000'

		this.setSigner(this.signers[1])

		await assert.isRejected(
			services.twitter.mintTweet({
				tweetData: {
					id: uuidv4(),
					text: faker.lorem.words()
				},
				twitterUser: {
					id: uuidv4(),
					name: faker.name.firstName(),
					username: faker.lorem.word()
				}
			})
		)
	}

	private async claimTweet() {
		const meemContract = await services.meem.getMeemContract()

		await services.meem.createMeemProject({
			name: 'Twitter project',
			description: 'blah blah',
			minterAddresses: [this.signers[0].address]
		})

		config.TWITTER_PROJECT_TOKEN_ID = '100000'

		const project = await meemContract.getMeem(config.TWITTER_PROJECT_TOKEN_ID)
		assert.equal(project.meemType, MeemAPI.MeemType.Original)

		const twitterUserId = uuidv4()

		await services.twitter.mintTweet({
			tweetData: {
				id: twitterUserId,
				text: faker.lorem.words()
			},
			twitterUser: {
				id: twitterUserId,
				name: faker.name.firstName(),
				username: faker.lorem.word()
			}
		})

		const meem = await meemContract.connect(this.signers[0]).getMeem(100001)
		assert.equal(meem.owner, config.MEEM_PROXY_ADDRESS)
		assert.equal(meem.meemType, MeemAPI.MeemType.Remix)
		assert.equal(meem.parent, this.contractAddress)
		assert.equal(meem.parentTokenId.toNumber(), 100000)
		assert.equal(meem.generation.toNumber(), 1)
		assert.notEqual(meem.properties.splits[0].lockedBy, MeemAPI.zeroAddress)
		assert.equal(meem.properties.splits[0].amount.toNumber(), 100)
		assert.equal(meem.properties.splits[0].toAddress, config.DAO_WALLET)

		const meemIdentificationId = uuidv4()
		const meemIdentification = await orm.models.MeemIdentification.create({
			id: meemIdentificationId
		})

		const wallet = await orm.models.Wallet.create({
			address: this.signers[1].address,
			isDefault: true,
			meemIdentification
		})

		const twitter = await orm.models.Twitter.create({
			twitterId: twitterUserId,
			isDefault: true,
			meemIdentification
		})

		meemIdentification.Wallets = [wallet]
		meemIdentification.Twitters = [twitter]

		await services.meem.claimMeem('100001', meemIdentification)

		const claimedMeem = await meemContract
			.connect(this.signers[0])
			.getMeem(100001)
		assert.equal(claimedMeem.owner, this.signers[1].address)
	}

	private async claimWrappedMeem() {
		const meemContract = await services.meem.getMeemContract()

		await services.meem.mintWrappedMeem({
			tokenAddress: '0x6444070d9b4776a2363d1bac287571db11d692eb',
			tokenId: 80,
			chain: 1,
			accountAddress: config.MEEM_PROXY_ADDRESS,
			properties: {
				totalCopies: '-1',
				totalCopiesLockedBy: MeemAPI.zeroAddress,
				totalRemixes: '-1',
				totalRemixesLockedBy: MeemAPI.zeroAddress,
				copyPermissions: [
					{
						permission: 1,
						addresses: [],
						numTokens: '0',
						lockedBy: MeemAPI.zeroAddress,
						costWei: '0'
					}
				],
				splits: [
					{
						toAddress: '0x40c6BeE45d94063c5B05144489cd8A9879899592',
						amount: 1000,
						lockedBy: MeemAPI.zeroAddress
					}
				]
			},
			childProperties: {
				totalCopies: '-1',
				totalCopiesLockedBy: MeemAPI.zeroAddress,
				totalRemixes: '-1',
				totalRemixesLockedBy: MeemAPI.zeroAddress,
				copyPermissions: [
					{
						permission: 1,
						addresses: [],
						numTokens: '0',
						lockedBy: MeemAPI.zeroAddress,
						costWei: '0'
					}
				],
				splits: [
					{
						toAddress: '0x40c6BeE45d94063c5B05144489cd8A9879899592',
						amount: 1000,
						lockedBy: MeemAPI.zeroAddress
					}
				]
			}
		})

		const meem = await meemContract.connect(this.signers[0]).getMeem(100000)

		assert.equal(meem.owner, config.MEEM_PROXY_ADDRESS)
		assert.equal(meem.meemType, MeemAPI.MeemType.Wrapped)
		assert.equal(meem.generation.toNumber(), 0)

		const meemIdentificationId = uuidv4()
		const meemIdentification = await orm.models.MeemIdentification.create({
			id: meemIdentificationId
		})

		const wallet = await orm.models.Wallet.create({
			address: '0xE7EDF0FeAebaF19Ad799eA9246E7bd8a38002d89',
			isDefault: true,
			meemIdentification
		})

		const twitter = await orm.models.Twitter.create({
			twitterId: uuidv4(),
			isDefault: true,
			meemIdentification
		})

		meemIdentification.Wallets = [wallet]
		meemIdentification.Twitters = [twitter]

		await services.meem.claimMeem('100000', meemIdentification)

		const claimedMeem = await meemContract
			.connect(this.signers[0])
			.getMeem(100000)
		assert.equal(
			claimedMeem.owner,
			'0xE7EDF0FeAebaF19Ad799eA9246E7bd8a38002d89'
		)
	}

	private async claimTweetNonOwner() {
		const meemContract = await services.meem.getMeemContract()

		await services.meem.createMeemProject({
			name: 'Twitter project',
			description: 'blah blah',
			minterAddresses: [this.signers[0].address]
		})

		config.TWITTER_PROJECT_TOKEN_ID = '100000'

		const project = await meemContract.getMeem(config.TWITTER_PROJECT_TOKEN_ID)
		assert.equal(project.meemType, MeemAPI.MeemType.Original)

		const twitterUserId = uuidv4()
		const nonOwnerTwitterUserId = uuidv4()

		await services.twitter.mintTweet({
			tweetData: {
				id: twitterUserId,
				text: faker.lorem.words()
			},
			twitterUser: {
				id: twitterUserId,
				name: faker.name.firstName(),
				username: faker.lorem.word()
			}
		})

		const meemIdentificationId = uuidv4()
		const meemIdentification = await orm.models.MeemIdentification.create({
			id: meemIdentificationId
		})

		const wallet = await orm.models.Wallet.create({
			address: this.signers[1].address,
			isDefault: true,
			meemIdentification
		})

		const twitter = await orm.models.Twitter.create({
			twitterId: nonOwnerTwitterUserId,
			isDefault: true,
			meemIdentification
		})

		meemIdentification.Wallets = [wallet]
		meemIdentification.Twitters = [twitter]

		await assert.isRejected(
			services.meem.claimMeem('100001', meemIdentification)
		)
	}

	private async mintAndRemixTweet() {
		const meemContract = await services.meem.getMeemContract()

		await services.meem.createMeemProject({
			name: 'Twitter project',
			description: 'blah blah',
			minterAddresses: [this.signers[0].address]
		})

		const twitterUserId = uuidv4()

		config.TWITTER_PROJECT_TOKEN_ID = '100000'

		await services.twitter.mintTweet({
			tweetData: {
				id: uuidv4(),
				text: faker.lorem.words()
			},
			twitterUser: {
				id: uuidv4(),
				name: faker.name.firstName(),
				username: faker.lorem.word()
			},
			remix: {
				meemId: {
					wallets: [this.signers[1].address],
					twitters: [twitterUserId],
					defaultWallet: this.signers[1].address,
					defaultTwitter: twitterUserId,
					hasOnboarded: true,
					meemPass: {
						twitter: {
							hasApplied: true,
							isWhitelisted: true,
							tweetsPerDayQuota: 99
						},
						isAdmin: false
					}
				},
				tweetData: {
					id: uuidv4(),
					text: faker.lorem.words()
				},
				twitterUser: {
					id: uuidv4(),
					name: faker.name.firstName(),
					username: faker.lorem.word()
				}
			}
		})

		const meem = await meemContract.connect(this.signers[0]).getMeem(100001)
		assert.equal(meem.owner, config.MEEM_PROXY_ADDRESS)
		assert.equal(meem.meemType, MeemAPI.MeemType.Remix)
		assert.equal(meem.parent, this.contractAddress)
		assert.equal(meem.parentTokenId.toNumber(), 100000)
		assert.equal(meem.generation.toNumber(), 1)
		const remixMeem = await meemContract
			.connect(this.signers[0])
			.getMeem(100002)
		assert.equal(remixMeem.owner, this.signers[1].address)
		assert.equal(remixMeem.meemType, MeemAPI.MeemType.Remix)
		assert.equal(remixMeem.parent, this.contractAddress)
		assert.equal(remixMeem.parentTokenId.toNumber(), 100001)
		assert.equal(remixMeem.generation.toNumber(), 2)
	}
}

describe('MintTweetsTests', function tests() {
	new MintTweetsTests(this)
})
