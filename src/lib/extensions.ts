import { ethers } from 'ethers'

export default [
	{
		id: '3d7cca32-3a82-4f0c-85e7-a285976f3f46',
		name: 'Discussions',
		description: 'Discuss things!',
		icon: 'integration-discussions.png',
		guideUrl: '',
		slug: 'discussion',
		storageDefinition: {
			tableland: {
				tables: [
					{
						name: 'posts',
						schema: {
							data: 'text',
							accessControlConditions: 'text',
							encryptedSymmetricKey: 'text'
						},
						permissions: {
							adminRoleContract: ethers.constants.AddressZero,
							canInsert: true,
							insertRoleContract: ethers.constants.AddressZero,
							canUpdate: false,
							updateRoleContract: ethers.constants.AddressZero,
							canDelete: false,
							deleteRoleContract: ethers.constants.AddressZero,
							updateableColumns: []
						}
					},
					{
						name: 'comments',
						schema: {
							data: 'text',
							accessControlConditions: 'text',
							encryptedSymmetricKey: 'text',
							refId: 'integer'
						},
						permissions: {
							adminRoleContract: ethers.constants.AddressZero,
							canInsert: true,
							insertRoleContract: ethers.constants.AddressZero,
							canUpdate: false,
							updateRoleContract: ethers.constants.AddressZero,
							canDelete: false,
							deleteRoleContract: ethers.constants.AddressZero,
							updateableColumns: []
						}
					},
					{
						name: 'reactions',
						schema: {
							data: 'text',
							accessControlConditions: 'text',
							encryptedSymmetricKey: 'text',
							refTable: 'text',
							refId: 'integer'
						},
						permissions: {
							adminRoleContract: ethers.constants.AddressZero,
							canInsert: true,
							insertRoleContract: ethers.constants.AddressZero,
							canUpdate: false,
							updateRoleContract: ethers.constants.AddressZero,
							canDelete: false,
							deleteRoleContract: ethers.constants.AddressZero,
							updateableColumns: []
						}
					}
				]
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
