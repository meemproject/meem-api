import { DataTypes, QueryInterface, Sequelize } from 'sequelize'
import { tryPromise } from './lib/utils'

export default {
	up: async (queryInterface: QueryInterface, _sequelize: Sequelize) => {
		await tryPromise(
			queryInterface.addColumn('Agreements', 'isOnChain', {
				type: DataTypes.BOOLEAN,
				allowNull: false,
				defaultValue: true
			})
		)
		await tryPromise(
			queryInterface.addColumn('AgreementRoles', 'isOnChain', {
				type: DataTypes.BOOLEAN,
				allowNull: false,
				defaultValue: true
			})
		)
	},

	down: async (_queryInterface: QueryInterface, _sequelize: Sequelize) => {}
}
