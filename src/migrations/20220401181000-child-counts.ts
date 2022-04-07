import { QueryInterface, Sequelize, DataTypes } from 'sequelize'

export default {
	up: async (queryInterface: QueryInterface, _sequelize: Sequelize) => {
		await queryInterface.addColumn('Meems', 'numRemixes', {
			type: DataTypes.INTEGER,
			allowNull: false,
			defaultValue: 0
		})
		await queryInterface.addColumn('Meems', 'numCopies', {
			type: DataTypes.INTEGER,
			allowNull: false,
			defaultValue: 0
		})
	},

	down: async (_queryInterface: QueryInterface, _sequelize: Sequelize) => {}
}
