import { trpc } from "@/lib/trpc";
import { finishLogout } from "@/lib/logout";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export function useLogout() {
  const queryClient = useQueryClient();
  const mutation = trpc.auth.logout.useMutation();
  const logout = async () => {
    try {
      await mutation.mutateAsync();
      await finishLogout(queryClient);
    } catch {
      // Do not claim the httpOnly cookies were cleared when the request failed.
      toast.error("Sign out did not complete. Check your connection and try again.");
    }
  };
  return { logout, isPending: mutation.isPending, error: mutation.error };
}
