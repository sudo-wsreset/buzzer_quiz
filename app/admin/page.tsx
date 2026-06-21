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
      <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center">
        <p className="opacity-70">Loading…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex flex-col items-center justify-center px-6">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold mb-2">⚠️ Failed to Load</h1>
          <p className="text-neutral-400 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 rounded-lg bg-white text-black font-bold hover:opacity-90"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const sortedTeamsByScore = [...teams].sort((a, b) => b.score - a.score);

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      {toast && (
        <div
          className={`fixed top-4 right-4 px-6 py-3 rounded-lg font-semibold transition-all ${
            toast.type === "success"
              ? "bg-emerald-600 text-white"
              : "bg-red-600 text-white"
          }`}
        >
          {toast.message}
        </div>
      )}
      {/* Top nav */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-neutral-800 sticky top-0 bg-neutral-950 z-10">
        <h1 className="text-lg font-bold">🔔 Buzzer Quiz — Admin</h1>
        <div className="flex gap-2">
          {(["live", "teams", "questions"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize ${
                tab === t ? "bg-white text-black" : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
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
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8 mb-6 min-h-[180px] flex flex-col justify-center">
            {currentQuestion ? (
              <>
                <p className="text-xs uppercase tracking-widest text-neutral-500 mb-2">
                  Question {currentIndex + 1} of {questions.length} · {currentQuestion.points} pts
                </p>
                <p className="text-3xl font-bold leading-snug">{currentQuestion.question_text}</p>
                {quizState?.answer_revealed && currentQuestion.answer_text && (
                  <p className="mt-4 text-xl text-emerald-400 font-semibold">
                    Answer: {currentQuestion.answer_text}
                  </p>
                )}
              </>
            ) : (
              <p className="text-neutral-500 text-xl text-center">
                No question selected. Go to the Questions tab or press Next.
              </p>
            )}
          </div>

          {/* Controls */}
          <div className="flex flex-wrap gap-3 mb-8">
            <button
              onClick={prevQuestion}
              disabled={currentIndex <= 0}
              className="px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 disabled:opacity-30 font-medium"
            >
              ← Prev
            </button>
            <button
              onClick={nextQuestion}
              disabled={currentIndex >= questions.length - 1}
              className="px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 disabled:opacity-30 font-medium"
            >
              Next →
            </button>
            <div className="w-px bg-neutral-800 mx-1" />
            <button
              onClick={openBuzzers}
              disabled={!currentQuestion || quizState?.buzzers_open}
              className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-30 font-bold"
            >
              🟢 Open Buzzers
            </button>
            <button
              onClick={lockBuzzers}
              disabled={!quizState?.buzzers_open}
              className="px-5 py-2 rounded-lg bg-red-600 hover:bg-red-500 disabled:opacity-30 font-bold"
            >
              🔒 Lock Buzzers
            </button>
            <button
              onClick={resetRound}
              className="px-5 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 font-bold"
            >
              ↺ Reset Round
            </button>
            <button
              onClick={revealAnswer}
              disabled={!currentQuestion?.answer_text || quizState?.answer_revealed}
              className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-30 font-bold"
            >
              👁 Reveal Answer
            </button>
          </div>

          {/* Buzz order + scoring */}
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h2 className="font-bold text-lg mb-3">Buzz Order</h2>
              <div
                className={`rounded-xl border ${
                  quizState?.buzzers_open
                    ? "border-emerald-700 bg-emerald-950/30"
                    : "border-neutral-800 bg-neutral-900"
                } p-4 min-h-[120px]`}
              >
                <p className="text-xs mb-3 font-semibold uppercase tracking-wide text-neutral-400">
                  Buzzers {quizState?.buzzers_open ? "OPEN" : "CLOSED"}
                </p>
                {buzzOrder.length === 0 && (
                  <p className="text-neutral-500 text-sm">No buzzes yet this round.</p>
                )}
                <ol className="flex flex-col gap-2">
                  {buzzOrder.map((b, i) => (
                    <li
                      key={b.id}
                      className={`flex items-center justify-between px-4 py-2.5 rounded-lg ${
                        i === 0 ? "bg-amber-500 text-black font-bold" : "bg-neutral-800"
                      }`}
                    >
                      <span>
                        #{i + 1} {b.team_name}
                      </span>
                      {currentQuestion && (
                        <button
                          onClick={() => awardPoints(b.team_id, currentQuestion.points)}
                          className="text-xs px-2 py-1 rounded bg-black/20 hover:bg-black/40"
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
              <h2 className="font-bold text-lg mb-3">Scoreboard</h2>
              <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
                <ol className="flex flex-col gap-2">
                  {sortedTeamsByScore.map((t, i) => (
                    <li
                      key={t.id}
                      className="flex items-center justify-between px-3 py-2 rounded-lg bg-neutral-800"
                    >
                      <span className="font-medium">
                        {i + 1}. {t.name}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => adjustScore(t.id, -10)}
                          className="w-7 h-7 rounded bg-neutral-700 hover:bg-neutral-600"
                        >
                          −
                        </button>
                        <span className="w-10 text-center font-bold">{t.score}</span>
                        <button
                          onClick={() => adjustScore(t.id, 10)}
                          className="w-7 h-7 rounded bg-neutral-700 hover:bg-neutral-600"
                        >
                          +
                        </button>
                      </div>
                    </li>
                  ))}
                  {teams.length === 0 && (
                    <p className="text-neutral-500 text-sm">Add teams in the Teams tab.</p>
                  )}
                </ol>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === "teams" && (
        <div className="p-6 max-w-2xl mx-auto">
          <h2 className="font-bold text-xl mb-4">Manage Teams</h2>
          <div className="flex gap-2 mb-6">
            <input
              value={newTeamName}
              onChange={(e) => setNewTeamName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addTeam()}
              placeholder="Team name"
              className="flex-1 px-4 py-2 rounded-lg bg-neutral-900 border border-neutral-700 outline-none focus:border-neutral-500"
            />
            <button onClick={addTeam} className="px-5 py-2 rounded-lg bg-white text-black font-bold">
              Add
            </button>
          </div>
          <div className="flex flex-col gap-2 mb-6">
            {teams.map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between px-4 py-3 rounded-lg bg-neutral-900 border border-neutral-800"
              >
                <span className="font-medium">{t.name}</span>
                <div className="flex items-center gap-3">
                  <span className="text-neutral-400 text-sm">Score: {t.score}</span>
                  <button
                    onClick={() => deleteTeam(t.id)}
                    className="text-red-400 hover:text-red-300 text-sm"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
            {teams.length === 0 && <p className="text-neutral-500">No teams yet.</p>}
          </div>
          {teams.length > 0 && (
            <div className="flex flex-col gap-2">
              <button
                onClick={resetAllScores}
                className="px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-sm font-medium"
              >
                Reset all scores to 0
              </button>
              <button
                onClick={resetQuestionsAndScores}
                className="px-4 py-2 rounded-lg bg-red-900 hover:bg-red-800 text-sm font-medium text-red-100"
              >
                🔄 Reset Questions & Scores
              </button>
            </div>
          )}
        </div>
      )}

      {tab === "questions" && (
        <div className="p-6 max-w-2xl mx-auto">
          <h2 className="font-bold text-xl mb-4">Manage Questions</h2>
          <div className="flex flex-col gap-2 mb-6 bg-neutral-900 border border-neutral-800 rounded-xl p-4">
            <textarea
              value={newQ.question_text}
              onChange={(e) => setNewQ({ ...newQ, question_text: e.target.value })}
              placeholder="Question text"
              rows={2}
              className="px-4 py-2 rounded-lg bg-neutral-950 border border-neutral-700 outline-none focus:border-neutral-500 resize-none"
            />
            <input
              value={newQ.answer_text}
              onChange={(e) => setNewQ({ ...newQ, answer_text: e.target.value })}
              placeholder="Answer (optional, shown when revealed)"
              className="px-4 py-2 rounded-lg bg-neutral-950 border border-neutral-700 outline-none focus:border-neutral-500"
            />
            <div className="flex gap-2 items-center">
              <label className="text-sm text-neutral-400">Points:</label>
              <input
                type="number"
                value={newQ.points}
                onChange={(e) => setNewQ({ ...newQ, points: Number(e.target.value) })}
                className="w-24 px-3 py-2 rounded-lg bg-neutral-950 border border-neutral-700 outline-none focus:border-neutral-500"
              />
              <button
                onClick={addQuestion}
                className="ml-auto px-5 py-2 rounded-lg bg-white text-black font-bold"
              >
                Add Question
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            {questions.map((q, i) => (
              <div
                key={q.id}
                className={`flex items-start justify-between gap-3 px-4 py-3 rounded-lg border ${
                  quizState?.current_question_id === q.id
                    ? "border-emerald-600 bg-emerald-950/30"
                    : "border-neutral-800 bg-neutral-900"
                }`}
              >
                <div className="flex-1">
                  <p className="text-xs text-neutral-500 mb-1">
                    #{i + 1} · {q.points} pts
                  </p>
                  <p className="font-medium">{q.question_text}</p>
                  {q.answer_text && (
                    <p className="text-sm text-neutral-500 mt-1">Answer: {q.answer_text}</p>
                  )}
                </div>
                <div className="flex flex-col gap-1 shrink-0">
                  <button
                    onClick={() => goToQuestion(q)}
                    className="text-xs px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-500 font-medium"
                  >
                    Set Live
                  </button>
                  <button
                    onClick={() => deleteQuestion(q.id)}
                    className="text-xs px-3 py-1.5 rounded bg-neutral-800 hover:bg-neutral-700 text-red-400"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
            {questions.length === 0 && <p className="text-neutral-500">No questions yet.</p>}
          </div>
        </div>
      )}
    </div>
  );
}
