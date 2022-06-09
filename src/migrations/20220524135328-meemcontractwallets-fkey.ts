import { DataTypes, QueryInterface, Sequelize } from 'sequelize'
import { tryPromise } from './lib/utils'

export default {
	up: async (queryInterface: QueryInterface, _sequelize: Sequelize) => {
		await tryPromise(
			queryInterface.addColumn('MeemContracts', 'DefaultPropertiesId', {
				type: DataTypes.UUID,
				allowNull: true
			})
		)
		await tryPromise(
			queryInterface.addColumn('MeemContracts', 'DefaultChildPropertiesId', {
				type: DataTypes.UUID,
				allowNull: true
			})
		)

		await tryPromise(
			queryInterface.sequelize.query(
				'ALTER TABLE "MeemContractWallets" ADD CONSTRAINT "MeemContractWallets_MeemContractId_fkey" FOREIGN KEY ("MeemContractId") REFERENCES "MeemContracts" (id) MATCH SIMPLE ON UPDATE CASCADE ON DELETE SET NULL;'
			)
		)

		await tryPromise(
			queryInterface.sequelize.query(
				'ALTER TABLE "MeemContractWallets" ADD CONSTRAINT "MeemContractWallets_WalletId_fkey" FOREIGN KEY ("WalletId") REFERENCES "Wallets" (id) MATCH SIMPLE ON UPDATE CASCADE ON DELETE SET NULL;'
			)
		)
	},

	down: async (_queryInterface: QueryInterface, _sequelize: Sequelize) => {}
}
