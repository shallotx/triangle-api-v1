import { boolean, pgTable, serial, text, timestamp } from '../../deps.ts'

export const addresses = pgTable('addresses', {
	id: serial('id').primaryKey(),
	address1: text('address1').notNull(),
	address2: text('address2'),
	city: text('city').notNull(),
	state: text('state').notNull(),
	zip: text('zip').notNull(),
	country: text('country').notNull(),
	is_active: boolean('is_active'),
	created_at: timestamp('created_at', { precision: 6, withTimezone: true }),
	updated_at: timestamp('updated_at', { precision: 6, withTimezone: true }),
})
