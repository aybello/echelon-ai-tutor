import { useEffect, useRef, useState } from "react";
import { trpc } from "@/lib/trpc";

type Change = { id: string; known: boolean };
type Save = {
  operationId: string;
  changes: Change[];
  totalCards: number;
  createdAt: number;
};
export function useFlashcardPersistence(
  email: string,
  examType: string,
  totalCards: number
) {
  const utils = trpc.useUtils();
  const query = trpc.flashcard.getProgress.useQuery(
    { examType, cacheScope: email },
    { enabled: !!email, staleTime: 0, refetchOnMount: "always", retry: 2 }
  );
  const mutation = trpc.flashcard.updateProgress.useMutation();
  const refs = useRef({ mutation, totalCards, utils });
  refs.current = { mutation, totalCards, utils };
  const [known, setKnown] = useState(new Set<string>());
  const [status, setStatus] = useState("loading");
  const controller = useRef<{
    change: (change: Change) => void;
    retry: () => void;
    refresh: (ids: string[]) => void;
  } | null>(null);
  useEffect(() => {
    if (!email) {
      controller.current = null;
      setKnown(new Set());
      setStatus("guest");
      return;
    }
    const prefix = `echelon_flashcard_pending_v2:${email.toLowerCase()}:${examType}:`;
    let disposed = false,
      running = false,
      queue: Save[] = [],
      baseline: string[] = [],
      storageFailed = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    // One entry per operation avoids one tab replacing another tab's queue.
    try {
      queue = Object.keys(localStorage)
        .filter(key => key.startsWith(prefix))
        .map(key => JSON.parse(localStorage.getItem(key)!))
        .filter(
          s =>
            typeof s.operationId === "string" &&
            Number.isFinite(s.createdAt) &&
            Number.isInteger(s.totalCards) &&
            Array.isArray(s.changes) &&
            s.changes.every(
              (c: Change) =>
                typeof c.id === "string" && typeof c.known === "boolean"
            )
        )
        .sort((a, b) => a.createdAt - b.createdAt);
    } catch {
      storageFailed = true;
    }
    const render = () => {
      const ids = new Set(baseline);
      for (const save of queue)
        for (const c of save.changes)
          c.known ? ids.add(c.id) : ids.delete(c.id);
      if (!disposed) setKnown(ids);
    };
    const persist = (save: Save) => {
      try {
        localStorage.setItem(prefix + save.operationId, JSON.stringify(save));
        storageFailed = false;
      } catch {
        storageFailed = true;
      }
    };
    const drain = async () => {
      if (running || disposed || !queue.length) return;
      running = true;
      setStatus("saving");
      try {
        while (queue.length && !disposed) {
          const save = queue[0];
          const result = await refs.current.mutation.mutateAsync({
            ...save,
            examType,
          });
          if (!result.success) throw new Error("Not saved");
          queue.shift();
          baseline = result.knownIds;
          try {
            localStorage.removeItem(prefix + save.operationId);
          } catch {
            /* Retry receipt is safe if storage is unavailable. */
          }
          render();
          await refs.current.utils.flashcard.getProgress.cancel({
            examType,
            cacheScope: email,
          });
          refs.current.utils.flashcard.getProgress.setData(
            { examType, cacheScope: email },
            result
          );
        }
        if (!disposed) {
          setStatus("saved");
          void refs.current.utils.flashcard.getAllProgress.invalidate();
        }
      } catch {
        if (!disposed) {
          setStatus(storageFailed ? "error-local" : "error");
          timer = setTimeout(() => void drain(), 5000);
        }
      } finally {
        running = false;
      }
    };
    controller.current = {
      change(c) {
        const save = {
          operationId: crypto.randomUUID(),
          changes: [c],
          totalCards: refs.current.totalCards,
          createdAt: Math.max(Date.now(), (queue.at(-1)?.createdAt ?? 0) + 1),
        };
        queue.push(save);
        persist(save);
        render();
        void drain();
      },
      retry() {
        clearTimeout(timer);
        void drain();
      },
      refresh(ids) {
        if (running) return;
        baseline = ids;
        render();
        if (!queue.length && !running) setStatus("saved");
      },
    };
    render();
    setStatus(queue.length ? "saving" : "loading");
    void drain();
    const online = () => void drain();
    window.addEventListener("online", online);
    return () => {
      disposed = true;
      clearTimeout(timer);
      window.removeEventListener("online", online);
      controller.current = null;
    };
  }, [email, examType]);
  useEffect(() => {
    if (query.data)
      controller.current?.refresh(query.data.knownIds.map(String));
  }, [query.data, email, examType]);
  useEffect(() => {
    if (query.isError) setStatus("error");
  }, [query.isError]);
  return {
    known,
    status,
    change: (id: string, value: boolean) =>
      controller.current?.change({ id, known: value }),
    retry: () => {
      controller.current?.retry();
      void query.refetch();
    },
  };
}
