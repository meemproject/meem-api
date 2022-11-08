import { QueryInterface, Sequelize } from 'sequelize'
import { tryPromise } from './lib/utils'

export default {
	up: async (queryInterface: QueryInterface, _sequelize: Sequelize) => {
		await tryPromise(queryInterface.renameTable('MeemContracts', 'Agreements'))
		await tryPromise(queryInterface.renameTable('Meems', 'Tokens'))
		await tryPromise(queryInterface.renameTable('Integrations', 'Extensions'))
		await tryPromise(
			queryInterface.renameTable(
				'MeemContractIntegrations',
				'AgreementExtensions'
			)
		)
		await tryPromise(
			queryInterface.renameTable('MeemContractRoles', 'AgreementRoles')
		)
		await tryPromise(
			queryInterface.renameTable(
				'MeemContractRolePermissions',
				'AgreementRolePermissions'
			)
		)
		await tryPromise(
			queryInterface.renameTable('MeemContractWallets', 'AgreementWallets')
		)
		await tryPromise(
			queryInterface.renameTable('MeemContractGuilds', 'AgreementGuilds')
		)
	},

	down: async (_queryInterface: QueryInterface, _sequelize: Sequelize) => {}
}
