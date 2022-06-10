import { DataTypes, QueryInterface, Sequelize } from 'sequelize'
import { tryPromise } from './lib/utils'

export default {
	up: async (queryInterface: QueryInterface, _sequelize: Sequelize) => {
		await tryPromise(
			queryInterface.addColumn('MeemContracts', 'name', {
				type: DataTypes.TEXT,
				allowNull: false,
				defaultValue: ''
			})
		)

		await tryPromise(
			queryInterface.addColumn('MeemContracts', 'symbol', {
				type: DataTypes.TEXT,
				allowNull: false,
				defaultValue: ''
			})
		)
	},

	down: async (_queryInterface: QueryInterface, _sequelize: Sequelize) => {}
}
