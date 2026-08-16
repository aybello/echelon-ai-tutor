import { useState } from "react";
import { trpc } from "@/lib/trpc";

type ChangelogForm = {
  date: string;
  badge: string;
  badgeColor: string;
  title: string;
  body: string;
  visible: boolean;
};

function currentMonthLabel() {
  return new Date().toLocaleDateString("en-CA", { month: "long", year: "numeric" });
}

function blankForm(): ChangelogForm {
  return {
    date: currentMonthLabel(),
    badge: "New",
    badgeColor: "#0F766E",
    title: "",
    body: "",
    visible: true,
  };
}

const fieldStyle = {
  width: "100%",
  border: "1px solid #CBD5E1",
  borderRadius: 9,
  padding: "9px 11px",
  background: "#FFFFFF",
  color: "#0F172A",
  fontFamily: "inherit",
  fontSize: 12,
  boxSizing: "border-box" as const,
};

export default function ChangelogManager() {
  const utils = trpc.useUtils();
  const entriesQ = trpc.changelog.adminList.useQuery();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<ChangelogForm>(blankForm);

  const refreshLists = async () => {
    await Promise.all([
      utils.changelog.adminList.invalidate(),
      utils.changelog.list.invalidate(),
    ]);
  };

  const resetForm = () => {
    setEditingId(null);
    setForm(blankForm());
  };

  const createEntry = trpc.changelog.create.useMutation({
    onSuccess: async () => {
      resetForm();
      await refreshLists();
    },
  });
  const updateEntry = trpc.changelog.update.useMutation({
    onSuccess: refreshLists,
  });
  const deleteEntry = trpc.changelog.delete.useMutation({
    onSuccess: refreshLists,
  });

  const isSaving = createEntry.isPending || updateEntry.isPending;
  const mutationError = createEntry.error ?? updateEntry.error ?? deleteEntry.error;

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const values = {
      date: form.date.trim(),
      badge: form.badge.trim(),
      badgeColor: form.badgeColor,
      title: form.title.trim(),
      body: form.body.trim(),
      visible: form.visible,
    };
    if (!values.date || !values.title || !values.body) return;
    if (editingId == null) createEntry.mutate(values);
    else updateEntry.mutate({ id: editingId, ...values }, { onSuccess: resetForm });
  };

  const edit = (entry: NonNullable<typeof entriesQ.data>[number]) => {
    setEditingId(entry.id);
    setForm({
      date: entry.date,
      badge: entry.badge ?? "",
      badgeColor: entry.badgeColor,
      title: entry.title,
      body: entry.body,
      visible: entry.visible,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const moveToTop = (id: number) => {
    const minimum = Math.min(...(entriesQ.data ?? []).map(entry => entry.sortOrder), 0);
    updateEntry.mutate({ id, sortOrder: minimum - 1 });
  };

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <form onSubmit={submit} style={{ background: "#F8FAFC", borderRadius: 16, border: "1px solid #E2E8F0", padding: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start", marginBottom: 18, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: "#0F172A" }}>{editingId == null ? "Publish a platform update" : "Edit platform update"}</div>
            <div style={{ fontSize: 11, color: "#64748B", marginTop: 4 }}>Published entries appear immediately on the About page. New entries are placed first automatically.</div>
          </div>
          {editingId != null && (
            <button type="button" onClick={resetForm} style={{ border: "1px solid #CBD5E1", background: "#FFFFFF", borderRadius: 20, padding: "7px 12px", color: "#475569", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>Cancel edit</button>
          )}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 12 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: "#475569" }}>
            Display date
            <input value={form.date} onChange={event => setForm(current => ({ ...current, date: event.target.value }))} placeholder="August 2026" required maxLength={32} style={{ ...fieldStyle, marginTop: 6 }} />
          </label>
          <label style={{ fontSize: 11, fontWeight: 700, color: "#475569" }}>
            Badge
            <select value={form.badge} onChange={event => setForm(current => ({ ...current, badge: event.target.value }))} style={{ ...fieldStyle, marginTop: 6 }}>
              <option value="New">New</option>
              <option value="Improvement">Improvement</option>
              <option value="Fix">Fix</option>
              <option value="">No badge</option>
            </select>
          </label>
          <label style={{ fontSize: 11, fontWeight: 700, color: "#475569" }}>
            Badge colour
            <input type="color" value={form.badgeColor} onChange={event => setForm(current => ({ ...current, badgeColor: event.target.value }))} style={{ ...fieldStyle, marginTop: 6, height: 37, padding: 4 }} />
          </label>
        </div>

        <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#475569", marginBottom: 12 }}>
          Title
          <input value={form.title} onChange={event => setForm(current => ({ ...current, title: event.target.value }))} placeholder="What changed?" required maxLength={256} style={{ ...fieldStyle, marginTop: 6 }} />
        </label>
        <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#475569", marginBottom: 12 }}>
          Description
          <textarea value={form.body} onChange={event => setForm(current => ({ ...current, body: event.target.value }))} placeholder="Explain the customer-facing improvement in plain language." required rows={4} style={{ ...fieldStyle, marginTop: 6, resize: "vertical" }} />
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, color: "#475569", marginBottom: 14 }}>
          <input type="checkbox" checked={form.visible} onChange={event => setForm(current => ({ ...current, visible: event.target.checked }))} />
          Publish immediately
        </label>

        {mutationError && <div style={{ padding: 10, borderRadius: 8, background: "#FEF2F2", color: "#B91C1C", fontSize: 11, marginBottom: 12 }}>{mutationError.message}</div>}
        <button type="submit" disabled={isSaving || !form.date.trim() || !form.title.trim() || !form.body.trim()} style={{ border: "none", borderRadius: 20, padding: "9px 16px", background: "#0F766E", color: "#FFFFFF", fontSize: 11, fontWeight: 800, cursor: isSaving ? "wait" : "pointer", opacity: isSaving ? 0.65 : 1 }}>
          {isSaving ? "Saving…" : editingId == null ? "Publish update" : "Save changes"}
        </button>
      </form>

      <div style={{ background: "#F8FAFC", borderRadius: 16, border: "1px solid #E2E8F0", overflow: "hidden" }}>
        <div style={{ padding: "15px 20px", borderBottom: "1px solid #E2E8F0", fontSize: 13, fontWeight: 800, color: "#0F172A" }}>
          Published history {entriesQ.data ? `(${entriesQ.data.length})` : ""}
        </div>
        {entriesQ.isLoading && <div style={{ padding: 32, textAlign: "center", color: "#64748B", fontSize: 12 }}>Loading platform updates…</div>}
        {entriesQ.error && <div style={{ padding: 20, color: "#B91C1C", fontSize: 12 }}>{entriesQ.error.message}</div>}
        {entriesQ.data?.length === 0 && <div style={{ padding: 32, textAlign: "center", color: "#64748B", fontSize: 12 }}>No changelog entries yet.</div>}
        {entriesQ.data?.map(entry => (
          <div key={entry.id} style={{ padding: "16px 20px", borderTop: "1px solid #E2E8F0", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap", opacity: entry.visible ? 1 : 0.6 }}>
            <div style={{ flex: "1 1 520px" }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 6 }}>
                <span style={{ fontSize: 10, fontWeight: 800, color: "#64748B", textTransform: "uppercase" }}>{entry.date}</span>
                {entry.badge && <span style={{ padding: "2px 7px", borderRadius: 20, background: entry.badgeColor, color: "#FFFFFF", fontSize: 9, fontWeight: 800, textTransform: "uppercase" }}>{entry.badge}</span>}
                <span style={{ padding: "2px 7px", borderRadius: 20, background: entry.visible ? "#DCFCE7" : "#E2E8F0", color: entry.visible ? "#166534" : "#475569", fontSize: 9, fontWeight: 800 }}>{entry.visible ? "VISIBLE" : "HIDDEN"}</span>
              </div>
              <div style={{ fontSize: 13, fontWeight: 800, color: "#0F172A", marginBottom: 4 }}>{entry.title}</div>
              <div style={{ fontSize: 11, color: "#64748B", lineHeight: 1.6 }}>{entry.body}</div>
            </div>
            <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
              <button type="button" onClick={() => moveToTop(entry.id)} disabled={updateEntry.isPending} style={{ border: "1px solid #CBD5E1", background: "#FFFFFF", borderRadius: 20, padding: "6px 10px", color: "#475569", fontSize: 10, fontWeight: 700, cursor: "pointer" }}>Move to top</button>
              <button type="button" onClick={() => updateEntry.mutate({ id: entry.id, visible: !entry.visible })} disabled={updateEntry.isPending} style={{ border: "1px solid #CBD5E1", background: "#FFFFFF", borderRadius: 20, padding: "6px 10px", color: "#475569", fontSize: 10, fontWeight: 700, cursor: "pointer" }}>{entry.visible ? "Hide" : "Publish"}</button>
              <button type="button" onClick={() => edit(entry)} style={{ border: "1px solid #BFDBFE", background: "#EFF6FF", borderRadius: 20, padding: "6px 10px", color: "#1D4ED8", fontSize: 10, fontWeight: 700, cursor: "pointer" }}>Edit</button>
              <button type="button" onClick={() => {
                if (window.confirm(`Delete “${entry.title}”? This cannot be undone.`)) deleteEntry.mutate({ id: entry.id });
              }} disabled={deleteEntry.isPending} style={{ border: "1px solid #FECACA", background: "#FEF2F2", borderRadius: 20, padding: "6px 10px", color: "#B91C1C", fontSize: 10, fontWeight: 700, cursor: "pointer" }}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
