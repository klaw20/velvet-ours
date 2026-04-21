import { useState, useEffect, useRef } from "react";

// ── Constants ─────────────────────────────────────────────────────────────────

const ARCHETYPES = [
  { id: "brooding",  label: "The Brooding Stranger",  desc: "Dark, mysterious, speaks little but means everything" },
  { id: "charming",  label: "The Charming Rogue",      desc: "Quick-witted, irreverent, dangerously magnetic" },
  { id: "gentle",    label: "The Tender Protector",    desc: "Strong, patient, devastatingly gentle" },
  { id: "rival",     label: "The Reluctant Rival",     desc: "Tension-soaked history, undeniable pull" },
  { id: "builder",   label: "The Quiet Builder",       desc: "Calloused hands, few words — shows up every single time" },
  { id: "schoolrun", label: "The School Run",          desc: "Single dad, slightly chaotic, never meant to notice you" },
  { id: "rancher",   label: "The Rancher",             desc: "Sun-weathered, unhurried, unshakeable — knows what matters" },
  { id: "storm",     label: "The Quiet Storm",         desc: "Reads everything, feels deeply, dangerous when pushed" },
];

const SETTINGS = [
  { id: "paris",    label: "Paris, 1920s",           desc: "Jazz, candlelight, streets that keep secrets" },
  { id: "tuscany",  label: "Tuscany Villa",           desc: "Golden hills, slow evenings, nowhere to be" },
  { id: "london",   label: "Rainy London",            desc: "Grey skies, warm pubs, accidental eye contact" },
  { id: "newyork",  label: "New York Rooftop",        desc: "City lights, borrowed time, electric air" },
  { id: "coastal",  label: "Coastal Estate",          desc: "Salt air, old money, ghosts of summers past" },
  { id: "shoreline",label: "The Shoreline",           desc: "Your town's beach, off-season, familiar and dangerous" },
  { id: "resort",   label: "Sun, Sand & Strangers",   desc: "A holiday where nobody knows your name or history" },
  { id: "gates",    label: "The School Gates",        desc: "8am, every morning — you told yourself it was nothing" },
  { id: "bar",      label: "Last Orders",             desc: "A bar where the night always goes longer than planned" },
  { id: "market",   label: "The Sunday Market",       desc: "Slow mornings, fresh coffee, conversations that last too long" },
];

const HAIR_COLOURS = ["Blonde", "Brunette", "Red", "Dark", "Silver"];
const EYE_COLOURS  = ["Blue", "Green", "Brown", "Hazel", "Dark"];
const STYLE_VIBES  = ["Elegant", "Casual", "Edgy", "Bohemian", "Classic"];
const PERSONALITIES = ["Guarded", "Warm", "Fierce", "Dreamy", "Witty"];

const LOADING_MSGS = [
  "Lighting the candles…",
  "Setting the scene…",
  "The story stirs…",
  "He's already there, waiting…",
  "Turning the page…",
  "Your choice echoes forward…",
  "Something's about to happen…",
];

const CHOICE_STYLES = {
  bold:  { label: "Bold",      color: "#c4687a", hint: "Risk it. Own it." },
  soft:  { label: "Tender",    color: "#c9a84c", hint: "Let him in." },
  wild:  { label: "Reckless",  color: "#e8a87c", hint: "Chaos has its own logic." },
  dark:  { label: "Walk Away", color: "#888",    hint: "Some wounds are chosen." },
};

const FREE_CHAPTERS = 2; // Chapters 1-2 free, paywall after

// ── Storage helpers ───────────────────────────────────────────────────────────

function saveProgress(data) {
  try { localStorage.setItem("velvetours_progress", JSON.stringify(data)); } catch {}
}

function loadProgress() {
  try {
    const raw = localStorage.getItem("velvetours_progress");
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function clearProgress() {
  try { localStorage.removeItem("velvetours_progress"); } catch {}
}

// ── System prompt ─────────────────────────────────────────────────────────────

function buildSystem(profile, chapterNum) {
  const archetype = ARCHETYPES.find(a => a.id === profile.archetype);
  const setting   = SETTINGS.find(s => s.id === profile.setting);
  const isCliffhanger = chapterNum === FREE_CHAPTERS;

  return `You are writing a serialized choose-your-own-adventure romance story. Think Colleen Hoover meets Sally Thorne — emotionally raw, natural dialogue, real human messiness, and a slow burn that gets genuinely steamy without being pornographic.

ABOUT HER:
- Name: "${profile.heroine || profile.name}"
- Hair: ${profile.hair}
- Eyes: ${profile.eyes}
- Style: ${profile.style}
- Personality: ${profile.personality}

Weave her appearance naturally into the story — don't list her features, reveal them through the narrative. A strand of ${profile.hair.toLowerCase()} hair. Her ${profile.eyes.toLowerCase()} eyes catching the light. Small details that make it feel written for her specifically.

LOVE INTEREST: ${archetype?.label} — ${archetype?.desc}
Keep him slightly mysterious. Don't over-describe his appearance — let the reader's imagination fill in the gaps.

SETTING: ${setting?.label} — ${setting?.desc}

WRITING RULES:
- Write like a human, not an AI. Vary sentence length. Short punchy sentences for tension. Longer flowing ones for atmosphere.
- Natural dialogue — people interrupt, trail off, say the wrong thing at the wrong moment
- Physical awareness — heartbeat, breath, the warmth of proximity, the weight of a look that lasts a beat too long
- Steamy but tasteful — the almost is everything. A hand that lingers. Breath on her neck. The charged silence before someone speaks.
- Real emotions — jealousy, doubt, wanting what you shouldn't, saying one thing and meaning another entirely
- Flawed characters — she makes mistakes, he's not perfect, that's what makes it real and addictive
- Every chapter should feel like it could only go one way — and then go another

${isCliffhanger ? `
CRITICAL — THIS IS CHAPTER ${chapterNum} — THE CLIFFHANGER CHAPTER:
This chapter must end on the most gripping, irresistible cliffhanger you can write. Something has to happen — a revelation, a touch that goes too far or stops just short, words said that can't be unsaid, or a moment so charged the reader physically cannot stop here. Make it feel like the story is just beginning to crack open. The reader must feel genuinely desperate to find out what happens next. This is the chapter that turns a casual reader into someone who will pay to continue.
` : ""}

Always provide exactly 4 choices with types: bold, soft, wild, dark.
Each choice should feel genuinely different — not just tone variations but different directions with different consequences.

Respond ONLY with valid JSON, no markdown fences:
{
  "chapterTitle": "A short poetic chapter title",
  "subtitle": "A single evocative line — the mood in a sentence",
  "story": "4-6 paragraphs. Richly written. Separate paragraphs with \\n",
  "choices": [
    { "type": "bold",  "text": "What she does — one sentence, present tense, first person feel", "hint": "The energy this choice carries" },
    { "type": "soft",  "text": "What she does", "hint": "hint" },
    { "type": "wild",  "text": "What she does", "hint": "hint" },
    { "type": "dark",  "text": "What she does", "hint": "hint" }
  ]
}`;
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function VelvetOurs() {
  const [screen,         setScreen]         = useState("onboarding");
  const [profile,        setProfile]        = useState({
    name: "", heroine: "", archetype: "brooding", setting: "paris",
    hair: "Brunette", eyes: "Green", style: "Casual", personality: "Warm",
  });
  const [chapter,        setChapter]        = useState(null);
  const [displayedText,  setDisplayedText]  = useState("");
  const [isTyping,       setIsTyping]       = useState(false);
  const [selectedChoice, setSelectedChoice] = useState(null);
  const [chapterNum,     setChapterNum]     = useState(1);
  const [storyHistory,   setStoryHistory]   = useState([]);
  const [choiceHistory,  setChoiceHistory]  = useState([]);
  const [error,          setError]          = useState("");
  const [loadingMsg,     setLoadingMsg]     = useState(LOADING_MSGS[0]);
  const [showPaywall,    setShowPaywall]    = useState(false);
  const [returning,      setReturning]      = useState(false);

  const typingRef  = useRef(null);
  const loadingRef = useRef(null);
  const timeoutRef = useRef(null);

  // Load saved progress on mount
  useEffect(() => {
    const saved = loadProgress();
    if (saved?.profile && saved?.chapterNum > 1) {
      setReturning(true);
      setProfile(saved.profile);
      setChapterNum(saved.chapterNum);
      setStoryHistory(saved.storyHistory || []);
      setChoiceHistory(saved.choiceHistory || []);
    }
  }, []);

  useEffect(() => {
    if (screen === "loading") {
      let i = 0;
      loadingRef.current = setInterval(() => {
        i = (i + 1) % LOADING_MSGS.length;
        setLoadingMsg(LOADING_MSGS[i]);
      }, 1800);
    }
    return () => clearInterval(loadingRef.current);
  }, [screen]);

  function stopLoading() {
    clearInterval(loadingRef.current);
    clearTimeout(timeoutRef.current);
  }

  async function generateChapter(choiceMade = null) {
    if (chapterNum > FREE_CHAPTERS) {
      setShowPaywall(true);
      return;
    }

    setScreen("loading");
    setError("");
    setLoadingMsg(LOADING_MSGS[0]);

    timeoutRef.current = setTimeout(() => {
      stopLoading();
      setError("Took too long to respond. Check your API key in Vercel settings and try again.");
      setScreen(chapter ? "story" : "onboarding");
    }, 30000);

    try {
      const choiceContext = choiceHistory.length > 0
        ? `\n\nHer choices so far: ${choiceHistory.map((c, i) => `Chapter ${i + 1} — [${c.type.toUpperCase()}] "${c.text}"`).join(", ")}. These choices have shaped who she is in this story.`
        : "";

      const userMsg = storyHistory.length === 0
        ? `Begin Chapter 1. Open in the middle of a moment — drop us straight into the scene with atmosphere and immediate tension. Introduce the love interest with intrigue. Don't over-explain. Make the reader feel like they've walked into something.`
        : `Story so far:\n${storyHistory.join("\n\n")}${choiceContext}\n\nNow write Chapter ${chapterNum}. She chose: [${choiceMade?.type?.toUpperCase()}] "${choiceMade?.text}". Open the chapter showing the immediate consequence of this choice — in his reaction, in the atmosphere, in how she feels. Make the choice matter.`;

      const res = await fetch("/api/story", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system: buildSystem(profile, chapterNum),
          messages: [{ role: "user", content: userMsg }],
        }),
      });

      const data = await res.json();
      stopLoading();

      if (!res.ok) throw new Error(JSON.stringify(data) || `HTTP ${res.status}`);

      const text  = data.content.map(b => b.text || "").join("");
      const clean = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);

      setChapter(parsed);

      const newHistory = [
        ...storyHistory,
        `Chapter ${chapterNum} — ${parsed.chapterTitle}: ${parsed.story.substring(0, 200)}…`,
      ];
      setStoryHistory(newHistory);
      setSelectedChoice(null);
      setScreen("story");
      typeStory(parsed.story);

      // Save progress
      saveProgress({
        profile,
        chapterNum: chapterNum + 1,
        storyHistory: newHistory,
        choiceHistory,
      });

    } catch (e) {
      stopLoading();
      setError(`Something went wrong: ${e.message}`);
      setScreen(chapter ? "story" : "onboarding");
    }
  }

  async function generateEnding() {
    setScreen("loading");
    setError("");
    setLoadingMsg("Writing your ending…");

    timeoutRef.current = setTimeout(() => {
      stopLoading();
      setError("Timed out. Please try again.");
      setScreen("story");
    }, 30000);

    try {
      const userMsg = `Story so far:\n${storyHistory.join("\n\n")}\n\nHer choices: ${choiceHistory.map((c, i) => `Chapter ${i + 1} — [${c.type}] "${c.text}"`).join(", ")}.\n\nNow write a final satisfying ending chapter. Resolve the tension. Give her the moment she's been building toward. Make it feel earned, emotional, and real. End on something that lingers.`;

      const res = await fetch("/api/story", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system: buildSystem(profile, 99),
          messages: [{ role: "user", content: userMsg }],
        }),
      });

      const data = await res.json();
      stopLoading();

      if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);

      const text   = data.content.map(b => b.text || "").join("");
      const clean  = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);

      // Override choices with "start again" only
      parsed.isEnding = true;
      setChapter(parsed);
      setScreen("story");
      typeStory(parsed.story);
    } catch (e) {
      stopLoading();
      setError(`Something went wrong: ${e.message}`);
      setScreen("story");
    }
  }

  function typeStory(text) {
    clearTimeout(typingRef.current);
    setDisplayedText("");
    setIsTyping(true);
    let i = 0;
    function tick() {
      if (i < text.length) {
        setDisplayedText(text.slice(0, i + 1));
        i++;
        typingRef.current = setTimeout(tick, 14);
      } else {
        setIsTyping(false);
      }
    }
    tick();
  }

  function handleStart() {
    if (!profile.name.trim()) return;
    setReturning(false);
    generateChapter();
  }

  function handleContinue() {
    // Resume from saved progress
    setReturning(false);
    setScreen("story");
    if (chapter) {
      setDisplayedText(chapter.story);
    } else {
      generateChapter();
    }
  }

  function handleNextChapter() {
    if (!selectedChoice) return;
    const newChoiceHistory = [...choiceHistory, selectedChoice];
    setChoiceHistory(newChoiceHistory);
    const nextChapter = chapterNum + 1;
    setChapterNum(nextChapter);

    if (nextChapter > FREE_CHAPTERS) {
      setShowPaywall(true);
      return;
    }
    generateChapter(selectedChoice);
  }

  function handleRestart() {
    clearTimeout(typingRef.current);
    stopLoading();
    clearProgress();
    setScreen("onboarding");
    setChapter(null);
    setChapterNum(1);
    setStoryHistory([]);
    setChoiceHistory([]);
    setSelectedChoice(null);
    setDisplayedText("");
    setError("");
    setShowPaywall(false);
    setReturning(false);
  }

  const paragraphs  = displayedText.split("\n").filter(p => p.trim());
  const showChoices = !isTyping && chapter?.choices?.length > 0 && !chapter?.isEnding;
  const showEndingBtn = !isTyping && chapter && !chapter.isEnding && chapterNum >= FREE_CHAPTERS;

  // ── Styles ──────────────────────────────────────────────────────────────────

  const S = {
    app:        { minHeight: "100vh", background: "#120a08", color: "#f0e6d8", fontFamily: "'Palatino Linotype', Palatino, 'Book Antiqua', Georgia, serif" },
    content:    { maxWidth: 700, margin: "0 auto", padding: "0 20px 100px" },
    header:     { textAlign: "center", padding: "52px 0 36px", borderBottom: "1px solid rgba(185,145,60,0.2)", marginBottom: 44 },
    eyebrow:    { fontSize: 10, letterSpacing: 6, color: "#b9913c", textTransform: "uppercase", marginBottom: 18, opacity: 0.75 },
    logo:       { fontSize: "clamp(30px, 7vw, 48px)", letterSpacing: 5, color: "#f0e6d8", marginBottom: 10, fontWeight: 400, textShadow: "0 0 60px rgba(185,145,60,0.25)" },
    logoAccent: { color: "#b9913c" },
    tagline:    { fontStyle: "italic", fontSize: 16, color: "rgba(240,230,216,0.45)", letterSpacing: 0.5 },

    // Onboarding
    welcome:    { fontStyle: "italic", fontSize: 19, lineHeight: 1.75, color: "rgba(240,230,216,0.75)", marginBottom: 44, borderLeft: "2px solid rgba(185,145,60,0.3)", paddingLeft: 20 },
    sectionHdr: { fontSize: 9, letterSpacing: 4, textTransform: "uppercase", color: "#b9913c", opacity: 0.7, marginBottom: 20, marginTop: 36 },
    grid2:      { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 6 },
    grid3:      { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 6 },
    fieldGroup: { marginBottom: 20 },
    label:      { display: "block", fontSize: 9, letterSpacing: 3, textTransform: "uppercase", color: "#b9913c", opacity: 0.65, marginBottom: 8 },
    input:      { width: "100%", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(185,145,60,0.2)", borderRadius: 2, padding: "13px 16px", fontFamily: "inherit", fontSize: 16, color: "#f0e6d8", outline: "none", boxSizing: "border-box", transition: "border-color 0.2s" },
    select:     { width: "100%", background: "#1a0e0a", border: "1px solid rgba(185,145,60,0.2)", borderRadius: 2, padding: "13px 16px", fontFamily: "inherit", fontSize: 16, color: "#f0e6d8", outline: "none", boxSizing: "border-box" },
    pillRow:    { display: "flex", flexWrap: "wrap", gap: 8 },
    pill:       { padding: "8px 16px", border: "1px solid rgba(185,145,60,0.25)", borderRadius: 20, fontSize: 14, color: "rgba(240,230,216,0.6)", cursor: "pointer", transition: "all 0.2s", background: "transparent" },
    pillActive: { padding: "8px 16px", border: "1px solid #b9913c", borderRadius: 20, fontSize: 14, color: "#f0e6d8", cursor: "pointer", background: "rgba(185,145,60,0.12)" },
    btnStart:   { width: "100%", padding: "18px 0", marginTop: 32, background: "linear-gradient(135deg, #6b1f2a 0%, #8b2535 100%)", border: "1px solid rgba(185,145,60,0.35)", borderRadius: 2, fontSize: 12, letterSpacing: 5, textTransform: "uppercase", color: "#e8c97a", cursor: "pointer", fontFamily: "inherit" },
    btnGhost:   { width: "100%", padding: "14px 0", marginTop: 12, background: "transparent", border: "1px solid rgba(185,145,60,0.25)", borderRadius: 2, fontSize: 11, letterSpacing: 3, textTransform: "uppercase", color: "rgba(185,145,60,0.6)", cursor: "pointer", fontFamily: "inherit" },

    // Story
    profileBar: { display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(255,255,255,0.025)", border: "1px solid rgba(185,145,60,0.12)", borderRadius: 2, padding: "11px 18px", marginBottom: 36 },
    chapterMeta:{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28, paddingBottom: 18, borderBottom: "1px solid rgba(185,145,60,0.12)" },
    chTitle:    { fontSize: "clamp(24px, 5vw, 34px)", fontWeight: 400, lineHeight: 1.3, color: "#f0e6d8", marginBottom: 8 },
    chSubtitle: { fontStyle: "italic", fontSize: 16, color: "#c4687a", marginBottom: 40, opacity: 0.85 },
    storyBody:  { fontSize: "clamp(17px, 2.5vw, 20px)", lineHeight: 1.95, color: "rgba(240,230,216,0.88)", letterSpacing: 0.015 },
    storyP:     { marginBottom: 26 },
    cursor:     { display: "inline-block", width: 2, height: "1em", background: "#b9913c", marginLeft: 2, verticalAlign: "text-bottom", animation: "blink 1s step-end infinite" },
    skipHint:   { fontSize: 9, color: "rgba(185,145,60,0.22)", textAlign: "center", marginTop: 20, cursor: "pointer", letterSpacing: 3, textTransform: "uppercase" },

    // Choices
    choiceSection: { marginTop: 52, paddingTop: 36, borderTop: "1px solid rgba(185,145,60,0.12)" },
    choicePrompt:  { fontStyle: "italic", fontSize: 17, color: "rgba(240,230,216,0.5)", marginBottom: 24, textAlign: "center" },
    ornament:      { textAlign: "center", color: "#b9913c", opacity: 0.35, margin: "0 0 36px", fontSize: 18, letterSpacing: 18 },
    choiceList:    { display: "flex", flexDirection: "column", gap: 12 },
    choiceBtn:     { padding: "16px 20px", background: "rgba(255,255,255,0.025)", border: "1px solid rgba(185,145,60,0.18)", borderRadius: 2, fontSize: 17, fontStyle: "italic", color: "rgba(240,230,216,0.7)", cursor: "pointer", textAlign: "left", lineHeight: 1.5, fontFamily: "inherit", transition: "all 0.2s" },
    choiceBtnSel:  { padding: "16px 20px", background: "rgba(196,104,122,0.09)", border: "1px solid #c4687a", borderRadius: 2, fontSize: 17, fontStyle: "italic", color: "#f0e6d8", cursor: "pointer", textAlign: "left", lineHeight: 1.5, fontFamily: "inherit" },
    choiceHint:    { fontSize: 12, color: "rgba(240,230,216,0.3)", marginTop: 6, fontStyle: "normal" },
    continueBtn:   { marginTop: 28, padding: "15px 36px", background: "transparent", border: "1px solid rgba(185,145,60,0.4)", borderRadius: 2, fontSize: 11, letterSpacing: 4, textTransform: "uppercase", color: "#b9913c", cursor: "pointer", display: "block", marginLeft: "auto", marginRight: "auto", fontFamily: "inherit" },
    endingBtn:     { marginTop: 20, padding: "12px 28px", background: "transparent", border: "1px solid rgba(240,230,216,0.12)", borderRadius: 2, fontSize: 10, letterSpacing: 3, textTransform: "uppercase", color: "rgba(240,230,216,0.3)", cursor: "pointer", display: "block", marginLeft: "auto", marginRight: "auto", fontFamily: "inherit" },

    // Loading
    loadingState: { textAlign: "center", padding: "80px 0" },
    candle:        { fontSize: 44, marginBottom: 24, display: "block" },
    loadingText:   { fontStyle: "italic", fontSize: 18, color: "rgba(240,230,216,0.45)" },

    // Error
    errorMsg: { background: "rgba(107,31,42,0.18)", border: "1px solid rgba(196,104,122,0.3)", borderRadius: 2, padding: "16px 20px", fontStyle: "italic", fontSize: 16, color: "#c4687a", marginTop: 20, textAlign: "center" },

    // Paywall
    paywall:     { textAlign: "center", padding: "60px 20px" },
    paywallIcon: { fontSize: 48, marginBottom: 24 },
    paywallTitle:{ fontSize: 28, fontWeight: 400, color: "#f0e6d8", marginBottom: 12 },
    paywallSub:  { fontStyle: "italic", fontSize: 18, color: "rgba(240,230,216,0.5)", marginBottom: 40, lineHeight: 1.7 },
    paywallBtn:  { padding: "18px 48px", background: "linear-gradient(135deg, #6b1f2a, #8b2535)", border: "1px solid rgba(185,145,60,0.4)", borderRadius: 2, fontSize: 13, letterSpacing: 4, textTransform: "uppercase", color: "#e8c97a", cursor: "pointer", fontFamily: "inherit", marginBottom: 16, display: "block", width: "100%", maxWidth: 320, marginLeft: "auto", marginRight: "auto" },

    // Returning user
    returningBox: { background: "rgba(185,145,60,0.06)", border: "1px solid rgba(185,145,60,0.2)", borderRadius: 2, padding: "24px", marginBottom: 32, textAlign: "center" },
    returningTxt: { fontStyle: "italic", fontSize: 17, color: "rgba(240,230,216,0.7)", marginBottom: 20 },
  };

  const globalCSS = `
    @keyframes blink { 50% { opacity: 0; } }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #120a08; }
    select option { background: #1a0e0a; }
    button:hover { opacity: 0.85; }
  `;

  // ── Render ───────────────────────────────────────────────────────────────────

  function PillSelect({ options, value, onChange }) {
    return (
      <div style={S.pillRow}>
        {options.map(opt => (
          <button key={opt} style={value === opt ? S.pillActive : S.pill} onClick={() => onChange(opt)}>
            {opt}
          </button>
        ))}
      </div>
    );
  }

  return (
    <>
      <style>{globalCSS}</style>
      <div style={S.app}>
        <div style={S.content}>

          {/* ── Header ── */}
          <header style={S.header}>
            <div style={S.eyebrow}>✦ Your Story ✦</div>
            <div style={S.logo}>Velvet <span style={S.logoAccent}>Ours</span></div>
            <div style={S.tagline}>Where every chapter belongs to you</div>
          </header>

          {/* ── Onboarding ── */}
          {screen === "onboarding" && (
            <div>
              <p style={S.welcome}>
                Every chapter, a choice. Every choice, a consequence. Your story — shaped by you, written around you, impossible to put down.
              </p>

              {returning && (
                <div style={S.returningBox}>
                  <p style={S.returningTxt}>Welcome back, <em>{profile.name}</em>. Your story is waiting.</p>
                  <button style={S.btnStart} onClick={handleContinue}>Continue My Story</button>
                  <button style={S.btnGhost} onClick={() => setReturning(false)}>Start Something New</button>
                </div>
              )}

              {!returning && (
                <>
                  <div style={S.sectionHdr}>About You</div>

                  <div style={S.grid2}>
                    <div style={S.fieldGroup}>
                      <label style={S.label}>Your Name</label>
                      <input style={S.input} type="text" placeholder="Your name" value={profile.name}
                        onChange={e => setProfile(p => ({ ...p, name: e.target.value }))} />
                    </div>
                    <div style={S.fieldGroup}>
                      <label style={S.label}>Her Name (optional)</label>
                      <input style={S.input} type="text" placeholder="Or leave as yours" value={profile.heroine}
                        onChange={e => setProfile(p => ({ ...p, heroine: e.target.value }))} />
                    </div>
                  </div>

                  <div style={S.fieldGroup}>
                    <label style={S.label}>Hair Colour</label>
                    <PillSelect options={HAIR_COLOURS} value={profile.hair} onChange={v => setProfile(p => ({ ...p, hair: v }))} />
                  </div>

                  <div style={S.fieldGroup}>
                    <label style={S.label}>Eye Colour</label>
                    <PillSelect options={EYE_COLOURS} value={profile.eyes} onChange={v => setProfile(p => ({ ...p, eyes: v }))} />
                  </div>

                  <div style={S.fieldGroup}>
                    <label style={S.label}>Her Vibe</label>
                    <PillSelect options={STYLE_VIBES} value={profile.style} onChange={v => setProfile(p => ({ ...p, style: v }))} />
                  </div>

                  <div style={S.fieldGroup}>
                    <label style={S.label}>Her Personality</label>
                    <PillSelect options={PERSONALITIES} value={profile.personality} onChange={v => setProfile(p => ({ ...p, personality: v }))} />
                  </div>

                  <div style={S.sectionHdr}>Your Story</div>

                  <div style={S.grid2}>
                    <div style={S.fieldGroup}>
                      <label style={S.label}>His Archetype</label>
                      <select style={S.select} value={profile.archetype} onChange={e => setProfile(p => ({ ...p, archetype: e.target.value }))}>
                        {ARCHETYPES.map(a => <option key={a.id} value={a.id}>{a.label}</option>)}
                      </select>
                    </div>
                    <div style={S.fieldGroup}>
                      <label style={S.label}>Setting</label>
                      <select style={S.select} value={profile.setting} onChange={e => setProfile(p => ({ ...p, setting: e.target.value }))}>
                        {SETTINGS.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                      </select>
                    </div>
                  </div>

                  {error && <div style={S.errorMsg}>{error}</div>}

                  <button style={{ ...S.btnStart, opacity: profile.name.trim() ? 1 : 0.4 }}
                    onClick={handleStart} disabled={!profile.name.trim()}>
                    Begin My Story
                  </button>
                </>
              )}
            </div>
          )}

          {/* ── Loading ── */}
          {screen === "loading" && (
            <div style={S.loadingState}>
              <span style={S.candle}>🕯️</span>
              <div style={S.loadingText}>{loadingMsg}</div>
            </div>
          )}

          {/* ── Paywall ── */}
          {showPaywall && (
            <div style={S.paywall}>
              <div style={S.paywallIcon}>🔥</div>
              <h2 style={S.paywallTitle}>You've reached the edge</h2>
              <p style={S.paywallSub}>
                Chapter {chapterNum} is waiting — and after what just happened,<br />
                you already know you need to read it.<br /><br />
                <em>Continue for $7.99/month. Cancel anytime.</em>
              </p>
              <button style={S.paywallBtn} onClick={() => alert("Stripe coming soon! 🔥")}>
                Unlock the Story
              </button>
              <button style={{ ...S.endingBtn, marginTop: 8 }} onClick={handleRestart}>
                Start a new story instead
              </button>
            </div>
          )}

          {/* ── Story ── */}
          {screen === "story" && chapter && !showPaywall && (
            <div>
              <div style={S.profileBar}>
                <div style={{ fontStyle: "italic", fontSize: 15, color: "rgba(240,230,216,0.6)" }}>
                  {profile.name}'s story
                </div>
                <div style={{ fontSize: 9, letterSpacing: 3, color: "#c4687a", textTransform: "uppercase" }}>
                  Chapter {chapterNum}
                </div>
                <button style={{ background: "none", border: "none", fontSize: 9, letterSpacing: 2, color: "rgba(185,145,60,0.3)", cursor: "pointer", textTransform: "uppercase", fontFamily: "inherit" }}
                  onClick={handleRestart}>
                  New Story
                </button>
              </div>

              <div style={S.chapterMeta}>
                <span style={{ fontSize: 9, letterSpacing: 4, textTransform: "uppercase", color: "#b9913c", opacity: 0.65 }}>
                  Chapter {chapterNum}
                </span>
                <span style={{ fontStyle: "italic", fontSize: 13, color: "rgba(240,230,216,0.3)" }}>
                  {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric" })}
                </span>
              </div>

              <h2 style={S.chTitle}>{chapter.chapterTitle}</h2>
              <div style={S.chSubtitle}>{chapter.subtitle}</div>

              <div style={S.storyBody}>
                {paragraphs.map((p, i) => (
                  <p key={i} style={i === 0 ? { ...S.storyP, textIndent: 0 } : S.storyP}>
                    {p}{isTyping && i === paragraphs.length - 1 && <span style={S.cursor} />}
                  </p>
                ))}
              </div>

              {isTyping && (
                <div style={S.skipHint} onClick={() => {
                  clearTimeout(typingRef.current);
                  setDisplayedText(chapter.story);
                  setIsTyping(false);
                }}>Tap to reveal</div>
              )}

              {error && <div style={S.errorMsg}>{error}</div>}

              {/* Choices */}
              {showChoices && (
                <div style={S.choiceSection}>
                  <div style={S.ornament}>· · ·</div>
                  <p style={S.choicePrompt}>The moment is yours. What does she do?</p>
                  <div style={S.choiceList}>
                    {chapter.choices.map((c, i) => {
                      const style = CHOICE_STYLES[c.type] || CHOICE_STYLES.soft;
                      const isSelected = selectedChoice?.text === c.text;
                      return (
                        <button key={i}
                          style={isSelected ? S.choiceBtnSel : S.choiceBtn}
                          onClick={() => setSelectedChoice(c)}>
                          <div style={{ fontSize: 8, letterSpacing: 3, textTransform: "uppercase", color: style.color, marginBottom: 8 }}>
                            {style.label}
                          </div>
                          {c.text}
                          <div style={S.choiceHint}>{c.hint}</div>
                        </button>
                      );
                    })}
                  </div>

                  {selectedChoice && (
                    <button style={S.continueBtn} onClick={handleNextChapter}>
                      Live with this choice →
                    </button>
                  )}

                  {showEndingBtn && (
                    <button style={S.endingBtn} onClick={generateEnding}>
                      Write my ending
                    </button>
                  )}
                </div>
              )}

              {/* Ending screen */}
              {chapter.isEnding && (
                <div style={{ ...S.choiceSection, textAlign: "center" }}>
                  <div style={S.ornament}>· · ·</div>
                  <p style={{ fontStyle: "italic", fontSize: 18, color: "rgba(240,230,216,0.5)", marginBottom: 32 }}>
                    The end of this story. The beginning of the next.
                  </p>
                  <button style={S.continueBtn} onClick={handleRestart}>
                    Begin a New Story
                  </button>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </>
  );
}
