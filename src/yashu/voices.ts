/**
 * Female voice selection for speechSynthesis. Browsers don't expose a voice's
 * gender, so we rank by known voice names across platforms. Pure — tested in
 * tests/speech.test.ts.
 */

export type VoiceLike = { name: string; lang: string; localService?: boolean; voiceURI?: string };

// Known female voices (macOS/iOS, Windows/Edge, Chrome, Android).
const FEMALE =
  /\b(female|woman|samantha|victoria|karen|moira|tessa|fiona|veena|isha|lekha|serena|kate|allison|ava|susan|zoe|nicky|kathy|vicki|catherine|martha|shelley|sandy|flo|grandma|neerja|heera|swara|sonia|libby|maisie|hazel|zira|aria|jenny|michelle|ana|emma|natasha|clara|emily|sara|amber|ashley|cora|elizabeth|jane|nancy|molly|abbi|bella|hollie|olivia|freya|sophie|mia|leah|luna|yan|anika|kavya|aditi|raveena|kajal|joanna|kendra|kimberly|salli|ivy|ruth|amy)\b/i;
// Known male voices — never chosen.
const MALE =
  /\b(male|daniel|rishi|alex|fred|tom|oliver|arthur|aaron|gordon|lee|ralph|junior|albert|prabhat|ravi|david|mark|guy|ryan|george|thomas|christopher|eric|roger|steffan|liam|william|brian|andrew|reed|rocko|eddy|grandpa|matthew|joey|justin|kevin|russell|kunal|madhur|hemant|aarav)\b/i;
// macOS novelty voices.
const NOVELTY = /\b(bad news|bahh|bells|boing|bubbles|cellos|good news|jester|organ|superstar|trinoids|whisper|wobble|zarvox|deranged|hysterical|pipe organ)\b/i;
const QUALITY = /\b(natural|neural|online|premium|enhanced|siri)\b/i;

// Female voices whose names carry no gender hint.
const FEMALE_EXACT = /^(Google US English|Google हिन्दी|Google English \(India\))$/i;

export function isFemaleVoice(v: VoiceLike) {
  if (FEMALE_EXACT.test(v.name)) return true;
  return FEMALE.test(v.name) && !/\bmale\b/i.test(v.name.replace(/female/gi, ""));
}

export function voiceScore(v: VoiceLike): number {
  if (NOVELTY.test(v.name)) return -Infinity;
  if (MALE.test(v.name.replace(/female/gi, ""))) return -Infinity;
  const lang = v.lang.replace("_", "-");
  if (!/^en\b/i.test(lang) && !/^hi\b/i.test(lang)) return -Infinity;
  let s = 0;
  if (isFemaleVoice(v)) s += 100;
  if (/^en-IN/i.test(lang)) s += 40;
  else if (/^en-GB/i.test(lang)) s += 22;
  else if (/^en-(US|AU|IE|CA|NZ)/i.test(lang)) s += 12;
  else if (/^en/i.test(lang)) s += 6;
  else s -= 60; // Hindi voices only as a last resort for English text
  if (QUALITY.test(v.name)) s += 25;
  if (/^Google/i.test(v.name)) s += 8;
  if (v.localService) s += 2;
  return s;
}

/** Female (or at least not-male) English voices, best first. */
export function rankVoices<T extends VoiceLike>(voices: T[]): T[] {
  return voices
    .map((v) => ({ v, s: voiceScore(v) }))
    .filter((x) => Number.isFinite(x.s))
    .sort((a, b) => b.s - a.s)
    .map((x) => x.v);
}

export function femaleVoices<T extends VoiceLike>(voices: T[]): T[] {
  return rankVoices(voices).filter(isFemaleVoice);
}
