import { QueryInterface, Sequelize, DataTypes } from 'sequelize'
import { MeemAPI } from '../types/meem.generated'

export default {
	up: async (queryInterface: QueryInterface, _sequelize: Sequelize) => {
		await queryInterface.addColumn('MeemProperties', 'isTransferrable', {
			type: DataTypes.BOOLEAN,
			allowNull: false,
			defaultValue: false
		})
		await queryInterface.addColumn(
			'MeemProperties',
			'isTransferrableLockedBy',
			{
				type: DataTypes.STRING,
				allowNull: false,
				defaultValue: MeemAPI.zeroAddress
			}
		)
		await queryInterface.addColumn('MeemProperties', 'mintStartTimestamp', {
			type: DataTypes.STRING,
			allowNull: false,
			defaultValue: ''
		})
		await queryInterface.addColumn('MeemProperties', 'mintEndTimestamp', {
			type: DataTypes.STRING,
			allowNull: true
		})
		await queryInterface.addColumn('MeemProperties', 'mintDatesLockedBy', {
			type: DataTypes.STRING,
			allowNull: false,
			defaultValue: MeemAPI.zeroAddress
		})
		await queryInterface.addColumn('MeemProperties', 'transferLockupUntil', {
			type: DataTypes.STRING,
			allowNull: true
		})
		await queryInterface.addColumn(
			'MeemProperties',
			'transferLockupUntilLockedBy',
			{
				type: DataTypes.STRING,
				allowNull: false,
				defaultValue: MeemAPI.zeroAddress
			}
		)
	},

	down: async (_queryInterface: QueryInterface, _sequelize: Sequelize) => {}
}
