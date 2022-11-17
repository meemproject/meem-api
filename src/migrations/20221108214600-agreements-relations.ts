import { QueryInterface, Sequelize } from 'sequelize'
import { tryPromise } from './lib/utils'

export default {
	up: async (queryInterface: QueryInterface, _sequelize: Sequelize) => {
		await tryPromise(
			queryInterface.renameColumn(
				'AgreementExtensions',
				'MeemContractId',
				'AgreementId'
			)
		)
		await tryPromise(
			queryInterface.renameColumn(
				'AgreementExtensions',
				'IntegrationId',
				'ExtensionId'
			)
		)
		await tryPromise(
			queryInterface.renameColumn(
				'AgreementGuilds',
				'MeemContractId',
				'AgreementId'
			)
		)
		await tryPromise(
			queryInterface.renameColumn(
				'AgreementRolePermissions',
				'MeemContractRoleId',
				'AgreementRoleId'
			)
		)
		await tryPromise(
			queryInterface.renameColumn(
				'AgreementRoles',
				'MeemContractId',
				'AgreementId'
			)
		)
		await tryPromise(
			queryInterface.renameColumn(
				'AgreementRoles',
				'MeemContractGuildId',
				'AgreementGuildId'
			)
		)
		await tryPromise(
			queryInterface.renameColumn(
				'AgreementRoles',
				'RoleMeemContractId',
				'RoleAgreementId'
			)
		)
		await tryPromise(
			queryInterface.renameColumn(
				'AgreementWallets',
				'MeemContractId',
				'AgreementId'
			)
		)
	},

	down: async (_queryInterface: QueryInterface, _sequelize: Sequelize) => {}
}
