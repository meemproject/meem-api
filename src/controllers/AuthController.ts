import crypto from 'crypto'
import { ethers } from 'ethers'
import { Request, Response } from 'express'
import { IRequest, IResponse } from '../types/app'
import { MeemAPI } from '../types/meem.generated'

export default class AuthController {
	public static async getNonce(
		req: IRequest<MeemAPI.v1.GetNonce.IDefinition>,
		res: IResponse<MeemAPI.v1.GetNonce.IResponseBody>
	): Promise<Response> {
		if (!req.query.address) {
			throw new Error('MISSING_PARAMETERS')
		}
		// Generate a nonce and save it for the wallet
		const address = (req.query.address as string).toLowerCase()

		let wallet = await orm.models.Wallet.findOne({
			where: {
				address
			}
		})

		if (!wallet) {
			wallet = orm.models.Wallet.build({
				address
			})
		}

		wallet.nonce = `I'm verifying that I am the owner of wallet: ${
			req.query.address
		}\n\nBy signing this random key:\n${crypto.randomBytes(50).toString('hex')}`
		await wallet.save()

		return res.json({
			nonce: wallet.nonce
		})
	}

	public static async login(
		req: IRequest<MeemAPI.v1.Login.IDefinition>,
		res: IResponse<MeemAPI.v1.Login.IResponseBody>
	): Promise<Response> {
		// Check twitter OR verify wallet, lookup MeemId and return JWT
		const { address, signature } = req.body

		let jwt

		if (address && signature) {
			const wallet = await orm.models.Wallet.findOne({
				where: {
					address: address?.toLowerCase()
				}
			})

			if (!wallet || !wallet.nonce) {
				throw new Error('WALLET_NOT_FOUND')
			}

			if (!wallet.MeemIdentificationId) {
				throw new Error('WALLET_MEEMID_NOT_CONNECTED')
			}

			// 0x5E4844117f7D8f0cb6Ee9E2b01B14347a4fbB426
			const signingAddress = ethers.utils.verifyMessage(wallet.nonce, signature)
			if (signingAddress.toLowerCase() !== address.toLowerCase()) {
				throw new Error('SIGNATURE_FAILED')
			}

			jwt = services.auth.generateJWT({
				meemId: wallet.MeemIdentificationId
			})
		} else {
			// TODO: Verify twitter
			throw new Error('MISSING_PARAMETERS')
		}

		return res.json({
			jwt
		})
	}

	public static async createMeemId(
		req: Request,
		res: Response
	): Promise<Response> {
		// Verify twitter and wallet, create MeemId and return JWT
		return res.json({
			config: { version: config.version }
		})
	}
}
