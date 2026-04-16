import { useQuery } from "@tanstack/react-query";
import { useActor } from "./useActor";

export function useAllLogs() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["allLogs"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllLogs();
    },
    enabled: !!actor && !isFetching,
  });
}
