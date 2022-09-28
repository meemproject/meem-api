/* eslint-disable no-restricted-syntax */
/* eslint-disable guard-for-in */
import { Sequelize, Model, ModelAttributes, DataTypes } from 'sequelize'
import { Fn } from 'sequelize/types/utils'

// TODO: Enhancement of strict attribute checking https://sequelize.org/master/manual/typescript.html

// eslint-disable-next-line
export abstract class BaseModel<T> extends Model {
	public static hasMany: any // (target: Model<any, any>, options?: AssociationOptionsHasOne): IncludeAssociation;

	public static belongsTo: any // (target: Model<any, any>, options?: AssociationOptionsHasOne): IncludeAssociation;

	public static belongsToMany: any // (target: Model<any, any>, options?: AssociationOptionsHasOne): IncludeAssociation;

	public static readonly indexes: {
		fields: (string | Fn)[]
		name?: string
		type?: string
		unique?: boolean
	}[] = []

	public static readonly scopes: Record<string, any> = {}

	public static readonly timestamps: boolean = true

	public static readonly paranoid: boolean = true

	public static readonly attributes: ModelAttributes = {
		id: {
			type: DataTypes.UUID,
			defaultValue: DataTypes.UUIDV4,
			primaryKey: true
		}
	}

	/** Available as long as timestamps=true */
	public readonly createdAt!: Date

	/** Available as long as timestamps=true */
	public readonly updatedAt!: Date

	/** Available as long as paranoid=true */
	public readonly deletedAt!: Date | null

	public static initialize(
		sequelize: Sequelize,
		/**
		 * Optionally override sequelize init options
		 *
		 * Note that "timestamps", "paranoid", and "indexes" can be defined as static readonly members of the model.
		 *
		 * For additional configuration options see: https://sequelize.org/master/manual/models-definition.html#configuration
		 * */
		overrideOptions?: Record<string, any>
	): void {
		const finalOptions = {
			timestamps: this.timestamps,
			paranoid: this.paranoid,
			indexes: this.indexes,
			hooks: this.hooks,
			sequelize,
			...overrideOptions
		}

		// @ts-ignore
		return this.init(this.attributes, finalOptions)
	}

	public static get hooks(): Record<string, any> {
		return {}
	}
}
