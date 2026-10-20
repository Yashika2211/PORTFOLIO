/**
 * Speech-only text shaping. Subtitles keep the original line; the voice gets
 * a version that TTS engines pronounce well (acronyms, units, product names).
 * Pure — unit-tested in tests/speech.test.ts.
 */

// Order matters: specific phrases before generic patterns.
type Rep = string | ((match: string) => string);
const spell = (m: string) => m.split("").join(" ");

const REPLACEMENTS: [RegExp, Rep][] = [
  [/https?:\/\/\S+/g, ""],
  [/\bY\.A\.S\.H\.U\.?/g, "Yashu"],
  [/\bP10\s*\/\s*P50\s*\/\s*P90\b/g, "P10, P50 and P90"],
  [/\bP10\s*[–-]\s*P90\b/g, "P10 to P90"],
  [/\bmacro F0\.5\b/gi, "macro F half score"],
  [/\bF0\.5\b/g, "F half score"],
  [/\bp95\b/gi, "P 95"],
  [/\b(Next|Node)\.js\b/g, "$1 J S"],
  [/\bB\.Tech\b/g, "B Tech"],
  [/\be\.g\./gi, "for example"],
  [/\b(Cmd|Command)\s*\+\s*K\b/gi, "Command K"],
  [/\bCtrl\s*\+\s*K\b/gi, "Control K"],
  [/\bk-gram\b/gi, "k gram"],
  [/\bSaansSaathi\b/g, "Saans Saathi"],
  [/\bCodeNation\b/g, "Code Nation"],
  [/\bcashforecastor\b/gi, "cash forecaster"],
  [/\bGitKafka\b/g, "Git Kafka"],
  [/\bKridAI\b/g, "Krid A I"],
  [/\bReportMaster AI\b/g, "Report Master A I"],
  [/\bLeetCode\b/g, "Leet Code"],
  [/\bLightGBM\b/g, "Light G B M"],
  [/\bPostgreSQL\b/g, "Postgres"],
  [/\bFastAPI\b/g, "Fast A P I"],
  [/\b(Chroma|Dynamo|Mongo)DB\b/g, "$1 D B"],
  [/\bYAAD\b/g, "Yaad"],
  [/\bHMAC\b/g, "H mac"],
  [/\bSQL\b/g, "sequel"],
  [/\b(AQI|SSE|MCP|UTR|LLM|AWS|CGPA|DSA|SIH|IST|ML|AI|UI|SDK|QR|GPU|TTS)\b/g, spell],
  [/\bPRs\b/g, "P Rs"],
  [/(\d+(?:\.\d+)?)\s*\/\s*(10|100)\b/g, "$1 out of $2"],
  [/(\d[\d,]*)\+/g, "$1 plus"],
  [/(\d)\s*%/g, "$1 percent"],
  [/\s*[—–]\s*/g, ", "],
  [/\s*·\s*/g, ", "],
  [/\s*→\s*/g, " to "],
  [/\s*×\s*/g, " by "],
  [/\s*&\s*/g, " and "],
  [/[“”"]/g, ""],
  [/\p{Extended_Pictographic}/gu, ""],
  [/\s{2,}/g, " "],
];

export function toSpeech(text: string): string {
  let s = text;
  for (const [re, rep] of REPLACEMENTS) {
    s = typeof rep === "function" ? s.replace(re, rep) : s.replace(re, rep);
  }
  return s.replace(/\s+([,.!?;:])/g, "$1").replace(/,\s*,/g, ",").trim();
}

/**
 * Split into sentence-sized chunks (≤ max chars). Chrome silently cuts long
 * utterances off after ~15s, and short chunks also start speaking sooner.
 */
export function chunkSentences(text: string, max = 180): string[] {
  const sentences = text.match(/[^.!?]+[.!?]+["')\]]*|[^.!?]+$/g)?.map((x) => x.trim()).filter(Boolean) ?? [];
  const out: string[] = [];
  for (const sentence of sentences) {
    if (sentence.length <= max) {
      const last = out[out.length - 1];
      if (last && last.length + sentence.length + 1 <= max) out[out.length - 1] = `${last} ${sentence}`;
      else out.push(sentence);
      continue;
    }
    // Overlong sentence: break on commas, then on spaces.
    let buf = "";
    for (const part of sentence.split(/(?<=,)\s+/)) {
      if ((buf + " " + part).trim().length > max && buf) {
        out.push(buf.trim());
        buf = "";
      }
      if (part.length > max) {
        for (const word of part.split(" ")) {
          if ((buf + " " + word).length > max) {
            out.push(buf.trim());
            buf = "";
          }
          buf += ` ${word}`;
        }
      } else buf += ` ${part}`;
    }
    if (buf.trim()) out.push(buf.trim());
  }
  return out;
}
