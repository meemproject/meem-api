import { QueryInterface, Sequelize, DataTypes } from 'sequelize'

export default {
	up: async (queryInterface: QueryInterface, _sequelize: Sequelize) => {
		await queryInterface.addColumn('Meems', 'reactionCounts', {
			type: DataTypes.JSONB,
			allowNull: false,
			defaultValue: {}
		})
	},

	down: async (_queryInterface: QueryInterface, _sequelize: Sequelize) => {}
}
