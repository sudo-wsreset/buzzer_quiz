"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase, Team, Question, QuizState, Buzz } from "@/lib/supabase";
import { logger, getUserFriendlyErrorMessage } from "@/lib/utils";

type BuzzWithTeam = Buzz & { team_name: string };

export default function AdminPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [quizState, setQuizState] = useState<QuizState | null>(null);
  const [buzzOrder, setBuzzOrder] = useState<BuzzWithTeam[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"live" | "teams" | "questions">("live");
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const [newTeamName, setNewTeamName] = useState("");
  const [newQ, setNewQ] = useState({ question_text: "", answer_text: "", points: 10 });

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ---------- Initial load ----------
  useEffect(() => {
    const init = async () => {
      try {
        setError(null);
        const [{ data: t, error: tErr }, { data: q, error: qErr }, { data: s, error: sErr }] =
          await Promise.all([
            supabase.from("teams").select("*").order("created_at", { ascending: true }),
            supabase.from("questions").select("*").order("position", { ascending: true }),
            supabase.from("quiz_state").select("*").eq("id", 1).single(),
          ]);
        if (tErr) throw tErr;
        if (qErr) throw qErr;
        if (sErr) throw sErr;
        if (t) setTeams(t);
        if (q) setQuestions(q);
        if (s) setQuizState(s);
      } catch (err) {
        const message = getUserFriendlyErrorMessage(err);
        setError(message);
        logger.error("AdminPage Init", err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const refreshTeams = useCallback(async () => {
    const { data } = await supabase.from("teams").select("*").order("created_at", { ascending: true });
    if (data) setTeams(data);
  }, []);

  const refreshQuestions = useCallback(async () => {
    const { data } = await supabase.from("questions").select("*").order("position", { ascending: true });
    if (data) setQuestions(data);
  }, []);

  const refreshBuzzOrder = useCallback(async (roundToken: string) => {
    const { data } = await supabase
      .from("buzzes")
      .select("*, teams(name)")
      .eq("round_token", roundToken)
      .order("buzzed_at", { ascending: true });
    if (data) {
      setBuzzOrder(
        data.map((b: any) => ({
          ...b,
          team_name: b.teams?.name ?? "Unknown",
        }))
      );
    }
  }, []);

  // ---------- Realtime subscriptions ----------
  useEffect(() => {
    const channel = supabase
      .channel("admin-all-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "teams" }, refreshTeams)
      .on("postgres_changes", { event: "*", schema: "public", table: "questions" }, refreshQuestions)
      .on("postgres_changes", { event: "*", schema: "public", table: "quiz_state" }, (payload) => {
        const s = payload.new as QuizState;
        setQuizState(s);
        refreshBuzzOrder(s.round_token);
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "buzzes" }, (payload) => {
        const b = payload.new as Buzz;
        if (quizState && b.round_token === quizState.round_token) {
          refreshBuzzOrder(b.round_token);
        }
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quizState?.round_token]);

  useEffect(() => {
    if (quizState?.round_token) refreshBuzzOrder(quizState.round_token);
  }, [quizState?.round_token, refreshBuzzOrder]);

  // ---------- Quiz control actions ----------
  const currentQuestion = questions.find((q) => q.id === quizState?.current_question_id) || null;
  const currentIndex = currentQuestion ? questions.findIndex((q) => q.id === currentQuestion.id) : -1;

  const goToQuestion = async (q: Question) => {
    await supabase
      .from("quiz_state")
      .update({
        current_question_id: q.id,
        buzzers_open: false,
        answer_revealed: false,
        round_token: crypto.randomUUID(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", 1);
  };

  const nextQuestion = async () => {
    const next = questions[currentIndex + 1];
    if (next) await goToQuestion(next);
  };

  const prevQuestion = async () => {
    const prev = questions[currentIndex - 1];
    if (prev) await goToQuestion(prev);
  };

  const openBuzzers = async () => {
    await supabase.from("quiz_state").update({ buzzers_open: true }).eq("id", 1);
  };

  const lockBuzzers = async () => {
    await supabase.from("quiz_state").update({ buzzers_open: false }).eq("id", 1);
  };

  const resetRound = async () => {
    await supabase
      .from("quiz_state")
      .update({
        buzzers_open: false,
        answer_revealed: false,
        round_token: crypto.randomUUID(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", 1);
  };

  const revealAnswer = async () => {
    await supabase.from("quiz_state").update({ answer_revealed: true }).eq("id", 1);
  };

  const awardPoints = async (teamId: string, points: number) => {
    const team = teams.find((t) => t.id === teamId);
    if (!team) return;
    await supabase.from("teams").update({ score: team.score + points }).eq("id", teamId);
  };

  // ---------- Team management ----------
  const addTeam = async () => {
    if (!newTeamName.trim()) return;
    try {
      const { error } = await supabase.from("teams").insert({ name: newTeamName.trim() });
      if (error) throw error;
      setNewTeamName("");
      showToast("Team added");
    } catch (err) {
      showToast(getUserFriendlyErrorMessage(err), "error");
      logger.error("Add Team", err);
    }
  };

  const deleteTeam = async (id: string) => {
    try {
      const { error } = await supabase.from("teams").delete().eq("id", id);
      if (error) throw error;
      showToast("Team deleted");
    } catch (err) {
      showToast(getUserFriendlyErrorMessage(err), "error");
      logger.error("Delete Team", err);
    }
  };

  const adjustScore = async (id: string, delta: number) => {
    const team = teams.find((t) => t.id === id);
    if (!team) return;
    await supabase.from("teams").update({ score: team.score + delta }).eq("id", id);
  };

  const resetAllScores = async () => {
    await Promise.all(teams.map((t) => supabase.from("teams").update({ score: 0 }).eq("id", t.id)));
  };

  const resetQuestionsAndScores = async () => {
    if (!confirm("🚨 Reset ALL questions and scores? This cannot be undone!")) return;
    try {
      // Reset all scores
      await Promise.all(teams.map((t) => supabase.from("teams").update({ score: 0 }).eq("id", t.id)));
      // Reset quiz state: clear current question, reset buzzers and answer reveal
      await supabase
        .from("quiz_state")
        .update({
          current_question_id: null,
          buzzers_open: false,
          answer_revealed: false,
          round_token: crypto.randomUUID(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", 1);
      showToast("Questions and scores reset!");
    } catch (err) {
      showToast(getUserFriendlyErrorMessage(err), "error");
      logger.error("Reset Questions and Scores", err);
    }
  };

  // ---------- Question management ----------
  const addQuestion = async () => {
    if (!newQ.question_text.trim()) return;
    const nextPos = questions.length ? Math.max(...questions.map((q) => q.position)) + 1 : 1;
    await supabase.from("questions").insert({
      position: nextPos,
      question_text: newQ.question_text.trim(),
      answer_text: newQ.answer_text.trim() || null,
      points: newQ.points,
    });
    setNewQ({ question_text: "", answer_text: "", points: 10 });
  };

  const deleteQuestion = async (id: string) => {
    await supabase.from("questions").delete().eq("id", id);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <p className="opacity-70 text-cyan-400 text-lg">Loading…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center px-6">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold mb-2 text-fuchsia-400">⚠️ Failed to Load</h1>
          <p className="text-cyan-300/70 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 rounded-lg bg-cyan-600 text-black font-bold hover:bg-cyan-500 border border-cyan-400"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const sortedTeamsByScore = [...teams].sort((a, b) => b.score - a.score);

  return (
    <div className="min-h-screen bg-slate-950 text-white relative overflow-hidden">
      {/* Space glow effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-cyan-500/5 via-transparent to-fuchsia-500/5" />
      </div>
      
      {toast && (
        <div
          className={`fixed top-4 right-4 px-6 py-3 rounded-lg font-semibold transition-all border z-50 ${
            toast.type === "success"
              ? "bg-lime-600/80 text-white border-lime-400 shadow-lg shadow-lime-500/30"
              : "bg-fuchsia-600/80 text-white border-fuchsia-400 shadow-lg shadow-fuchsia-500/30"
          }`}
        >
          {toast.message}
        </div>
      )}
      {/* Top nav */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-cyan-500/30 sticky top-0 bg-slate-950/95 backdrop-blur z-10">
        <h1 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-fuchsia-400">
          🔔 Buzzer Quiz — Admin
        </h1>
        <div className="flex gap-2">
          {(["live", "teams", "questions"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-all ${
                tab === t 
                  ? "bg-gradient-to-r from-cyan-500 to-sky-400 text-black border border-cyan-300 shadow-lg shadow-cyan-500/30" 
                  : "bg-slate-800 text-cyan-300/70 hover:bg-slate-700 border border-slate-700 hover:border-cyan-500/50"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {tab === "live" && (
        <div className="p-6 max-w-6xl mx-auto">
          {/* Question display */}
          <div className="bg-slate-900/60 border border-cyan-500/40 rounded-2xl p-8 mb-6 min-h-[180px] flex flex-col justify-center backdrop-blur-sm">
            {currentQuestion ? (
              <>
                <p className="text-xs uppercase tracking-widest text-cyan-400/60 mb-2 font-mono">
                  Question {currentIndex + 1} of {questions.length} · {currentQuestion.points} pts
                </p>
                <p className="text-3xl font-bold leading-snug text-cyan-100">{currentQuestion.question_text}</p>
                {quizState?.answer_revealed && currentQuestion.answer_text && (
                  <p className="mt-4 text-xl text-lime-400 font-semibold">
                    Answer: {currentQuestion.answer_text}
                  </p>
                )}
              </>
            ) : (
              <p className="text-cyan-400/50 text-xl text-center">
                No question selected. Go to the Questions tab or press Next.
              </p>
            )}
          </div>

          {/* Controls */}
          <div className="flex flex-wrap gap-3 mb-8">
            <button
              onClick={prevQuestion}
              disabled={currentIndex <= 0}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 font-medium border border-slate-700 hover:border-cyan-500/50 transition-all"
            >
              ← Prev
            </button>
            <button
              onClick={nextQuestion}
              disabled={currentIndex >= questions.length - 1}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 font-medium border border-slate-700 hover:border-cyan-500/50 transition-all"
            >
              Next →
            </button>
            <div className="w-px bg-slate-700 mx-1" />
            <button
              onClick={openBuzzers}
              disabled={!currentQuestion || quizState?.buzzers_open}
              className="px-5 py-2 rounded-lg bg-gradient-to-r from-lime-600 to-emerald-600 hover:from-lime-500 hover:to-emerald-500 disabled:opacity-30 font-bold border border-lime-400 shadow-lg shadow-lime-500/30 transition-all"
            >
              🟢 Open Buzzers
            </button>
            <button
              onClick={lockBuzzers}
              disabled={!quizState?.buzzers_open}
              className="px-5 py-2 rounded-lg bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-500 hover:to-pink-500 disabled:opacity-30 font-bold border border-fuchsia-400 shadow-lg shadow-fuchsia-500/30 transition-all"
            >
              🔒 Lock Buzzers
            </button>
            <button
              onClick={resetRound}
              className="px-5 py-2 rounded-lg bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-500 hover:to-orange-500 font-bold border border-yellow-400 shadow-lg shadow-yellow-500/30 transition-all"
            >
              ↺ Reset Round
            </button>
            <button
              onClick={revealAnswer}
              disabled={!currentQuestion?.answer_text || quizState?.answer_revealed}
              className="px-5 py-2 rounded-lg bg-gradient-to-r from-cyan-600 to-sky-600 hover:from-cyan-500 hover:to-sky-500 disabled:opacity-30 font-bold border border-cyan-400 shadow-lg shadow-cyan-500/30 transition-all"
            >
              👁 Reveal Answer
            </button>
          </div>

          {/* Buzz order + scoring */}
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h2 className="font-bold text-lg mb-3 text-cyan-400">Buzz Order</h2>
              <div
                className={`rounded-xl border backdrop-blur-sm ${
                  quizState?.buzzers_open
                    ? "border-lime-600/50 bg-lime-950/20"
                    : "border-slate-700 bg-slate-900/40"
                } p-4 min-h-[120px]`}
              >
                <p className="text-xs mb-3 font-semibold uppercase tracking-wide text-cyan-400/60 font-mono">
                  Buzzers {quizState?.buzzers_open ? "OPEN 🟢" : "CLOSED 🔴"}
                </p>
                {buzzOrder.length === 0 && (
                  <p className="text-cyan-400/50 text-sm">No buzzes yet this round.</p>
                )}
                <ol className="flex flex-col gap-2">
                  {buzzOrder.map((b, i) => (
                    <li
                      key={b.id}
                      className={`flex items-center justify-between px-4 py-2.5 rounded-lg border transition-all ${
                        i === 0 
                          ? "bg-gradient-to-r from-lime-600 to-emerald-600 text-black font-bold border-lime-400 shadow-lg shadow-lime-500/30" 
                          : "bg-slate-800/60 border-slate-700 hover:border-cyan-500/50"
                      }`}
                    >
                      <span>
                        #{i + 1} {b.team_name}
                      </span>
                      {currentQuestion && (
                        <button
                          onClick={() => awardPoints(b.team_id, currentQuestion.points)}
                          className="text-xs px-2 py-1 rounded bg-black/30 hover:bg-black/50 transition-colors"
                        >
                          +{currentQuestion.points}
                        </button>
                      )}
                    </li>
                  ))}
                </ol>
              </div>
            </div>

            <div>
              <h2 className="font-bold text-lg mb-3 text-fuchsia-400">Scoreboard</h2>
              <div className="rounded-xl border border-slate-700 bg-slate-900/40 p-4 backdrop-blur-sm">
                <ol className="flex flex-col gap-2">
                  {sortedTeamsByScore.map((t, i) => (
                    <li
                      key={t.id}
                      className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-800/60 border border-slate-700/50 hover:border-fuchsia-500/50 transition-all"
                    >
                      <span className="font-medium">
                        {i + 1}. {t.name}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => adjustScore(t.id, -10)}
                          className="w-7 h-7 rounded bg-slate-700 hover:bg-fuchsia-600 transition-colors font-bold"
                        >
                          −
                        </button>
                        <span className="w-10 text-center font-bold text-fuchsia-400">{t.score}</span>
                        <button
                          onClick={() => adjustScore(t.id, 10)}
                          className="w-7 h-7 rounded bg-slate-700 hover:bg-lime-600 transition-colors font-bold"
                        >
                          +
                        </button>
                      </div>
                    </li>
                  ))}
                  {teams.length === 0 && (
                    <p className="text-cyan-400/50 text-sm">Add teams in the Teams tab.</p>
                  )}
                </ol>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === "teams" && (
        <div className="p-6 max-w-2xl mx-auto">
          <h2 className="font-bold text-xl mb-4 text-cyan-400">Manage Teams</h2>
          <div className="flex gap-2 mb-6">
            <input
              value={newTeamName}
              onChange={(e) => setNewTeamName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addTeam()}
              placeholder="Team name"
              className="flex-1 px-4 py-2 rounded-lg bg-slate-900/60 border border-cyan-500/40 outline-none focus:border-cyan-400 text-white placeholder:text-slate-500 focus:shadow-lg focus:shadow-cyan-500/20 transition-all"
            />
            <button onClick={addTeam} className="px-5 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-sky-400 text-black font-bold hover:shadow-lg hover:shadow-cyan-500/30 border border-cyan-300 transition-all">
              Add
            </button>
          </div>
          <div className="flex flex-col gap-2 mb-6">
            {teams.map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between px-4 py-3 rounded-lg bg-slate-900/60 border border-slate-700 hover:border-cyan-500/50 transition-all"
              >
                <span className="font-medium">{t.name}</span>
                <div className="flex items-center gap-3">
                  <span className="text-cyan-400/70 text-sm font-mono">Score: {t.score}</span>
                  <button
                    onClick={() => deleteTeam(t.id)}
                    className="text-fuchsia-400 hover:text-fuchsia-300 text-sm transition-colors"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
            {teams.length === 0 && <p className="text-cyan-400/50">No teams yet.</p>}
          </div>
          {teams.length > 0 && (
            <div className="flex flex-col gap-2">
              <button
                onClick={resetAllScores}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-sm font-medium border border-slate-700 hover:border-cyan-500/50 transition-all"
              >
                Reset all scores to 0
              </button>
              <button
                onClick={resetQuestionsAndScores}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-fuchsia-900/80 to-pink-900/80 hover:from-fuchsia-800 hover:to-pink-800 text-sm font-medium text-fuchsia-200 border border-fuchsia-600/60 shadow-lg shadow-fuchsia-600/20 transition-all"
              >
                🔄 Reset Questions & Scores
              </button>
            </div>
          )}
        </div>
      )}

      {tab === "questions" && (
        <div className="p-6 max-w-2xl mx-auto">
          <h2 className="font-bold text-xl mb-4 text-fuchsia-400">Manage Questions</h2>
          <div className="flex flex-col gap-2 mb-6 bg-slate-900/60 border border-slate-700 rounded-xl p-4 backdrop-blur-sm">
            <textarea
              value={newQ.question_text}
              onChange={(e) => setNewQ({ ...newQ, question_text: e.target.value })}
              placeholder="Question text"
              rows={2}
              className="px-4 py-2 rounded-lg bg-slate-950/60 border border-cyan-500/40 outline-none focus:border-cyan-400 text-white placeholder:text-slate-500 resize-none focus:shadow-lg focus:shadow-cyan-500/20 transition-all"
            />
            <input
              value={newQ.answer_text}
              onChange={(e) => setNewQ({ ...newQ, answer_text: e.target.value })}
              placeholder="Answer (optional, shown when revealed)"
              className="px-4 py-2 rounded-lg bg-slate-950/60 border border-cyan-500/40 outline-none focus:border-cyan-400 text-white placeholder:text-slate-500 focus:shadow-lg focus:shadow-cyan-500/20 transition-all"
            />
            <div className="flex gap-2 items-center">
              <label className="text-sm text-cyan-400/70 font-mono">Points:</label>
              <input
                type="number"
                value={newQ.points}
                onChange={(e) => setNewQ({ ...newQ, points: Number(e.target.value) })}
                className="w-24 px-3 py-2 rounded-lg bg-slate-950/60 border border-cyan-500/40 outline-none focus:border-cyan-400 text-white focus:shadow-lg focus:shadow-cyan-500/20 transition-all"
              />
              <button
                onClick={addQuestion}
                className="ml-auto px-5 py-2 rounded-lg bg-gradient-to-r from-fuchsia-500 to-pink-500 text-black font-bold hover:shadow-lg hover:shadow-fuchsia-500/30 border border-fuchsia-300 transition-all"
              >
                Add Question
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            {questions.map((q, i) => (
              <div
                key={q.id}
                className={`flex items-start justify-between gap-3 px-4 py-3 rounded-lg border backdrop-blur-sm transition-all ${
                  quizState?.current_question_id === q.id
                    ? "border-lime-600/60 bg-lime-950/30 shadow-lg shadow-lime-500/20"
                    : "border-slate-700 bg-slate-900/40 hover:border-cyan-500/50"
                }`}
              >
                <div className="flex-1">
                  <p className="text-xs text-cyan-400/60 mb-1 font-mono">
                    #{i + 1} · {q.points} pts
                  </p>
                  <p className="font-medium text-cyan-100">{q.question_text}</p>
                  {q.answer_text && (
                    <p className="text-sm text-cyan-400/50 mt-1">Answer: {q.answer_text}</p>
                  )}
                </div>
                <div className="flex flex-col gap-1 shrink-0">
                  <button
                    onClick={() => goToQuestion(q)}
                    className="text-xs px-3 py-1.5 rounded bg-gradient-to-r from-cyan-600 to-sky-600 hover:from-cyan-500 hover:to-sky-500 font-medium text-black border border-cyan-400 transition-all"
                  >
                    Set Live
                  </button>
                  <button
                    onClick={() => deleteQuestion(q.id)}
                    className="text-xs px-3 py-1.5 rounded bg-slate-800 hover:bg-fuchsia-900/60 text-fuchsia-400 hover:text-fuchsia-300 border border-slate-700 hover:border-fuchsia-600/60 transition-all"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
            {questions.length === 0 && <p className="text-cyan-400/50">No questions yet.</p>}
          </div>
        </div>
      )}
    </div>
  );
}
