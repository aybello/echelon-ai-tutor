import { trpc } from "@/lib/trpc";

export default function PurchaseEmailDelivery() {
  const deliveries = trpc.admin.purchaseEmailDelivery.useQuery();
  const retry = trpc.admin.retryPurchaseEmail.useMutation({ onSuccess: () => { void deliveries.refetch(); } });
  return <details style={{ padding: 16 }}>
    <summary>Purchase email delivery</summary>
    {deliveries.isLoading && <p>Loading delivery status…</p>}
    {deliveries.isError && <p role="alert">Delivery status could not be loaded.</p>}
    {retry.isError && <p role="alert">Retry could not be queued. Please try again.</p>}
    {deliveries.data?.length === 0 && <p>No purchase emails queued yet.</p>}
    {deliveries.data?.map(row => <div key={row.id} style={{ marginTop: 8, overflowWrap: "anywhere" }}>
      {row.stripeSessionId} — {row.status} ({row.attempts} attempts)
      {row.status === "failed" && <button disabled={retry.isPending} onClick={() => retry.mutate({ id: row.id })}>Retry delivery</button>}
    </div>)}
  </details>;
}
