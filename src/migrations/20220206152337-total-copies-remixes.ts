import { QueryInterface, Sequelize, DataTypes } from 'sequelize'

export default {
	up: async (queryInterface: QueryInterface, _sequelize: Sequelize) => {
		await queryInterface.renameColumn(
			'MeemProperties',
			'totalChildren',
			'totalRemixes'
		)
		await queryInterface.renameColumn(
			'MeemProperties',
			'totalChildrenLockedBy',
			'totalRemixesLockedBy'
		)
		await queryInterface.renameColumn(
			'MeemProperties',
			'childrenPerWallet',
			'remixesPerWallet'
		)
		await queryInterface.renameColumn(
			'MeemProperties',
			'childrenPerWalletLockedBy',
			'remixesPerWalletLockedBy'
		)

		await queryInterface.addColumn('MeemProperties', 'totalCopies', {
			type: DataTypes.STRING,
			allowNull: false,
			defaultValue: '0x00'
		})
		await queryInterface.addColumn('MeemProperties', 'copiesPerWallet', {
			type: DataTypes.STRING,
			allowNull: false,
			defaultValue: '-0x01'
		})
		await queryInterface.addColumn(
			'MeemProperties',
			'copiesPerWalletLockedBy',
			{
				type: DataTypes.STRING,
				allowNull: false,
				defaultValue: '0x0000000000000000000000000000000000000000'
			}
		)
		await queryInterface.addColumn('MeemProperties', 'totalCopiesLockedBy', {
			type: DataTypes.STRING,
			allowNull: false,
			defaultValue: '0x0000000000000000000000000000000000000000'
		})
	},

	down: async (_queryInterface: QueryInterface, _sequelize: Sequelize) => {}
}
