import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.ravennah.app',
  appName: 'Yoga Ravennah',
  // The client-only member bundle from `yarn build:ios:bundle`
  webDir: '.output-ios/public',
  plugins: {
    PushNotifications: {
      // Also show a notification that arrives while the app is open, without leaving a badge behind
      presentationOptions: ['sound', 'alert'],
    },
  },
}

export default config
