import { type JWTPayload, signJWT, validateJWT } from '@cross/jwt'
import config from '../config/default.ts'

// const key = await crypto.subtle.generateKey(
// 	{ name: 'HMAC', hash: 'SHA-512' },
// 	true,
// 	['sign', 'verify'],
// )

const key = 'mySuperSecretAtLeast32CharsLong!'

const options = {
	validateExp: true,
}

class JwtHelper {
	/**
	 * Generate JWT token
	 * @param exp Expiry
	 * @param id
	 * @returns String Returns JWT
	 */
	public static createToken(
		exp: number,
		id: number,
	): Promise<string> {
		// const now = Date.now(); // in millis
		const nowTs = Math.round(Date.now() / 1000) //in secs
		const payload = {
			iss: 'deno_rest',
			iat: nowTs,
			id,
			exp,
		}
		return signJWT(payload, key, options)
	}

	/**
	 * Validates JWT and returns JWT payload
	 * @param token
	 * @returns Promise<any>
	 */
	public static async getJwtPayload(
		token: string,
	): Promise<string | JWTPayload> {
		try {
			const res = await validateJWT(token, key, options)
			return res
		} catch (_error) {
			return 'invalid_token'
		}
	}

	public static async generateAuthToken(
		memberId: number,
		tokenType: string,
	): Promise<string> {
		const nowTs = Math.round(Date.now() / 1000) //in secs
		let accessTokenExpires = 0
		if (tokenType === 'access') {
			accessTokenExpires = nowTs + (config.jwtAccessExpiration * 1) // 3600 secs  or 1 hr

			// for testing, make this 2 minutes
			accessTokenExpires = nowTs + (120 * 1)
		} else {
			//refresh token
			accessTokenExpires = nowTs + (config.jwtRefeshExpiration * 1) // 86400 secs or 1 days
			// for testing, make this 4 minutes
			accessTokenExpires = nowTs + (240 * 1)
		}
		return await JwtHelper.createToken(accessTokenExpires, memberId)
	}
}

export default JwtHelper
