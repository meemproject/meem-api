import { BaseModel } from './BaseModel'

export default class ModelWithAddress<T> extends BaseModel<T> {
	public static async findByAddress<A>(address: string): Promise<A | null> {
		const result = await this.findOne({
			where: orm.sequelize.where(
				orm.sequelize.fn('lower', orm.sequelize.col('address')),
				address.toLowerCase()
			)
		})

		return result ? (result as unknown as A) : null
	}
}
