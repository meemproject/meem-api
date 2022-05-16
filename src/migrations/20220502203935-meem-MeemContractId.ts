import { QueryInterface, Sequelize, DataTypes } from 'sequelize'

export default {
	up: async (queryInterface: QueryInterface, _sequelize: Sequelize) => {
		await queryInterface.addColumn('Meems', 'MeemContractId', {
			type: DataTypes.UUID,
			allowNull: true
		})
	},

	down: async (queryInterface: QueryInterface, _sequelize: Sequelize) => {
		await queryInterface.removeColumn('Meems', 'MeemContractId')
	}
}
