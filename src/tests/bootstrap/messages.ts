import { Message } from 'discord.js'

export const discordMessageSingleUser = () => {
	const users: {
		[key: string]: {
			id: string
			username: string
			tag: string
			roles: {
				cache: {
					guild: string
					icon: string | null
					unicodeEmoji: string | null
					id: string
					name: string
					color: number
					hoist: boolean
					rawPosition: number
					permissions: string
					managed: boolean
					mentionable: boolean
					tags: Record<string, any>
					createdTimestamp: number
				}[]
			}
		}
	} = {
		'775600967169212416': {
			id: '775600967169212416',
			username: 'kencodes.eth',
			tag: 'kencodes.eth#0013',
			roles: {
				cache: [
					{
						guild: '1064925445562302625',
						icon: null,
						unicodeEmoji: null,
						id: '1067583729670815866',
						name: 'Test Role One',
						color: 0,
						hoist: false,
						rawPosition: 2,
						permissions: '1071698660929',
						managed: false,
						mentionable: false,
						tags: {},
						createdTimestamp: 1674602195900
					},
					{
						guild: '1064925445562302625',
						icon: null,
						unicodeEmoji: null,
						id: '1064925445562302625',
						name: '@everyone',
						color: 0,
						hoist: false,
						rawPosition: 0,
						permissions: '137411140505153',
						managed: false,
						mentionable: false,
						tags: {},
						createdTimestamp: 1673968411580
					}
				]
			}
		}
	}

	const reactions = [
		{
			emoji: {
				name: '👍'
			},
			users: {
				cache: {
					get: (id: string) => {
						return users[id]
					},
					forEach: (cb: any) => Object.values(users).forEach(cb)
				}
			}
		}
	]

	return {
		channelId: '1064925446308900867',
		guildId: '1064925445562302625',
		id: '1096432585325948992',
		createdTimestamp: 1681480299074,
		type: 0,
		system: false,
		content: 'blah blah blah',
		authorId: '775600967169212416',
		pinned: false,
		tts: false,
		nonce: '1096432584298070016',
		embeds: [],
		components: [],
		attachments: [],
		stickers: [],
		position: null,
		roleSubscriptionData: null,
		editedTimestamp: null,
		mentions: {
			everyone: false,
			users: [],
			roles: [],
			crosspostedChannels: [],
			repliedUser: null,
			members: [],
			channels: []
		},
		webhookId: null,
		groupActivityApplicationId: null,
		applicationId: null,
		activity: null,
		flags: 0,
		reference: null,
		interaction: null,
		cleanContent: 'blah blah blah',
		reactions: {
			cache: {
				size: 1,
				at: (i: number) => {
					return reactions[i]
				}
			}
		},
		users: {
			cache: {
				size: 1,
				forEach: () => Object.values(users).forEach,
				get: (id: string) => {
					return users[id]
				}
			}
		},
		guild: {
			members: {
				cache: {
					size: 1,
					get: (id: string) => {
						return users[id]
					}
				}
			}
		}
	} as unknown as Message<boolean>
}
export const discordMessageUserAndEditor = () => {
	const users: {
		[key: string]: {
			id: string
			username: string
			tag: string
			roles: {
				cache: {
					guild: string
					icon: string | null
					unicodeEmoji: string | null
					id: string
					name: string
					color: number
					hoist: boolean
					rawPosition: number
					permissions: string
					managed: boolean
					mentionable: boolean
					tags: Record<string, any>
					createdTimestamp: number
				}[]
			}
		}
	} = {
		'775600967169212416': {
			id: '775600967169212416',
			username: 'kencodes.eth',
			tag: 'kencodes.eth#0013',
			roles: {
				cache: [
					{
						guild: '1064925445562302625',
						icon: null,
						unicodeEmoji: null,
						id: '1067583729670815866',
						name: 'Test Role One',
						color: 0,
						hoist: false,
						rawPosition: 2,
						permissions: '1071698660929',
						managed: false,
						mentionable: false,
						tags: {},
						createdTimestamp: 1674602195900
					},
					{
						guild: '1064925445562302625',
						icon: null,
						unicodeEmoji: null,
						id: '1064925445562302625',
						name: '@everyone',
						color: 0,
						hoist: false,
						rawPosition: 0,
						permissions: '137411140505153',
						managed: false,
						mentionable: false,
						tags: {},
						createdTimestamp: 1673968411580
					}
				]
			}
		},
		'999600967169212999': {
			id: '999600967169212999',
			username: 'kencodes.eth',
			tag: 'user#0001',
			roles: {
				cache: [
					{
						guild: '1064925445562302625',
						icon: null,
						unicodeEmoji: null,
						id: '8372967081586610675',
						name: 'Test Role Two',
						color: 0,
						hoist: false,
						rawPosition: 2,
						permissions: '1071698660929',
						managed: false,
						mentionable: false,
						tags: {},
						createdTimestamp: 1674602195900
					},
					{
						guild: '1064925445562302625',
						icon: null,
						unicodeEmoji: null,
						id: '1064925445562302625',
						name: '@everyone',
						color: 0,
						hoist: false,
						rawPosition: 0,
						permissions: '137411140505153',
						managed: false,
						mentionable: false,
						tags: {},
						createdTimestamp: 1673968411580
					}
				]
			}
		}
	}

	const reactions = [
		{
			emoji: {
				name: '👍'
			},
			users: {
				cache: {
					get: (id: string) => {
						return users[id]
					},
					forEach: (cb: any) => Object.values([users[0]]).forEach(cb)
				}
			}
		},
		{
			emoji: {
				name: '🤯'
			},
			users: {
				cache: {
					get: (id: string) => {
						return users[id]
					},
					forEach: (cb: any) => Object.values([users[1]]).forEach(cb)
				}
			}
		}
	]

	return {
		channelId: '1064925446308900867',
		guildId: '1064925445562302625',
		id: '1096432585325948992',
		createdTimestamp: 1681480299074,
		type: 0,
		system: false,
		content: 'blah blah blah',
		authorId: '775600967169212416',
		pinned: false,
		tts: false,
		nonce: '1096432584298070016',
		embeds: [],
		components: [],
		attachments: [],
		stickers: [],
		position: null,
		roleSubscriptionData: null,
		editedTimestamp: null,
		mentions: {
			everyone: false,
			users: [],
			roles: [],
			crosspostedChannels: [],
			repliedUser: null,
			members: [],
			channels: []
		},
		webhookId: null,
		groupActivityApplicationId: null,
		applicationId: null,
		activity: null,
		flags: 0,
		reference: null,
		interaction: null,
		cleanContent: 'blah blah blah',
		reactions: {
			cache: {
				size: 1,
				at: (i: number) => {
					return reactions[i]
				}
			}
		},
		users: {
			cache: {
				size: 1,
				forEach: () => Object.values(users).forEach,
				get: (id: string) => {
					return users[id]
				}
			}
		},
		guild: {
			members: {
				cache: {
					size: 1,
					get: (id: string) => {
						return users[id]
					}
				}
			}
		}
	} as unknown as Message<boolean>
}
