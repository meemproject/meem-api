import { QueryInterface, Sequelize, DataTypes } from 'sequelize'

export default {
	up: async (queryInterface: QueryInterface, _sequelize: Sequelize) => {
		await queryInterface.changeColumn('Meems', 'data', {
			type: DataTypes.TEXT,
			allowNull: false,
			defaultValue: ''
		})
	},

	down: async (_queryInterface: QueryInterface, _sequelize: Sequelize) => {}
}
