import { assert } from 'chai'
import BaseTest from '../BaseTest'

class ContractInitTests extends BaseTest {
	protected async setup() {
		it.skip('Can prepare init values for removing admins', () =>
			this.prepareInit())
	}

	private async prepareInit() {
		const apiWallet = '0xde19C037a85A609ec33Fc747bE9Db8809175C3a5'
		const metadata = {
			meem_contract_type: 'meem-club',
			meem_metadata_version: 'MeemClub_Contract_20220718',
			name: 'asdf',
			description: 'asdf',
			image: '',
			associations: [],
			external_url: `https://clubs.link/`,
			application_instructions: []
		}

		const agreement = await orm.models.Agreement.create({
			address: '0xEFDa83b22E408A27182CFb7a44296DE313Fbc49b',
			mintPermissions: [],
			slug: 'test',
			symbol: 'TEST',
			name: 'test',
			chainId: 5,
			metadata
		})

		const wallets = await orm.models.Wallet.bulkCreate([
			{
				address: '0x0000000000000000000000000000000000000001'
			},
			{
				address: '0x0000000000000000000000000000000000000002'
			},
			{
				address: '0x0000000000000000000000000000000000000003'
			},
			{
				address: '0x0000000000000000000000000000000000000004'
			}
		])

		await orm.models.AgreementWallet.bulkCreate([
			{
				role: config.ADMIN_ROLE,
				AgreementId: agreement.id,
				WalletId: wallets[0].id
			}
		])

		let result = await services.agreement.prepareInitValues({
			admins: ['0x0000000000000000000000000000000000000001'],
			minters: [],
			chainId: 5,
			senderWalletAddress: '0xa44296DE313Fbc49bEFDa83b22E408A27182CFb7',
			agreement
		})

		const apiAdmin = result.contractInitParams.roles.find(
			r => r.role === config.ADMIN_ROLE && r.user === apiWallet && r.hasRole
		)
		const apiUpgrader = result.contractInitParams.roles.find(
			r => r.role === config.UPGRADER_ROLE && r.user === apiWallet && r.hasRole
		)
		const apiMinter = result.contractInitParams.roles.find(
			r => r.role === config.MINTER_ROLE && r.user === apiWallet && r.hasRole
		)

		assert.isOk(apiAdmin)
		assert.isOk(apiUpgrader)
		assert.isOk(apiMinter)

		result = await services.agreement.prepareInitValues({
			admins: [
				'0x0000000000000000000000000000000000000001',
				'0x0000000000000000000000000000000000000002'
			],
			minters: [],
			chainId: 5,
			senderWalletAddress: '0xa44296DE313Fbc49bEFDa83b22E408A27182CFb7',
			agreement
		})

		const user2Admin = result.contractInitParams.roles.find(
			r =>
				r.role === config.ADMIN_ROLE &&
				r.user === '0x0000000000000000000000000000000000000002' &&
				r.hasRole
		)

		assert.isOk(user2Admin)

		assert.equal(
			result.cleanAdmins[1].user,
			'0x0000000000000000000000000000000000000002'
		)

		assert.isTrue(result.cleanAdmins[1].hasRole)

		result = await services.agreement.prepareInitValues({
			admins: ['0x0000000000000000000000000000000000000002'],
			minters: [],
			chainId: 5,
			senderWalletAddress: '0xa44296DE313Fbc49bEFDa83b22E408A27182CFb7',
			agreement
		})

		const user1Admin = result.contractInitParams.roles.find(
			r =>
				r.role === config.ADMIN_ROLE &&
				r.user === '0x0000000000000000000000000000000000000001' &&
				!r.hasRole
		)

		assert.isOk(user1Admin)
	}
}

describe('ContractInitTests', function tests() {
	new ContractInitTests(this)
})
