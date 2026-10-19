/** Visitor achievements (distinct from Yashika's hackathon badges). Persisted in localStorage. */
export const ACHIEVEMENTS = [
  { id: "explorer", title: "Explorer", body: "Visited every section." },
  { id: "deepDiver", title: "Deep diver", body: "Opened 3 case files." },
  { id: "talker", title: "Talker", body: "Used a voice command." },
  { id: "nightOwl", title: "Night owl", body: "Visited after midnight." },
  { id: "tourist", title: "Tourist", body: "Completed the guided tour." },
  { id: "root", title: "Root access", body: "Ran sudo hire yashika." },
  { id: "overdrive", title: "Overdrive", body: "Found the Konami code." },
] as const;

export const SECRET = {
  id: "secret",
  title: "All systems unlocked",
  body: "You found everything. Yashika would like a word — the comms channel is open.",
};
