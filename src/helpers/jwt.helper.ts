import { create, verify } from '../deps.ts'
import type { Header, Payload } from '../deps.ts'
import { HTTPException } from '../deps.ts'

const key = await crypto.subtle.generateKey(
	{ name: 'HMAC', hash: 'SHA-512' },
	true,
	['sign', 'verify'],
)

class JwtHelper {
	/**
	 * Generate JWT token
	 * @param exp Expiry
	 * @param id
	 * @returns String Returns JWT
	 */
	public static getToken(
		exp: number,
		id: number,
	): Promise<string> {
		const nowTs = Math.round(Date.now() / 1000) //in secs
		// const now = Date.now(); // in millis
		const header: Header = {
			alg: 'HS512',
			typ: 'JWT',
		}
		const payload: Payload = {
			iss: 'deno_rest',
			iat: nowTs,
			id,
			exp,
		}

		return create(header, payload, key)
	}

	/**
	 * Validates JWT and returns JWT payload
	 * @param token
	 * @returns Promise<Payload | Error> Returns JWT payload
	 */
	public static async getJwtPayload(
		token: string,
	): Promise<Payload | string> {
		try {
			return await verify(token, key)
		} catch (error) {
			// console.log('my error here')
			// const errorResponse = new Response('Unauthorized', {
			// 	status: 401,
			// 	headers: {
			// 		Authenticate: 'error="invalid_token"',
			// 	},
			// })
			return 'invalid_token'
			// throw new HTTPException(401, { res: errorResponse })
		}
	}
}

export default JwtHelper
