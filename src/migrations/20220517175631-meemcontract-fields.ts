import { DataTypes, QueryInterface, Sequelize } from 'sequelize'

export default {
	up: async (queryInterface: QueryInterface, _sequelize: Sequelize) => {
		await queryInterface.renameColumn(
			'MeemProperties',
			'mintStartTimestamp',
			'mintStartAt'
		)
		await queryInterface.renameColumn(
			'MeemProperties',
			'mintEndTimestamp',
			'mintEndAt'
		)

		await queryInterface.renameColumn(
			'MeemContracts',
			'mintStartTimestamp',
			'mintStartAt'
		)

		await queryInterface.renameColumn(
			'MeemContracts',
			'mintEndTimestamp',
			'mintEndAt'
		)

		await queryInterface.changeColumn('MeemProperties', 'mintStartAt', {
			type: DataTypes.STRING,
			allowNull: true
		})

		await queryInterface.changeColumn('MeemProperties', 'mintEndAt', {
			type: DataTypes.STRING,
			allowNull: true
		})

		await queryInterface.changeColumn('MeemProperties', 'transferLockupUntil', {
			type: DataTypes.STRING,
			allowNull: true
		})

		await queryInterface.changeColumn('MeemContracts', 'mintStartAt', {
			type: DataTypes.STRING,
			allowNull: true
		})

		await queryInterface.changeColumn('MeemContracts', 'mintEndAt', {
			type: DataTypes.STRING,
			allowNull: true
		})

		await queryInterface.changeColumn('MeemContracts', 'transferLockupUntil', {
			type: DataTypes.STRING,
			allowNull: true
		})

		await queryInterface.sequelize.query(
			'UPDATE "MeemProperties" SET "mintStartAt"=null, "mintEndAt"=null, "transferLockupUntil"=null'
		)

		await queryInterface.sequelize.query(
			'UPDATE "MeemContracts" SET "mintStartAt"=null, "mintEndAt"=null, "transferLockupUntil"=null'
		)

		await queryInterface.changeColumn('MeemProperties', 'mintStartAt', {
			type: 'TIMESTAMP USING CAST("mintStartAt" as TIMESTAMP)',
			allowNull: true,
			defaultValue: Sequelize.fn('NOW')
		})

		await queryInterface.changeColumn('MeemProperties', 'mintEndAt', {
			type: 'TIMESTAMP USING CAST("mintEndAt" as TIMESTAMP)',
			allowNull: true,
			defaultValue: Sequelize.fn('NOW')
		})

		await queryInterface.changeColumn('MeemProperties', 'transferLockupUntil', {
			type: 'TIMESTAMP USING CAST("transferLockupUntil" as TIMESTAMP)',
			allowNull: true,
			defaultValue: Sequelize.fn('NOW')
		})

		await queryInterface.changeColumn('MeemContracts', 'mintStartAt', {
			type: 'TIMESTAMP USING CAST("mintStartAt" as TIMESTAMP)',
			allowNull: true,
			defaultValue: Sequelize.fn('NOW')
		})

		await queryInterface.changeColumn('MeemContracts', 'mintEndAt', {
			type: 'TIMESTAMP USING CAST("mintEndAt" as TIMESTAMP)',
			allowNull: true,
			defaultValue: Sequelize.fn('NOW')
		})

		await queryInterface.changeColumn('MeemContracts', 'transferLockupUntil', {
			type: 'TIMESTAMP USING CAST("transferLockupUntil" as TIMESTAMP)',
			allowNull: true,
			defaultValue: Sequelize.fn('NOW')
		})
	},

	down: async (_queryInterface: QueryInterface, _sequelize: Sequelize) => {}
}
