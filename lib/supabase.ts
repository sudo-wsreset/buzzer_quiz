import { createClient } from "@supabase/supabase-js";
import { logger } from "./utils";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  logger.error(
    "Supabase Config",
    "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY"
  );
  throw new Error("Supabase environment variables are not configured");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 20,
    },
  },
});

export type Team = {
  id: string;
  name: string;
  score: number;
  created_at: string;
};

export type Question = {
  id: string;
  position: number;
  question_text: string;
  answer_text: string | null;
  points: number;
  created_at: string;
};

export type QuizState = {
  id: number;
  current_question_id: string | null;
  buzzers_open: boolean;
  answer_revealed: boolean;
  round_token: string;
  updated_at: string;
};

export type Buzz = {
  id: string;
  round_token: string;
  team_id: string;
  buzzed_at: string;
};
