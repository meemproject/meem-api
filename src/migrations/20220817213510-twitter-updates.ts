/* eslint-disable no-await-in-loop */
import { QueryInterface, Sequelize } from 'sequelize'
import { tryPromise } from './lib/utils'

export default {
	up: async (queryInterface: QueryInterface, _sequelize: Sequelize) => {
		await tryPromise(queryInterface.removeColumn('Twitters', 'isDefault'))
	},

	down: async (_queryInterface: QueryInterface, _sequelize: Sequelize) => {}
}
