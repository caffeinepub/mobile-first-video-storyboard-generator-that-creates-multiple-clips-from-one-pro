import { useQuery } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { VideoSessionId, VideoSessionSummary } from '../backend';
import { Principal } from '@dfinity/principal';

export function useGetSession(sessionId: VideoSessionId | null) {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ['session', sessionId?.toString()],
    queryFn: async () => {
      if (!actor || !sessionId) return null;
      return actor.getSession(sessionId);
    },
    enabled: !!actor && !isFetching && !!sessionId,
    refetchInterval: 3000 // Poll every 3 seconds for updates
  });
}

export function useGetUserSessions(userPrincipal: string | null) {
  const { actor, isFetching } = useActor();

  return useQuery<VideoSessionSummary[]>({
    queryKey: ['userSessions', userPrincipal],
    queryFn: async () => {
      if (!actor || !userPrincipal) return [];
      const principal = Principal.fromText(userPrincipal);
      return actor.getUserSessions(principal);
    },
    enabled: !!actor && !isFetching && !!userPrincipal
  });
}

