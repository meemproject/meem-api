/* eslint-disable no-await-in-loop */
import { QueryInterface, Sequelize } from 'sequelize'

export default {
	up: async (queryInterface: QueryInterface, _sequelize: Sequelize) => {
		await queryInterface.removeColumn('MeemContracts', 'splitsLockedBy')
	},

	down: async (_queryInterface: QueryInterface, _sequelize: Sequelize) => {}
}
