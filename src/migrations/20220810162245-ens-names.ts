/* eslint-disable no-await-in-loop */
import { DataTypes, QueryInterface, Sequelize } from 'sequelize'
import { tryPromise } from './lib/utils'

export default {
	up: async (queryInterface: QueryInterface, _sequelize: Sequelize) => {
		await tryPromise(
			queryInterface.addColumn('Wallets', 'ens', {
				type: DataTypes.STRING
			})
		)
		await tryPromise(
			queryInterface.addColumn('MeemContracts', 'ens', {
				type: DataTypes.STRING
			})
		)
		await tryPromise(
			queryInterface.addColumn('Wallets', 'ensFetchedAt', {
				type: DataTypes.DATE
			})
		)
		await tryPromise(
			queryInterface.addColumn('MeemContracts', 'ensFetchedAt', {
				type: DataTypes.DATE
			})
		)
	},

	down: async (_queryInterface: QueryInterface, _sequelize: Sequelize) => {}
}
