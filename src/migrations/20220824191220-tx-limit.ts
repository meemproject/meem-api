import { DataTypes, QueryInterface, Sequelize } from 'sequelize'

export default {
	up: async (queryInterface: QueryInterface, _sequelize: Sequelize) => {
		await queryInterface.addColumn('Wallets', 'dailyTXLimit', {
			type: DataTypes.INTEGER,
			allowNull: false,
			defaultValue: 5
		})
	},

	down: async (_queryInterface: QueryInterface, _sequelize: Sequelize) => {}
}
