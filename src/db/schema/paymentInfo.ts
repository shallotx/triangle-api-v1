import {
	boolean,
	integer,
	pgTable,
	serial,
	text,
	timestamp,
} from '../../deps.ts'
import { membersOther } from './membersOther.ts'

export const paymentInfo = pgTable('payment_info', {
	id: serial('id').primaryKey(),
	payment_method: text('payment_method').notNull(),
	next_due_text: text('next_due_text'),
	note: text('note'),
	members_other_id: integer('members_other_id').references(() =>
		membersOther.id
	),
	created_at: timestamp('created_at', { precision: 6, withTimezone: true }),
	updated_at: timestamp('updated_at', { precision: 6, withTimezone: true }),
})
