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
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <p className="text-lg opacity-70 text-cyan-400">Loading…</p>
      </div>
    );
  }

  if (error && !myTeamId) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center px-6">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold mb-2 text-fuchsia-400">⚠️ Connection Error</h1>
          <p className="text-cyan-300/70 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 rounded-lg bg-fuchsia-600 text-white font-bold hover:bg-fuchsia-500 border border-fuchsia-400"
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
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center px-6 py-12">
        <h1 className="text-2xl font-bold mb-1 text-cyan-400">Pick your team</h1>
        <p className="text-cyan-300/60 mb-8 text-sm">Tap your team name to continue</p>
        <div className="w-full max-w-sm flex flex-col gap-3">
          {teams.length === 0 && (
            <p className="text-cyan-400/50 text-center mt-8">
              No teams yet. Ask the host to add teams in the admin panel.
            </p>
          )}
          {teams.map((t) => (
            <button
              key={t.id}
              onClick={() => selectTeam(t.id)}
              className="w-full py-4 px-5 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 transition text-left text-lg font-semibold border border-cyan-500/30 hover:border-cyan-400/60 hover:shadow-md hover:shadow-cyan-500/20"
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
  let buttonClasses = "bg-slate-800 text-slate-500 border-slate-700";
  let subLabel = "Buzzers are closed";

  if (alreadyBuzzed) {
    buttonLabel = "BUZZED!";
    buttonClasses = "bg-gradient-to-r from-lime-500 to-emerald-500 text-black border-lime-400 shadow-xl shadow-lime-500/50";
    subLabel =
      myBuzzPosition === 1
        ? "You're FIRST! 🎉"
        : `You're #${myBuzzPosition} in queue`;
  } else if (buzzersOpen) {
    buttonLabel = "BUZZ";
    buttonClasses = pressing
      ? "bg-gradient-to-r from-fuchsia-700 to-pink-700 text-white border-fuchsia-500 scale-95 shadow-lg shadow-fuchsia-600/50"
      : "bg-gradient-to-r from-fuchsia-600 to-pink-600 text-white border-fuchsia-400 active:scale-95 shadow-xl shadow-fuchsia-500/50";
    subLabel = "Tap now!";
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-between px-6 py-8 relative overflow-hidden">
      {/* Space glow effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-40 right-40 w-80 h-80 bg-cyan-500 opacity-10 blur-3xl rounded-full" />
        <div className="absolute bottom-40 left-40 w-80 h-80 bg-fuchsia-500 opacity-10 blur-3xl rounded-full" />
      </div>
      
      <div className="relative z-10 w-full flex items-center justify-between">
        <div>
          <p className="text-cyan-400/70 text-xs uppercase tracking-wide font-mono">Team</p>
          <p className="text-xl font-bold text-cyan-100">{myTeam?.name}</p>
        </div>
        <button
          onClick={changeTeam}
          className="text-xs text-cyan-400/80 underline underline-offset-2 hover:text-cyan-300 transition"
        >
          switch team
        </button>
      </div>

      {error && (
        <div className="fixed top-4 left-4 right-4 px-4 py-3 rounded-lg bg-fuchsia-600/80 text-white text-sm font-semibold border border-fuchsia-400">
          {error}
        </div>
      )}

      <button
        onClick={buzz}
        disabled={!buzzersOpen || alreadyBuzzed}
        className={`flex-1 my-8 w-full max-w-sm aspect-square rounded-full text-4xl font-extrabold tracking-wide transition-transform duration-100 shadow-2xl flex items-center justify-center border-2 ${buttonClasses}`}
      >
        {buttonLabel}
      </button>

      <p className="text-lg font-medium text-cyan-300 mb-4">{subLabel}</p>
      <p className="text-xs text-cyan-400/60 font-mono">Score: {myTeam?.score ?? 0}</p>
    </div>
  );
}
