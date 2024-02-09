import {
	boolean,
	integer,
	pgTable,
	serial,
	text,
	timestamp,
} from '../../deps.ts'

export const membersOther = pgTable('members_other', {
	id: serial('id').primaryKey(),
	firstname: text('firstname'),
	lastname: text('lastname'),
	phone: text('phone'),
	email: text('email').notNull().unique(),
	is_volunteer: boolean('is_volunteer').notNull(),
	membership_is_active: boolean('membership_is_active').notNull(),
	address_id: integer('address_id'),
	notes: text('notes'),
	created_at: timestamp('created_at', { precision: 6, withTimezone: true }),
	updated_at: timestamp('updated_at', { precision: 6, withTimezone: true }),
})

export type MemberOther = typeof membersOther.$inferSelect // return type when queried
