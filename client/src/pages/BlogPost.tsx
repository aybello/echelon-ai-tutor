import { Link, useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import SiteNav from "@/components/SiteNav";
import { usePageMeta } from "@/hooks/usePageMeta";

function formatDate(d: Date | string) {
  return new Date(d).toLocaleDateString("en-CA", { year: "numeric", month: "long", day: "numeric" });
}

function TagBadge({ tag }: { tag: string }) {
  return (
    <span className="inline-block bg-blue-50 text-blue-700 text-xs font-medium px-2 py-0.5 rounded-full border border-blue-100">
      {tag.trim()}
    </span>
  );
}

export default function BlogPost() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug ?? "";

  const { data: post, isLoading } = trpc.blog.getPostBySlug.useQuery(
    { slug },
    { enabled: !!slug }
  );
  const { data: related } = trpc.blog.getRelatedPosts.useQuery(
    { slug, limit: 3 },
    { enabled: !!slug }
  );

  usePageMeta({
    title: post?.metaTitle ?? (post ? `${post.title} | Echelon Institute` : "Blog | Echelon Institute"),
    description: post?.metaDescription ?? post?.excerpt ?? "Ontario water and wastewater operator certification study guides.",
    keywords: post?.tags ?? "Ontario water operator exam, OIT certification, wastewater operator",
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <SiteNav currentPath={`/blog/${slug}`} />
        <div className="max-w-3xl mx-auto px-4 py-12 animate-pulse">
          <div className="h-4 bg-slate-200 rounded w-1/4 mb-6" />
          <div className="h-8 bg-slate-200 rounded w-3/4 mb-4" />
          <div className="h-4 bg-slate-200 rounded w-full mb-2" />
          <div className="h-4 bg-slate-200 rounded w-2/3 mb-8" />
          <div className="space-y-3">
            {[1,2,3,4,5].map(i => <div key={i} className="h-4 bg-slate-200 rounded w-full" />)}
          </div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-slate-50">
        <SiteNav currentPath={`/blog/${slug}`} />
        <div className="max-w-3xl mx-auto px-4 py-20 text-center">
          <div className="text-4xl mb-4">📄</div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Post not found</h1>
          <p className="text-slate-500 mb-6">This article may have been moved or removed.</p>
          <Link href="/blog">
            <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2 rounded-lg text-sm transition-colors">
              Back to Blog
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <SiteNav currentPath={`/blog/${slug}`} />

      {/* Article header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-4 py-10">
          <Link href="/blog">
            <span className="text-blue-600 text-sm font-medium hover:text-blue-800 cursor-pointer flex items-center gap-1 mb-5">
              ← Blog
            </span>
          </Link>

          {post.tags && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {post.tags.split(",").map(tag => <TagBadge key={tag} tag={tag} />)}
            </div>
          )}

          <h1 className="text-3xl font-bold text-slate-900 mb-4 leading-tight">
            {post.title}
          </h1>

          <p className="text-slate-600 text-lg leading-relaxed mb-6">
            {post.excerpt}
          </p>

          <div className="flex items-center gap-3 text-sm text-slate-500 border-t border-slate-100 pt-4">
            <span className="font-medium text-slate-700">{post.author}</span>
            <span>·</span>
            <span>{formatDate(post.publishedAt)}</span>
            <span>·</span>
            <span>{post.readingTimeMinutes} min read</span>
          </div>
        </div>
      </div>

      {/* Article body */}
      <div className="max-w-3xl mx-auto px-4 py-10">
        <article
          className="prose prose-slate prose-lg max-w-none
            prose-headings:font-bold prose-headings:text-slate-900
            prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4
            prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3
            prose-p:text-slate-700 prose-p:leading-relaxed prose-p:mb-5
            prose-ul:text-slate-700 prose-ol:text-slate-700
            prose-li:mb-1.5
            prose-strong:text-slate-900
            prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline
            prose-blockquote:border-l-blue-400 prose-blockquote:bg-blue-50 prose-blockquote:rounded-r-lg prose-blockquote:py-1
            prose-table:text-sm prose-th:bg-slate-100 prose-th:text-slate-800
            prose-code:bg-slate-100 prose-code:text-slate-800 prose-code:rounded prose-code:px-1"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {/* CTA mid-article */}
        <div className="my-10 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 text-white">
          <p className="font-bold text-lg mb-1">Practice what you just learned</p>
          <p className="text-blue-100 text-sm mb-4">Echelon has 15,000+ questions across every Ontario certification level. First 15 questions are always free.</p>
          <Link href="/quiz">
            <button className="bg-white text-blue-700 font-semibold px-5 py-2 rounded-lg text-sm hover:bg-blue-50 transition-colors">
              Start Free Practice
            </button>
          </Link>
        </div>

        {/* Related posts */}
        {related && related.length > 0 && (
          <div className="mt-10">
            <h2 className="text-xl font-bold text-slate-900 mb-5">More Articles</h2>
            <div className="space-y-4">
              {related.map(r => (
                <Link key={r.slug} href={`/blog/${r.slug}`}>
                  <div className="bg-white rounded-xl border border-slate-200 p-5 hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer group">
                    <div className="text-xs text-slate-500 mb-1">{formatDate(r.publishedAt)} · {r.readingTimeMinutes} min read</div>
                    <h3 className="font-semibold text-slate-900 group-hover:text-blue-700 transition-colors">{r.title}</h3>
                    <p className="text-slate-600 text-sm mt-1 line-clamp-2">{r.excerpt}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white mt-8">
        <div className="max-w-3xl mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-slate-500">
          <span>© {new Date().getFullYear()} Echelon Institute</span>
          <div className="flex gap-4">
            <Link href="/blog"><span className="hover:text-slate-700 cursor-pointer">Blog</span></Link>
            <Link href="/pricing"><span className="hover:text-slate-700 cursor-pointer">Pricing</span></Link>
            <Link href="/quiz"><span className="hover:text-slate-700 cursor-pointer">Practice</span></Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
