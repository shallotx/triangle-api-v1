import { Hono } from '../deps.ts'
import meetingsController from '../controllers/meetings.controller.ts'
import kvService from '../services/kv.service.ts'

const router = new Hono()

router.get('/', meetingsController.getMeetings)
router.get('/meetingtypes', async (c) => {
	const dts = await kvService.getMeetingTypes()
	return c.json({
		meetingTypes: dts,
		status: 'success',
		results: dts.length,
	})
})
router.get('/virtual', async (c) => {
	const dts = await kvService.getVirtualMeetings()
	return c.json({
		virtualMeetings: dts,
		status: 'success',
		results: dts.length,
	})
})

export default router
