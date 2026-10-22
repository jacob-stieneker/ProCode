export const firebaseSolutions: Record<string, string> = {
  'fb-setup': 'firebase login\nfirebase projects:list\nfirebase use dev',
  'fb-init': 'firebase init hosting\nfirebase init firestore',
  'fb-emulators':
    'firebase init emulators\nfirebase emulators:start --only auth,firestore --project demo-procode',
  'fb-hosting': 'firebase deploy --only hosting --project staging',
  'fb-preview': 'firebase hosting:channel:deploy review --expires 7d --project staging',
  'fb-data':
    'firebase emulators:start --only auth,firestore --project demo-procode --import ./seed --export-on-exit ./saved',
  'fb-ci': 'firebase emulators:exec --only firestore --project demo-procode "npm run test:rules"',
  'fb-rules': 'firebase deploy --only firestore --project staging',
  'fb-target':
    'firebase target:apply hosting app procode-staging-site --project staging\nfirebase deploy --only hosting:app --project staging',
};
