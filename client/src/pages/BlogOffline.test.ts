import React, { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Router, Route } from 'wouter';
import { QueryClient, QueryObserver, onlineManager } from '@tanstack/react-query';
import { afterEach, describe, expect, it, vi } from 'vitest';
const queries = vi.hoisted(() => ({ post: {} as any, related: {} as any, list: {} as any }));
vi.mock('@/components/SiteNav', () => ({ default: () => null }));
vi.mock('@/hooks/usePageMeta', () => ({ usePageMeta: () => {} }));
vi.mock('@/lib/trpc', () => ({ trpc: { blog: {
  getPostBySlug: { useQuery: () => queries.post },
  getRelatedPosts: { useQuery: () => queries.related },
  listPosts: { useQuery: () => queries.list },
} } }));
vi.mock('dompurify', () => ({ default: { sanitize: (input: string) => input } }));
import BlogPost from './BlogPost';
import Blog from './Blog';
afterEach(() => { onlineManager.setOnline(true); vi.unstubAllGlobals(); });
const fixture = { slug: 'offline-fixture', title: 'Fixture study guide', excerpt: 'Fixture excerpt', content: '<p>Fixture article body.</p>', author: 'Echelon Institute', publishedAt: new Date('2026-10-17T00:00:00Z'), readingTimeMinutes: 3 };
describe('public blog offline and retained-content regressions', () => {
  it('actual paused first fetch gives reconnect guidance, never a false not-found', () => {
    vi.stubGlobal('React', React); onlineManager.setOnline(false);
    const client = new QueryClient();
    const queryFn = vi.fn(async () => fixture);
    const observer = new QueryObserver(client, { queryKey: ['blog', 'offline-fixture'], queryFn, retry: 1 });
    const unsubscribe = observer.subscribe(() => {});
    queries.post = observer.getCurrentResult(); queries.related = { data: undefined };
    expect(queries.post.fetchStatus).toBe('paused'); expect(queries.post.isPending).toBe(true);
    expect(queries.post.isLoading).toBe(false); expect(queries.post.isError).toBe(false);
    expect(queryFn).not.toHaveBeenCalled();
    const html = renderToStaticMarkup(createElement(Router, { ssrPath: '/blog/offline-fixture', children: createElement(Route, { path: '/blog/:slug', children: createElement(BlogPost) }) }));
    expect(html).not.toContain('Post not found'); expect(html).toContain('You are offline');
    queries.list = queries.post;
    const index = renderToStaticMarkup(createElement(Router, { ssrPath: '/blog', children: createElement(Blog) }));
    expect(index).not.toContain('animate-pulse'); expect(index).not.toContain('Articles are temporarily unavailable'); expect(index).not.toContain('No matching articles');
    expect(index).not.toContain('Fixture study guide'); expect(index).toContain('Reconnect to load articles');
    unsubscribe(); client.clear();
  });
  it('cached article remains readable through refresh failure and recovery', async () => {
    vi.stubGlobal('React', React);
    const client = new QueryClient();
    const observer = new QueryObserver<typeof fixture>(client, { queryKey: ['blog', 'cached-fixture'], queryFn: async () => { throw new Error('isolated unavailable fixture'); }, retry: false, enabled: false, initialData: fixture });
    queries.post = await observer.refetch(); queries.related = {};
    expect(queries.post.isError).toBe(true); expect(queries.post.data).toEqual(fixture);
    const html = renderToStaticMarkup(createElement(Router, { ssrPath: '/blog/offline-fixture', children: createElement(Route, { path: '/blog/:slug', children: createElement(BlogPost) }) }));
    expect(html).toContain('Showing the previously loaded article'); expect(html).toContain('Fixture article body');
    observer.setOptions({ queryKey: ['blog', 'cached-fixture'], queryFn: async () => fixture, retry: false, enabled: false });
    queries.post = await observer.refetch();
    const recovered = renderToStaticMarkup(createElement(Router, { ssrPath: '/blog/offline-fixture', children: createElement(Route, { path: '/blog/:slug', children: createElement(BlogPost) }) }));
    expect(recovered).toContain('Fixture article body'); expect(recovered).not.toContain('Showing the previously loaded article');
    client.clear();
  });
  it('real cached list refetch is success/fetching, never pending; failed refresh retains articles', async () => {
    vi.stubGlobal('React', React);
    const client = new QueryClient();
    let fail!: (error: Error) => void;
    const observer = new QueryObserver(client, {
      queryKey: ['blog', 'cached-list-fixture'], initialData: [fixture], retry: false,
      queryFn: () => new Promise<typeof fixture[]>((_, reject) => { fail = reject; }),
    });
    const unsubscribe = observer.subscribe(() => {});
    queries.list = observer.getCurrentResult();
    expect(queries.list.status).toBe('success');
    expect(queries.list.fetchStatus).toBe('fetching');
    expect(queries.list.isPending).toBe(false); expect(queries.list.isLoading).toBe(false);
    const render = () => renderToStaticMarkup(createElement(Router, { ssrPath: '/blog', children: createElement(Blog) }));
    expect(render()).toContain('Fixture study guide'); expect(render()).not.toContain('animate-pulse');
    const settled = observer.refetch({ cancelRefetch: false });
    fail(new Error('isolated refresh failure'));
    queries.list = await settled;
    expect(queries.list.isError).toBe(true); expect(queries.list.data).toEqual([fixture]);
    const html = render();
    expect(html).toContain('Fixture study guide');
    expect(html).toContain('Article updates are temporarily unavailable');
    expect(html).toContain('Showing previously loaded articles');
    expect(html).not.toContain('No matching articles'); expect(html).not.toContain('animate-pulse');
    observer.setOptions({ queryKey: ['blog', 'cached-list-fixture'], enabled: false, retry: false, queryFn: async () => [fixture] });
    queries.list = await observer.refetch();
    expect(render()).toContain('Fixture study guide');
    expect(render()).not.toContain('Article updates are temporarily unavailable');
    unsubscribe(); client.clear();
  });
  it.each([false, true])('defensively avoids skeleton/list contradictions for invalid pending-data (isLoading=%s)', isLoading => {
    vi.stubGlobal('React', React);
    // This combination is not produced by QueryObserver with defined cached data.
    queries.list = { data: [fixture], isPending: true, isLoading, fetchStatus: 'fetching', isError: false };
    const html = renderToStaticMarkup(createElement(Router, { ssrPath: '/blog', children: createElement(Blog) }));
    expect(html).toContain('Fixture study guide'); expect(html).not.toContain('animate-pulse');
  });
});
