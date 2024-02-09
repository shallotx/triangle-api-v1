import { Hono } from '../deps.ts'
import meetingsController from '../controllers/meetings.controller.ts'

const router = new Hono()

router.get('/', meetingsController.getMeetings)
router.get('/meetingtypes', meetingsController.getMeetingTypes)
router.get('/virtual', meetingsController.getVirtualMeetings)

export default router
