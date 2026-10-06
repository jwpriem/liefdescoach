import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.ravennah.app',
  appName: 'Yoga Ravennah',
  // The client-only member bundle from `yarn build:ios:bundle`
  webDir: '.output-ios/public',
}

export default config
