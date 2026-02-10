import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type InsertItem } from "@shared/routes";
import { z } from "zod";

// Fetch all items
export function useItems() {
  return useQuery({
    queryKey: [api.items.list.path],
    queryFn: async () => {
      const res = await fetch(api.items.list.path);
      if (!res.ok) throw new Error("Failed to fetch items");
      return api.items.list.responses[200].parse(await res.json());
    },
  });
}

// Create a new item
export function useCreateItem() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (newItem: InsertItem) => {
      const res = await fetch(api.items.create.path, {
        method: api.items.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newItem),
      });

      if (!res.ok) {
        if (res.status === 400) {
          const error = await res.json();
          throw new Error(error.message || "Validation failed");
        }
        throw new Error("Failed to create item");
      }

      return api.items.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      // Invalidate the list query to refresh the UI
      queryClient.invalidateQueries({ queryKey: [api.items.list.path] });
    },
  });
}
