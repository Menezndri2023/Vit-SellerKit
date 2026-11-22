/**
 * Admin accounts: two-factor authentication is mandatory, and Better Auth only asks the second
 * factor on email/password sign-in — so social sign-in (Google) is refused for admins.
 */
export const blocksSocialSignIn = (role: string | null | undefined, path: string | null | undefined) =>
  role === 'admin' && Boolean(path?.startsWith('/callback'));

/** Admin area: allowed only once two-factor authentication is on. */
export const adminNeedsTwoFactor = (user: { role?: string | null; twoFactorEnabled?: boolean | null }) => user.role === 'admin' && !user.twoFactorEnabled;
