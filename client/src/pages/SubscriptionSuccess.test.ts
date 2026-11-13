import React, { createElement, useRef } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Router } from 'wouter';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
const fixture = vi.hoisted(() => ({ result: undefined as any, error: false, meta: undefined as any }));
vi.mock('@/components/LandingNav', () => ({ default: () => null }));
vi.mock('@/hooks/usePageMeta', () => ({ usePageMeta: (meta: any) => { fixture.meta = meta; } }));
vi.mock('@/lib/trpc', () => ({ trpc: { stripe: { verifySubscriptionSession: {
  useMutation: (options: any) => {
    // Deliver a server-response fixture once during rendering; React rerenders
    // the real page with its own state setters (not a replacement view).
    const delivered = useRef(false);
    if (!delivered.current && (fixture.result || fixture.error)) {
      delivered.current = true;
      if (fixture.error) options.onError(new Error('isolated fixture'));
      else options.onSuccess(fixture.result);
    }
    return { mutate: vi.fn() };
  },
} } } }));
import SubscriptionSuccess from './SubscriptionSuccess';
const paid = { paid: true, email: '', tier: '', province: '', examTypes: [], accessToken: null, requiresSignIn: true };
const render = () => renderToStaticMarkup(createElement(Router, { ssrPath: '/subscription-success', children: createElement(SubscriptionSuccess) }));
beforeEach(() => {
  fixture.result = undefined; fixture.error = false;
  vi.stubGlobal('React', React);
  vi.stubGlobal('window', { location: { search: '?session_id=fixture&tier=class4&province=ontario' } });
  vi.stubGlobal('localStorage', { setItem: vi.fn() });
});
afterEach(() => vi.unstubAllGlobals());
describe('SubscriptionSuccess actual page presentation', () => {
  it('initial verification has no activation, benefits or study action', () => {
    const html = render();
    expect(html).toContain('Verifying your payment');
    expect(html).not.toContain('Subscription Activated');
    expect(html).not.toContain('Your subscription includes');
    expect(html).not.toContain('Start Studying');
    expect(fixture.meta.title).not.toContain('Activated');
    expect(localStorage.setItem).not.toHaveBeenCalled();
  });
  it.each(['unpaid', 'error'])('%s is truthful, without benefits or activation', kind => {
    if (kind === 'error') fixture.error = true;
    else fixture.result = { ...paid, paid: false };
    const html = render();
    expect(html).toContain('Payment not confirmed');
    expect(html).toContain('href="/login/otp"');
    expect(html).not.toContain('Subscription Activated');
    expect(html).not.toContain('Your subscription includes');
    expect(html).not.toContain('Redirecting');
    expect(localStorage.setItem).not.toHaveBeenCalled();
  });
  it('anonymous paid receipt confirms payment, not identity or a fresh term', () => {
    fixture.result = paid;
    const html = render();
    expect(html).toContain('Payment confirmed');
    expect(html).toContain('Sign in with your subscription email');
    expect(html).toContain('not a new subscription term');
    expect(html).toContain('href="/login/otp"');
    expect(html).not.toContain('Subscription Activated');
    expect(html).not.toContain('Your subscription includes');
    expect(html).not.toContain('Redirecting');
    expect(localStorage.setItem).not.toHaveBeenCalled();
  });
  it('verified access labels and continuation use the server plan, never URL hints', () => {
    fixture.result = { ...paid, email: 'fixture@example.test', tier: 'class2', province: 'western', examTypes: ['wpi-water-2'], requiresSignIn: false };
    const html = render();
    expect(html).toContain('Subscription Activated!');
    expect(html).toContain('Class 2 All-Access');
    expect(html).toContain('Western Canada (WPI)');
    expect(html).toContain('href="/wpi-class2-water"');
    expect(html).toContain('current subscription term shown in your account');
    expect(html).not.toContain('Class 4 All-Access');
    expect(localStorage.setItem).toHaveBeenCalledWith('echelon_subscription_tier', 'class2');
    expect(localStorage.setItem).toHaveBeenCalledWith('echelon_subscription_province', 'western');
  });
});
