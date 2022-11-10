import { DataTypes, QueryInterface } from 'sequelize'
import { tryPromise } from './lib/utils'
export default {
	up: async (queryInterface: QueryInterface) => {
		await tryPromise(
			queryInterface.addColumn('Wallets', 'pkpTokenId', {
				type: DataTypes.STRING
			})
		)
	},

	down: async (_queryInterface: QueryInterface) => {}
}
