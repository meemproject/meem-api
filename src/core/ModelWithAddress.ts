import { BaseModel } from './BaseModel'

export default class ModelWithAddress<T> extends BaseModel<T> {
	public static async findByAddress<A>(
		address: string,
		include?: Record<string, any>
	): Promise<A | null> {
		const query: Record<string, any> = {
			where: orm.sequelize.where(
				orm.sequelize.fn('lower', orm.sequelize.col('address')),
				address.toLowerCase()
			)
		}

		if (include) {
			query.include = include
		}
		const result = await this.findOne(query)

		return result ? (result as unknown as A) : null
	}
}
