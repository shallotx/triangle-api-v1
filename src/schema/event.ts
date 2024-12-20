import {
	boolean,
	integer,
	pgTable,
	serial,
	text,
	timestamp,
} from 'drizzle-orm/pg-core'

export const eventsCalender = pgTable('events_calendar', {
	id: serial('id').primaryKey(),
	name: text('name'),
	note: text('note').default(''),
	eventType: text('event_type'),
	is_link: boolean('is_link'),
	pageRoute: text('page_route'),
	stripeTarget: text('stripe_target'),
	eventDateText: text('event_date_text'),
	eventDate: integer('event_date'),
	is_active: boolean('is_active'),
	created_at: timestamp('created_at', { precision: 6, withTimezone: true }),
	updated_at: timestamp('updated_at', { precision: 6, withTimezone: true }),
})
