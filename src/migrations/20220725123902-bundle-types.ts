import { DataTypes, QueryInterface, Sequelize } from 'sequelize'

export default {
	up: async (queryInterface: QueryInterface, _sequelize: Sequelize) => {
		await queryInterface.addColumn('Bundles', 'abi', {
			type: DataTypes.JSONB,
			allowNull: false,
			defaultValue: []
		})
		await queryInterface.addColumn('Bundles', 'types', {
			type: DataTypes.TEXT,
			allowNull: false,
			defaultValue: ''
		})
	},

	down: async (_queryInterface: QueryInterface, _sequelize: Sequelize) => {}
}
