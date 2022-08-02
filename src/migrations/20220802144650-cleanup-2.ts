/* eslint-disable no-await-in-loop */
import { QueryInterface, Sequelize } from 'sequelize'

export default {
	up: async (queryInterface: QueryInterface, _sequelize: Sequelize) => {
		await queryInterface.removeColumn('Wallets', 'deletedAt')

		await queryInterface.removeColumn('Meems', 'deletedAt')
		await queryInterface.removeColumn('Meems', 'PropertiesId')
		await queryInterface.removeColumn('Meems', 'ChildPropertiesId')

		await queryInterface.removeColumn('MeemContracts', 'deletedAt')
		await queryInterface.removeColumn('MeemContracts', 'originalsPerWallet')
		await queryInterface.removeColumn(
			'MeemContracts',
			'originalsPerWalletLockedBy'
		)
		await queryInterface.removeColumn(
			'MeemContracts',
			'isTransferrableLockedBy'
		)
		await queryInterface.removeColumn('MeemContracts', 'mintStartAt')
		await queryInterface.removeColumn('MeemContracts', 'mintEndAt')
		await queryInterface.removeColumn('MeemContracts', 'mintDatesLockedBy')
		await queryInterface.removeColumn('MeemContracts', 'transferLockupUntil')
		await queryInterface.removeColumn(
			'MeemContracts',
			'transferLockupUntilLockedBy'
		)
		await queryInterface.removeColumn('MeemContracts', 'DefaultPropertiesId')
		await queryInterface.removeColumn(
			'MeemContracts',
			'DefaultChildPropertiesId'
		)
	},

	down: async (_queryInterface: QueryInterface, _sequelize: Sequelize) => {}
}
