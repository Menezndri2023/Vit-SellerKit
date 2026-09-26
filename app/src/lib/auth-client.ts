import { createAuthClient } from 'better-auth/react';
import { adminClient, inferAdditionalFields } from 'better-auth/client/plugins';

export const authClient = createAuthClient({
  plugins: [
    adminClient(),
    inferAdditionalFields({
      user: { uiLocale: { type: 'string', required: false }, timeZone: { type: 'string', required: false } },
    }),
  ],
});
