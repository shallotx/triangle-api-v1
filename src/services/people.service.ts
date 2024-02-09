import { and, eq, sql } from '../deps.ts'
import {
	Member, /* ,member_roles,MemberRole */
	members,
} from '../db/schema/members.ts'
import {
	MemberOther, /* ,member_roles,MemberRole */
	membersOther,
} from '../db/schema/membersOther.ts'
import { AdminUser, adminUsers } from '../db/schema/adminUsers.ts'
import { UserInvite, userInvite } from '../db/schema/userInvite.ts'
import { drizzle } from '../deps.ts'
import { rolesType } from '../db/schema/zod.ts'
import pgSql from '../db/db.ts'

class PeopleService {
	public static async getMemberByEmail(
		email: string,
		isActive: boolean,
	): Promise<Member | string> {
		try {
			const db = drizzle(pgSql)
			const result = await db.select().from(members)
				.where(
					and(
						eq(members.email, email),
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
			const db = drizzle(pgSql)
			const result = await db.select().from(adminUsers)
				.where(
					and(
						eq(adminUsers.email, email),
						eq(adminUsers.is_active, isActive),
					),
				)
			return result[0]
		} catch (error) {
			return error as string
		}
	}

	public static async getUserInviteByEmail(
		email: string,
		isActive: boolean,
	): Promise<UserInvite | string> {
		try {
			const db = drizzle(pgSql)
			const result = await db.select().from(userInvite)
				.where(
					and(
						eq(userInvite.email, email),
						eq(userInvite.is_active, isActive),
					),
				)
			return result[0]
		} catch (error) {
			return error as string
		}
	}

	public static async getUserInviteByToken(
		token: string,
		/* isActive: boolean, */
	): Promise<UserInvite | string> {
		try {
			const db = drizzle(pgSql)
			const result = await db.select().from(userInvite)
				.where(
					and(
						eq(userInvite.token, token),
						/* eq(userInvite.is_active, isActive), */
					),
				)
			return result[0]
		} catch (error) {
			return error as string
		}
	}

	public static async getMemberOtherByEmail(
		email: string,
		isActive: boolean,
	): Promise<MemberOther | string> {
		try {
			const db = drizzle(pgSql)
			const result = await db.select().from(membersOther)
				.where(
					and(
						eq(membersOther.email, email),
						eq(membersOther.membership_is_active, isActive),
					),
				)
			return result[0]
		} catch (error) {
			return error as string
		}
	}

	public static async getAdminUserRolesById(
		adminUserId: number,
	): Promise<rolesType[] | string> {
		try {
			const db = drizzle(pgSql)
			const res2 = await db.execute(sql`SELECT ur.user_id, r.name
                     FROM user_to_role ur INNER JOIN user_roles r on ur.roles_id = r.id 
                     where ur.user_id = ${adminUserId}`)

			const roles: rolesType[] = []
			for (const row of res2) {
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
