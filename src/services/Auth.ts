import jwt from 'jsonwebtoken'
import { v4 as uuidv4 } from 'uuid'

export default class AuthService {
	/** Execute a shell command and get back the result */
	public static generateJWT(options: {
		meemId: string
		/** Additional data to encode in the JWT. Do not store sensitive information here. */
		data?: Record<string, any>
		expiresIn?: number
	}) {
		const { meemId, expiresIn, data } = options

		let exp = config.JWT_EXPIRES_IN
		if (expiresIn && +expiresIn > 0) {
			exp = +expiresIn
		}
		const token = jwt.sign(
			{
				...data,
				meemId
			},
			config.JWT_SECRET,
			{
				algorithm: 'HS512',
				jwtid: uuidv4(),
				expiresIn: exp
			}
		)

		return token
	}
}
