import { DataTypes, QueryInterface } from 'sequelize'
import { tryPromise } from './lib/utils'
export default {
	up: async (queryInterface: QueryInterface) => {
		await tryPromise(
			queryInterface.changeColumn('IdentityIntegrations', 'connectionName', {
				type: DataTypes.STRING,
				allowNull: true
			})
		)

		await tryPromise(
			queryInterface.addColumn('IdentityIntegrations', 'connectionId', {
				type: DataTypes.STRING
			})
		)

		await tryPromise(
			queryInterface.removeColumn('IdentityIntegrations', 'deletedAt')
		)
	},

	down: async (_queryInterface: QueryInterface) => {}
}
