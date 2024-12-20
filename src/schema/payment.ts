import {
	/* boolean, */ integer,
	pgTable,
	serial,
	text,
	timestamp,
} from 'drizzle-orm/pg-core'

// import { sql } from 'drizzle-orm';
import { membersOther } from './membersOther.ts'

export const paymentInfo = pgTable('payment_info', {
	id: serial('id').primaryKey(),
	payment_method: text('payment_method').notNull(),
	next_due_text: text('next_due_text'),
	note: text('note'),
	members_other_id: integer('members_other_id').notNull().references(() =>
		membersOther.id
	),
	created_at: timestamp('created_at', { precision: 6, withTimezone: true }),
	updated_at: timestamp('updated_at', { precision: 6, withTimezone: true }),
})

export const payment = pgTable('payment', {
	id: serial('id').primaryKey(),
	pay_amount: integer('pay_amount'),
	last_pay_date: integer('last_pay_date'),
	note: text('note'),
	payment_info_id: integer('payment_info_id').references(() =>
		paymentInfo.id
	),
	created_at: timestamp('created_at', { precision: 6, withTimezone: true }),
	updated_at: timestamp('updated_at', { precision: 6, withTimezone: true }),
})

export type Payment = typeof payment.$inferSelect // return type when queried
