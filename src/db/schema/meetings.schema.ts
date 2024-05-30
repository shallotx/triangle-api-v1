import {
	boolean,
	integer,
	pgTable,
	serial,
	text,
	timestamp,
} from 'drizzle-orm/pg-core'

export const meeting_type = pgTable('meeting_type', {
	id: serial('id').primaryKey(),
	code: text('code'),
	is_active: boolean('is_active'),
	name: text('name'),
	created_at: timestamp('created_at', { precision: 6, withTimezone: true }),
	updated_at: timestamp('updated_at', { precision: 6, withTimezone: true }),
})
export const discussion_type = pgTable('discussion_type', {
	id: serial('id').primaryKey(),
	code: text('code'),
	is_active: boolean('is_active'),
	name: text('name'),
	created_at: timestamp('created_at', { precision: 6, withTimezone: true }),
	updated_at: timestamp('updated_at', { precision: 6, withTimezone: true }),
})

export const meetings = pgTable('meetings', {
	id: serial('id').primaryKey(),
	day: text('day').notNull(),
	name: text('name'),
	room: text('room'),
	is_active: boolean('is_active'),
	meeting_time: text('meeting_time'),
	discuss_type: integer('discuss_type').references(() => discussion_type.id),
	donation_code: text('donation_code'),
	sortorder: integer('sortorder'),
	meeting_type: integer('meeting_type').references(() => meeting_type.id),
	created_at: timestamp('created_at', { precision: 6, withTimezone: true }),
	updated_at: timestamp('updated_at', { precision: 6, withTimezone: true }),
})

export const virtual_meetings = pgTable('virtual_meetings', {
	id: serial('id').primaryKey(),
	name: text('name'),
	note: text('note'),
	href: text('href'),
	is_active: boolean('is_active'),
	meeting_time: text('meeting_time'),
	created_at: timestamp('created_at', { precision: 6, withTimezone: true }),
	updated_at: timestamp('updated_at', { precision: 6, withTimezone: true }),
})
