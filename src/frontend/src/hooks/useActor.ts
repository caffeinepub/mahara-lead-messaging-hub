import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import type { backendInterface } from "../backend";
import { createActorWithConfig } from "../config";
import { getSecretParameter } from "../utils/urlParams";
import { useInternetIdentity } from "./useInternetIdentity";

const ACTOR_QUERY_KEY = "actor";
export function useActor() {
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  const actorQuery = useQuery<backendInterface>({
    queryKey: [ACTOR_QUERY_KEY, identity?.getPrincipal().toString()],
    queryFn: async () => {
      // Create actor with identity if available (Internet Identity),
      // otherwise create anonymous actor for username/password login
      const actorOptions = identity
        ? { agentOptions: { identity } }
        : undefined;

      const actor = await createActorWithConfig(actorOptions);

      // ALWAYS call _initializeAccessControlWithSecret regardless of login method.
      // For username/password login, the caller is anonymous but the backend
      // now allows anonymous principals to register when a valid token is supplied.
      const adminToken = getSecretParameter("caffeineAdminToken") || "";
      try {
        await actor._initializeAccessControlWithSecret(adminToken);
      } catch (e) {
        console.warn("Access control initialization failed:", e);
      }

      return actor;
    },
    staleTime: Number.POSITIVE_INFINITY,
    enabled: true,
  });

  // When the actor changes, invalidate dependent queries
  useEffect(() => {
    if (actorQuery.data) {
      queryClient.invalidateQueries({
        predicate: (query) => {
          return !query.queryKey.includes(ACTOR_QUERY_KEY);
        },
      });
      queryClient.refetchQueries({
        predicate: (query) => {
          return !query.queryKey.includes(ACTOR_QUERY_KEY);
        },
      });
    }
  }, [actorQuery.data, queryClient]);

  return {
    actor: actorQuery.data || null,
    isFetching: actorQuery.isFetching,
  };
}
