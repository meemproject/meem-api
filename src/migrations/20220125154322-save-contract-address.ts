import { QueryInterface, Sequelize, DataTypes } from 'sequelize'

export default {
	up: async (queryInterface: QueryInterface, _sequelize: Sequelize) => {
		await queryInterface.addColumn('Meems', 'parent', {
			type: DataTypes.STRING,
			allowNull: false,
			defaultValue: ''
		})
		await queryInterface.addColumn('Meems', 'root', {
			type: DataTypes.STRING,
			allowNull: false,
			defaultValue: ''
		})
	},

	down: async (queryInterface: QueryInterface, _sequelize: Sequelize) => {
		await queryInterface.removeColumn('Meems', 'parent')
		await queryInterface.removeColumn('Meems', 'root')
	}
}
