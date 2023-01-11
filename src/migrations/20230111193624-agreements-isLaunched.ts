import { DataTypes, QueryInterface, Sequelize } from 'sequelize'
import { tryPromise } from './lib/utils'

export default {
	up: async (queryInterface: QueryInterface, _sequelize: Sequelize) => {
		await tryPromise(
			queryInterface.addColumn('Agreements', 'isLaunched', {
				type: DataTypes.BOOLEAN,
				allowNull: false,
				defaultValue: false
			})
		)
	},

	down: async (_queryInterface: QueryInterface, _sequelize: Sequelize) => {}
}
