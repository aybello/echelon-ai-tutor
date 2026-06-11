import { Link } from "wouter";
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

export default function Blog() {
  usePageMeta({
    title: "Blog | Echelon Institute — Ontario Water & Wastewater Operator Exam Prep",
    description: "Study guides, exam tips, and certification advice for Ontario water and wastewater operators. OIT, Class 1-4, WQA, and EOCP certification content.",
    keywords: "Ontario water operator exam, OIT certification, Class 1 water treatment, EOCP, wastewater operator certification, water treatment study guide",
  });

  const { data: posts, isLoading } = trpc.blog.listPosts.useQuery();

  return (
    <div className="min-h-screen bg-slate-50">
      <SiteNav currentPath="/blog" />

      {/* Hero */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="flex items-center gap-2 text-blue-600 text-sm font-medium mb-3">
            <span>📝</span>
            <span>Echelon Institute Blog</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-3">
            Ontario Operator Certification — Study Guides & Exam Tips
          </h1>
          <p className="text-slate-600 text-lg max-w-2xl">
            Practical guides for water and wastewater operators preparing for OIT, Class 1-4, WQA, and EOCP certification exams in Ontario.
          </p>
        </div>
      </div>

      {/* Posts */}
      <div className="max-w-4xl mx-auto px-4 py-10">
        {isLoading && (
          <div className="space-y-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-xl border border-slate-200 p-6 animate-pulse">
                <div className="h-4 bg-slate-200 rounded w-1/4 mb-3" />
                <div className="h-6 bg-slate-200 rounded w-3/4 mb-3" />
                <div className="h-4 bg-slate-200 rounded w-full mb-2" />
                <div className="h-4 bg-slate-200 rounded w-2/3" />
              </div>
            ))}
          </div>
        )}

        {!isLoading && (!posts || posts.length === 0) && (
          <div className="text-center py-20 text-slate-500">
            <div className="text-4xl mb-4">📝</div>
            <p className="text-lg font-medium">No posts yet</p>
            <p className="text-sm mt-1">Check back soon for study guides and exam tips.</p>
          </div>
        )}

        {!isLoading && posts && posts.length > 0 && (
          <div className="space-y-6">
            {posts.map(post => (
              <Link key={post.slug} href={`/blog/${post.slug}`}>
                <article className="bg-white rounded-xl border border-slate-200 p-6 hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer group">
                  <div className="flex items-center gap-3 text-sm text-slate-500 mb-3">
                    <span>{formatDate(post.publishedAt)}</span>
                    <span>·</span>
                    <span>{post.readingTimeMinutes} min read</span>
                    {post.author && post.author !== "Echelon Institute" && (
                      <>
                        <span>·</span>
                        <span>{post.author}</span>
                      </>
                    )}
                  </div>

                  <h2 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-blue-700 transition-colors">
                    {post.title}
                  </h2>

                  <p className="text-slate-600 text-sm leading-relaxed mb-4 line-clamp-3">
                    {post.excerpt}
                  </p>

                  {post.tags && (
                    <div className="flex flex-wrap gap-1.5">
                      {post.tags.split(",").slice(0, 4).map(tag => (
                        <TagBadge key={tag} tag={tag} />
                      ))}
                    </div>
                  )}
                </article>
              </Link>
            ))}
          </div>
        )}

        {/* CTA */}
        <div className="mt-12 bg-blue-50 border border-blue-100 rounded-xl p-6 text-center">
          <p className="text-slate-700 font-medium mb-1">Ready to start practising?</p>
          <p className="text-slate-500 text-sm mb-4">15 free questions on every course — no account required.</p>
          <Link href="/quiz">
            <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2.5 rounded-lg text-sm transition-colors">
              Start Free Practice
            </button>
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white mt-8">
        <div className="max-w-4xl mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-slate-500">
          <span>© {new Date().getFullYear()} Echelon Institute</span>
          <div className="flex gap-4">
            <Link href="/pricing"><span className="hover:text-slate-700 cursor-pointer">Pricing</span></Link>
            <Link href="/about"><span className="hover:text-slate-700 cursor-pointer">About</span></Link>
            <Link href="/quiz"><span className="hover:text-slate-700 cursor-pointer">Practice</span></Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
