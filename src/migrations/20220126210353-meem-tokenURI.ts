import { QueryInterface, Sequelize, DataTypes } from 'sequelize'

export default {
	up: async (queryInterface: QueryInterface, _sequelize: Sequelize) => {
		await queryInterface.addColumn('Meems', 'tokenURI', {
			type: DataTypes.STRING,
			allowNull: false,
			defaultValue: ''
		})
	},

	down: async (queryInterface: QueryInterface, _sequelize: Sequelize) => {
		await queryInterface.removeColumn('Meems', 'tokenURI')
	}
}