import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import chai, { assert } from 'chai'
import chaiAsPromised from 'chai-as-promised'
import faker from 'faker'
import { ethers } from 'hardhat'
import { v4 as uuidv4 } from 'uuid'
import { deployDiamond } from '../../../tasks'
import { MeemAPI } from '../../types/meem.generated'
import BaseTest from '../BaseTest'

chai.use(chaiAsPromised)

class MintTweetsTests extends BaseTest {
	private signers!: SignerWithAddress[]

	private contractAddress!: string

	protected async beforeEach() {
		this.signers = await ethers.getSigners()
		this.setSigner(this.signers[0])
		const { DiamondProxy: contractAddress } = await deployDiamond({
			ethers
		})
		this.contractAddress = contractAddress
		config.MEEM_PROXY_ADDRESS = contractAddress
		config.TWITTER_WALLET_PRIVATE_KEY = config.HARDHAT_MEEM_CONTRACT_WALLET
	}

	protected async setup() {
		it('Can mint a Tweet', () => this.mintTweet())
		it('Can not mint a Tweet as non-minter', () => this.nonMinterTweet())
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
		assert.equal(meem.generation.toNumber(), 1)
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

	// private async mintAndRemixTweet() {
	// 	const meemContract = await services.meem.getMeemContract()

	// 	await services.meem.createMeemProject({
	// 		name: 'Twitter project',
	// 		description: 'blah blah',
	// 		minterAddresses: [this.signers[0].address]
	// 	})

	// 	config.TWITTER_PROJECT_TOKEN_ID = '100000'

	// 	await services.twitter.mintTweet({
	// 		tweetData: {
	// 			id: uuidv4(),
	// 			text: faker.lorem.words()
	// 		},
	// 		twitterUser: {
	// 			id: uuidv4(),
	// 			name: faker.name.firstName(),
	// 			username: faker.lorem.word()
	// 		},
	// 		remix: {
	// 			tweetData: {
	// 				id: uuidv4(),
	// 				text: faker.lorem.words()
	// 			},
	// 			twitterUser: {
	// 				id: uuidv4(),
	// 				name: faker.name.firstName(),
	// 				username: faker.lorem.word()
	// 			}
	// 		}
	// 	})

	// 	const meem = await meemContract.connect(this.signers[0]).getMeem(100001)
	// 	assert.equal(meem.meemType, MeemAPI.MeemType.Remix)
	// 	assert.equal(meem.parent, this.contractAddress)
	// 	assert.equal(meem.parentTokenId.toNumber(), 100000)
	// 	assert.equal(meem.generation.toNumber(), 1)
	// }
}

describe('MintTweetsTests', function tests() {
	new MintTweetsTests(this)
})
