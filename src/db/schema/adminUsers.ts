import {
	boolean,
	integer,
	pgTable,
	serial,
	text,
	timestamp,
} from '../../deps.ts'

export const adminUsers = pgTable('admin_users', {
	id: serial('id').primaryKey(),
	firstname: text('firstname').notNull(),
	lastname: text('lastname').notNull(),
	phone: text('phone'),
	email: text('email').notNull().unique(),
	is_active: boolean('is_active').notNull(),
	is_super: boolean('is_super').notNull(),
	password: text('password').notNull(),
	salt: text('salt').notNull(),
	notes: text('notes'),
	created_at: timestamp('created_at', { precision: 6, withTimezone: true }),
	updated_at: timestamp('updated_at', { precision: 6, withTimezone: true }),
})
export type AdminUser = typeof adminUsers.$inferSelect // return type when queried
