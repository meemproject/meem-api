import { QueryInterface, Sequelize, DataTypes } from 'sequelize'

export default {
	up: async (queryInterface: QueryInterface, _sequelize: Sequelize) => {
		await queryInterface.addColumn('MeemPasses', 'isAdmin', {
			type: DataTypes.BOOLEAN,
			allowNull: false,
			defaultValue: false
		})
	},

	down: async (queryInterface: QueryInterface, _sequelize: Sequelize) => {
		await queryInterface.removeColumn('MeemPasses', 'isAdmin')
	}
}
