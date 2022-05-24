import { DataTypes, QueryInterface, Sequelize } from 'sequelize'

export default {
	up: async (queryInterface: QueryInterface, _sequelize: Sequelize) => {
		await queryInterface.addColumn('MeemContracts', 'DefaultPropertiesId', {
			type: DataTypes.UUID,
			allowNull: true
		})
		await queryInterface.addColumn(
			'MeemContracts',
			'DefaultChildPropertiesId',
			{
				type: DataTypes.UUID,
				allowNull: true
			}
		)

		await queryInterface.sequelize.query(
			'ALTER TABLE "MeemContractWallets" ADD CONSTRAINT "MeemContractWallets_MeemContractId_fkey" FOREIGN KEY ("MeemContractId") REFERENCES "MeemContracts" (id) MATCH SIMPLE ON UPDATE CASCADE ON DELETE SET NULL;'
		)

		await queryInterface.sequelize.query(
			'ALTER TABLE "MeemContractWallets" ADD CONSTRAINT "MeemContractWallets_WalletId_fkey" FOREIGN KEY ("WalletId") REFERENCES "Wallets" (id) MATCH SIMPLE ON UPDATE CASCADE ON DELETE SET NULL;'
		)
	},

	down: async (_queryInterface: QueryInterface, _sequelize: Sequelize) => {}
}
