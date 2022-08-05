/* eslint-disable no-await-in-loop */
import { DataTypes, QueryInterface, Sequelize } from 'sequelize'
import { v4 as uuidv4 } from 'uuid'
import { tryPromise } from './lib/utils'

export default {
	up: async (queryInterface: QueryInterface, _sequelize: Sequelize) => {
		// Add owner column
		await tryPromise(
			queryInterface.addColumn('Meems', 'OwnerId', {
				type: DataTypes.UUID,
				allowNull: true
			})
		)

		await tryPromise(
			queryInterface.sequelize.query(
				'ALTER TABLE "Meems" ADD CONSTRAINT "Meems_OwnerId_fkey" FOREIGN KEY ("OwnerId") REFERENCES "Wallets" (id) MATCH SIMPLE ON UPDATE CASCADE ON DELETE SET NULL;'
			)
		)

		// Create wallets for each owner

		const result = await queryInterface.sequelize.query('SELECT * FROM "Meems"')

		for (let i = 0; i < result[0].length; i += 1) {
			const meem = result[0][i] as any
			const walletResult = (await queryInterface.sequelize.query(
				`SELECT * FROM "Wallets" where lower(address) = lower('${meem.owner}')`
			)) as any

			let walletId = uuidv4()

			if (walletResult[0].length === 0) {
				await queryInterface.sequelize.query(
					`INSERT INTO "Wallets" (id, address, "createdAt", "updatedAt", "isDefault") VALUES ('${walletId}', '${meem.owner}', now(), now(), true)`
				)
			} else if (walletResult[0].length === 1) {
				walletId = walletResult[0][0].id
			}

			await queryInterface.sequelize.query(
				`UPDATE "Meems" SET "OwnerId"='${walletId}' where id='${meem.id}'`
			)
		}

		await queryInterface.removeColumn('Meems', 'meemId')
		await queryInterface.removeColumn('Meems', 'parentChain')
		await queryInterface.removeColumn('Meems', 'parent')
		await queryInterface.removeColumn('Meems', 'parentTokenId')
		await queryInterface.removeColumn('Meems', 'rootChain')
		await queryInterface.removeColumn('Meems', 'root')
		await queryInterface.removeColumn('Meems', 'rootTokenId')
		await queryInterface.removeColumn('Meems', 'generation')
		await queryInterface.removeColumn('Meems', 'data')
		await queryInterface.removeColumn('Meems', 'uriLockedBy')
		await queryInterface.removeColumn('Meems', 'uriSource')
		await queryInterface.removeColumn('Meems', 'numRemixes')
		await queryInterface.removeColumn('Meems', 'numCopies')
		await queryInterface.removeColumn('Meems', 'reactionTypes')
		await queryInterface.removeColumn('Meems', 'reactionCounts')
		await queryInterface.removeColumn('Meems', 'owner')

		await queryInterface.renameColumn(
			'MeemContracts',
			'totalOriginalsSupply',
			'maxSupply'
		)
		await queryInterface.removeColumn(
			'MeemContracts',
			'totalOriginalsSupplyLockedBy'
		)
		await queryInterface.addColumn('MeemContracts', 'isMaxSupplyLocked', {
			type: DataTypes.BOOLEAN,
			allowNull: false,
			defaultValue: false
		})
		await queryInterface.removeColumn(
			'MeemContracts',
			'mintPermissionsLockedBy'
		)
	},

	down: async (_queryInterface: QueryInterface, _sequelize: Sequelize) => {}
}
