/* eslint-disable no-await-in-loop */
import { DataTypes, QueryInterface, Sequelize } from 'sequelize'
import { tryPromise } from './lib/utils'

export default {
	up: async (queryInterface: QueryInterface, _sequelize: Sequelize) => {
		await tryPromise(
			queryInterface.removeColumn('Wallets', 'MeemIdentificationId')
		)
		await tryPromise(queryInterface.removeColumn('Wallets', 'isDefault'))
		await tryPromise(
			queryInterface.addColumn('Wallets', 'apiKey', {
				type: DataTypes.UUID
			})
		)
		await tryPromise(queryInterface.dropTable('MeemIdentifications'))
		await tryPromise(queryInterface.dropTable('MeemPasses'))
		await tryPromise(queryInterface.dropTable('MeemProperties'))
		await tryPromise(queryInterface.dropTable('MeemVotes'))
		await tryPromise(queryInterface.dropTable('Votes'))
		await tryPromise(queryInterface.dropTable('Prompts'))
		await tryPromise(
			queryInterface.removeColumn('Clippings', 'MeemIdentificationId')
		)
		await tryPromise(
			queryInterface.removeColumn('Twitters', 'MeemIdentificationId')
		)
		await tryPromise(
			queryInterface.removeColumn('Reactions', 'MeemIdentificationId')
		)
	},

	down: async (_queryInterface: QueryInterface, _sequelize: Sequelize) => {}
}
