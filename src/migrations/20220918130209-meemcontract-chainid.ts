import { DataTypes, QueryInterface, Sequelize } from 'sequelize'
import { tryPromise } from './lib/utils'

export default {
	up: async (queryInterface: QueryInterface, _sequelize: Sequelize) => {
		await tryPromise(
			queryInterface.addColumn('MeemContracts', 'chainId', {
				type: DataTypes.INTEGER,
				allowNull: false,
				defaultValue: 137
			})
		)
	},

	down: async (_queryInterface: QueryInterface, _sequelize: Sequelize) => {}
}
