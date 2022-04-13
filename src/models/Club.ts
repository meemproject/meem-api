import { DataTypes } from 'sequelize'
import { BaseModel } from '../core/BaseModel'
import type { IModels } from '../types/models'

export default class Club extends BaseModel<Club> {
	public static readonly modelName = 'Club'

	public static get indexes() {
		return [
			{
				name: 'Club_tokenId',
				fields: ['tokenId']
			},
			{
				name: 'Club_displayName',
				fields: ['displayName']
			}
		]
	}

	public static readonly attributes = {
		id: {
			type: DataTypes.UUID,
			defaultValue: DataTypes.UUIDV4,
			primaryKey: true
		},
		tokenId: {
			type: DataTypes.STRING,
			allowNull: false
		},
		tokenName: {
			type: DataTypes.STRING,
			allowNull: false
		},
		displayName: {
			type: DataTypes.STRING,
			allowNull: false
		},
		description: {
			type: DataTypes.STRING,
			allowNull: false
		}
	}

	public id!: string

	public tokenId!: string

	public tokenName!: string

	public displayName!: string

	public description!: string

	public static associate(models: IModels) {}
}
