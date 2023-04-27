import { assert } from 'chai'
import { MeemAPI } from '../../types/meem.generated'
import BaseTest from '../BaseTest'
import { discordMessageSingleUser } from '../bootstrap/messages'

class RuleTests extends BaseTest {
	protected async setup() {
		it('Count emoji happypath', () => this.countEmoji())
		it('Count emoji filter by role', () => this.countEmojiFilterRole())
		it('Count emoji filter by channel', () => this.countEmojiFilterChannel())
		it.skip('Should publish with editor approval', () =>
			this.publishWithEditorApproval())
	}

	private async countEmoji() {
		const rule = await orm.models.Rule.create({
			input: MeemAPI.RuleIo.Discord,
			output: MeemAPI.RuleIo.Webhook,
			definition: {
				publishType: MeemAPI.PublishType.PublishImmediately,
				proposerRoles: [],
				proposerEmojis: [],
				approverRoles: ['1064925445562302625'],
				approverEmojis: [
					{ id: '1f44d', name: '1f44d', type: 'unified', unified: '1f44d' }
				],
				vetoerRoles: [],
				vetoerEmojis: [],
				editorRoles: [],
				editorEmojis: [],
				proposalChannels: ['1064925446308900867'],
				proposalShareChannel: '',
				canVeto: false,
				votes: 1,
				vetoVotes: 0,
				editorVotes: 0,
				proposeVotes: 0,
				shouldReply: false,
				isEnabled: true
			}
		})
		const message = discordMessageSingleUser()
		const result = await services.discord.countReactions({
			message,
			rule
		})
		assert.equal(result.totalApprovals, 1)
		assert.equal(result.totalProposers, 0)
		assert.equal(result.totalEditors, 0)
		assert.equal(result.totalVetoers, 0)
	}

	private async countEmojiFilterRole() {
		const rule = await orm.models.Rule.create({
			input: MeemAPI.RuleIo.Discord,
			output: MeemAPI.RuleIo.Webhook,
			definition: {
				publishType: MeemAPI.PublishType.PublishImmediately,
				proposerRoles: [],
				proposerEmojis: [],
				approverRoles: ['1234'],
				approverEmojis: [
					{ id: '1f44d', name: '1f44d', type: 'unified', unified: '1f44d' }
				],
				vetoerRoles: [],
				vetoerEmojis: [],
				editorRoles: [],
				editorEmojis: [],
				proposalChannels: ['1064925446308900867'],
				proposalShareChannel: '',
				canVeto: false,
				votes: 1,
				vetoVotes: 0,
				editorVotes: 0,
				proposeVotes: 0,
				shouldReply: false,
				isEnabled: true
			}
		})
		const message = discordMessageSingleUser()
		const result = await services.discord.countReactions({
			message,
			rule
		})
		assert.equal(result.totalApprovals, 0)
		assert.equal(result.totalProposers, 0)
		assert.equal(result.totalEditors, 0)
		assert.equal(result.totalVetoers, 0)
	}

	private async countEmojiFilterChannel() {
		const rule = await orm.models.Rule.create({
			input: MeemAPI.RuleIo.Discord,
			output: MeemAPI.RuleIo.Webhook,
			definition: {
				publishType: MeemAPI.PublishType.PublishImmediately,
				proposerRoles: [],
				proposerEmojis: [],
				approverRoles: ['1064925445562302625'],
				approverEmojis: [
					{ id: '1f44d', name: '1f44d', type: 'unified', unified: '1f44d' }
				],
				vetoerRoles: [],
				vetoerEmojis: [],
				editorRoles: [],
				editorEmojis: [],
				proposalChannels: ['1234'],
				proposalShareChannel: '',
				canVeto: false,
				votes: 1,
				vetoVotes: 0,
				editorVotes: 0,
				proposeVotes: 0,
				shouldReply: false,
				isEnabled: true
			}
		})
		const message = discordMessageSingleUser()
		const result = await services.discord.countReactions({
			message,
			rule
		})
		assert.equal(result.totalApprovals, 0)
		assert.equal(result.totalProposers, 0)
		assert.equal(result.totalEditors, 0)
		assert.equal(result.totalVetoers, 0)
	}

	private async publishWithEditorApproval() {
		const rule = await orm.models.Rule.create({
			input: MeemAPI.RuleIo.Discord,
			output: MeemAPI.RuleIo.Webhook,
			definition: {
				publishType: MeemAPI.PublishType,
				proposerRoles: [],
				proposerEmojis: [],
				approverRoles: ['1064925445562302625'],
				approverEmojis: [
					{ id: '1f44d', name: '1f44d', type: 'unified', unified: '1f44d' }
				],
				vetoerRoles: [],
				vetoerEmojis: [],
				editorRoles: [],
				editorEmojis: [],
				proposalChannels: ['1234'],
				proposalShareChannel: '',
				canVeto: false,
				votes: 1,
				vetoVotes: 0,
				editorVotes: 0,
				proposeVotes: 0,
				shouldReply: false,
				isEnabled: true
			}
		})
		const message = discordMessageSingleUser()
		const result = await services.discord.countReactions({
			message,
			rule
		})
		assert.equal(result.totalApprovals, 0)
		assert.equal(result.totalProposers, 0)
		assert.equal(result.totalEditors, 0)
		assert.equal(result.totalVetoers, 0)
	}
}

describe('RuleTests', function tests() {
	new RuleTests(this)
})
