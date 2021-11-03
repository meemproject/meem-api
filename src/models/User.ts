import bcrypt from 'bcrypt'
import { DataTypes } from 'sequelize'
import { BaseModel } from '../core/BaseModel'
import type { IModels } from '../types/models'

export default class User extends BaseModel<User> {
	public static readonly modelName = 'User'

	public static get indexes() {
		return [
			{
				name: 'users_email_lower',
				unique: true,
				fields: [orm.sequelize.fn('lower', orm.sequelize.col('email'))]
			}
		]
	}

	public static readonly attributes = {
		id: {
			type: DataTypes.UUID,
			defaultValue: DataTypes.UUIDV4,
			primaryKey: true
		},
		email: {
			type: DataTypes.STRING,
			allowNull: true,
			unique: true,
			validate: {
				isEmail: {
					args: true,
					msg: 'Please enter a valid email address.'
				}
			},
			get(this: User) {
				const e = this.getDataValue('email')
				if (e) {
					return e.toLowerCase()
				}
				return e
			}
		},
		username: {
			type: DataTypes.STRING,
			allowNull: false,
			comment: 'A valid user email.',
			unique: true,
			validate: {
				isEmail: {
					args: true,
					msg: 'Please enter a valid email address.'
				}
			},
			get(this: User) {
				const e = this.getDataValue('email')
				if (e) {
					return e.toLowerCase()
				}
				return e
			}
		},
		password: {
			type: DataTypes.VIRTUAL,
			comment:
				'This is a virtual attribute that is used to hash and set the actual password.',
			validate: {
				len: {
					args: [6, 50] as [number, number],
					msg: 'Password must be 6-50 characters'
				}
			},
			set(this: User, val: string) {
				if (typeof val === 'undefined' || val === null) {
					return
				}
				// hash password
				const salt = bcrypt.genSaltSync(10)
				const hash = bcrypt.hashSync(val, salt)
				this.setDataValue('password_encrypted', hash)
				this.setDataValue('password', val)
			}
		},
		password_encrypted: {
			type: DataTypes.STRING,
			allowNull: false,
			comment: 'Our encrypted user passwords.'
		}
	}

	/** The id of the user */
	public id!: string

	/** The user's email */
	public email!: string | null

	/** The username */
	public username!: string

	/** VIRTUAL */
	public name!: string

	/** VIRTUAL For setting password only */
	public password!: string

	public password_encrypted!: string

	public static associate(models: IModels) {
		this.hasMany(models.Socket)
	}
}
