import { DataTypes, QueryInterface } from 'sequelize'
import { tryPromise } from './lib/utils'
export default {
	up: async (queryInterface: QueryInterface) => {
		await tryPromise(
			queryInterface.dropTable('MeemIdentityIntegrations', {
				cascade: true
			})
		)
		await tryPromise(
			queryInterface.dropTable('MeemIdentityWallets', {
				cascade: true
			})
		)

		await tryPromise(queryInterface.renameTable('MeemIdentities', 'Users', {}))

		await tryPromise(
			queryInterface.addColumn('Wallets', 'UserId', {
				type: DataTypes.UUID,
				allowNull: true
			})
		)

		await tryPromise(
			queryInterface.addColumn('IdentityIntegrations', 'connectionName', {
				type: DataTypes.STRING,
				allowNull: false,
				defaultValue: ''
			})
		)

		await tryPromise(
			queryInterface.sequelize.query(
				'ALTER TABLE "Wallets" ADD CONSTRAINT "Wallets_UserId_fkey" FOREIGN KEY ("UserId") REFERENCES "Users" (id) MATCH SIMPLE ON UPDATE CASCADE ON DELETE SET NULL;'
			)
		)
	},

	down: async (_queryInterface: QueryInterface) => {}
}
