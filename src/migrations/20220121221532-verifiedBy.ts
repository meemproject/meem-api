import { QueryInterface, Sequelize, DataTypes } from 'sequelize'

export default {
	up: async (queryInterface: QueryInterface, _sequelize: Sequelize) => {
		await queryInterface.addColumn('Meems', 'verifiedBy', {
			type: DataTypes.STRING,
			allowNull: false,
			defaultValue: '0x0000000000000000000000000000000000000000'
		})
	},

	down: async (queryInterface: QueryInterface, _sequelize: Sequelize) => {
		await queryInterface.removeColumn('Meems', 'data')
	}
}
