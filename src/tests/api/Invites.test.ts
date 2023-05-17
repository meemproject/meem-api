import { assert } from 'chai'
import { MeemAPI } from '../../types/meem.generated'
import BaseTest from '../BaseTest'

class ConfigTests extends BaseTest {
	protected async setup() {
		it('Can not invite a user if not logged in', () =>
			this.inviteUserNotLoggedIn())
		it.skip('Can invite a user and accept invite', () => this.inviteUser())
	}

	private async inviteUserNotLoggedIn() {
		const { agreement } = await this.getAgreement()

		await this.makeRequest({
			path: MeemAPI.v1.SendAgreementInvites.path({
				agreementId: agreement.id
			}),
			method: MeemAPI.v1.SendAgreementInvites.method,
			expect: 403
		})
	}

	private async inviteUser() {
		const { agreement } = await this.getAgreement()

		const user0 = this.mocks.users[0]
		const user1 = this.mocks.users[1]

		const { body } = await this.makeRequest({
			path: MeemAPI.v1.SendAgreementInvites.path({
				agreementId: agreement.id
			}),
			data: {
				to: ['test@example.com']
			},
			method: MeemAPI.v1.SendAgreementInvites.method,
			expect: 200,
			user: user0
		})

		assert.equal(body.status, 'success')

		const invite = await orm.models.Invite.findOne({
			order: [['createdAt', 'DESC']]
		})

		assert.equal(invite?.AgreementId, agreement.id)

		const { body: body2 } = await this.makeRequest({
			path: MeemAPI.v1.AcceptAgreementInvite.path(),
			data: {
				code: invite?.code
			},
			method: MeemAPI.v1.AcceptAgreementInvite.method,
			expect: 200,
			user: user1
		})

		assert.isOk(body2.agreementId)
		assert.isOk(body2.agreementTokenId)
		assert.isOk(body2.name)
		assert.isOk(body2.slug)
		assert.isOk(body2.agreementRoleId)
		assert.isOk(body2.agreementRoleTokenId)

		const agreementToken = await orm.models.AgreementToken.findOne({
			where: {
				id: body2.agreementTokenId,
				OwnerId: user1.DefaultWalletId
			}
		})

		assert.isOk(agreementToken)

		const agreementRoleToken = await orm.models.AgreementRoleToken.findOne({
			where: {
				id: body2.agreementRoleTokenId,
				OwnerId: user1.DefaultWalletId
			}
		})

		assert.isOk(agreementRoleToken)
	}
}

describe('ConfigTests', function tests() {
	new ConfigTests(this)
})
