import { drizzle as drizzlserv } from '../deps.ts'
import { Context } from '../deps.ts'
import { drizzle } from '../deps.ts'
import { eq, sql } from '../deps.ts'
import pgSql from '../db/db.ts'
import {
	discussion_type,
	meeting_type,
	meetings,
} from '../db/schema/meetings.ts'

const getMeetings = async (c: Context) => {
	try {
		const isActive = true
		const db = drizzle(pgSql)
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
	} catch (error) {
		return c.json(
			{
				error,
			},
			400,
		)
	}
}

export default {
	getMeetings,
}
