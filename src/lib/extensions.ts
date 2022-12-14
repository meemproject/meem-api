export default [
	{
		id: 'c0478003-8ae7-4b24-9517-a459ba1f35a5',
		name: 'Discussions',
		description: 'Discuss things!',
		icon: 'integration-discussions.png',
		guideUrl: '',
		slug: 'discussions',
		storageDefinition: {
			tableland: {
				tables: {
					posts: {
						data: 'text',
						accessControlConditions: 'text'
					},
					comments: {
						data: 'text',
						accessControlConditions: 'text',
						refId: 'integer'
					},
					reactions: {
						data: 'text',
						accessControlConditions: 'text',
						refId: 'integer'
					}
				}
			}
		}
	},
	{
		id: 'ddbc4b66-be57-4031-acbf-f53b40d4cd6f',
		slug: 'guild',
		name: 'Guild',
		description: 'Sync your roles with Guild.xyz',
		icon: 'integration-guild.png',
		guideUrl:
			'https://meemproject.notion.site/Guild-7c6f030bd5b4485998899d521fc3694a',
		createdAt: '2022-06-08 21:42:45.558+00',
		updatedAt: '2022-06-08 21:42:45.558+00'
	}
]
