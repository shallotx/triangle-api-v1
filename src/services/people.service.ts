import { drizzle } from 'drizzle-orm/neon-http'
import { and, eq /* sql */ } from 'drizzle-orm'
import { lower, type Member, members } from '../schema/member.ts'
import { neon } from '@neon/serverless'
import config from '../config/default.ts'
// import { type MemberOther, membersOther } from '../db/schema/membersOther.ts'

import {
	admin_users,
	type AdminUser, /* userInvite, UserInvite */
} from '../schema/admin_user.ts'

import type { rolesType } from '../schema/zod.ts'

class PeopleService {
	public static async getMemberByEmail(
		email: string,
		isActive: boolean,
	): Promise<Member | string> {
		try {
			const sql = neon(config.dbURL)
			const db = drizzle({ client: sql })
			const result = await db.select().from(members)
				.where(
					and(
						// eq(members.email, email),
						eq(lower(members.email), email.toLowerCase()),
						eq(members.membership_is_active, isActive),
					),
				)
			return result[0]
		} catch (error) {
			return error as string
		}
	}

	public static async getAdminUserByEmail(
		email: string,
		isActive: boolean,
	): Promise<AdminUser | string> {
		try {
			const sql = neon(config.dbURL)
			const db = drizzle({ client: sql })
			const result = await db.select().from(admin_users)
				.where(
					and(
						// eq(admin_users.email, email),
						eq(lower(admin_users.email), email.toLowerCase()),
						eq(admin_users.is_active, isActive),
					),
				)
			return result[0]
		} catch (error) {
			return error as string
		}
	}

	// public static async getUserInviteByEmail(
	// 	email: string,
	// 	isActive: boolean,
	// ): Promise<UserInvite | string> {
	// 	try {
	// 		const db = drizzle({ client: sql })
	// 		const result = await db.select().from(userInvite)
	// 			.where(
	// 				and(
	// 					eq(userInvite.email, email),
	// 					eq(userInvite.is_active, isActive),
	// 				),
	// 			)
	// 		return result[0]
	// 	} catch (error) {
	// 		return error as string
	// 	}
	// }

	// public static async getUserInviteByToken(
	// 	token: string,
	// 	/* isActive: boolean, */
	// ): Promise<UserInvite | string> {
	// 	try {
	// 		const db = drizzle({ client: sql })
	// 		const result = await db.select().from(userInvite)
	// 			.where(
	// 				and(
	// 					eq(userInvite.token, token),
	// 					/* eq(userInvite.is_active, isActive), */
	// 				),
	// 			)
	// 		return result[0]
	// 	} catch (error) {
	// 		return error as string
	// 	}
	// }

	// public static async getMemberOtherByEmail(
	// 	email: string,
	// 	isActive: boolean,
	// ): Promise<MemberOther | string> {
	// 	try {
	// 		const db = drizzle({ client: sql })
	// 		const result = await db.select().from(membersOther)
	// 			.where(
	// 				and(
	// 					eq(membersOther.email, email),
	// 					eq(membersOther.membership_is_active, isActive),
	// 				),
	// 			)
	// 		return result[0]
	// 	} catch (error) {
	// 		return error as string
	// 	}
	// }

	public static async getAdminUserRolesById(
		adminUserId: number,
	): Promise<rolesType[] | string> {
		try {
			const sql = neon(config.dbURL)
			const result = await sql(
				`SELECT ur.user_id, r.name FROM user_to_role ur
				 INNER JOIN user_roles r on ur.roles_id = r.id WHERE ur.user_id  = ${adminUserId}`,
			)

			const roles: rolesType[] = []
			for (const row of result) {
				roles.push({
					id: row.user_id as number,
					roleName: row.name as string,
				})
			}
			return roles
		} catch (error) {
			return error as string
		}
	}
}

export default PeopleService
