export enum RuleIo {
	Discord = 'discord',
	Slack = 'slack',
	Webhook = 'webhook',
	Twitter = 'twitter'
}

export enum PublishType {
	Proposal = 'proposal',
	PublishImmediately = 'publishImmediately',
	PublishAfterApproval = 'publishAfterApproval',
	PublishImmediatelyOrEditorApproval = 'publishImmediatelyOrEditorApproval'
}

export enum EmojiType {
	Unified = 'unified',
	Discord = 'discord',
	Slack = 'slack'
}

export interface IEmoji {
	id: string
	name: string
	type: EmojiType
	unified?: string
	url?: string
}

export interface IRule {
	publishType: PublishType
	proposerRoles: string[]
	proposerEmojis: IEmoji[]
	approverRoles: string[]
	approverEmojis: IEmoji[]
	vetoerRoles: string[]
	vetoerEmojis: IEmoji[]
	editorRoles?: string[]
	editorEmojis?: IEmoji[]
	proposalChannels: string[]
	proposalShareChannel: string
	canVeto: boolean
	votes: number
	vetoVotes: number
	editorVotes?: number
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

export interface IWebhookAttachment {
	url?: string | null
	width?: number | null
	height?: number | null
	mimeType?: string | null
	description?: string | null
	name?: string | null
	createdAt?: number | null
}

export interface IWebhookReaction {
	name: string
	emoji?: string | null
	unicode?: string | null
	count: number
}

export interface IWebhookBody {
	secret: string
	channelId: string
	channelName?: string
	messageId: string
	rule: Omit<IRuleToSave, 'webhookUrl' | 'webhookSecret'>
	content: string
	attachments: IWebhookAttachment[]
	user?: {
		id?: string
		username?: string
		realName?: string
		isAdmin?: boolean
		isOwner?: boolean
		locale?: string
		timezone?: string
	}
	totalApprovals: number
	totalProposers: number
	totalVetoers: number
	reactions: IWebhookReaction[]
	createdTimestamp?: number
}
