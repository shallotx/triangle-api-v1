import {
	AdminUserKV,
	Discussion_Type,
	Donation_Code,
	Links,
	Meeting_Type,
	Product,
	Virtual_Meeting,
} from '../db/schema/kv/kv.models.ts'
// import { adminUserInsert } from '../db/schema/zod.ts'
import { HTTPException } from '../deps.ts'

const kv = await Deno.openKv();
// Deno.env.set('DENO_KV_ACCESS_TOKEN', 'ddo_9mNxD8VccFoLnB4l1EKEMBXOPZKf113xUqqN')
// const kv = await Deno.openKv(
// 	'https://api.deno.com/databases/62ce7b32-d1c9-4095-91c6-6399581aef77/connect',
// )

class KVService {
	public static async getDiscussionTypes(): Promise<
		Discussion_Type[] | string
	> {
		const retVal = <Discussion_Type[]> []
		try {
			for await (const res of kv.list({ prefix: ['discussion_types'] })) {
				retVal.push(res.value as Discussion_Type)
			}
			return retVal
		} catch (error) {
			return error as string
		}
	}

	public static async getMeetingTypes(): Promise<Meeting_Type[] | string> {
		const retVal = <Meeting_Type[]> []
		try {
			for await (const res of kv.list({ prefix: ['meeting_types'] })) {
				retVal.push(res.value as Meeting_Type)
			}
			return retVal
		} catch (error) {
			return error as string
		}
	}

	public static async getMeetingTypeByCode(
		code: string,
	): Promise<Meeting_Type | null> {
		try {
			const res = await kv.get<Meeting_Type>([
				'meeting_types_by_code',
				code,
			])
			return res.value
		} catch (error) {
			return null
		}
	}

	public static async getVirtualMeetings(): Promise<
		Virtual_Meeting[] | string
	> {
		const retVal = <Virtual_Meeting[]> []
		try {
			for await (const res of kv.list({ prefix: ['virtual_meetings'] })) {
				retVal.push(res.value as Virtual_Meeting)
			}
			return retVal
		} catch (error) {
			return error as string
		}
	}

	public static async getRecoveryLinks(): Promise<Links[] | string> {
		const retVal = <Links[]> []
		try {
			for await (const res of kv.list({ prefix: ['recovery_links'] })) {
				retVal.push(res.value as Links)
			}
			return retVal
		} catch (error) {
			return error as string
		}
	}

	public static async getProducts(
		testmode: boolean,
		account: string,
	): Promise<Product[] | string> {
		const retVal = <Product[]> []
		try {
			for await (const res of kv.list({ prefix: ['products'] })) {
				retVal.push(res.value as Product)
			}

			const result = retVal.filter((p) =>
				p.is_active && p.is_test_mode === testmode &&
				p.account === account
			)
			return result
		} catch (error) {
			return error as string
		}
	}

	public static async getDonationCodes(): Promise<Donation_Code[] | string> {
		const retVal = <Donation_Code[]> []
		try {
			for await (const res of kv.list({ prefix: ['donation_codes'] })) {
				retVal.push(res.value as Donation_Code)
			}
			const result = retVal.filter((dc) => dc.is_active)
			return result
		} catch (error) {
			return error as string
		}
	}

	public static async upsertAdminUser(adminuser: AdminUserKV) {
		const adminuserKey = ['adminuser', adminuser.id]
		const adminuserByEmailKey = ['adminuser_by_email', adminuser.email]

		const oldUser = await kv.get<AdminUserKV>(adminuserKey)

		if (!oldUser.value) {
			const ok = await kv.atomic()
				.check(oldUser)
				.set(adminuserByEmailKey, adminuser.id)
				.set(adminuserKey, adminuser)
				.commit()
			if (!ok) {
				const errorResponse = new Response('An Error occurred', {
					status: 401,
				})
				new HTTPException(401, { res: errorResponse })
			}
		} else {
			const ok = await kv.atomic()
				.check(oldUser)
				.delete(['user_by_email', oldUser.value.email])
				.set(adminuserByEmailKey, adminuser.id)
				.set(adminuserKey, adminuser)
				.commit()
			if (!ok) {
				const errorResponse = new Response('An Error occurred', {
					status: 401,
				})
				new HTTPException(401, { res: errorResponse })
			}
		}
	}

	public static async getAllAdminUsers() {
		const users = []
		for await (const res of kv.list({ prefix: ['adminuser'] })) {
			users.push(res.value)
		}
		return users
	}

	public static async getAdminUserByEmail(email: string) {
		const adminuserByEmailKey = ['adminuser_by_email', email]
		const id = (await kv.get(adminuserByEmailKey)).value as string
		const adminuserKey = ['adminuser', id]
		return (await kv.get(adminuserKey)).value as AdminUserKV
	}
}

export default KVService
