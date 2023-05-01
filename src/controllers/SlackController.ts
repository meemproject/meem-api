import { InstallProvider } from '@slack/oauth'
import { WebClient } from '@slack/web-api'
import { Request, Response } from 'express'
import { Op } from 'sequelize'
import { IAuthenticatedRequest, IResponse } from '../types/app'
import { MeemAPI } from '../types/meem.generated'

export default class SlackController {
	public static async auth(
		req: IAuthenticatedRequest<MeemAPI.v1.AuthenticateWithSlack.IDefinition>,
		res: IResponse<MeemAPI.v1.AuthenticateWithSlack.IResponseBody>
	): Promise<any> {
		const agreementId = req.query.agreementId as string
		const jwt = req.query.jwt as string
		const returnUrl = req.query.returnUrl as string

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

		const installer = new InstallProvider({
			clientId: config.SLACK_CLIENT_ID,
			clientSecret: config.SLACK_CLIENT_SECRET,
			stateSecret: config.SLACK_STATE_SECRET
		})

		const authUrl = await installer.generateInstallUrl({
			scopes: config.SLACK_SCOPES.split(','),
			redirectUri: `${config.API_URL}/api/1.0/symphony/slack/callback`,
			metadata: ''
		})

		res.cookie('agreementId', agreementId, {
			httpOnly: true
		})

		res.cookie('meemJwt', jwt, {
			httpOnly: true
		})

		res.cookie('returnUrl', returnUrl, {
			httpOnly: true
		})

		res.redirect(authUrl)
	}

	public static async callback(
		req: IAuthenticatedRequest<MeemAPI.v1.SlackAuthCallback.IDefinition>,
		res: IResponse<MeemAPI.v1.SlackAuthCallback.IResponseBody>
	): Promise<any> {
		const code = req.query.code as string

		const { agreementId, returnUrl } = req.cookies

		try {
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

			const client = new WebClient()

			const result = await client.oauth.v2.access({
				client_id: config.SLACK_CLIENT_ID,
				client_secret: config.SLACK_CLIENT_SECRET,
				code,
				redirect_uri: `${config.API_URL}/api/1.0/symphony/slack/callback`
			})

			if (!result.access_token || result.error) {
				log.crit('Unable to get access token from Slack', result.error)
				res.redirect(returnUrl)
				return
			}

			const { team } = await client.team.info({
				token: result.access_token
			})

			const encryptedData = await services.data.encrypt({
				data: {
					accessToken: result.access_token
				},
				key: config.ENCRYPTION_KEY
			})

			let slack = await orm.models.Slack.findOne({
				where: {
					teamId: team?.id
				}
			})

			if (!slack) {
				slack = orm.models.Slack.build()
			}

			slack.encryptedAccessToken = encryptedData
			slack.name = team?.name
			slack.teamId = team?.id
			slack.icon = team?.icon?.image_230
			await slack.save()

			let agreementSlack = await orm.models.AgreementSlack.findOne({
				where: {
					SlackId: slack.id,
					AgreementId: agreementId
				}
			})

			if (!agreementSlack) {
				agreementSlack = await orm.models.AgreementSlack.create({
					AgreementId: agreement.id,
					SlackId: slack.id
				})
			}
		} catch (err) {
			log.crit(err)
			throw err
		}

		res.clearCookie('agreementId')
		res.clearCookie('meemJwt')
		res.clearCookie('returnUrl')
		res.redirect(returnUrl ?? config.MEEM_DOMAIN)
	}

	public static async disconnect(
		req: IAuthenticatedRequest<MeemAPI.v1.DisconnectSlack.IDefinition>,
		res: IResponse<MeemAPI.v1.DisconnectSlack.IResponseBody>
	): Promise<any> {
		const { agreementSlackId } = req.body

		if (!agreementSlackId) {
			throw new Error('MISSING_PARAMETERS')
		}

		const agreementSlack = await orm.models.AgreementSlack.findOne({
			where: {
				id: agreementSlackId
			},
			include: [orm.models.Agreement]
		})

		if (!agreementSlack || !agreementSlack.Agreement) {
			throw new Error('SLACK_NOT_FOUND')
		}

		const isAdmin = await agreementSlack.Agreement.isAdmin(req.wallet.address)

		if (!isAdmin) {
			throw new Error('NOT_AUTHORIZED')
		}

		await agreementSlack.destroy()

		return res.json({
			status: 'success'
		})
	}

	public static async getSlackChannels(
		req: IAuthenticatedRequest<MeemAPI.v1.GetSlackChannels.IDefinition>,
		res: IResponse<MeemAPI.v1.GetSlackChannels.IResponseBody>
	): Promise<any> {
		const { agreementSlackId } = req.query

		if (!agreementSlackId) {
			throw new Error('MISSING_PARAMETERS')
		}

		const agreementSlack = await orm.models.AgreementSlack.findOne({
			where: {
				id: agreementSlackId
			},
			include: [orm.models.Slack, orm.models.Agreement]
		})

		const slack = agreementSlack?.Slack

		if (!slack || !agreementSlack.Agreement) {
			throw new Error('SLACK_NOT_FOUND')
		}

		const isAdmin = await agreementSlack.Agreement.isAdmin(req.wallet.address)

		if (!isAdmin) {
			throw new Error('NOT_AUTHORIZED')
		}

		const decrypted = await services.data.decrypt({
			strToDecrypt: slack.encryptedAccessToken,
			privateKey: config.ENCRYPTION_KEY
		})

		const client = services.slack.getClient(decrypted.data.accessToken)

		const { channels } = await client.conversations.list()

		const filteredChannels: MeemAPI.ISlackChannel[] = []

		if (channels) {
			channels.forEach(c => {
				if (
					c.is_channel &&
					!c.is_archived &&
					c.id &&
					c.name &&
					typeof c.is_member === 'boolean' &&
					typeof c.num_members === 'number'
				) {
					filteredChannels.push({
						id: c.id,
						name: c.name,
						isMember: c.is_member,
						numMembers: c.num_members
					})
				}
			})
		}

		return res.json({
			channels: filteredChannels
		})
	}

	public static async events(req: Request, res: Response): Promise<any> {
		const {
			challenge,
			token,
			type,
			team_id: teamId,
			event,
			command
			// response_url: responseUrl
		} = req.body

		log.debug({
			body: req.body,
			challenge,
			token,
			type
		})

		if (teamId) {
			if (event?.type === 'reaction_added') {
				const slack = await orm.models.Slack.findOne({
					where: {
						teamId
					},
					include: [orm.models.AgreementSlack]
				})

				if (slack && event.item?.type === 'message') {
					const rules = await orm.models.Rule.findAll({
						where: {
							input: MeemAPI.RuleIo.Slack,
							inputRef: {
								[Op.in]: slack.AgreementSlacks?.map(a => a.id)
							}
						}
					})
					const decrypted = await services.data.decrypt({
						strToDecrypt: slack.encryptedAccessToken,
						privateKey: config.ENCRYPTION_KEY
					})

					const client = services.slack.getClient(decrypted.data.accessToken)

					const history = await client.conversations.history({
						channel: event.item.channel,
						latest: event.item.ts,
						limit: 1,
						inclusive: true
					})

					if (history.messages && history.messages[0]) {
						const message = history.messages[0]
						for (let i = 0; i < rules.length; i++) {
							const rule = rules[i]
							const isHandled = await services.rule.isMessageHandled({
								agreementId: rule.AgreementId,
								messageId: message.ts
							})

							if (isHandled) {
								log.debug(
									`Message w/ id ${message.ts} has already been handled`
								)
								return
							}
							await services.rule.processRule({
								channelId: event.item.channel,
								rule,
								message: {
									...message,
									team: teamId
								}
							})
						}
					}
				}
			} else if (command) {
				switch (command) {
					case '/ruleslocal':
					case '/rulesdev':
					case '/rules': {
						const slack = await orm.models.Slack.findOne({
							where: {
								teamId
							},
							include: [orm.models.AgreementSlack]
						})
						if (!slack) {
							throw new Error('SLACK_NOT_FOUND')
						}
						const { content } = await services.slack.getRulesText({
							agreementSlackIds: slack.AgreementSlacks?.map(a => a.id) ?? []
						})

						// await request.post(responseUrl).send({
						// 	response_type: 'in_channel',
						// 	blocks: [
						// 		{
						// 			type: 'section',
						// 			text: {
						// 				type: 'mrkdwn',
						// 				text: content
						// 			}
						// 		}
						// 	]
						// })
						return res.json({
							response_type: 'in_channel',
							blocks: [
								{
									type: 'section',
									text: {
										type: 'mrkdwn',
										text: content
									}
								}
							]
						})
						break
					}

					default:
						log.warn(`No handler for command ${command}`)
				}
			}
		}

		return res.json({
			challenge
		})
	}

	public static async getEmojis(
		req: IAuthenticatedRequest<MeemAPI.v1.GetSlackEmojis.IDefinition>,
		res: IResponse<MeemAPI.v1.GetSlackEmojis.IResponseBody>
	) {
		const { agreementSlackId } = req.query
		const agreementSlack = await orm.models.AgreementSlack.findOne({
			where: {
				id: agreementSlackId
			},
			include: [orm.models.Slack, orm.models.Agreement]
		})

		if (!agreementSlack || !agreementSlack.Slack || !agreementSlack.Agreement) {
			throw new Error('SLACK_NOT_FOUND')
		}

		const isAdmin = await agreementSlack.Agreement.isAdmin(req.wallet.address)

		if (!isAdmin) {
			throw new Error('NOT_AUTHORIZED')
		}

		const emojis = await services.slack.getEmojis({
			slack: agreementSlack.Slack
		})

		return res.json({ emojis })
	}
}
