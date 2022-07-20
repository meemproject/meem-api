import { DataTypes, QueryInterface, Sequelize } from 'sequelize'

export default {
	up: async (queryInterface: QueryInterface, _sequelize: Sequelize) => {
		await queryInterface.addColumn('BundleContracts', 'functionSelectors', {
			type: DataTypes.JSONB,
			allowNull: false,
			defaultValue: []
		})
	},

	down: async (_queryInterface: QueryInterface, _sequelize: Sequelize) => {}
}
