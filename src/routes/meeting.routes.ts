import { Context, Hono } from '@hono/hono'
import { eq } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/neon-http'
import { neon } from '@neon/serverless'
import config from '../config/default.ts'
import {
	discussion_type,
	meeting_type,
	meetings,
	virtual_meetings,
} from '../db/schema/meetings.schema.ts'

const router = new Hono()

router.get('/', async (c: Context) => {
	const sql = neon(config.dbURL)
	const db = drizzle(sql)
	const isActive = true
	const result = await db.select({
		id: meetings.id,
		day: meetings.day,
		name: meetings.name,
		room: meetings.room,
		meeting_time: meetings.meeting_time,
		donation_code: meetings.donation_code,
		sortorder: meetings.sortorder,
		meeting_type_code: meeting_type.code,
		discuss_type_code: discussion_type.code,
	})
		.from(meetings)
		.leftJoin(meeting_type, eq(meeting_type.id, meetings.meeting_type))
		.leftJoin(
			discussion_type,
			eq(discussion_type.id, meetings.discuss_type),
		)
		.where(eq(meetings.is_active, isActive))
	return c.json({
		meetings: result,
		status: 'success',
		results: result.length,
	})
})

router.get('/meetingtypes', async (c: Context) => {
	const sql = neon(config.dbURL)
	const db = drizzle(sql)
	const isActive = true
	const result = await db.select().from(meeting_type)
		.where(eq(meeting_type.is_active, isActive))
	return c.json({
		meetingTypes: result,
		status: 'success',
		results: result.length,
	})
})

router.get('/virtual', async (c: Context) => {
	const sql = neon(config.dbURL)
	const db = drizzle(sql)
	const isActive = true
	const result = await db.select().from(virtual_meetings)
		.where(eq(virtual_meetings.is_active, isActive))
	return c.json({
		virtualMeetings: result,
		status: 'success',
		results: result.length,
	})
})

export default router
