import { QueryInterface, Sequelize, DataTypes } from 'sequelize'

export default {
	up: async (queryInterface: QueryInterface, _sequelize: Sequelize) => {
		await queryInterface.renameColumn('Meems', 'verifiedBy', 'uriLockedBy')
		await queryInterface.addColumn('Meems', 'reactionTypes', {
			type: DataTypes.JSONB,
			allowNull: false,
			defaultValue: []
		})
		await queryInterface.addColumn('Meems', 'uriSource', {
			type: DataTypes.INTEGER,
			allowNull: false,
			defaultValue: 0
		})
	},

	down: async (_queryInterface: QueryInterface, _sequelize: Sequelize) => {}
}
