import {
	bigint,
	boolean,
	integer,
	pgTable,
	serial,
	text,
	timestamp,
} from '../../deps.ts'

export const userInvite = pgTable('user_invite', {
	email: text('email').notNull().unique().primaryKey(),
	token: text('token'),
	expires: bigint('expires', { mode: 'number' }).notNull(),
	user_confirmed: boolean('user_confirmed').notNull(),
	is_active: boolean('is_active').notNull(),
	created_at: timestamp('created_at', { precision: 6, withTimezone: true }),
	updated_at: timestamp('updated_at', { precision: 6, withTimezone: true }),
})
export type UserInvite = typeof userInvite.$inferSelect // return type when queried
