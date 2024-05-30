import {
	boolean,
	integer,
	pgTable,
	serial,
	text,
	timestamp,
} from 'drizzle-orm/pg-core'

export const membersOther = pgTable('members_other', {
	id: serial('id').primaryKey(),
	firstname: text('firstname'),
	lastname: text('lastname'),
	phone: text('phone'),
	/*
	Mar 20, no longer require email
	 */
	//email: text('email').notNull().unique(),
	email: text('email'),
	is_volunteer: boolean('is_volunteer').notNull(),
	membership_is_active: boolean('membership_is_active').notNull(),
	address_id: integer('address_id'),
	notes: text('notes'),
	created_at: timestamp('created_at', { precision: 6, withTimezone: true }),
	updated_at: timestamp('updated_at', { precision: 6, withTimezone: true }),
})

export type MemberOther = typeof membersOther.$inferSelect // return type when queried

export const membersOtherTrans = pgTable('members_other_status_trans', {
	id: serial('id').primaryKey(),
	members_other_id: integer('members_other_id').notNull().references(() =>
		membersOther.id
	),
	updated_by_id: integer('updated_by_id').notNull(),
	update_status_to: boolean('update_status_to').notNull(),
	update_reason: text('update_reason').notNull(),
	created_at: timestamp('created_at', { precision: 6, withTimezone: true }),
})

export type MembersOtherTrans = typeof membersOtherTrans.$inferSelect
