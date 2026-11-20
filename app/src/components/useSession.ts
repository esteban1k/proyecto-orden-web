"use client";

import { useEffect, useState } from "react";
import {
  readSession,
  subscribeSession,
  type SessionPayload,
} from "@/lib/session";

export function useSession(): {
  ready: boolean;
  session: SessionPayload | null;
} {
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<SessionPayload | null>(null);

  useEffect(() => {
    const sync = () => {
      setSession(readSession());
      setReady(true);
    };
    sync();
    return subscribeSession(sync);
  }, []);

  return { ready, session };
}
