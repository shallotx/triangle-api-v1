import kvUtilityService from '../services/kv.utility.service.ts'
import kvService from '../services/kv.service.ts'

/* some testing, etc */

//const res = await kvService.loadDiscussionTypes()
//  const res = await kvService.getMeetingTypeByCode('MA')
//  console.log(res)

/* utility service for seeding, etc */

//const res = await kvUtilityService.seedDonationCodes()
// const res = await kvUtilityService.seedLinks()
// const res = await kvUtilityService.seedProducts()
// const res = await kvUtilityService.seedMeetingTypes()
// const res = await kvUtilityService.seedDiscussionTypes()
const res = await kvUtilityService.seedVirtualMeetings()

//const res = await kvUtilityService.deleteAllDonationCodes()
// const res = await kvUtilityService.deleteAllMeetingTypes()
