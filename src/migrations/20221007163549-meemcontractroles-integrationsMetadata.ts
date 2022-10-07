import { QueryInterface, Sequelize, DataTypes } from 'sequelize'

export default {
	up: async (queryInterface: QueryInterface, _sequelize: Sequelize) => {
		await queryInterface.addColumn(
			'MeemContractRoles',
			'integrationsMetadata',
			{
				type: DataTypes.JSONB,
				allowNull: false,
				defaultValue: []
			}
		)
	},

	down: async (queryInterface: QueryInterface, _sequelize: Sequelize) => {
		await queryInterface.removeColumn(
			'MeemContractRoles',
			'integrationsMetadata'
		)
	}
}
