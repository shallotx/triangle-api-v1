import {
	boolean,
	integer,
	pgTable,
	serial,
	text,
	timestamp,
} from '../../deps.ts'

export const members = pgTable('members', {
	id: serial('id').primaryKey(),
	firstname: text('firstname'),
	lastname: text('lastname'),
	phone: text('phone'),
	email: text('email').notNull().unique(),
	is_volunteer: boolean('is_volunteer').notNull(),
	membership_is_active: boolean('membership_is_active').notNull(),
	password: text('password').notNull(),
	stripe_cust_id: text('stripe_cust_id'),
	notes: text('notes'),
	salt: text('salt'),
	created_at: timestamp('created_at', { precision: 6, withTimezone: true }),
	updated_at: timestamp('updated_at', { precision: 6, withTimezone: true }),
})

export type Member = typeof members.$inferSelect // return type when queried
