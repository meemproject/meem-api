export enum RuleIo {
	Discord = 'discord',
	Slack = 'slack',
	Webhook = 'webhook',
	Twitter = 'twitter'
}

export enum PublishType {
	Proposal = 'proposal',
	PublishImmediately = 'publishImmediately'
}

export interface IRule {
	publishType: PublishType
	proposerRoles: string[]
	proposerEmojis: string[]
	approverRoles: string[]
	approverEmojis: string[]
	vetoerRoles: string[]
	vetoerEmojis: string[]
	proposalChannels: string[]
	proposalShareChannel: string
	canVeto: boolean
	votes: number
	vetoVotes: number
	proposeVotes: number
	shouldReply: boolean
	ruleId?: string
	isEnabled: boolean
}

export interface IRuleToSave extends IRule {
	input: RuleIo
	output: RuleIo
	inputRef?: string | null
	outputRef?: string | null
	webhookUrl?: string
	webhookSecret?: string
}

export interface ISavedRule
	extends Omit<
		IRule,
		| 'proposerRoles'
		| 'proposerEmojis'
		| 'approverRoles'
		| 'approverEmojis'
		| 'vetoerRoles'
		| 'vetoerEmojis'
		| 'proposalChannels'
	> {
	proposerRoles: string
	proposerEmojis: string
	approverRoles: string
	approverEmojis: string
	vetoerRoles: string
	vetoerEmojis: string
	proposalChannels: string
}

export interface IDiscordRole {
	id: string
	name: string
	managed: boolean
	color: number
	icon: string | null
}

export interface IDiscordChannel {
	id: string
	name: string
	canSend: boolean
	canView: boolean
}

export interface ISlackChannel {
	id: string
	name: string
	isMember: boolean
	numMembers: number
}

export enum MessageStatus {
	Pending = 'pending',
	Handled = 'handled'
}

export interface IWebhookBody {
	secret: string
	rule: Omit<IRuleToSave, 'webhookUrl' | 'webhookSecret'>
	content: string
}
