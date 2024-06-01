import {
	compare,
	compareSync,
	genSalt,
	genSaltSync,
	hash,
	hashSync,
} from '../deps.ts'

class HashHelper {
	/**
	 * Encrypts plain string and returns password hash
	 * @param str
	 * @returns Promise<string> Returns encrypted password hash
	 */
	// public static async encrypt(str: string): Promise<string> {
	//   const salt = await genSalt(8);
	//  return hash(str, salt);
	// }

	// may 14 trying sync because the regular has does not work on deno deploy
	public static async encrypt(str: string): Promise<string> {
		const salt = await genSaltSync(8)
		return hashSync(str, salt)
	}

	/**
	 * Compares hash
	 * @param plain
	 * @param _hash
	 * @returns Promise<boolean> Returns Boolean if provided string and hash are equal
	 */
	public static async compare(
		plain: string,
		_hash: string,
	): Promise<boolean> {
		// may 14 trying sync because the regular has does not work on deno deploy
		return await compareSync(plain, _hash)
		// return await compare(plain, _hash);
	}
}

export default HashHelper
