import {
	AnyPgColumn,
	boolean,
	integer,
	pgTable,
	serial,
	text,
	timestamp,
	uniqueIndex,
} from 'drizzle-orm/pg-core'

import { SQL, sql } from 'drizzle-orm'

export const members = pgTable(
	'members',
	{
		id: serial('id').primaryKey(),
		firstname: text('firstname').notNull(),
		lastname: text('lastname').notNull(),
		phone: text('phone'),
		email: text('email').notNull(),
		is_volunteer: boolean('is_volunteer').notNull(),
		membership_is_active: boolean('membership_is_active').notNull(),
		password: text('password').notNull(),
		salt: text('salt'),
		stripe_cust_id: text('stripe_cust_id'),
		notes: text('notes'),
		created_at: timestamp('created_at', {
			precision: 6,
			withTimezone: true,
		}),
		updated_at: timestamp('updated_at', {
			precision: 6,
			withTimezone: true,
		}),
	},
	(members) => ({
		codeIdx: uniqueIndex('members_idx').on(members.email),
		// codeIdx: uniqueIndex('members_idx').on(lower(members.email)),
	}),
)

export type Member = typeof members.$inferSelect // return type when queried

// custom lower function
export function lower(email: AnyPgColumn): SQL {
	return sql`lower(${email})`
}

export const passwordToken = pgTable(
	'password_token',
	{
		id: serial('id').primaryKey(),
		memberId: integer('member_id').notNull(),
		hash: text('hash').notNull(),
		salt: text('salt').notNull(),
		is_active: boolean('is_active'),
		expires: integer('expires').notNull(),
		created_at: timestamp('created_at', {
			precision: 6,
			withTimezone: true,
		}).notNull(),
	},
)

export type PasswordToken = typeof passwordToken.$inferSelect
