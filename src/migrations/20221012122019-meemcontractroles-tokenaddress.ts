import { DataTypes, QueryInterface, Sequelize } from 'sequelize'
import { tryPromise } from './lib/utils'

export default {
	up: async (queryInterface: QueryInterface, _sequelize: Sequelize) => {
		await tryPromise(
			queryInterface.addColumn('MeemContractRoles', 'tokenAddress', {
				type: DataTypes.STRING,
				allowNull: true
			})
		)
	},

	down: async (_queryInterface: QueryInterface, _sequelize: Sequelize) => {}
}
