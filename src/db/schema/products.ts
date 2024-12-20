import { boolean, pgTable, serial, integer,text, timestamp } from 'drizzle-orm/pg-core'

export const productsSubscription = pgTable('products_subscription', {
	id: serial('id').primaryKey(),
	is_test_mode: boolean('is_test_mode').notNull(),
	name: text('name'),
	description: text('description'),
	price: text('price'),
	stripe_price_id: text('stripe_price_id'),
	stripe_product_id: text('stripe_product_id'),
	is_active: boolean('is_active'),
	created_at: timestamp('created_at', { precision: 6, withTimezone: true }),
	updated_at: timestamp('updated_at', { precision: 6, withTimezone: true }),
})

export const productsOther = pgTable('products_other', {
	id: serial('id').primaryKey(),
	is_test_mode: boolean('is_test_mode').notNull(),
	name: text('name'),
	description: text('description'),
	price: text('price'),
	product_type: text('product_type'),
	stripe_product_id: text('stripe_product_id'),
	image_file: text('image_file'),
	image_alt: text('image_alt'),
	sort_order: integer('sort_order'),
	is_active: boolean('is_active'),
	created_at: timestamp('created_at', { precision: 6, withTimezone: true }),
	updated_at: timestamp('updated_at', { precision: 6, withTimezone: true }),
})