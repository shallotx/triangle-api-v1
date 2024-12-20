import { encodeHex } from '../helpers/hex.ts'
import cryptoRandomString from 'crypto-random-string'
import type { HashResult } from '../schema/zod.ts'

class CryptoHelper {
	/**
	 * Encrypts plain string and returns hash
	 * @param str
	 * @returns Promise<string> Returns encrypted password hash & salt
	 */
	public static async hash(str: string): Promise<HashResult> {
		const salt = cryptoRandomString({ length: 10, type: 'alphanumeric' })
		const messageBuffer = new TextEncoder().encode(str + salt)
		const hashBuffer = await crypto.subtle.digest('SHA-256', messageBuffer)
		const hash = encodeHex(hashBuffer)
		const res: HashResult = { hash: hash, salt: salt }
		return res
	}

	public static async verify(
		pwd: string,
		origSalt: string,
		origHash: string,
	): Promise<boolean> {
		const messageBuffer = new TextEncoder().encode(pwd + origSalt)
		const hashBuffer = await crypto.subtle.digest('SHA-256', messageBuffer)
		const hash = encodeHex(hashBuffer)
		const res = hash === origHash
		return res
	}
}

export default CryptoHelper
