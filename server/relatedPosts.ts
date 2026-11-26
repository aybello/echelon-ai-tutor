type RelatedPost = {
  tags: string | null;
  publishedAt: Date;
};

export function rankRelatedPosts<T extends RelatedPost>(
  posts: T[],
  currentTagsValue: string | null,
  limit: number
): T[] {
  const currentTags = new Set(
    (currentTagsValue ?? "")
      .split(",")
      .map(tag => tag.trim().toLowerCase())
      .filter(Boolean)
  );
  return posts
    .map(post => ({
      post,
      sharedTags: (post.tags ?? "")
        .split(",")
        .map(tag => tag.trim().toLowerCase())
        .filter(tag => currentTags.has(tag)).length,
    }))
    .sort(
      (a, b) =>
        b.sharedTags - a.sharedTags ||
        new Date(b.post.publishedAt).getTime() -
          new Date(a.post.publishedAt).getTime()
    )
    .slice(0, limit)
    .map(({ post }) => post);
}
