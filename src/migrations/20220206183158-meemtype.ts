import { QueryInterface, Sequelize, DataTypes } from 'sequelize'
import { MeemAPI } from '../types/meem.generated'

export default {
	up: async (queryInterface: QueryInterface, _sequelize: Sequelize) => {
		await queryInterface.addColumn('Meems', 'meemType', {
			type: DataTypes.INTEGER,
			allowNull: false,
			defaultValue: 0
		})
		await queryInterface.addColumn('Meems', 'mintedBy', {
			type: DataTypes.STRING,
			allowNull: false,
			defaultValue: MeemAPI.zeroAddress
		})
	},

	down: async (queryInterface: QueryInterface, _sequelize: Sequelize) => {
		await queryInterface.removeColumn('Meems', 'meemType')
	}
}
