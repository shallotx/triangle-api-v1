import { /* getCookie, */ setCookie } from '@hono/hono/cookie'
import type { Context } from '@hono/hono'
class UtilsHelper {
	public static parseBool = (str: string | null) => {
		if (str == null) {
			return false
		}

		if (typeof str === 'boolean') {
			if (str === true) {
				return true
			}

			return false
		}

		if (typeof str === 'string') {
			if (str == '') {
				return false
			}

			str = str.replace(/^\s+|\s+$/g, '')
			if (str.toLowerCase() == 'true' || str.toLowerCase() == 'yes') {
				return true
			}

			str = str.replace(/,/g, '.')
			str = str.replace(/^\s*\-\s*/g, '-')
		}
		return false
	}
	public static setRefreshTokenCookie = (
		c: Context,
		token: string,
		expires: Date,
	) => {
		setCookie(c, 'refreshToken', token, {
			httpOnly: true,
			// domain: 'atlantatriangleclub.org',
			path: '/',
			expires: expires,
			secure: true,
			//sameSite: 'None',
			sameSite: 'Strict',
		})
	}
}

export default UtilsHelper
