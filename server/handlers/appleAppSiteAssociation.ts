import { MEMBER_ROUTE_PREFIXES } from '../../config/ios-target'

// Apple team id + bundle id of the iOS app
const APP_ID = '6DK95S2F4D.com.ravennah.app'

/** Tells iOS which links on this site open in the app instead of Safari: the member area, nothing else. */
export function appleAppSiteAssociation() {
  return {
    applinks: {
      details: [{
        appIDs: [APP_ID],
        components: MEMBER_ROUTE_PREFIXES.flatMap((prefix) => [{ '/': prefix }, { '/': `${prefix}/*` }]),
      }],
    },
  }
}

export default defineEventHandler(() => appleAppSiteAssociation())
