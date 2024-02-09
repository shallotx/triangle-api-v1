import { boolean, pgTable, serial, text, timestamp } from '../../deps.ts'

export const products = pgTable('products', {
	id: serial('id').primaryKey(),
	account: text('account'),
	is_test_mode: boolean('is_test_mode').notNull(),
	name: text('name'),
	price: text('price'),
	stripe_price_id: text('stripe_price_id'),
	stripe_product_id: text('stripe_product_id'),
	product_type: text('product_type'),
	is_active: boolean('is_active'),
	created_at: timestamp('created_at', { precision: 6, withTimezone: true }),
	updated_at: timestamp('updated_at', { precision: 6, withTimezone: true }),
})
