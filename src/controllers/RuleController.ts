import { Op } from 'sequelize'
import { Events } from '../services/Analytics'
import { IAuthenticatedRequest, IResponse } from '../types/app'
import { MeemAPI } from '../types/meem.generated'

export default class RuleController {
	public static async saveRule(
		req: IAuthenticatedRequest<MeemAPI.v1.SaveRule.IDefinition>,
		res: IResponse<MeemAPI.v1.SaveRule.IResponseBody>
	): Promise<any> {
		const { agreementId, rule } = req.body

		if (!agreementId) {
			throw new Error('MISSING_PARAMETERS')
		}

		const agreement = await orm.models.Agreement.findOne({
			where: {
				id: agreementId
			}
		})

		if (!agreement) {
			throw new Error('AGREEMENT_NOT_FOUND')
		}

		const isAdmin = await agreement.isAdmin(req.wallet.address)

		if (!isAdmin) {
			throw new Error('NOT_AUTHORIZED')
		}

		const [existingRule, io] = await Promise.all([
			rule.ruleId
				? orm.models.Rule.findOne({
						where: {
							id: rule.ruleId,
							agreementId
						}
				  })
				: Promise.resolve(null),
			services.rule.getRuleIO({ rule })
		])

		if (!io.input || !io.output || !agreement) {
			throw new Error('IO_NOT_FOUND')
		}

		// const roles = await services.discord.getRoles(discord.guildId)

		const promises: Promise<any>[] = []

		const definition = {
			publishType: rule.publishType,
			proposerRoles: rule.proposerRoles,
			proposerEmojis: rule.proposerEmojis,
			approverRoles: rule.approverRoles,
			approverEmojis: rule.approverEmojis,
			vetoerRoles: rule.vetoerRoles,
			vetoerEmojis: rule.vetoerEmojis,
			proposalChannels: rule.proposalChannels,
			proposalShareChannel: rule.proposalShareChannel,
			canVeto: rule.canVeto,
			votes: rule.votes,
			vetoVotes: rule.vetoVotes,
			proposeVotes: rule.proposeVotes,
			shouldReply: rule.shouldReply,
			isEnabled: rule.isEnabled
		}

		if (existingRule) {
			existingRule.definition = definition
			existingRule.input = rule.input
			existingRule.output = rule.output
			existingRule.inputRef = typeof io.input !== 'string' ? io.input.id : null
			existingRule.outputRef =
				typeof io.output !== 'string' ? io.output.id : null
			existingRule.webhookUrl = rule.webhookUrl
			existingRule.webhookSecret = rule.webhookSecret

			existingRule.changed('definition', true)
			const [description, abridgedDescription] = await Promise.all([
				services.rule.getRuleText({ rule: existingRule }),
				services.rule.getAbridgedRuleText({ rule: existingRule })
			])

			existingRule.abridgedDescription = abridgedDescription
			existingRule.description = description
			promises.push(existingRule.save())
			promises.push(
				services.rule.sendRuleNotification({ rule: existingRule, agreement })
			)

			// for (let j = 0; j < rule.proposalChannels.length; j += 1) {
			// 	const channelId = rule.proposalChannels[j]
			// 	promises.push(
			// 		services.discord.sendMessage({
			// 			channelId,
			// 			message: {
			// 				content: existingRule.description,
			// 				components: services.discord.getMessageComponents([
			// 					{
			// 						slug: agreement?.slug,
			// 						ctaText: 'Manage Rules'
			// 					}
			// 				])
			// 			}
			// 		})
			// 	)
			// }
		} else {
			const newRule = orm.models.Rule.build({
				agreementId,
				definition,
				input: rule.input,
				output: rule.output,
				inputRef: typeof io.input !== 'string' ? io.input.id : null,
				outputRef: typeof io.output !== 'string' ? io.output.id : null,
				webhookUrl: rule.webhookUrl,
				webhookSecret: rule.webhookSecret
			})

			const [description, abridgedDescription] = await Promise.all([
				services.rule.getRuleText({ rule: newRule }),
				services.rule.getAbridgedRuleText({ rule: newRule })
			])

			newRule.abridgedDescription = abridgedDescription
			newRule.description = description

			promises.push(newRule.save())
			promises.push(
				services.rule.sendRuleNotification({ rule: newRule, agreement })
			)
		}

		await Promise.all(promises)

		services.analytics.track([
			{
				name: Events.RulesSaved,
				agreementId,
				params: {}
			}
		])

		return res.json({
			status: 'success'
		})
	}

	public static async removeRules(
		req: IAuthenticatedRequest<MeemAPI.v1.RemoveRules.IDefinition>,
		res: IResponse<MeemAPI.v1.RemoveRules.IResponseBody>
	): Promise<any> {
		const { agreementId, ruleIds } = req.body

		if (!agreementId) {
			throw new Error('MISSING_PARAMETERS')
		}

		const agreement = await orm.models.Agreement.findOne({
			where: {
				id: agreementId
			}
		})

		if (!agreement) {
			throw new Error('AGREEMENT_NOT_FOUND')
		}

		const isAdmin = await agreement.isAdmin(req.wallet.address)

		if (!isAdmin) {
			throw new Error('NOT_AUTHORIZED')
		}

		log.debug('Removing rules', { ruleIds })

		await orm.models.Rule.destroy({
			where: {
				id: {
					[Op.in]: ruleIds
				},
				agreementId
			}
		})

		services.analytics.track([
			{
				name: Events.RulesDeleted,
				agreementId,
				params: {}
			}
		])

		return res.json({
			status: 'success'
		})
	}
}
