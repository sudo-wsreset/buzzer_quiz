"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { supabase, Team, QuizState } from "@/lib/supabase";
import { logger, getUserFriendlyErrorMessage } from "@/lib/utils";

const STORAGE_KEY = "buzzer_team_id";

export default function BuzzerPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [myTeamId, setMyTeamId] = useState<string | null>(null);
  const [quizState, setQuizState] = useState<QuizState | null>(null);
  const [myBuzzPosition, setMyBuzzPosition] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [pressing, setPressing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastRoundToken = useRef<string | null>(null);

  // Load teams + quiz state, restore saved team selection
  useEffect(() => {
    const init = async () => {
      try {
        setError(null);
        const { data: teamsData, error: teamsErr } = await supabase
          .from("teams")
          .select("*")
          .order("created_at", { ascending: true });
        if (teamsErr) throw teamsErr;
        if (teamsData) setTeams(teamsData);

        const { data: stateData, error: stateErr } = await supabase
          .from("quiz_state")
          .select("*")
          .eq("id", 1)
          .single();
        if (stateErr) throw stateErr;
        if (stateData) {
          setQuizState(stateData);
          lastRoundToken.current = stateData.round_token;
        }

        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved && teamsData?.some((t) => t.id === saved)) {
          setMyTeamId(saved);
        }
      } catch (err) {
        const message = getUserFriendlyErrorMessage(err);
        setError(message);
        logger.error("BuzzerPage Init", err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  // Realtime: teams list
  useEffect(() => {
    const channel = supabase
      .channel("teams-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "teams" },
        async () => {
          const { data } = await supabase
            .from("teams")
            .select("*")
            .order("created_at", { ascending: true });
          if (data) setTeams(data);
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Realtime: quiz_state
  useEffect(() => {
    const channel = supabase
      .channel("quiz-state-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "quiz_state" },
        (payload) => {
          const newState = payload.new as QuizState;
          setQuizState(newState);
          // New round started -> clear my buzz position
          if (newState.round_token !== lastRoundToken.current) {
            lastRoundToken.current = newState.round_token;
            setMyBuzzPosition(null);
          }
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Realtime: buzzes (to know my own rank position)
  useEffect(() => {
    if (!quizState) return;
    const channel = supabase
      .channel("buzzes-for-me")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "buzzes" },
        async (payload) => {
          const row = payload.new as { team_id: string; round_token: string };
          if (row.team_id === myTeamId && row.round_token === quizState.round_token) {
            // figure out my rank
            const { count } = await supabase
              .from("buzzes")
              .select("*", { count: "exact", head: true })
              .eq("round_token", row.round_token)
              .lte("buzzed_at", new Date().toISOString());
            setMyBuzzPosition(count ?? 1);
          }
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [quizState, myTeamId]);

  const selectTeam = (id: string) => {
    setMyTeamId(id);
    localStorage.setItem(STORAGE_KEY, id);
  };

  const changeTeam = () => {
    setMyTeamId(null);
    localStorage.removeItem(STORAGE_KEY);
    setMyBuzzPosition(null);
  };

  const buzz = useCallback(async () => {
    if (!myTeamId || !quizState || !quizState.buzzers_open || myBuzzPosition !== null) return;
    setPressing(true);
    if (navigator.vibrate) navigator.vibrate(50);

    try {
      const { error } = await supabase.from("buzzes").insert({
        round_token: quizState.round_token,
        team_id: myTeamId,
      });
      if (error) throw error;
    } catch (err) {
      logger.error("Buzz Failed", err);
      setError("Failed to buzz. Please try again.");
      setTimeout(() => setError(null), 3000);
    } finally {
      setPressing(false);
    }
  }, [myTeamId, quizState, myBuzzPosition]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-950 text-white">
        <p className="text-lg opacity-70">Loading…</p>
      </div>
    );
  }

  if (error && !myTeamId) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex flex-col items-center justify-center px-6">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold mb-2">⚠️ Connection Error</h1>
          <p className="text-neutral-400 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 rounded-lg bg-red-600 text-white font-bold hover:bg-red-500"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // ---- Team selection screen ----
  if (!myTeamId) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex flex-col items-center px-6 py-12">
        <h1 className="text-2xl font-bold mb-1">Pick your team</h1>
        <p className="text-neutral-400 mb-8 text-sm">Tap your team name to continue</p>
        <div className="w-full max-w-sm flex flex-col gap-3">
          {teams.length === 0 && (
            <p className="text-neutral-500 text-center mt-8">
              No teams yet. Ask the host to add teams in the admin panel.
            </p>
          )}
          {teams.map((t) => (
            <button
              key={t.id}
              onClick={() => selectTeam(t.id)}
              className="w-full py-4 px-5 rounded-xl bg-neutral-800 hover:bg-neutral-700 active:scale-95 transition text-left text-lg font-semibold border border-neutral-700"
            >
              {t.name}
            </button>
          ))}
        </div>
      </div>
    );
  }

  const myTeam = teams.find((t) => t.id === myTeamId);
  const buzzersOpen = quizState?.buzzers_open ?? false;
  const alreadyBuzzed = myBuzzPosition !== null;

  let buttonLabel = "WAIT";
  let buttonClasses = "bg-neutral-800 text-neutral-500";
  let subLabel = "Buzzers are closed";

  if (alreadyBuzzed) {
    buttonLabel = "BUZZED!";
    buttonClasses = "bg-amber-500 text-black";
    subLabel =
      myBuzzPosition === 1
        ? "You're FIRST! 🎉"
        : `You're #${myBuzzPosition} in queue`;
  } else if (buzzersOpen) {
    buttonLabel = "BUZZ";
    buttonClasses = pressing
      ? "bg-red-700 text-white scale-95"
      : "bg-red-600 text-white active:scale-95";
    subLabel = "Tap now!";
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex flex-col items-center justify-between px-6 py-8">
      {error && (
        <div className="fixed top-4 left-4 right-4 px-4 py-3 rounded-lg bg-red-600 text-white text-sm font-semibold">
          {error}
        </div>
      )}
      <div className="w-full flex items-center justify-between">
        <div>
          <p className="text-neutral-400 text-xs uppercase tracking-wide">Team</p>
          <p className="text-xl font-bold">{myTeam?.name}</p>
        </div>
        <button
          onClick={changeTeam}
          className="text-xs text-neutral-400 underline underline-offset-2"
        >
          switch team
        </button>
      </div>

      <button
        onClick={buzz}
        disabled={!buzzersOpen || alreadyBuzzed}
        className={`flex-1 my-8 w-full max-w-sm aspect-square rounded-full text-4xl font-extrabold tracking-wide transition-transform duration-100 shadow-2xl flex items-center justify-center ${buttonClasses}`}
      >
        {buttonLabel}
      </button>

      <p className="text-lg font-medium text-neutral-300 mb-4">{subLabel}</p>
      <p className="text-xs text-neutral-600">Score: {myTeam?.score ?? 0}</p>
    </div>
  );
}
