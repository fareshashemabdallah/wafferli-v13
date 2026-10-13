import { supabase } from "@/integrations/supabase/client";
import { readLocal, uid, writeLocal } from "./storage";

export type VoteOption = { id: string; name: string; note: string | null; votes: number; voters?: string[] };
export type VoteView = {
  title: string;
  event_at: string | null;
  neighborhood: string | null;
  friend_count: number;
  organizer_name: string | null;
  total_votes: number;
  my_option_id?: string | null;
  vote_token?: string;
  options: VoteOption[];
};
export type SavedOuting = { admin_token: string; vote_token: string; title: string; budget?: string; whoPays?: string; created: string };

export function voterKey(): string {
  let k = readLocal<string>("voterKey", "");
  if (!k) {
    k = uid() + uid();
    writeLocal("voterKey", k);
  }
  return k;
}

const friendly = (m: string) =>
  m.includes("Failed to fetch") ? "Network problem — check your connection and try again." : m;

export async function createOuting(input: {
  title: string; event_at: string; neighborhood: string; friend_count: number; organizer_name: string;
  options: { name: string; note: string }[];
}) {
  const { data, error } = await supabase.rpc("create_outing", {
    p_title: input.title, p_event_at: input.event_at, p_neighborhood: input.neighborhood,
    p_friend_count: input.friend_count, p_organizer_name: input.organizer_name, p_options: input.options,
  });
  if (error) throw new Error(friendly(error.message));
  return data as { vote_token: string; admin_token: string };
}

export async function getVote(token: string): Promise<VoteView | null> {
  const { data, error } = await supabase.rpc("get_outing_vote", { p_vote_token: token, p_voter_key: voterKey() });
  if (error) throw new Error(friendly(error.message));
  return (data as VoteView | null) ?? null;
}

export async function castVote(token: string, optionId: string, name: string) {
  const { error } = await supabase.rpc("cast_outing_vote", {
    p_vote_token: token, p_voter_key: voterKey(), p_option_id: optionId, p_voter_name: name,
  });
  if (error) throw new Error(friendly(error.message));
}

export async function getAdmin(token: string): Promise<VoteView | null> {
  const { data, error } = await supabase.rpc("get_outing_admin", { p_admin_token: token });
  if (error) throw new Error(friendly(error.message));
  return (data as VoteView | null) ?? null;
}

export const voteUrl = (t: string) => `${window.location.origin}${import.meta.env.BASE_URL}#/vote/${encodeURIComponent(t)}`;
export const waLink = (title: string, url: string) =>
  `https://wa.me/?text=${encodeURIComponent(`Vote for where we go: ${title}\n${url}`)}`;