import { crypto } from 'https://deno.land/std@0.209.0/crypto/crypto.ts'
import { encodeHex } from 'https://deno.land/std@0.207.0/encoding/hex.ts'
import { cryptoRandomString } from 'https://deno.land/x/crypto_random_string@1.0.0/mod.ts'
import { HashResult } from '../db/schema/zod.ts'

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
