import { describe, expect, it } from 'vitest';
import { adminNeedsTwoFactor, blocksSocialSignIn } from './two-factor-policy';

describe('admin two-factor policy', () => {
  it('admins need 2FA for the admin area; other users never do', () => {
    expect(adminNeedsTwoFactor({ role: 'admin', twoFactorEnabled: false })).toBe(true);
    expect(adminNeedsTwoFactor({ role: 'admin', twoFactorEnabled: true })).toBe(false);
    expect(adminNeedsTwoFactor({ role: 'user', twoFactorEnabled: false })).toBe(false);
  });
  it('Google sign-in (OAuth callback) is refused for admins only', () => {
    expect(blocksSocialSignIn('admin', '/callback/:id')).toBe(true);
    expect(blocksSocialSignIn('user', '/callback/:id')).toBe(false);
    expect(blocksSocialSignIn('admin', '/sign-in/email')).toBe(false);
    expect(blocksSocialSignIn(undefined, '/callback/:id')).toBe(false);
  });
});
