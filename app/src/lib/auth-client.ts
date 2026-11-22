import { createAuthClient } from 'better-auth/react';
import { adminClient, inferAdditionalFields, twoFactorClient } from 'better-auth/client/plugins';

export const authClient = createAuthClient({
  plugins: [
    adminClient(),
    twoFactorClient(),
    inferAdditionalFields({
      user: { uiLocale: { type: 'string', required: false }, timeZone: { type: 'string', required: false } },
    }),
  ],
});
