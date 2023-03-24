import crypto from 'crypto'

export default class DataService {
	/** Encrypt data using a public key */
	public static async encrypt(options: {
		data: Record<string, any>
		key: JsonWebKey

		algorithm?:
			| AlgorithmIdentifier
			| RsaHashedImportParams
			| EcKeyImportParams
			| HmacImportParams
			| AesKeyAlgorithm

		/** The algorithm params to pass to crypto.subtle.decrypt(...). Default AES-CTR length 128 */
		algorithmParams?:
			| AlgorithmIdentifier
			| RsaOaepParams
			| AesCtrParams
			| AesCbcParams
			| AesGcmParams
	}) {
		const { data, key, algorithm, algorithmParams } = options

		const cryptoKey = await crypto.subtle.importKey(
			'jwk',
			key,
			algorithm ?? { name: 'AES-CTR' },
			false,
			['encrypt']
		)

		const encrypted = await crypto.subtle.encrypt(
			algorithmParams ?? {
				name: 'AES-CTR',
				counter: new Uint8Array(16),
				length: 128
			},
			cryptoKey,
			Buffer.from(JSON.stringify(data))
		)

		return Buffer.from(encrypted).toString('base64')
	}

	/** Decrypt data using a private key */
	public static async decrypt(options: {
		/** The string to decrypt */
		strToDecrypt: string

		privateKey: JsonWebKey

		/** The algorithm used to generate the privateKey. Default AES-CTR */
		algorithm?:
			| AlgorithmIdentifier
			| RsaHashedImportParams
			| EcKeyImportParams
			| HmacImportParams
			| AesKeyAlgorithm

		/** The algorithm params to pass to crypto.subtle.decrypt(...). Default AES-CTR length 128 */
		algorithmParams?:
			| AlgorithmIdentifier
			| RsaOaepParams
			| AesCtrParams
			| AesCbcParams
			| AesGcmParams
	}) {
		const { strToDecrypt, privateKey, algorithm, algorithmParams } = options

		const cryptoKey = await crypto.subtle.importKey(
			'jwk',
			privateKey,
			algorithm ?? { name: 'AES-CTR', hash: { name: 'SHA-256' } },
			false,
			['decrypt']
		)

		const decryptedString = await crypto.subtle.decrypt(
			algorithmParams ?? {
				name: 'AES-CTR',
				counter: new Uint8Array(16),
				length: 128
			},
			cryptoKey,
			Buffer.from(strToDecrypt, 'base64')
		)

		let data: Record<string, any> = {}
		if (decryptedString) {
			try {
				data = JSON.parse(Buffer.from(decryptedString).toString())
			} catch (e) {
				log.warn('Error parsing decrypted string as JSON')
				log.warn(e)
			}
		}

		return { decryptedString, data }
	}
}
