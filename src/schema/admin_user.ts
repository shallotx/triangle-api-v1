import {
	boolean,
	pgTable,
	serial,
	text,
	timestamp,
	uniqueIndex,
} from 'drizzle-orm/pg-core'

export const admin_users = pgTable(
	'admin_users',
	{
		id: serial('id').primaryKey(),
		firstname: text('firstname').notNull(),
		lastname: text('lastname').notNull(),
		phone: text('phone'),
		email: text('email').notNull(),
		is_active: boolean('is_active').notNull(),
		is_super: boolean('is_super').notNull(),
		password: text('password').notNull(),
		salt: text('salt').notNull(),
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
	(admin_users) => ({
		adminUsersIdx: uniqueIndex('admin_users_idx').on(admin_users.email),
	}),
)
export type AdminUser = typeof admin_users.$inferSelect // return type when queried
