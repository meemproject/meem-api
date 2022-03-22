import { QueryInterface, Sequelize, DataTypes } from 'sequelize'

export default {
	up: async (queryInterface: QueryInterface, _sequelize: Sequelize) => {
		await queryInterface.addColumn('Tweets', 'conversationId', {
			type: DataTypes.STRING,
			allowNull: false,
			defaultValue: ''
		})
	},

	down: async (queryInterface: QueryInterface, _sequelize: Sequelize) => {
		await queryInterface.removeColumn('Tweets', 'conversationId')
	}
}
