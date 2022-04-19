import { QueryInterface, Sequelize, DataTypes } from 'sequelize'

export default {
	up: async (queryInterface: QueryInterface, _sequelize: Sequelize) => {
		await queryInterface.addColumn('Twitters', 'ClubId', {
			type: DataTypes.STRING
		})
	},

	down: async (queryInterface: QueryInterface, _sequelize: Sequelize) => {
		await queryInterface.removeColumn('Twitters', 'ClubId')
	}
}
