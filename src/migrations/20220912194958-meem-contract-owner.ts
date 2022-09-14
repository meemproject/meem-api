import { DataTypes, QueryInterface, Sequelize } from 'sequelize'
import { tryPromise } from './lib/utils'

export default {
	up: async (queryInterface: QueryInterface, _sequelize: Sequelize) => {
		await tryPromise(
			queryInterface.addColumn('MeemContracts', 'OwnerId', {
				type: DataTypes.UUID
			})
		)

		await tryPromise(
			queryInterface.addColumn('MeemContracts', 'ownerFetchedAt', {
				type: DataTypes.DATE
			})
		)

		await tryPromise(
			queryInterface.sequelize.query(
				'ALTER TABLE "MeemContracts" ADD CONSTRAINT "MeemContracts_OwnerId_fkey" FOREIGN KEY ("OwnerId") REFERENCES "Wallets" (id) MATCH SIMPLE ON UPDATE CASCADE ON DELETE SET NULL;'
			)
		)
	},

	down: async (_queryInterface: QueryInterface, _sequelize: Sequelize) => {}
}
