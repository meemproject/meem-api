import { QueryInterface, Sequelize, DataTypes } from 'sequelize'

export default {
	up: async (queryInterface: QueryInterface, _sequelize: Sequelize) => {
		await queryInterface.addColumn('Twitters', 'isDefault', {
			type: DataTypes.BOOLEAN,
			allowNull: false,
			defaultValue: false
		})
		await queryInterface.addColumn('Wallets', 'isDefault', {
			type: DataTypes.BOOLEAN,
			allowNull: false,
			defaultValue: false
		})
	},

	down: async (queryInterface: QueryInterface, _sequelize: Sequelize) => {
		await queryInterface.removeColumn('Twitters', 'isDefault')
		await queryInterface.removeColumn('Wallets', 'isDefault')
	}
}
