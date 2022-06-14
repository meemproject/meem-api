import { DataTypes, QueryInterface, Sequelize } from 'sequelize'

export default {
	up: async (queryInterface: QueryInterface, _sequelize: Sequelize) => {
		await queryInterface.addColumn('MeemContractIntegrations', 'isPublic', {
			type: DataTypes.BOOLEAN,
			allowNull: false,
			defaultValue: true
		})
	},

	down: async (_queryInterface: QueryInterface, _sequelize: Sequelize) => {}
}
