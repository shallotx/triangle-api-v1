import { boolean, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core'

export const donation_code = pgTable('donation_code', {
	id: serial('id').primaryKey(),
	code: text('code'),
	is_active: boolean('is_active'),
	name: text('name'),
	notes: text('notes'),
	created_at: timestamp('created_at', { precision: 6, withTimezone: true }),
	updated_at: timestamp('updated_at', { precision: 6, withTimezone: true }),
})

export const links = pgTable('links', {
	id: serial('id').primaryKey(),
	link_type: text('link_type'),
	href: text('href'),
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
