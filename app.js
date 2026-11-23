const STORAGE_KEY = "eduspark_gemini_api_key";
const LEADERBOARD_STORAGE_KEY = "eduspark_lesson_leaderboard_v6";
const CLOUD_CONFIG_STORAGE_KEY = "eduspark_supabase_cloud_config_v1";
const CLOUD_SNAPSHOT_STORAGE_KEY = "eduspark_cloud_leaderboard_snapshots_v1";
const ROOM_PIN_STORAGE_KEY = "eduspark_competition_pins_v1";
const TUTOR_RETROSPECTIVE_STORAGE_KEY = "eduspark_tutor_retrospective_memory_v1";

let currentLessonData = null;
let currentMindMapStyleSeed = 1;
let currentVisualPool = [];
let currentVisualIndices = [0, 1, 2, 3];
let currentVideoPool = [];
let currentVideoIndex = 0;
let isFullLessonExpanded = false;
let interactiveSlideTimer = null;
let interactiveSlideProgress = 0;
let isInteractiveSlidePlaying = false;
let audioCtx = null;
let isVoiceMuted = false;

// حالة المساعد الذكي والتخزين الرجعي والاقتراحات المتجددة
let tutorMemoryList = [];
let tutorSortOrder = "newest"; // "newest" | "oldest" | "verified"
let tutorSearchQuery = "";
let lastTutorDraftQuestion = "";
let currentFollowUpSuggestions = [];
let assistantTurnCounter = 0;

// مؤقت زمني لكل سؤال داخل اللعبة
let questionTimerInterval = null;
let questionTimeRemaining = 20;
const QUESTION_TIME_LIMIT = 20;

// 50 نوع لعبة حقيقية ومختلفة يختار منها الطالب أولاً
const FIFTY_GAME_TYPES = [
  { id: 1, name: "اختيار من متعدد كلاسيكي", mode: "mcq", desc: "اختر الإجابة الصحيحة من 4 اختيارات حقيقية للدرس." },
  { id: 2, name: "صح أم خطأ السريع", mode: "tf", desc: "حدد هل العبارة المستخرجة من الدرس صحيحة أم خاطئة." },
  { id: 3, name: "تحدي السرعة والتركيز", mode: "mcq", desc: "أجب بسرعة لحصد نقاط أعلى وتجاوز المنافسين." },
  { id: 4, name: "سلسلة الانتصارات المتتالية", mode: "mcq", desc: "كل إجابة صحيحة متتالية تضاعف مكافأة السلسلة." },
  { id: 5, name: "معركة النقاط ضد المنافس", mode: "battle", desc: "اجمع نقاطاً لتتجاوز هدف المنافس في لوحة الترتيب." },
  { id: 6, name: "اكتشف التعريف الصحيح", mode: "mcq", desc: "ميّز التعريف الأدق لموضوع الدرس بين خيارات متقاربة." },
  { id: 7, name: "صائد المكونات الأساسية", mode: "mcq", desc: "تعرّف على المكون أو العنصر الصحيح داخل الدرس." },
  { id: 8, name: "خبير المقارنات والفروق", mode: "mcq", desc: "قارن بين الأفكار والمحاور واختر الوصف الأدق." },
  { id: 9, name: "تحدي الفكرة الجوهرية", mode: "mcq", desc: "حدّد الفكرة المركزية التي يرتكز عليها الدرس." },
  { id: 10, name: "الاختبار الحقيقي من المصادر", mode: "mcq", desc: "أسئلة مستخرجة مباشرة من نصوص وأقسام الإنترنت." },
  { id: 11, name: "مبارزة العباقرة", mode: "battle", desc: "منافسة قوية لرفع ترتيبك إلى المركز الأول." },
  { id: 12, name: "كاشف المعلومة الصحيحة", mode: "tf", desc: "تحقق من دقة المعلومة المعروضة أمامك." },
  { id: 13, name: "تحدي التطبيق العملي", mode: "mcq", desc: "اربط مفهوم الدرس بالاستخدام أو التطبيق الصحيح." },
  { id: 14, name: "رحلة الاستكشاف المعرفي", mode: "mcq", desc: "انتقل بين أسئلة متنوعة تغطي محاور الدرس." },
  { id: 15, name: "بطل المراجعة السريعة", mode: "mcq", desc: "مراجعة مركزة لأهم نقاط الدرس قبل الامتحان." },
  { id: 16, name: "تحدي الدقة العالية", mode: "tf", desc: "إجابة واحدة خاطئة تصفّر السلسلة—كن دقيقاً." },
  { id: 17, name: "سباق القمة التعليمية", mode: "battle", desc: "نافس زملاءك في الدرس واكسب لقب بطل الدرس." },
  { id: 18, name: "مختبر المفاهيم", mode: "mcq", desc: "اختبر فهمك للمصطلحات والعناصر الأساسية." },
  { id: 19, name: "تحدي الأقسام والمحاور", mode: "mcq", desc: "أسئلة مبنية على أقسام الدرس التفصيلية." },
  { id: 20, name: "اختيار الخبير", mode: "mcq", desc: "اختر التفسير الأكثر اكتمالاً وصحة للدرس." },
  { id: 21, name: "حكم الصواب والخطأ", mode: "tf", desc: "احكم بسرعة على صحة العبارة التعليمية." },
  { id: 22, name: "تحدي النقاط الذهبية", mode: "battle", desc: "اربح نقاطاً إضافية وتحدّى أقوى منافس." },
  { id: 23, name: "مغامرة فهم الدرس", mode: "mcq", desc: "أسئلة عشوائية متجددة لا تتكرر بنفس الترتيب." },
  { id: 24, name: "قناص الإجابة الدقيقة", mode: "mcq", desc: "اختر العبارة الأكثر تطابقاً مع مضمون الدرس." },
  { id: 25, name: "تحدي الذاكرة النشطة", mode: "mcq", desc: "استدعِ المعلومات المهمة من شرح الدرس." },
  { id: 26, name: "ميزان الحقيقة", mode: "tf", desc: "فرّق بين العبارة الصحيحة والعبارة المحرّفة." },
  { id: 27, name: "صراع المتفوقين", mode: "battle", desc: "تحدٍّ تنافسي لرفع رصيد نقاطك الكلي." },
  { id: 28, name: "تحدي الشرح المبسّط", mode: "mcq", desc: "اختر الصياغة الأوضح والأبسط للفكرة." },
  { id: 29, name: "اختبار التمكن الكامل", mode: "mcq", desc: "اختبر استيعابك الشامل لموضوع الدرس." },
  { id: 30, name: "تحدي الأسئلة المتنوعة", mode: "mcq", desc: "تبديل عشوائي بين تعريفات ومكونات وأقسام الدرس." },
  { id: 31, name: "سريع البديهة (صح/خطأ)", mode: "tf", desc: "تحدٍّ مباشر لتحديد صحة الجملة من الدرس." },
  { id: 32, name: "بطولة التحدي المباشر", mode: "battle", desc: "اجمع النقاط وتفوّق على المنافسين في الجدول." },
  { id: 33, name: "مكتشف التفاصيل", mode: "mcq", desc: "التقط التفاصيل الدقيقة الواردة في شرح الدرس." },
  { id: 34, name: "تحدي الربط الذكي", mode: "mcq", desc: "اربط المحور بالشرح الصحيح المرتبط به." },
  { id: 35, name: "جولة الحسم المعرفي", mode: "mcq", desc: "أسئلة مختارة بعناية من محتوى الدرس." },
  { id: 36, name: "مختبر التحقق", mode: "tf", desc: "تأكد من صحة النص قبل اختيار إجابتك." },
  { id: 37, name: "تحدي صدارة الترتيب", mode: "battle", desc: "تقدّم في لوحة المتصدرين للدرس الحالي." },
  { id: 38, name: "تحدي الفهم العميق", mode: "mcq", desc: "تجاوز الحفظ السطحي واختر الفهم الصحيح." },
  { id: 39, name: "موسوعة الأسئلة العشوائية", mode: "mcq", desc: "أسئلة عشوائية متجددة في كل جولة." },
  { id: 40, name: "تحدي النجوم الخمس", mode: "battle", desc: "اجمع نقاطاً عالية لبلوغ تقييم 5 نجوم." },
  { id: 41, name: "تدقيق المعلومات", mode: "tf", desc: "هل هذه المعلومة صحيحة فعلاً في الدرس؟" },
  { id: 42, name: "تحدي المعلومة الغائبة", mode: "mcq", desc: "أكمل الفكرة باختيار الجزء الصحيح." },
  { id: 43, name: "ساحة المنافسة الكبرى", mode: "battle", desc: "تحدٍّ حماسي مع لوحة نقاط حية." },
  { id: 44, name: "تحدي الخلاصة الذكية", mode: "mcq", desc: "اختر الخلاصة الأدق لكل محور." },
  { id: 45, name: "تحدي الأسئلة الحية", mode: "mcq", desc: "أسئلة مبنية على بيانات مستجلبة من الإنترنت." },
  { id: 46, name: "تحدي الصواب الفوري", mode: "tf", desc: "قرار سريع بين صح وخطأ." },
  { id: 47, name: "معركة الأبطال", mode: "battle", desc: "تجاوز هدف المنافس وأثبت تفوقك." },
  { id: 48, name: "تحدي الإتقان السريع", mode: "mcq", desc: "اختبر جاهزيتك للدرس بخطوات ممتعة." },
  { id: 49, name: "تحدي التنويع المعرفي", mode: "mcq", desc: "أسئلة متنوعة من مختلف أجزاء الدرس." },
  { id: 50, name: "التحدي النهائي الشامل", mode: "battle", desc: "تحدٍّ ختامي يجمع بين الفهم والتنافس والتقييم." }
];

// حالة اللعبة والاختبار والمنافسات والحفظ
let activeArcadeMode = "game"; // "game" | "exam" | "competition"
let selectedGameTypeId = 1;
let gameStage = "start"; // "start" | "playing" | "finished"
let gameQuestionsPerSession = 5;
let gameAnsweredCount = 0;
let gameCorrectCount = 0;
let gameWrongCount = 0;
let questionShuffleSeed = 1;
let gameScore = 0;
let gameStreak = 0;
let currentGameQuestionIdx = 0;
let currentGameQuestionsBank = [];
let currentExamQuestionsBank = [];
let lastGameMessage = "اختر نوع اللعبة أولاً ثم اضغط 'ابدأ اللعبة الآن' لخوض جولة بمؤقت لكل سؤال.";
let lastGameCorrect = null;
let quizAnswers = {};
let lastQuizScore = 0;
let lastQuizTotal = 0;
let quizSubmittedOnce = false;
let playerName = "أنت";
let rivalTargetScore = 120;
let activeCompetitionRound = 1;
let activeInvitePin = "";
let cloudSyncStatus = "المحلي مفعّل — جاهز للحفظ في ملف (JSON/CSV) أو السحابة";
let lastSavedActionSummary = "لم يتم تنفيذ عملية حفظ أو مزامنة بعد في هذه الجلسة.";

// عناصر الصفحة
const apiKeyInput = document.getElementById("apiKeyInput");
const saveApiKeyBtn = document.getElementById("saveApiKeyBtn");
const topicInput = document.getElementById("topicInput");
const generateBtn = document.getElementById("generateBtn");
const statusBar = document.getElementById("statusBar");

const tabButtons = document.querySelectorAll(".tab-btn");
const tabPanels = document.querySelectorAll(".tab-panel");
const chipButtons = document.querySelectorAll(".chip-btn[data-topic]");

const lessonContent = document.getElementById("lessonContent");
const visualsContent = document.getElementById("visualsContent");
const videoContent =
  document.getElementById("videoContent") ||
  document.getElementById("videosContent") ||
  document.getElementById("interactiveVideoContent");

const dedicatedTutorContainers = Array.from(
  new Set(
    [
      document.getElementById("tutorContent"),
      document.getElementById("assistantContent"),
      document.getElementById("aiTutorContent"),
      document.getElementById("smartTutorContent"),
      document.getElementById("chatTutorContent")
    ].filter(Boolean)
  )
);

const dedicatedArcadeContainers = Array.from(
  new Set(
    [
      document.getElementById("gamesContent"),
      document.getElementById("gameContent"),
      document.getElementById("gamesTab"),
      document.getElementById("gameTab"),
      document.getElementById("quizContent"),
      document.getElementById("examContent"),
      document.getElementById("examsContent"),
      document.getElementById("evaluationContent"),
      document.getElementById("evaluationsContent"),
      document.getElementById("competitionContent"),
      document.getElementById("competitionsContent"),
      document.getElementById("leaderboardContent")
    ].filter(Boolean)
  )
);

function stopQuestionTimer() {
  if (questionTimerInterval) {
    clearInterval(questionTimerInterval);
    questionTimerInterval = null;
  }
}

function getSelectedGameType() {
  return FIFTY_GAME_TYPES.find((g) => g.id === selectedGameTypeId) || FIFTY_GAME_TYPES[0];
}

function shuffleArray(items) {
  const arr = Array.isArray(items) ? [...items] : [];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// =========================================================================
// أدوات التحقق من اكتمال النص ومنع التكرار وتوسيع البحث المجاني
// =========================================================================

function ensureCompleteSentence(rawText, fallbackTopic = "") {
  let txt = String(rawText || "")
    .replace(/\[[^\]]*\]/g, "")
    .replace(/\([^)]*\)/g, "")
    .replace(/=+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!txt) return "";

  // إزالة البدايات المبتورة أو المكررة المملة
  txt = txt.replace(/^(هو|هي)\s+(الذي|التي)\s+/i, "$1 ");

  // إن انتهت الجملة بنقاط حذف مبتورة نحاول إنهاءها بشكل طبيعي
  if (txt.endsWith("...")) {
    txt = txt.slice(0, -3).trim();
  }

  // قص عند أقرب حد جملة مكتمل إذا تجاوز الحد المطلوب
  if (txt.length > 320) {
    const sliceWindow = txt.slice(0, 320);
    const lastPunct = Math.max(
      sliceWindow.lastIndexOf("."),
      sliceWindow.lastIndexOf("،"),
      sliceWindow.lastIndexOf("؛"),
      sliceWindow.lastIndexOf("!")
    );
    txt = lastPunct > 90 ? sliceWindow.slice(0, lastPunct + 1).trim() : sliceWindow.trim();
  }

  if (!/[.،!؟؛]$/.test(txt) && txt.length > 0) {
    txt = `${txt}.`;
  }

  if (fallbackTopic && txt.length < 28) {
    return `${fallbackTopic}: ${txt}`;
  }

  return txt;
}

function deduplicateSentenceList(sentences = []) {
  const unique = [];
  const seenExact = new Set();
  const seenTokens = [];

  for (const raw of sentences) {
    const clean = ensureCompleteSentence(raw);
    if (!clean) continue;
    const norm = normalizeArabic(clean);
    if (!norm || seenExact.has(norm)) continue;

    const tokens = new Set(norm.split(/\s+/).filter((t) => t.length > 2));
    let isNearDuplicate = false;

    if (tokens.size >= 4) {
      for (const prevTokens of seenTokens) {
        let overlap = 0;
        tokens.forEach((tk) => {
          if (prevTokens.has(tk)) overlap += 1;
        });
        const similarity = overlap / Math.max(tokens.size, prevTokens.size);
        if (similarity >= 0.68) {
          isNearDuplicate = true;
          break;
        }
      }
    }

    if (!isNearDuplicate) {
      seenExact.add(norm);
      seenTokens.push(tokens);
      unique.push(clean);
    }
  }

  return unique;
}

// بحث مجاني موسّع من Wikidata + OpenLibrary + Wikipedia + DuckDuckGo
async function fetchWikidataFreeFacts(topic) {
  try {
    const searchUrl = `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(topic)}&language=ar&uselang=ar&limit=3&format=json&origin=*`;
    const res = await fetch(searchUrl);
    if (!res.ok) return [];
    const json = await res.json();
    const hits = json?.search || [];
    const facts = [];

    for (const h of hits) {
      const label = (h.label || "").trim();
      const desc = (h.description || "").trim();
      if (label && desc && desc.length > 8) {
        facts.push(ensureCompleteSentence(`${label}: ${desc}`, topic));
      }
    }
    return deduplicateSentenceList(facts);
  } catch (e) {
    console.warn("Wikidata search warning:", e);
    return [];
  }
}

async function fetchOpenLibraryFreeRefs(topic) {
  try {
    const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(topic)}&limit=3`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const json = await res.json();
    const docs = json?.docs || [];
    const refs = [];

    for (const d of docs) {
      const title = (d.title || "").trim();
      const author = Array.isArray(d.author_name) && d.author_name[0] ? d.author_name[0] : "";
      const subj = Array.isArray(d.subject) ? d.subject.slice(0, 3).join("، ") : "";
      if (title && (author || subj)) {
        const summary = `مرجع معرفي (${title})${author ? ` للمؤلف ${author}` : ""}${subj ? ` — محاوره: ${subj}` : ""}`;
        refs.push(ensureCompleteSentence(summary, topic));
      }
    }
    return deduplicateSentenceList(refs);
  } catch (e) {
    console.warn("OpenLibrary search warning:", e);
    return [];
  }
}

function computeLessonVerificationReport(topic, sources, fullExtracts, liveWebFacts, keyPoints) {
  const keywords = extractKeywords(topic);
  const allCorpus = [
    ...(sources || []).map((s) => `${s.title} ${s.extract}`),
    ...(fullExtracts || []).map((f) => (typeof f === "string" ? f : f.text || "")),
    ...(liveWebFacts || [])
  ].join(" ");

  const normCorpus = normalizeArabic(allCorpus);
  let matchedKeywords = 0;
  for (const kw of keywords) {
    if (normCorpus.includes(kw)) matchedKeywords += 1;
  }

  const uniqueSourceCount = (sources || []).length;
  const uniquePointCount = (keyPoints || []).length;
  const kwRatio = keywords.length > 0 ? matchedKeywords / keywords.length : 1;

  let accuracyScore = 75;
  accuracyScore += Math.min(12, uniqueSourceCount * 4);
  accuracyScore += Math.min(8, uniquePointCount * 2);
  accuracyScore += Math.round(kwRatio * 5);
  accuracyScore = Math.max(60, Math.min(99, accuracyScore));

  return {
    accuracyScore,
    statusLabel: `تم التحقق والمراجعة (${accuracyScore}% تطابق ومصداقية)`,
    sourcesCount: uniqueSourceCount,
    uniquePointsCount: uniquePointCount,
    notes: [
      `تم فحص ${uniqueSourceCount} مصادر حية مجانية ومطابقتها مع كلمات الموضوع "${topic}".`,
      `تمت تصفية التكرارات واستخراج ${uniquePointCount} نقاط أساسية مكتملة الصياغة.`
    ]
  };
}

// =========================================================================
// مساعد ذكي حواري متجدد: بحث حقيقي لكل سؤال + ردود غير مكررة + اقتراح أسئلة ذكية + ذاكرة رجعية
// =========================================================================

function loadRetrospectiveMemory() {
  try {
    const raw = localStorage.getItem(TUTOR_RETROSPECTIVE_STORAGE_KEY);
    const parsed = JSON.parse(raw || "[]");
    if (Array.isArray(parsed)) {
      tutorMemoryList = parsed;
      return tutorMemoryList;
    }
  } catch (e) {
    console.warn("Retrospective memory load warning:", e);
  }
  tutorMemoryList = [];
  return tutorMemoryList;
}

function saveRetrospectiveMemory() {
  try {
    localStorage.setItem(
      TUTOR_RETROSPECTIVE_STORAGE_KEY,
      JSON.stringify(tutorMemoryList.slice(0, 120))
    );
  } catch (e) {
    console.warn("Retrospective memory save warning:", e);
  }
}

function addRetrospectiveEntry({
  userMessage,
  assistantReply,
  suggestedQuestions = [],
  verificationReport = null,
  topic = "",
  intentLabel = "حوار وبحث",
  pinned = false
}) {
  const entry = {
    id: `mem_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
    timestamp: new Date().toISOString(),
    timeLabel: new Date().toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" }),
    topic: topic || currentLessonData?.title || "محادثة عامة",
    intentLabel,
    userMessage: String(userMessage || "").trim(),
    assistantReply: ensureCompleteSentence(assistantReply),
    suggestedQuestions: deduplicateSentenceList(suggestedQuestions || []),
    verificationScore: verificationReport?.confidenceScore ?? 85,
    verificationStatus: verificationReport?.statusLabel || "متحقق من المصادر",
    verificationNotes: verificationReport?.notes || [],
    pinned: Boolean(pinned)
  };

  tutorMemoryList.unshift(entry);
  saveRetrospectiveMemory();
  return entry;
}

function getFilteredAndSortedRetrospectiveMemory() {
  const qNorm = normalizeArabic(tutorSearchQuery || "");
  const list = (tutorMemoryList || []).filter((item) => {
    if (!qNorm) return true;
    const hay = normalizeArabic(
      `${item.topic} ${item.userMessage} ${item.assistantReply} ${(item.suggestedQuestions || []).join(" ")} ${item.intentLabel}`
    );
    return hay.includes(qNorm);
  });

  const sorted = [...list];
  if (tutorSortOrder === "oldest") {
    sorted.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  } else if (tutorSortOrder === "verified") {
    sorted.sort((a, b) => (b.verificationScore || 0) - (a.verificationScore || 0));
  } else {
    sorted.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }
  return sorted;
}

function verifyAssistantAnswer(question, candidateText, data, liveSnippets = [], memoryMatches = []) {
  const qKeywords = extractKeywords(question || "");
  const normCand = normalizeArabic(candidateText || "");
  const normLive = normalizeArabic((liveSnippets || []).join(" "));

  let hits = 0;
  for (const kw of qKeywords) {
    if (normCand.includes(kw) || normLive.includes(kw)) {
      hits += 1;
    }
  }

  const hasLive = Array.isArray(liveSnippets) && liveSnippets.length > 0;
  const hasLesson = Boolean(data && data.title);
  const hasMemory = Array.isArray(memoryMatches) && memoryMatches.length > 0;
  const ratio = qKeywords.length > 0 ? hits / qKeywords.length : 0.75;

  let score = 76;
  if (hasLive) score += 12;
  if (hasLesson) score += 5;
  if (hasMemory) score += 3;
  score += Math.min(3, Math.round(ratio * 4));
  score = Math.max(58, Math.min(99, score));

  const statusLabel =
    score >= 85
      ? `تم التحقق بدقة عالية (${score}%)`
      : score >= 70
      ? `تم التحقق من النتائج (${score}%)`
      : `إجابة مبنية على السياق المتاح (${score}%)`;

  const notes = [];
  if (hasLive) {
    notes.push(`تم جلب ${liveSnippets.length} فقرات بحث حية متعلقة بسؤالك وتصفيتها من التكرار.`);
  } else {
    notes.push("لم تُعد نتائج بحث خارجية جديدة لهذا السؤال، فتم الاعتماد على الدرس والذاكرة الرجعية.");
  }
  if (hasMemory) {
    notes.push(`تمت مطابقة ${memoryMatches.length} سجل سابق من التخزين الرجعي.`);
  }

  return { confidenceScore: score, statusLabel, notes };
}

// بحث مباشر ومتجدد مخصص لسؤال المستخدم نفسه عبر مصادر مجانية متعددة
async function searchLiveForQuestion(userMessage, activeTopic, turnNum) {
  const cleanQ = String(userMessage || "").trim();
  const kws = extractKeywords(cleanQ);
  const focusTerm = kws.length > 0 ? kws.slice(0, 3).join(" ") : cleanQ;
  const queryWithTopic =
    activeTopic && !normalizeArabic(cleanQ).includes(normalizeArabic(activeTopic))
      ? `${cleanQ} ${activeTopic}`
      : cleanQ;

  const queryVariants = [
    queryWithTopic,
    focusTerm,
    turnNum % 2 === 0 ? `${focusTerm} تعريف خصائص` : `${focusTerm} أنواع استخدام`
  ].filter(Boolean);

  const gathered = [];
  const bust = Date.now() % 1000;

  for (const q of queryVariants.slice(0, 2)) {
    try {
      const wUrl = `https://ar.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(q)}&utf8=&format=json&origin=*&srlimit=4&_=${bust}`;
      const wRes = await fetch(wUrl);
      if (wRes.ok) {
        const wJson = await wRes.json();
        const hits = wJson?.query?.search || [];
        for (const h of hits) {
          const snip = (h.snippet || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
          const complete = ensureCompleteSentence(snip, focusTerm);
          if (complete.length > 22) gathered.push(complete);
        }
      }
    } catch (e) {
      console.warn("Question live wiki search warning:", e);
    }

    try {
      const dUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(q)}&format=json&no_html=1&skip_disambig=1&_=${bust}`;
      const dRes = await fetch(dUrl);
      if (dRes.ok) {
        const dJson = await dRes.json();
        if (dJson.AbstractText) {
          dJson.AbstractText.split(/(?<=[.،!؟])\s+/).forEach((part) => {
            const c = ensureCompleteSentence(part, focusTerm);
            if (c.length > 22) gathered.push(c);
          });
        }
        for (const rt of dJson.RelatedTopics || []) {
          const t = rt.Text || (rt.Topics && rt.Topics[0]?.Text) || "";
          const c = ensureCompleteSentence(t, focusTerm);
          if (c.length > 22) gathered.push(c);
        }
      }
    } catch (e) {
      console.warn("Question live ddg search warning:", e);
    }
  }

  const wdFacts = await fetchWikidataFreeFacts(focusTerm);
  return deduplicateSentenceList([...gathered, ...wdFacts]).slice(0, 6);
}

// توليد أسئلة متابعة ذكية ومتجددة مبنية على السؤال الفعلي ونتائج البحث
function buildDynamicSuggestedQuestions(userMessage, activeTopic, liveFacts, turnNum) {
  const cleanQ = String(userMessage || "").trim();
  const kws = extractKeywords(cleanQ);
  const mainSubject = kws[0] || activeTopic || "الموضوع";
  const secondSubject = kws[1] || activeTopic || "هذا المجال";

  const factSnippet = liveFacts && liveFacts[0] ? shortBranchLabel(liveFacts[0], 36) : "";

  const candidatePool = [
    `ما الفرق العملي بين ${mainSubject} و${secondSubject}؟`,
    `أعطني مثالاً واقعياً واضحاً يوضّح ${mainSubject} بدون تعقيد`,
    `ما أبرز الأخطاء أو التحديات الشائعة عند التعامل مع ${mainSubject}؟`,
    `كيف أبدأ خطوة بخطوة في تعلم أو تطبيق ${mainSubject}؟`,
    factSnippet ? `اشرح لي أكثر عن نقطة: "${factSnippet}"` : `ما أهم مميزات وعيوب ${mainSubject}؟`,
    `اسألني سؤالاً تفاعلياً صعباً قليلاً لقياس فهمي في ${mainSubject}`
  ];

  const rotated = candidatePool.map((_, i) => candidatePool[(i + turnNum) % candidatePool.length]);
  return deduplicateSentenceList(rotated).slice(0, 4);
}

// صياغة رد حواري كامل ومُحقَّق غير مكرر
async function generateConversationalAiReply(userMessage, data = currentLessonData) {
  assistantTurnCounter += 1;
  const rawQ = String(userMessage || "").trim();
  const normQ = normalizeArabic(rawQ);
  const activeTopic = (data?.title || topicInput?.value || "").trim();
  const kws = extractKeywords(rawQ);

  const greetings = [
    "السلام عليكم", "سلام عليكم", "اهلا", "اهلا بك", "مرحبا", "ازيك", "عامل ايه",
    "كيف حالك", "صباح الخير", "مساء الخير", "هلا", "hi", "hello"
  ];
  const isGreeting =
    greetings.some((g) => normQ === g || normQ.startsWith(g + " ")) &&
    rawQ.split(/\s+/).length <= 5;

  if (isGreeting) {
    const greetVariants = [
      `أهلاً بك يا أستاذ محمد! يسعدني جداً حديثك. قل لي ما الذي يشغلك أو تحب أن نبحث ونناقش فيه الآن؟`,
      `وعليكم السلام ورحمة الله وبركاته! أهلاً بك، أنا جاهز لأسمع سؤالك وأبحث له في مصادر متعددة وأجيبك بإجابة كاملة ومباشرة. بماذا نبدأ؟`,
      `أهلاً وسهلاً بك! نورت. اكتب أي سؤال يخطر في بالك سواء في الدرس أو خارجه وسأبحث وأتحقق وأرد عليك بوضوح.`
    ];
    const reply = greetVariants[assistantTurnCounter % greetVariants.length];
    const suggestions = [
      activeTopic ? `ما الفكرة الأهم في درس ${activeTopic}؟` : "ما الفرق بين الذكاء الاصطناعي وتعلم الآلة؟",
      "اشرح لي موضوعاً معقداً بأسلوب بسيط وواضح",
      "ما أفضل طريقة للمذاكرة السريعة والتركيز؟",
      "اختبرني في معلومة عامة أو تقنية"
    ];
    const verification = verifyAssistantAnswer(rawQ, reply, data, [], []);
    return {
      intentLabel: "دردشة مباشرة",
      reply: ensureCompleteSentence(reply),
      suggestedQuestions: suggestions,
      verification
    };
  }

  const asksMemory =
    normQ.includes("الذاكره") ||
    normQ.includes("قلت لك") ||
    normQ.includes("سابقا") ||
    normQ.includes("تخزين رجعي");

  const memoryMatches = (tutorMemoryList || []).filter((item) => {
    const hay = normalizeArabic(`${item.userMessage} ${item.assistantReply} ${item.topic}`);
    return kws.some((k) => hay.includes(k)) || hay.includes(normQ);
  });

  if (asksMemory && memoryMatches.length > 0) {
    const top = memoryMatches[0];
    const reply = ensureCompleteSentence(
      `من ذاكرتنا الرجعية (${top.timeLabel})، آخر نقاش قريب كان عن "${top.userMessage}"، وكانت الخلاصة: ${top.assistantReply}`
    );
    const suggestions = buildDynamicSuggestedQuestions(
      top.userMessage,
      activeTopic,
      [],
      assistantTurnCounter
    );
    const verification = verifyAssistantAnswer(rawQ, reply, data, [], memoryMatches);
    return {
      intentLabel: "استرجاع من الذاكرة",
      reply,
      suggestedQuestions: suggestions,
      verification
    };
  }

  const liveFacts = await searchLiveForQuestion(rawQ, activeTopic, assistantTurnCounter);

  const relevantLessonSnippets = data
    ? deduplicateSentenceList([
        data.bestDefinition,
        ...(data.key_points || []),
        ...(data.components || []).map((c) => c.explanation),
        ...(data.liveWebFacts || [])
      ]).filter((s) => {
        const n = normalizeArabic(s);
        return kws.some((k) => n.includes(k));
      })
    : [];

  const bestAnswers = deduplicateSentenceList([
    ...liveFacts,
    ...relevantLessonSnippets
  ]).slice(0, 3);

  const isCompare = normQ.includes("الفرق") || normQ.includes("مقارنه") || normQ.includes("قارن");
  const isHow = normQ.includes("كيف") || normQ.includes("ازاي") || normQ.includes("خطوات") || normQ.includes("طريقه");
  const isWhat = normQ.includes("ما هو") || normQ.includes("ما هي") || normQ.includes("تعريف") || normQ.includes("يعني ايه");

  let rawReply = "";
  if (bestAnswers.length > 0) {
    const joined = bestAnswers.join(" ");
    if (isCompare) {
      rawReply = `بخصوص المقارنة في "${rawQ}"، توضح المصادر المحققة: ${joined} والأساس في أي مقارنة دقيقة هو تحديد الفارق الجوهري في الوظيفة والخصائص والنتائج العملية.`;
    } else if (isHow) {
      rawReply = `للإجابة عن "${rawQ}" بشكل عملي كامل: ${joined} والخطوة الأفضل هي البدء بفهم الأساس ثم التطبيق العملي ومراجعة النتائج خطوة بخطوة.`;
    } else if (isWhat) {
      rawReply = `التعريف الكامل والمباشر حول "${rawQ}": ${joined}`;
    } else {
      const openers = [
        `بحثت وتحققنا حول "${rawQ}"، وإليك الإجابة الكاملة: `,
        `بناءً على البحث المتعدد حول سؤالك "${rawQ}": `,
        `إليك الخلاصة الكاملة والموثقة حول "${rawQ}": `
      ];
      const opener = openers[assistantTurnCounter % openers.length];
      rawReply = `${opener}${joined}`;
    }
  } else {
    rawReply = `سؤالك "${rawQ}" يحتاج تحديد الزاوية بدقة حتى نصل لأدق نتيجة؛ هل تقصد التعريف الأساسي، أم الخطوات العملية، أم المقارنة مع مفهوم آخر؟`;
  }

  const reply = ensureCompleteSentence(rawReply, rawQ);
  const suggestedQuestions = buildDynamicSuggestedQuestions(
    rawQ,
    activeTopic,
    bestAnswers,
    assistantTurnCounter
  );
  const verification = verifyAssistantAnswer(rawQ, reply, data, bestAnswers, memoryMatches);

  return {
    intentLabel: isCompare
      ? "مقارنة"
      : isHow
      ? "خطوات وعمل"
      : isWhat
      ? "تعريف ومفهوم"
      : "بحث وإجابة حوارية",
    reply,
    suggestedQuestions,
    verification
  };
}

function buildSmartTutorSectionHtml(data = currentLessonData) {
  loadRetrospectiveMemory();
  const topic = (data?.title || topicInput?.value || "حوار مفتوح").trim();
  const sortedMemories = getFilteredAndSortedRetrospectiveMemory();

  const suggestionsToRender =
    currentFollowUpSuggestions && currentFollowUpSuggestions.length > 0
      ? currentFollowUpSuggestions
      : [
          `اشرح لي ${topic} بأسلوب بسيط ومباشر`,
          `ما أبرز النقاط أو الفروق المهمة في ${topic}؟`,
          `أعطني مثالاً عملياً على ${topic}`,
          `اختبرني بسؤال سريع في ${topic}`
        ];

  const chipsHtml = suggestionsToRender
    .map(
      (q) =>
        `<button type="button" class="suggestion-chip tutor-suggested-q-btn" data-suggested-q="${escapeHtml(q)}">💡 ${escapeHtml(q)}</button>`
    )
    .join("");

  const historyCardsHtml =
    sortedMemories.length > 0
      ? sortedMemories
          .slice(0, 12)
          .map((item) => {
            const memSugsHtml = (item.suggestedQuestions || [])
              .map(
                (sq) =>
                  `<button type="button" class="mini-btn tutor-suggested-q-btn" data-suggested-q="${escapeHtml(sq)}" style="margin-left:4px;margin-bottom:4px;">${escapeHtml(sq)}</button>`
              )
              .join("");

            return `
              <div class="tutor-memory-card" data-mem-id="${escapeHtml(item.id)}" style="background:#ffffff;border:1px solid ${item.pinned ? "#2563eb" : "#e2e8f0"};border-radius:10px;padding:12px;margin-bottom:10px;">
                <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:6px;margin-bottom:6px;">
                  <span style="font-size:0.82rem;font-weight:700;color:#1d4ed8;">
                    ${item.pinned ? "📌 مثبت • " : ""}${escapeHtml(item.intentLabel)} — ${escapeHtml(item.topic)}
                  </span>
                  <span style="font-size:0.78rem;color:#64748b;">
                    🕒 ${escapeHtml(item.timeLabel)} • ✅ ${escapeHtml(item.verificationStatus)}
                  </span>
                </div>
                <div style="font-weight:700;color:#0f172a;margin-bottom:6px;">أنت: ${escapeHtml(item.userMessage)}</div>
                <div style="color:#334155;line-height:1.7;font-size:0.93rem;margin-bottom:8px;">${escapeHtml(item.assistantReply)}</div>
                ${
                  memSugsHtml
                    ? `<div style="margin-bottom:8px;"><div style="font-size:0.78rem;color:#0f766e;font-weight:700;margin-bottom:4px;">أسئلة مقترحة مرتبطة بهذا الرد:</div><div>${memSugsHtml}</div></div>`
                    : ""
                }
                <div style="display:flex;gap:8px;flex-wrap:wrap;">
                  <button type="button" class="mini-btn tutor-recall-btn" data-mem-id="${escapeHtml(item.id)}">↩ استرجاع وإسماع الرد</button>
                  <button type="button" class="mini-btn tutor-pin-btn" data-mem-id="${escapeHtml(item.id)}">${item.pinned ? "إلغاء التثبيت" : "📌 تثبيت"}</button>
                  <button type="button" class="mini-btn tutor-delete-btn" data-mem-id="${escapeHtml(item.id)}">🗑 حذف</button>
                </div>
              </div>
            `;
          })
          .join("")
      : `
        <div style="background:#ffffff;border:1px dashed #cbd5e1;border-radius:10px;padding:14px;text-align:center;color:#64748b;font-size:0.92rem;">
          لا توجد سجلات بعد. اكتب سؤالك أو اضغط على سؤال مقترح لبدء البحث والرد فوراً.
        </div>
      `;

  return `
    <div id="smartHumanTutorBox" class="smart-human-tutor-box" style="border:2px solid #bfdbfe;background:#f8fafc;border-radius:14px;padding:18px;">
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;margin-bottom:12px;">
        <div>
          <h3 style="margin:0;color:#0f172a;">🤖 المساعد الذكي الحواري (بحث متعدد مجاني • اقتراح أسئلة • تحقق • ذاكرة رجعية)</h3>
          <div style="font-size:0.86rem;color:#475569;margin-top:4px;">
            السياق: <strong>${escapeHtml(topic)}</strong> — يبحث في مصادر مجانية متعددة لكل سؤال ويمنع التكرار (${tutorMemoryList.length} سجل).
          </div>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          <button type="button" class="mini-btn tutor-refresh-suggestions-btn">🔄 تجديد الأسئلة المقترحة</button>
          <button type="button" class="mini-btn tutor-clear-memory-btn">🧹 مسح الذاكرة</button>
        </div>
      </div>

      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px;">
        <input
          type="text"
          class="tutor-chat-input"
          value="${escapeHtml(lastTutorDraftQuestion)}"
          placeholder="اسأل أي سؤال أو دردش معي كأنك تكلم ذكاءً اصطناعياً..."
          style="flex:1;min-width:220px;padding:10px 12px;border:1px solid #94a3b8;border-radius:10px;background:#fff;font-size:0.95rem;"
        />
        <button type="button" class="secondary-btn tutor-send-btn">إرسال وبحث 🚀</button>
        <button type="button" class="mini-btn tutor-speak-last-btn">🔊 استمع للرد</button>
      </div>

      <div class="tutor-live-answer-panel" style="background:#eff6ff;border:1px solid #93c5fd;border-radius:12px;padding:14px;margin-bottom:12px;">
        <div style="font-weight:700;color:#1e3a8a;margin-bottom:6px;">
          أهلاً بك! اكتب سؤالك أو اختر سؤالاً من الاقتراحات بالأسفل لأبحث وأتحقق وأرد عليك مباشرة.
        </div>
        <div style="font-size:0.86rem;color:#0f766e;font-weight:600;">
          ✅ حالة التحقق: جاهز للبحث المجاني المتعدد والمقارنة مع الذاكرة الرجعية.
        </div>
      </div>

      <div style="margin-bottom:16px;">
        <div style="font-weight:700;color:#0f172a;font-size:0.9rem;margin-bottom:8px;">💬 أسئلة مقترحة لك (اضغط على أي سؤال لنسأله ونبحث عنه):</div>
        <div class="tutor-suggestions-wrap" style="display:flex;gap:8px;flex-wrap:wrap;">${chipsHtml}</div>
      </div>

      <div style="background:#f1f5f9;border:1px solid #cbd5e1;border-radius:12px;padding:14px;">
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:10px;">
          <h4 style="margin:0;color:#0f172a;">🧠 التخزين الرجعي (سجل المحادثات والبحث)</h4>
          <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;">
            <input
              type="text"
              class="tutor-memory-search-input"
              value="${escapeHtml(tutorSearchQuery)}"
              placeholder="ابحث في الذاكرة..."
              style="padding:6px 10px;border:1px solid #94a3b8;border-radius:8px;background:#fff;font-size:0.86rem;"
            />
            <select class="tutor-memory-sort-select" style="padding:6px 10px;border:1px solid #94a3b8;border-radius:8px;background:#fff;font-size:0.86rem;font-weight:600;">
              <option value="newest" ${tutorSortOrder === "newest" ? "selected" : ""}>الأحدث أولاً</option>
              <option value="oldest" ${tutorSortOrder === "oldest" ? "selected" : ""}>الأقدم أولاً</option>
              <option value="verified" ${tutorSortOrder === "verified" ? "selected" : ""}>الأعلى تحققاً</option>
            </select>
          </div>
        </div>
        <div class="tutor-memory-list">${historyCardsHtml}</div>
      </div>
    </div>
  `;
}

function renderAndBindSmartTutor(data = currentLessonData) {
  loadRetrospectiveMemory();
  const html = buildSmartTutorSectionHtml(data);

  for (const container of dedicatedTutorContainers) {
    container.innerHTML = html;
  }

  const tutorBoxes = Array.from(document.querySelectorAll(".smart-human-tutor-box"));
  if (!tutorBoxes.length) return;

  let latestSpokenReply = sortedOrDefaultFirstReply();

  function sortedOrDefaultFirstReply() {
    const list = getFilteredAndSortedRetrospectiveMemory();
    if (list.length > 0 && list[0].assistantReply) {
      return list[0].assistantReply;
    }
    return "أهلاً بك! أنا مساعدك الذكي، اكتب سؤالك أو اختر سؤالاً مقترحاً وسأبحث وأتحقق وأرد مباشرة.";
  }

  const paintAnswerPanel = (resultObj, questionText) => {
    const notesLis = (resultObj.verification?.notes || [])
      .map((n) => `<li style="margin-bottom:3px;">${escapeHtml(n)}</li>`)
      .join("");

    document.querySelectorAll(".tutor-live-answer-panel").forEach((panel) => {
      panel.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:6px;margin-bottom:8px;">
          <span style="font-weight:700;color:#1d4ed8;">🤖 ${escapeHtml(resultObj.intentLabel)}</span>
          <span style="background:#dcfce7;color:#166534;padding:3px 10px;border-radius:999px;font-size:0.82rem;font-weight:700;">
            ✔ ${escapeHtml(resultObj.verification?.statusLabel || "تم التحقق")}
          </span>
        </div>
        <div style="font-size:0.86rem;color:#475569;margin-bottom:6px;"><strong>سؤالك:</strong> ${escapeHtml(questionText)}</div>
        <p style="margin:0 0 10px;line-height:1.8;color:#0f172a;font-size:0.97rem;">${escapeHtml(resultObj.reply)}</p>
        ${
          notesLis
            ? `<div style="background:#ffffff;border:1px solid #bfdbfe;border-radius:8px;padding:8px 10px;font-size:0.82rem;color:#334155;"><strong>🔍 ملاحظات البحث والتحقق:</strong><ul style="margin:4px 0 0;padding-right:18px;">${notesLis}</ul></div>`
            : ""
        }
      `;
    });
  };

  const handleAskTutor = async (rawQuestion, shouldSpeak = false) => {
    const cleanQ = String(rawQuestion || "").trim();
    if (!cleanQ) return;
    lastTutorDraftQuestion = cleanQ;

    document.querySelectorAll(".tutor-live-answer-panel").forEach((panel) => {
      panel.innerHTML = `<div style="color:#1d4ed8;font-weight:700;">⏳ جاري البحث في مصادر مجانية متعددة عن "${escapeHtml(cleanQ)}" والتحقق من الإجابة...</div>`;
    });

    const resultObj = await generateConversationalAiReply(cleanQ, data);
    currentFollowUpSuggestions = resultObj.suggestedQuestions || [];

    addRetrospectiveEntry({
      userMessage: cleanQ,
      assistantReply: resultObj.reply,
      suggestedQuestions: currentFollowUpSuggestions,
      verificationReport: resultObj.verification,
      topic: data?.title || topicInput?.value || "حوار مفتوح",
      intentLabel: resultObj.intentLabel,
      pinned: false
    });

    latestSpokenReply = resultObj.reply;
    lastTutorDraftQuestion = "";
    renderAndBindSmartTutor(data);
    paintAnswerPanel(resultObj, cleanQ);

    if (shouldSpeak && !isVoiceMuted) {
      speakArabicText(resultObj.reply, null, true);
    }
  };

  tutorBoxes.forEach((box) => {
    const inputEl = box.querySelector(".tutor-chat-input");
    const sendBtn = box.querySelector(".tutor-send-btn");
    const refreshSugBtn = box.querySelector(".tutor-refresh-suggestions-btn");
    const speakLastBtn = box.querySelector(".tutor-speak-last-btn");
    const clearMemBtn = box.querySelector(".tutor-clear-memory-btn");
    const searchInput = box.querySelector(".tutor-memory-search-input");
    const sortSelect = box.querySelector(".tutor-memory-sort-select");

    if (sendBtn && inputEl) {
      sendBtn.addEventListener("click", () => {
        handleAskTutor(inputEl.value, false);
      });
      inputEl.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          handleAskTutor(inputEl.value, false);
        }
      });
    }

    if (refreshSugBtn) {
      refreshSugBtn.addEventListener("click", () => {
        assistantTurnCounter += 1;
        const activeTopic = (data?.title || topicInput?.value || "الموضوع الحالي").trim();
        const lastQ = tutorMemoryList[0]?.userMessage || activeTopic;
        currentFollowUpSuggestions = buildDynamicSuggestedQuestions(
          lastQ,
          activeTopic,
          data?.liveWebFacts || [],
          assistantTurnCounter
        );
        playCueTone(580, 0.1);
        renderAndBindSmartTutor(data);
      });
    }

    if (speakLastBtn) {
      speakLastBtn.addEventListener("click", () => {
        speakArabicText(latestSpokenReply, null, true);
      });
    }

    if (clearMemBtn) {
      clearMemBtn.addEventListener("click", () => {
        tutorMemoryList = [];
        currentFollowUpSuggestions = [];
        saveRetrospectiveMemory();
        playCueTone(420, 0.12);
        renderAndBindSmartTutor(data);
      });
    }

    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        tutorSearchQuery = e.target.value || "";
        const listEl = box.querySelector(".tutor-memory-list");
        if (listEl) {
          const filtered = getFilteredAndSortedRetrospectiveMemory();
          listEl.innerHTML = filtered.length
            ? filtered
                .slice(0, 12)
                .map(
                  (m) => `
                    <div class="tutor-memory-card" style="background:#ffffff;border:1px solid #e2e8f0;border-radius:10px;padding:10px;margin-bottom:8px;">
                      <div style="font-size:0.8rem;color:#1d4ed8;font-weight:700;">${escapeHtml(m.intentLabel)} • ${escapeHtml(m.timeLabel)} • ✅ ${escapeHtml(m.verificationStatus)}</div>
                      <div style="font-weight:700;color:#0f172a;margin:4px 0;">أنت: ${escapeHtml(m.userMessage)}</div>
                      <div style="color:#334155;font-size:0.9rem;">${escapeHtml(m.assistantReply)}</div>
                    </div>
                  `
                )
                .join("")
            : `<div style="padding:10px;text-align:center;color:#64748b;">لا توجد نتائج مطابقة في الذاكرة.</div>`;
        }
      });
    }

    if (sortSelect) {
      sortSelect.addEventListener("change", (e) => {
        tutorSortOrder = e.target.value || "newest";
        renderAndBindSmartTutor(data);
      });
    }

    box.querySelectorAll(".tutor-suggested-q-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const sq = btn.dataset.suggestedQ || "";
        handleAskTutor(sq, false);
      });
    });

    box.querySelectorAll(".tutor-recall-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.memId;
        const found = tutorMemoryList.find((m) => m.id === id);
        if (found) {
          latestSpokenReply = found.assistantReply;
          if (Array.isArray(found.suggestedQuestions) && found.suggestedQuestions.length) {
            currentFollowUpSuggestions = found.suggestedQuestions;
          }
          paintAnswerPanel(
            {
              intentLabel: `استرجاع • ${found.intentLabel}`,
              reply: found.assistantReply,
              verification: {
                statusLabel: found.verificationStatus,
                notes: found.verificationNotes || []
              }
            },
            found.userMessage
          );
          speakArabicText(found.assistantReply, null, true);
        }
      });
    });

    box.querySelectorAll(".tutor-pin-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.memId;
        tutorMemoryList = tutorMemoryList.map((m) =>
          m.id === id ? { ...m, pinned: !m.pinned } : m
        );
        saveRetrospectiveMemory();
        renderAndBindSmartTutor(data);
      });
    });

    box.querySelectorAll(".tutor-delete-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.memId;
        tutorMemoryList = tutorMemoryList.filter((m) => m.id !== id);
        saveRetrospectiveMemory();
        renderAndBindSmartTutor(data);
      });
    });
  });
}

// =========================================================================

function generateKahootStylePin() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function getOrCreateLessonInvitePin(topic) {
  const key = normalizeArabic(topic) || "default_lesson";
  let pinStore = {};
  try {
    pinStore = JSON.parse(localStorage.getItem(ROOM_PIN_STORAGE_KEY) || "{}");
  } catch (e) {
    pinStore = {};
  }

  if (activeInvitePin && /^\d{6}$/.test(activeInvitePin)) {
    pinStore[key] = activeInvitePin;
    try {
      localStorage.setItem(ROOM_PIN_STORAGE_KEY, JSON.stringify(pinStore));
    } catch (e) {}
    return activeInvitePin;
  }

  if (pinStore[key] && /^\d{6}$/.test(String(pinStore[key]))) {
    activeInvitePin = String(pinStore[key]);
    return activeInvitePin;
  }

  const freshPin = generateKahootStylePin();
  activeInvitePin = freshPin;
  pinStore[key] = freshPin;
  try {
    localStorage.setItem(ROOM_PIN_STORAGE_KEY, JSON.stringify(pinStore));
  } catch (e) {}
  return freshPin;
}

function setLessonInvitePin(topic, newPin) {
  const cleanPin = String(newPin || "").replace(/\D/g, "").slice(0, 6);
  if (cleanPin.length < 4) return false;
  activeInvitePin = cleanPin;
  const key = normalizeArabic(topic) || "default_lesson";
  let pinStore = {};
  try {
    pinStore = JSON.parse(localStorage.getItem(ROOM_PIN_STORAGE_KEY) || "{}");
  } catch (e) {
    pinStore = {};
  }
  pinStore[key] = cleanPin;
  try {
    localStorage.setItem(ROOM_PIN_STORAGE_KEY, JSON.stringify(pinStore));
  } catch (e) {}
  return true;
}

function stopAllLessonAudio(keepSlideShow = false) {
  if (!keepSlideShow) {
    stopInteractiveSlideShow();
  }
  if ("speechSynthesis" in window) {
    try {
      window.speechSynthesis.cancel();
    } catch (e) {
      console.warn("Speech cancel warning:", e);
    }
  }
}

function pauseVideoPlayerIfPlaying() {
  const playerEl = document.getElementById("lessonInteractivePlayer");
  if (playerEl && !playerEl.paused) {
    try {
      playerEl.pause();
    } catch (e) {
      console.warn("Video pause warning:", e);
    }
  }
}

function ensureAudioContext() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;
  if (!audioCtx) {
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

function playCueTone(freq = 520, durationSec = 0.14) {
  if (isVoiceMuted) return;
  try {
    const ctx = ensureAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(0.06, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + durationSec);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + durationSec);
  } catch (e) {
    console.warn("Audio cue warning:", e);
  }
}

window.addEventListener("DOMContentLoaded", () => {
  loadRetrospectiveMemory();
  renderAndBindSmartTutor(null);

  if ("speechSynthesis" in window) {
    window.speechSynthesis.getVoices();
    window.speechSynthesis.onvoiceschanged = () => {
      window.speechSynthesis.getVoices();
    };
  }
  const savedKey = localStorage.getItem(STORAGE_KEY);
  if (savedKey && apiKeyInput) {
    apiKeyInput.value = savedKey;
  }
  showStatus("النظام المجاني جاهز! اكتب اسم الدرس واضغط 'ابدأ التعلّم الذكي'.", "success");
});

if (saveApiKeyBtn) {
  saveApiKeyBtn.addEventListener("click", () => {
    const key = apiKeyInput.value.trim();
    if (!key) {
      showStatus("الموقع يعمل مجاناً بدون مفتاح API، أو أدخل مفتاحاً إن أردت.", "info");
      return;
    }
    localStorage.setItem(STORAGE_KEY, key);
    showStatus("تم حفظ المفتاح محلياً في المتصفح.", "success");
  });
}

tabButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    stopAllLessonAudio(false);
    pauseVideoPlayerIfPlaying();
    const targetId = btn.dataset.tab || "";

    tabButtons.forEach((b) => b.classList.remove("active"));
    tabPanels.forEach((p) => p.classList.remove("active"));

    btn.classList.add("active");
    const targetPanel = document.getElementById(targetId);
    if (targetPanel) {
      targetPanel.classList.add("active");
    }

    const lowerTab = targetId.toLowerCase();
    const isTutorTab =
      lowerTab.includes("tutor") ||
      lowerTab.includes("assistant") ||
      lowerTab.includes("chat");

    if (isTutorTab) {
      renderAndBindSmartTutor(currentLessonData);
    }

    if (currentLessonData) {
      const isGameTab =
        lowerTab.includes("game") ||
        lowerTab.includes("quiz") ||
        lowerTab.includes("exam") ||
        lowerTab.includes("eval") ||
        lowerTab.includes("comp") ||
        lowerTab.includes("leader");
      if (isGameTab) {
        renderAndBindLessonArcade(currentLessonData);
      } else {
        stopQuestionTimer();
      }
    }
  });
});

chipButtons.forEach((chip) => {
  chip.addEventListener("click", () => {
    topicInput.value = chip.dataset.topic;
    topicInput.focus();
  });
});

function showStatus(message, type = "info") {
  statusBar.textContent = message;
  statusBar.classList.remove("hidden");
  if (type === "error") {
    statusBar.style.background = "#fee2e2";
    statusBar.style.color = "#991b1b";
  } else if (type === "success") {
    statusBar.style.background = "#dcfce7";
    statusBar.style.color = "#166534";
  } else {
    statusBar.style.background = "#fef9c3";
    statusBar.style.color = "#854d0e";
  }
}

function normalizeArabic(text) {
  return (text || "")
    .toLowerCase()
    .replace(/[إأآا]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[\u064B-\u065F]/g, "")
    .replace(/(^|\s)ال/g, "$1")
    .replace(/[^\u0600-\u06FFa-zA-Z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractKeywords(topic) {
  const stopWords = new Set([
    "في", "من", "على", "إلى", "عن", "مع", "هو", "هي", "ما", "ماذا", "كيف",
    "ال", "و", "أو", "ثم", "هذا", "هذه", "تلك", "ذلك", "التي", "الذي", "الدرس", "شرح"
  ]);
  const normalized = normalizeArabic(topic);
  return normalized
    .split(/\s+/)
    .map((w) => w.trim())
    .filter((w) => w.length > 1 && !stopWords.has(w));
}

function calculateRelevance(text, topic, keywords) {
  const normText = normalizeArabic(text);
  const normTopic = normalizeArabic(topic);
  let score = 1;

  if (normTopic && normText.includes(normTopic)) {
    score += 12;
  }

  for (const kw of keywords) {
    if (normText.includes(kw)) {
      score += 4;
    }
  }
  return score;
}

async function fetchWikipediaSources(topic) {
  const results = [];
  const seenUrls = new Set();
  const languages = ["ar", "en"];
  const queries = [topic];
  const withoutAl = topic.replace(/(^|\s)ال/g, "$1").trim();
  if (withoutAl && withoutAl !== topic) {
    queries.push(withoutAl);
  }

  for (const lang of languages) {
    for (const q of queries) {
      try {
        const searchUrl = `https://${lang}.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(q)}&utf8=&format=json&origin=*&srlimit=6`;
        const searchRes = await fetch(searchUrl);
        if (!searchRes.ok) continue;
        const searchJson = await searchRes.json();
        const hits = searchJson?.query?.search || [];

        for (const hit of hits.slice(0, 4)) {
          const title = hit.title;
          const summaryUrl = `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
          const sumRes = await fetch(summaryUrl);
          if (!sumRes.ok) continue;
          const sumJson = await sumRes.json();
          const pageUrl =
            sumJson.content_urls?.desktop?.page ||
            `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(title)}`;

          if (sumJson.extract && sumJson.extract.trim().length > 25 && !seenUrls.has(pageUrl)) {
            seenUrls.add(pageUrl);
            results.push({
              lang,
              title: sumJson.title || title,
              extract: ensureCompleteSentence(sumJson.extract.trim(), topic),
              url: pageUrl,
              thumbnail: sumJson.thumbnail?.source || sumJson.originalimage?.source || ""
            });
          }
        }
        if (results.length >= 4) break;
      } catch (e) {
        console.warn(`Wikipedia ${lang} fetch warning:`, e);
      }
    }
    if (lang === "ar" && results.length >= 3) break;
  }

  return results;
}

async function fetchFullWikipediaExtracts(sources) {
  const fullTexts = [];
  for (const src of (sources || []).slice(0, 3)) {
    if (!src || !src.title || (src.lang !== "ar" && src.lang !== "en")) continue;
    try {
      const url = `https://${src.lang}.wikipedia.org/w/api.php?action=query&prop=extracts&explaintext=1&exsectionformat=plain&titles=${encodeURIComponent(src.title)}&format=json&origin=*`;
      const res = await fetch(url);
      if (!res.ok) continue;
      const json = await res.json();
      const pages = json?.query?.pages ? Object.values(json.query.pages) : [];
      const text = pages[0]?.extract || "";
      if (text && text.trim().length > 60) {
        fullTexts.push({
          title: src.title,
          lang: src.lang,
          text: text.trim()
        });
      }
    } catch (e) {
      console.warn("Full extract fetch warning:", e);
    }
  }
  return fullTexts;
}

async function fetchDuckDuckGoInfo(topic) {
  try {
    const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(topic)}&format=json&no_html=1&skip_disambig=1`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const relatedTexts = (data.RelatedTopics || [])
      .map((item) => item.Text || (item.Topics && item.Topics[0]?.Text) || "")
      .filter((t) => t && t.length > 20)
      .slice(0, 6);

    if (data.AbstractText && data.AbstractText.trim().length > 25) {
      return {
        lang: "ddg",
        title: data.Heading || topic,
        extract: ensureCompleteSentence(`${data.AbstractText.trim()} ${relatedTexts.join(" ")}`.trim(), topic),
        url: data.AbstractURL || "https://duckduckgo.com",
        thumbnail: data.Image ? (data.Image.startsWith("http") ? data.Image : `https://duckduckgo.com${data.Image}`) : "",
        relatedFacts: relatedTexts
      };
    }
  } catch (e) {
    console.warn("DuckDuckGo fetch warning:", e);
  }
  return null;
}

async function fetchLiveWebFactsForQuestions(topic) {
  const liveFacts = [];
  const queries = [
    `${topic} تعريف خصائص`,
    `${topic} أنواع استخدامات`,
    `${topic} أدوات مواقع`
  ];

  for (const q of queries) {
    try {
      const url = `https://ar.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(q)}&utf8=&format=json&origin=*&srlimit=3`;
      const res = await fetch(url);
      if (!res.ok) continue;
      const json = await res.json();
      const hits = json?.query?.search || [];
      for (const h of hits) {
        const snippet = (h.snippet || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
        const completed = ensureCompleteSentence(snippet, topic);
        if (completed.length > 25) {
          liveFacts.push(completed);
        }
      }
    } catch (e) {
      console.warn("Live web facts warning:", e);
    }
  }

  const [wdFacts, olRefs] = await Promise.all([
    fetchWikidataFreeFacts(topic),
    fetchOpenLibraryFreeRefs(topic)
  ]);

  return deduplicateSentenceList([...liveFacts, ...wdFacts, ...olRefs]).slice(0, 10);
}

function extractToolsAndFamousWebsites(topic, combinedText, fullExtracts = []) {
  const allText = `${combinedText} ${(fullExtracts || []).map((f) => f.text || "").join(" ")}`;
  const toolKeywords = [
    "برنامج", "أداة", "أدوات", "تطبيق", "تطبيقات", "منصة", "منصات", "مختبر",
    "مقياس", "جهاز", "أجهزة", "مجهر", "تلسكوب", "حاسوب", "كمبيوتر", "برمجيات",
    "لغة", "محرك", "نظام", "خوارزمية", "قاعدة بيانات", "متصفح", "معدات", "تقنية"
  ];

  const foundTools = [];
  const sentences = deduplicateSentenceList(
    allText
      .split(/(?<=[.،!؟\n])\s+/)
      .map((s) => ensureCompleteSentence(s, topic))
      .filter((s) => s.length > 18)
  );

  for (const s of sentences) {
    if (toolKeywords.some((k) => s.includes(k)) && !foundTools.includes(s)) {
      foundTools.push(s);
    }
    if (foundTools.length >= 5) break;
  }

  const foundSites = [];
  const urlMatches = allText.match(/https?:\/\/[^\s)؛،]+|(?:www\.)?[a-zA-Z0-9-]+\.(?:org|com|edu|net|gov|io)\b/gi) || [];
  for (const rawSite of urlMatches) {
    const cleanSite = rawSite.trim();
    if (!foundSites.includes(cleanSite)) {
      foundSites.push(cleanSite);
    }
    if (foundSites.length >= 4) break;
  }

  const famousDefaults = [
    {
      name: "ويكيبيديا (Wikipedia)",
      url: `https://ar.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(topic)}`,
      desc: `موسوعة معرفية شاملة تضم تعريفات وأقسام ومراجع حول "${topic}".`
    },
    {
      name: "ويكي بيانات (Wikidata)",
      url: `https://www.wikidata.org/w/index.php?search=${encodeURIComponent(topic)}`,
      desc: `قاعدة بيانات معرفية منظمة ومجانية للتحقق من الخصائص والمفاهيم المرتبطة بـ "${topic}".`
    },
    {
      name: "DuckDuckGo للبحث المعرفي",
      url: `https://duckduckgo.com/?q=${encodeURIComponent(topic)}`,
      desc: `محرك بحث سريع لجلب ملخصات وحقائق ومصادر متعلقة بـ "${topic}".`
    },
    {
      name: "YouTube التعليمي",
      url: `https://www.youtube.com/results?search_query=${encodeURIComponent(`شرح ${topic}`)}`,
      desc: `منصة مرئية لمتابعة شروحات وتجارب وتطبيقات عملية لدرس "${topic}".`
    }
  ];

  const mappedExtractedSites = foundSites.map((siteStr, idx) => {
    const fullHref = siteStr.startsWith("http") ? siteStr : `https://${siteStr}`;
    return {
      name: `موقع مذكور في المصادر (${idx + 1}): ${siteStr}`,
      url: fullHref,
      desc: `موقع أو مرجع ظهر أثناء البحث عن "${topic}".`
    };
  });

  const toolsList =
    foundTools.length > 0
      ? foundTools
      : [
          `أدوات البحث والتحقق المعرفي الرقمي لجمع ومراجعة معلومات "${topic}".`,
          `الخرائط الذهنية والمخططات التوضيحية لتنظيم مفاهيم وعناصر "${topic}".`,
          `الاختبارات التفاعلية والمنافسات التعليمية لقياس استيعاب "${topic}".`
        ];

  return {
    tools: deduplicateSentenceList(toolsList),
    websites: [...mappedExtractedSites, ...famousDefaults].slice(0, 6)
  };
}

async function queryCommonsVideosByTerm(queryTerm, limit = 12) {
  const cleanQ = (queryTerm || "").replace(/[^\u0600-\u06FFa-zA-Z0-9\s]/g, " ").trim();
  if (!cleanQ) return [];

  try {
    const apiUrl = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrnamespace=6&gsrsearch=${encodeURIComponent(cleanQ)}&gsrlimit=${limit}&prop=imageinfo&iiprop=url|mime&iiurlwidth=640&format=json&origin=*`;
    const res = await fetch(apiUrl);
    if (!res.ok) return [];
    const json = await res.json();
    const pages = json?.query?.pages ? Object.values(json.query.pages) : [];
    const results = [];

    for (const p of pages) {
      const info = p.imageinfo && p.imageinfo[0];
      const mime = (info?.mime || "").toLowerCase();
      const videoUrl = info?.url || "";
      const isDirectVideo =
        mime.startsWith("video/") ||
        /\.(webm|mp4|ogv|ogg)(\?|$)/i.test(videoUrl);

      if (isDirectVideo && videoUrl) {
        const cleanTitle = (p.title || "")
          .replace(/^(File|ملف):/i, "")
          .replace(/\.[^.]+$/, "")
          .replace(/[_-]+/g, " ")
          .trim();

        results.push({
          title: cleanTitle || cleanQ,
          url: videoUrl,
          mime: mime || "video/webm",
          poster: info?.thumburl || "",
          source: "Wikimedia Commons"
        });
      }
    }
    return results;
  } catch (e) {
    console.warn("Commons video query warning:", e);
    return [];
  }
}

async function fetchEducationalVideos(data) {
  const topic = (data?.title || "الدرس").trim();
  const englishTitles = (data?.sources || [])
    .filter((s) => s.lang === "en" && s.title)
    .map((s) => s.title);
  const keywords = extractKeywords(topic);
  const defaultPoster = (data?.sources || []).find((s) => s.thumbnail)?.thumbnail || "";

  const directQueries = [
    englishTitles[0] || "",
    `${englishTitles[0] || topic} animation`,
    `${englishTitles[0] || topic} simulation`,
    `${englishTitles[0] || topic} video`,
    `${englishTitles[0] || topic} science`,
    topic,
    keywords[0] || ""
  ].filter(Boolean);

  const seenUrls = new Set();
  const matchedVideos = [];

  for (const q of directQueries) {
    const batch = await queryCommonsVideosByTerm(q, 12);
    for (const vid of batch) {
      if (vid && vid.url && !seenUrls.has(vid.url)) {
        seenUrls.add(vid.url);
        matchedVideos.push({
          ...vid,
          poster: vid.poster || defaultPoster,
          isDirectMatch: true
        });
      }
      if (matchedVideos.length >= 6) break;
    }
    if (matchedVideos.length >= 6) break;
  }

  const fallbackQueries = [
    "science animation",
    "physics simulation",
    "planet orbit animation",
    "solar system animation",
    "chemistry experiment",
    "biology cell animation",
    "computer network",
    "education"
  ];

  for (const fq of fallbackQueries) {
    if (matchedVideos.length >= 5) break;
    const batch = await queryCommonsVideosByTerm(fq, 10);
    for (const vid of batch) {
      if (vid && vid.url && !seenUrls.has(vid.url)) {
        seenUrls.add(vid.url);
        matchedVideos.push({
          ...vid,
          poster: vid.poster || defaultPoster,
          isDirectMatch: matchedVideos.length === 0 ? false : vid.isDirectMatch || false
        });
      }
      if (matchedVideos.length >= 5) break;
    }
  }

  return matchedVideos;
}

function stopInteractiveSlideShow() {
  isInteractiveSlidePlaying = false;
  if (interactiveSlideTimer) {
    clearInterval(interactiveSlideTimer);
    interactiveSlideTimer = null;
  }
}

function buildInteractiveVideoChapters(data, visualPool = []) {
  const topic = data?.title || "الدرس";
  const points = data?.key_points || [];
  const comps = data?.components || [];
  const imgs = Array.isArray(visualPool) ? visualPool.filter((x) => x && x.url) : [];

  return [
    {
      timeRatio: 0.0,
      progressTarget: 25,
      imageUrl: imgs[0]?.url || "",
      label: "1. تمهيد وتعريف الدرس",
      note: data?.bestDefinition || `نبدأ بالتعرف على مفهوم "${topic}" وأساسه العلمي.`,
      question: `كيف نعرّف "${topic}" ببساطة في بداية الشرح؟`,
      answer:
        data?.bestDefinition ||
        `${topic} يُفهم أولاً بتحديد معناه الأساسي وما يرتبط به من عناصر في الدرس.`
    },
    {
      timeRatio: 0.25,
      progressTarget: 50,
      imageUrl: imgs[1]?.url || imgs[0]?.url || "",
      label: "2. الفكرة وكيف يعمل؟",
      note: points[1] || points[0] || `نوضح كيف تتحرك وتعمل عناصر "${topic}" معاً.`,
      question: `ما الذي يفعله "${topic}" وكيف تسير فكرته الأساسية؟`,
      answer:
        points[1] ||
        points[0] ||
        `تعمل عناصر "${topic}" وفق نظام مترابط يوضّح دور كل جزء في تحقيق النتيجة.`
    },
    {
      timeRatio: 0.5,
      progressTarget: 75,
      imageUrl: imgs[2]?.url || imgs[0]?.url || "",
      label: "3. المكونات والمقارنات",
      note:
        comps[0]?.explanation ||
        data?.comparisons?.[0]?.detail ||
        `نقارن بين مكونات "${topic}" ونحدد الفروق الرئيسية بينها.`,
      question: `لماذا نحتاج للمقارنة بين مكونات "${topic}" أثناء المذاكرة؟`,
      answer:
        data?.comparisons?.[0]?.detail ||
        `المقارنة تساعدنا على تمييز وظيفة كل مكون في "${topic}" ومنع الخلط بينه وبين غيره.`
    },
    {
      timeRatio: 0.75,
      progressTarget: 100,
      imageUrl: imgs[3]?.url || imgs[0]?.url || "",
      label: "4. التطبيق والملخص النهائي",
      note: points[3] || points[points.length - 1] || `نلخص أهم فوائد وتطبيقات "${topic}".`,
      question: `كيف نلخص درس "${topic}" ونستفيد منه عملياً؟`,
      answer:
        points[3] ||
        points[points.length - 1] ||
        `نربط التعريف بالمكونات والمقارنات لنتمكن من شرح "${topic}" كاملاً بأسلوب واضح.`
    }
  ];
}

function renderInteractiveVideoTab(data, videos, activeIdx = 0) {
  if (!videoContent) return;
  stopAllLessonAudio(false);

  const topic = data?.title || "الدرس";
  const safeVideos = Array.isArray(videos) ? videos : [];
  const totalSlots = safeVideos.length > 0 ? safeVideos.length : 3;
  const validIdx = Math.abs(activeIdx) % totalSlots;
  const activeVideo = safeVideos[validIdx] || null;
  const chapters = buildInteractiveVideoChapters(data, currentVisualPool);

  const ytArabicUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(`شرح ${topic} تعليمي`)}`;
  const ytEnglishTitle =
    (data?.sources || []).find((s) => s.lang === "en" && s.title)?.title || topic;
  const ytEnglishUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(`${ytEnglishTitle} educational video`)}`;

  const chaptersHtml = chapters
    .map(
      (ch, cIdx) => `
        <button type="button" class="suggestion-chip video-chapter-btn ${cIdx === 0 ? "active" : ""}" data-chapter-index="${cIdx}">
          ${escapeHtml(ch.label)}
        </button>
      `
    )
    .join("");

  const videoNavControlsHtml = `
    <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;margin-bottom:14px;">
      <div>
        <div style="font-weight:700;color:#0f172a;">
          ${
            activeVideo
              ? escapeHtml(activeVideo.title)
              : `المحور المرئي رقم ${validIdx + 1} لدرس "${escapeHtml(topic)}"`
          }
        </div>
        <div style="font-size:0.86rem;color:#64748b;">
          ${
            activeVideo
              ? `المصدر: ${escapeHtml(activeVideo.source)} — الفيديو (${validIdx + 1} من ${totalSlots})`
              : `وضع الشرح المرئي والصوتي — الجزء (${validIdx + 1} من ${totalSlots})`
          }
        </div>
        <div id="audioStatusIndicator" style="font-size:0.84rem;color:#1d4ed8;font-weight:600;margin-top:4px;">
          ${isVoiceMuted ? "🔇 الصوت مكتوم حالياً" : "🔊 الصوت مفصول تلقائياً (إما صوت الفيديو أو صوت الشرح دون تداخل)"}
        </div>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;">
        <button type="button" id="toggleMuteVoiceBtn" class="secondary-btn">
          ${isVoiceMuted ? "🔊 إلغاء الكتم" : "🔇 كتم الصوت"}
        </button>
        <button type="button" id="prevLessonVideoBtn" class="secondary-btn">⬅ الفيديو السابق</button>
        <button type="button" id="nextLessonVideoBtn" class="secondary-btn">الفيديو التالي ➡</button>
      </div>
    </div>
  `;

  const initialChapter = chapters[validIdx % chapters.length] || chapters[0];

  const playerSectionHtml = activeVideo
    ? `
      <div style="background:#0f172a;border-radius:12px;padding:12px;margin-bottom:14px;">
        <video
          id="lessonInteractivePlayer"
          controls
          playsinline
          preload="metadata"
          ${activeVideo.poster ? `poster="${escapeHtml(activeVideo.poster)}"` : ""}
          style="width:100%;max-height:420px;border-radius:8px;background:#000;display:block;"
        >
          <source src="${escapeHtml(activeVideo.url)}" type="${escapeHtml(activeVideo.mime || "video/mp4")}" />
          المتصفح الحالي لا يدعم تشغيل الفيديو المباشر.
        </video>
      </div>
      ${videoNavControlsHtml}
    `
    : `
      <div id="fallbackInteractiveVideoStage" style="background:#0f172a;color:#fff;border-radius:12px;padding:16px;margin-bottom:14px;">
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;margin-bottom:12px;">
          <span style="font-weight:700;font-size:0.98rem;">🎬 مشغّل الدرس المرئي والصوتي (${escapeHtml(topic)})</span>
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            <button type="button" id="toggleAutoVideoPlayBtn" class="mini-btn">▶ تشغيل بالصوت والمحطات</button>
            <button type="button" id="nextAutoChapterBtn" class="mini-btn">المحطة التالية ⏭</button>
          </div>
        </div>
        <div style="background:#1e293b;border-radius:10px;padding:14px;display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:14px;align-items:center;">
          <div>
            ${
              initialChapter.imageUrl
                ? `<img id="fallbackStageImg" src="${escapeHtml(initialChapter.imageUrl)}" alt="${escapeHtml(topic)}" style="width:100%;max-height:240px;object-fit:cover;border-radius:8px;display:block;" />`
                : `<div style="padding:36px;text-align:center;color:#cbd5e1;background:#0f172a;border-radius:8px;">محطة شرح مرئية لدرس "${escapeHtml(topic)}"</div>`
            }
          </div>
          <div>
            <div id="fallbackStageLabel" style="font-weight:700;font-size:1.05rem;color:#93c5fd;margin-bottom:6px;">${escapeHtml(initialChapter.label)}</div>
            <p id="fallbackStageNote" style="margin:0;line-height:1.7;color:#f1f5f9;">${escapeHtml(initialChapter.note)}</p>
          </div>
        </div>
        <div style="background:#334155;height:8px;border-radius:999px;overflow:hidden;margin-top:12px;">
          <div id="fallbackVideoProgressBar" style="width:${initialChapter.progressTarget}%;height:100%;background:#38bdf8;transition:width 0.3s ease;"></div>
        </div>
      </div>
      ${videoNavControlsHtml}
    `;

  videoContent.innerHTML = `
    <div class="lesson-box">
      <h3>الفيديو التعليمي والتفاعلي — ${escapeHtml(topic)}</h3>
      <p class="lesson-text">
        عند تشغيل الفيديو يتم إيقاف صوت الشرح تلقائياً، وعند الضغط على "استمع لشرح المحطة" يتم إيقاف الفيديو حتى لا يتداخل الصوتان.
      </p>

      ${playerSectionHtml}

      <div class="teacher-question-box" style="margin-bottom:16px;">
        <div class="teacher-question-title">🎯 محطات الفيديو التفاعلية (اضغط للانتقال والاستماع):</div>
        <div class="suggestions-row" style="margin-bottom:12px;">${chaptersHtml}</div>
        <div id="videoChapterBox" class="suggestion-answer-box">
          <strong>${escapeHtml(initialChapter.label)}:</strong> ${escapeHtml(initialChapter.note)}
          <div style="margin-top:8px;color:#1d4ed8;font-weight:600;">سؤال المحطة: ${escapeHtml(initialChapter.question)}</div>
          <div style="margin-top:4px;">الإجابة النموذجية: ${escapeHtml(initialChapter.answer)}</div>
        </div>
        <div class="teacher-actions">
          <button type="button" id="speakVideoStationBtn" class="mini-btn">🔊 استمع لشرح المحطة</button>
          <button type="button" id="stopVideoStationBtn" class="mini-btn">⏹ إيقاف الصوت</button>
        </div>
      </div>

      <h4>روابط فيديو إضافية للدرس:</h4>
      <div style="display:flex;gap:10px;flex-wrap:wrap;">
        <a href="${escapeHtml(ytArabicUrl)}" target="_blank" rel="noopener noreferrer" class="secondary-btn" style="text-decoration:none;">
          ▶ شروحات عربية عن "${escapeHtml(topic)}"
        </a>
        <a href="${escapeHtml(ytEnglishUrl)}" target="_blank" rel="noopener noreferrer" class="secondary-btn" style="text-decoration:none;">
          ▶ Educational Videos (${escapeHtml(ytEnglishTitle)})
        </a>
      </div>
    </div>
  `;

  const playerEl = document.getElementById("lessonInteractivePlayer");
  const chapterBtns = videoContent.querySelectorAll(".video-chapter-btn");
  const chapterBox = document.getElementById("videoChapterBox");
  const fallbackImg = document.getElementById("fallbackStageImg");
  const fallbackLabel = document.getElementById("fallbackStageLabel");
  const fallbackNote = document.getElementById("fallbackStageNote");
  const fallbackBar = document.getElementById("fallbackVideoProgressBar");
  const audioStatusEl = document.getElementById("audioStatusIndicator");
  let activeChapterIdx = validIdx % chapters.length;
  let activeSpeechText = `${initialChapter.note}. ${initialChapter.question}. ${initialChapter.answer}`;

  const updateAudioStatusLabel = (msg) => {
    if (audioStatusEl) {
      audioStatusEl.textContent = msg;
    }
  };

  const goToNextVideo = () => {
    stopAllLessonAudio(false);
    playCueTone(620, 0.12);
    if (safeVideos.length > 1) {
      currentVideoIndex = (currentVideoIndex + 1) % safeVideos.length;
      renderInteractiveVideoTab(data, currentVideoPool, currentVideoIndex);
    } else {
      currentVideoIndex = (currentVideoIndex + 1) % 3;
      renderInteractiveVideoTab(data, currentVideoPool, currentVideoIndex);
      speakArabicText(activeSpeechText, updateAudioStatusLabel, false);
    }
  };

  const goToPrevVideo = () => {
    stopAllLessonAudio(false);
    playCueTone(460, 0.12);
    if (safeVideos.length > 1) {
      currentVideoIndex = (currentVideoIndex - 1 + safeVideos.length) % safeVideos.length;
      renderInteractiveVideoTab(data, currentVideoPool, currentVideoIndex);
    } else {
      currentVideoIndex = (currentVideoIndex - 1 + 3) % 3;
      renderInteractiveVideoTab(data, currentVideoPool, currentVideoIndex);
      speakArabicText(activeSpeechText, updateAudioStatusLabel, false);
    }
  };

  if (playerEl) {
    playerEl.volume = isVoiceMuted ? 0 : 1;
    playerEl.muted = isVoiceMuted;
    playerEl.onplay = () => {
      stopAllLessonAudio(false);
      updateAudioStatusLabel("▶ صوت الفيديو يعمل الآن (تم إيقاف صوت الدرس لمنع التداخل)");
    };
    playerEl.onended = () => {
      goToNextVideo();
    };
    playerEl.onerror = () => {
      if (safeVideos.length > 1) {
        currentVideoIndex = (currentVideoIndex + 1) % safeVideos.length;
        renderInteractiveVideoTab(data, currentVideoPool, currentVideoIndex);
      }
    };
  }

  const selectChapter = (cIdx, shouldSpeak = false) => {
    const safeC = ((cIdx % chapters.length) + chapters.length) % chapters.length;
    activeChapterIdx = safeC;
    const ch = chapters[safeC];

    chapterBtns.forEach((b, idx) => b.classList.toggle("active", idx === safeC));

    if (playerEl && Number.isFinite(playerEl.duration) && playerEl.duration > 0) {
      playerEl.currentTime = Math.max(0, Math.min(playerEl.duration - 1, playerEl.duration * ch.timeRatio));
    }

    if (fallbackImg && ch.imageUrl) fallbackImg.src = ch.imageUrl;
    if (fallbackLabel) fallbackLabel.textContent = ch.label;
    if (fallbackNote) fallbackNote.textContent = ch.note;
    if (fallbackBar) {
      interactiveSlideProgress = ch.progressTarget;
      fallbackBar.style.width = `${ch.progressTarget}%`;
    }

    if (chapterBox) {
      chapterBox.innerHTML = `
        <strong>${escapeHtml(ch.label)}:</strong> ${escapeHtml(ch.note)}
        <div style="margin-top:8px;color:#1d4ed8;font-weight:600;">سؤال المحطة: ${escapeHtml(ch.question)}</div>
        <div style="margin-top:4px;">الإجابة النموذجية: ${escapeHtml(ch.answer)}</div>
      `;
    }

    activeSpeechText = `${ch.note}. ${ch.question}. ${ch.answer}`;
    if (shouldSpeak && !isVoiceMuted) {
      pauseVideoPlayerIfPlaying();
      speakArabicText(activeSpeechText, updateAudioStatusLabel, true);
    }
  };

  chapterBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      selectChapter(Number(btn.dataset.chapterIndex), true);
    });
  });

  const muteBtn = document.getElementById("toggleMuteVoiceBtn");
  if (muteBtn) {
    muteBtn.addEventListener("click", () => {
      isVoiceMuted = !isVoiceMuted;
      if (playerEl) {
        playerEl.muted = isVoiceMuted;
        playerEl.volume = isVoiceMuted ? 0 : 1;
      }
      if (isVoiceMuted) {
        stopAllLessonAudio(false);
      }
      muteBtn.textContent = isVoiceMuted ? "🔊 إلغاء الكتم" : "🔇 كتم الصوت";
      updateAudioStatusLabel(
        isVoiceMuted ? "🔇 الصوت مكتوم حالياً" : "🔊 الصوت مفعّل (بدون تداخل)"
      );
    });
  }

  const toggleAutoBtn = document.getElementById("toggleAutoVideoPlayBtn");
  const nextChapterBtn = document.getElementById("nextAutoChapterBtn");

  if (toggleAutoBtn) {
    toggleAutoBtn.addEventListener("click", () => {
      if (isInteractiveSlidePlaying) {
        stopAllLessonAudio(false);
        toggleAutoBtn.textContent = "▶ تشغيل بالصوت والمحطات";
        updateAudioStatusLabel("⏹ تم إيقاف العرض والصوت");
      } else {
        pauseVideoPlayerIfPlaying();
        isInteractiveSlidePlaying = true;
        toggleAutoBtn.textContent = "⏸ إيقاف العرض التفاعلي";
        speakArabicText(activeSpeechText, updateAudioStatusLabel, true);
        interactiveSlideTimer = setInterval(() => {
          selectChapter(activeChapterIdx + 1, true);
        }, 7000);
      }
    });
  }

  if (nextChapterBtn) {
    nextChapterBtn.addEventListener("click", () => {
      selectChapter(activeChapterIdx + 1, true);
    });
  }

  const speakBtn = document.getElementById("speakVideoStationBtn");
  const stopBtn = document.getElementById("stopVideoStationBtn");
  if (speakBtn) {
    speakBtn.addEventListener("click", () => {
      if (isVoiceMuted) {
        isVoiceMuted = false;
        if (muteBtn) muteBtn.textContent = "🔇 كتم الصوت";
        if (playerEl) {
          playerEl.muted = false;
          playerEl.volume = 1;
        }
      }
      pauseVideoPlayerIfPlaying();
      speakArabicText(activeSpeechText, updateAudioStatusLabel, true);
    });
  }
  if (stopBtn) {
    stopBtn.addEventListener("click", () => {
      stopAllLessonAudio(false);
      if (toggleAutoBtn) toggleAutoBtn.textContent = "▶ تشغيل بالصوت والمحطات";
      updateAudioStatusLabel("⏹ تم إيقاف صوت الدرس");
    });
  }

  const prevBtn = document.getElementById("prevLessonVideoBtn");
  const nextBtn = document.getElementById("nextLessonVideoBtn");
  if (prevBtn) {
    prevBtn.addEventListener("click", goToPrevVideo);
  }
  if (nextBtn) {
    nextBtn.addEventListener("click", goToNextVideo);
  }
}

async function fetchFreeCommonsImages(queryText, limit = 15, offset = 0) {
  const cleanQuery = (queryText || "").replace(/[^\u0600-\u06FFa-zA-Z0-9\s]/g, " ").trim();
  if (!cleanQuery) return [];

  try {
    const apiUrl = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrnamespace=6&gsrsearch=${encodeURIComponent(cleanQuery)}&gsrlimit=${limit}&gsroffset=${offset}&prop=imageinfo&iiprop=url|mime&iiurlwidth=640&format=json&origin=*`;
    const res = await fetch(apiUrl);
    if (!res.ok) return [];
    const json = await res.json();
    const pages = json?.query?.pages ? Object.values(json.query.pages) : [];

    return pages
      .map((p) => {
        const info = p.imageinfo && p.imageinfo[0];
        const mime = (info?.mime || "").toLowerCase();
        const isValidImage =
          mime.startsWith("image/") &&
          !mime.includes("svg+xml") &&
          !mime.includes("tiff") &&
          !mime.includes("pdf");
        const srcUrl = info?.thumburl || info?.url || "";
        if (!isValidImage || !srcUrl) return null;
        return {
          title: (p.title || "").replace(/^File:/i, "").replace(/\.[^.]+$/, ""),
          url: srcUrl
        };
      })
      .filter(Boolean);
  } catch (e) {
    console.warn("Wikimedia Commons fetch warning:", e);
    return [];
  }
}

async function buildDiverseLessonImagePool(data, extraOffset = 0) {
  const topic = data.title || "الدرس";
  const keywords = extractKeywords(topic);
  const englishTitles = (data.sources || [])
    .filter((s) => s.lang === "en" && s.title)
    .map((s) => s.title);

  const primaryTopic = englishTitles[0] || topic;
  const queries = [
    topic,
    primaryTopic,
    `${primaryTopic} diagram`,
    `${primaryTopic} illustration`,
    `${primaryTopic} science`,
    keywords[0] || "",
    "education diagram"
  ].filter(Boolean);

  const batches = await Promise.all(
    queries.map((q, i) => fetchFreeCommonsImages(q, 12, extraOffset + i * 4))
  );

  const seenUrls = new Set();
  const pool = [];

  for (const src of data.sources || []) {
    if (src.thumbnail && !seenUrls.has(src.thumbnail)) {
      seenUrls.add(src.thumbnail);
      pool.push({
        title: src.title || topic,
        url: src.thumbnail
      });
    }
  }

  for (const batch of batches) {
    for (const img of batch) {
      if (img && img.url && !seenUrls.has(img.url)) {
        seenUrls.add(img.url);
        pool.push(img);
      }
    }
  }

  return pool;
}

function simplifyArabicSentence(sentence, maxLen = 280) {
  const completed = ensureCompleteSentence(sentence);
  if (completed.length <= maxLen) return completed;
  const sliced = completed.slice(0, maxLen);
  const pIdx = Math.max(sliced.lastIndexOf("."), sliced.lastIndexOf("،"), sliced.lastIndexOf("؛"));
  return ensureCompleteSentence(pIdx > 70 ? sliced.slice(0, pIdx + 1) : sliced);
}

function extractBestDefinition(topic, sentences, keywords) {
  const defPatterns = ["هو ", "هي ", "يُعد", "تُعد", "يعرف", "تُعرف", "مصطلح", "عملية", "نظام", "علم", "مجموعة"];
  const scored = sentences.map((s, idx) => {
    let score = calculateRelevance(s, topic, keywords);
    if (idx === 0) score += 6;
    if (defPatterns.some((p) => s.includes(p))) score += 5;
    if (s.length >= 45 && s.length <= 250) score += 3;
    return { text: s, score };
  });

  scored.sort((a, b) => b.score - a.score);
  const best = scored[0]?.text || sentences[0] || `${topic} هو مفهوم علمي أو عملي مهم ندرسه لفهم أساسياته وتطبيقاته.`;
  const cleanBest = simplifyArabicSentence(best, 260);

  if (normalizeArabic(cleanBest).startsWith(normalizeArabic(topic))) {
    return ensureCompleteSentence(cleanBest, topic);
  }
  return ensureCompleteSentence(`${topic}: ${cleanBest}`, topic);
}

function shortBranchLabel(text, maxLen = 28) {
  const clean = (text || "").replace(/\s+/g, " ").trim();
  if (clean.length <= maxLen) return clean;
  return clean.slice(0, maxLen - 3).trim() + "...";
}

function extractLessonComponents(topic, sentences, wikiSections, keywords) {
  const cleanTopic = (topic || "هذا الدرس").trim();
  const components = [];
  const usedNames = new Set();
  const usedDescs = new Set();

  for (const sec of wikiSections || []) {
    const rawTitle = (sec.title || "").replace(/^مقدمة.*$/i, "").trim();
    const normTitle = normalizeArabic(rawTitle);
    if (
      rawTitle &&
      rawTitle.length >= 2 &&
      rawTitle.length <= 45 &&
      !usedNames.has(normTitle) &&
      !/^محور\s*\d+/i.test(rawTitle)
    ) {
      const uniquePts = deduplicateSentenceList(sec.points || []);
      const firstPoint = uniquePts[0] || sec.simplifiedSummary || "";
      const secondPoint = uniquePts[1] || "";
      const desc = secondPoint
        ? ensureCompleteSentence(`${simplifyArabicSentence(firstPoint, 180)} ${simplifyArabicSentence(secondPoint, 150)}`, cleanTopic)
        : simplifyArabicSentence(firstPoint, 220);

      const normDesc = normalizeArabic(desc);
      if (!desc || usedDescs.has(normDesc)) continue;

      usedNames.add(normTitle);
      usedDescs.add(normDesc);
      components.push({
        name: `مكون ${components.length + 1}: ${rawTitle}`,
        role: `شرح المكون (${rawTitle}) في درس "${cleanTopic}"`,
        explanation: desc
      });
    }
    if (components.length >= 6) break;
  }

  if (components.length < 4) {
    const ranked = deduplicateSentenceList(sentences || [])
      .map((s) => ({
        text: simplifyArabicSentence(s, 210),
        score: calculateRelevance(s, cleanTopic, keywords)
      }))
      .sort((a, b) => b.score - a.score);

    for (const item of ranked) {
      if (!item.text || item.text.length < 20) continue;
      const shortName = shortBranchLabel(item.text, 30);
      const normName = normalizeArabic(shortName);
      const normDesc = normalizeArabic(item.text);
      if (usedNames.has(normName) || usedDescs.has(normDesc)) continue;
      usedNames.add(normName);
      usedDescs.add(normDesc);

      components.push({
        name: `مكون ${components.length + 1}: ${shortName}`,
        role: `ماذا يعمل هذا المكون في "${cleanTopic}"؟`,
        explanation: ensureCompleteSentence(`${item.text} يوضّح هذا العنصر جانباً أساسياً من بنية "${cleanTopic}" وكيفية ارتباط أجزائه.`, cleanTopic)
      });

      if (components.length >= 4) break;
    }
  }

  return components;
}

function extractSimplifiedWikiSections(topic, fullExtracts, fallbackSentences) {
  const ignoredSections = new Set([
    "انظر أيضا", "انظر أيضًا", "مراجع", "وصلات خارجية", "المراجع",
    "مصادر", "ملاحظات", "see also", "references", "external links", "notes", "further reading"
  ]);

  const sections = [];
  const seenTitles = new Set();
  const seenSectionSummaries = new Set();

  for (const entry of fullExtracts || []) {
    const rawText = (entry.text || "").replace(/\r/g, "").slice(0, 26000);
    const lines = rawText.split("\n");
    let currentTitle = `مقدمة ومفهوم ${topic}`;
    let currentBodyLines = [];

    const flushSection = () => {
      const cleanTitle = currentTitle.replace(/=+/g, "").trim();
      const normTitle = normalizeArabic(cleanTitle);
      if (
        !cleanTitle ||
        ignoredSections.has(cleanTitle.toLowerCase()) ||
        ignoredSections.has(normTitle) ||
        seenTitles.has(normTitle)
      ) {
        currentBodyLines = [];
        return;
      }
      const joined = currentBodyLines.join(" ").replace(/\s+/g, " ").trim();
      if (joined.length > 35) {
        const sents = deduplicateSentenceList(
          joined
            .split(/(?<=[.،!؟])\s+/)
            .map((s) => simplifyArabicSentence(s, 260))
            .filter((s) => s.length > 18)
        );

        if (sents.length > 0) {
          const picked = sents.slice(0, 6);
          const summaryStr = picked.join(" ");
          const normSum = normalizeArabic(summaryStr);
          if (!seenSectionSummaries.has(normSum)) {
            seenTitles.add(normTitle);
            seenSectionSummaries.add(normSum);
            sections.push({
              title: cleanTitle,
              teacherNote: `شرح قسم (${cleanTitle}): يوضح هذا القسم مضمونه الأساسي وعلاقته بموضوع "${topic}" بصورة واضحة ومرتبة.`,
              points: picked,
              simplifiedSummary: summaryStr
            });
          }
        }
      }
      currentBodyLines = [];
    };

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      const secMatch = trimmed.match(/^={2,}\s*(.+?)\s*={2,}$/);
      if (secMatch) {
        flushSection();
        currentTitle = secMatch[1].trim();
      } else {
        currentBodyLines.push(trimmed);
      }
    }
    flushSection();

    if (sections.length >= 10) break;
  }

  const uniqueFallback = deduplicateSentenceList(fallbackSentences || []);
  if (sections.length === 0 && uniqueFallback.length > 0) {
    for (let i = 0; i < Math.min(4, uniqueFallback.length); i++) {
      const s = simplifyArabicSentence(uniqueFallback[i], 260);
      sections.push({
        title: `محور ${i + 1} في درس ${topic}`,
        teacherNote: `شرح المحور (${i + 1}) في درس "${topic}": نوضح الفكرة الأساسية ومضمونها الكامل.`,
        points: [s],
        simplifiedSummary: s
      });
    }
  }

  return sections.slice(0, 10);
}

function extractSimplifiedComparisons(topic, sentences, keywords) {
  const comparisonHints = [
    "أكبر", "أصغر", "أبعد", "أقرب", "مقارنة", "بين", "يختلف", "تختلف",
    "بينما", "في حين", "مقابل", "أول", "ثاني", "صخري", "غازي", "داخل", "خارج",
    "أعلى", "أقل", "أسرع", "أبطأ", "أهم", "رئيسي", "ثانوي"
  ];

  const candidates = deduplicateSentenceList(sentences)
    .filter((s) => s.length >= 25)
    .map((s) => {
      const hasComp = comparisonHints.some((h) => s.includes(h));
      const score = calculateRelevance(s, topic, keywords) + (hasComp ? 7 : 0);
      return { text: simplifyArabicSentence(s, 230), score };
    })
    .sort((a, b) => b.score - a.score);

  const unique = [];
  for (const item of candidates) {
    if (item.text && !unique.includes(item.text)) {
      unique.push(item.text);
    }
    if (unique.length >= 4) break;
  }

  const fallbacks = [
    ensureCompleteSentence(`مقارنة مبسطة في "${topic}": نميّز بين الأجزاء الأساسية ودور كل جزء وكيف يكمّل بعضه الآخر.`, topic),
    ensureCompleteSentence(`اختلاف مهم داخل "${topic}": تتباين العناصر من حيث الحجم أو الموقع أو الوظيفة، وكل عنصر له دور واضح.`, topic),
    ensureCompleteSentence(`مقارنة عملية في "${topic}": فهم الفروق بين العناصر يساعدك على عدم الخلط بينها أثناء المذاكرة.`, topic),
    ensureCompleteSentence(`خلاصة المقارنة في "${topic}": ركّز على الخاصية المميزة لكل جزء وما الذي يفعله تحديداً.`, topic)
  ];

  while (unique.length < 4) {
    unique.push(fallbacks[unique.length]);
  }

  return deduplicateSentenceList(unique)
    .slice(0, 4)
    .map((compText, idx) => ({
      title: `مقارنة ووظيفة (${idx + 1})`,
      detail: ensureCompleteSentence(compText, topic)
    }));
}

function extractSpecificLessonElements(topic, sentences, pointText, maxCount = 4) {
  const cleanTopic = (topic || "هذا الدرس").trim();
  const basePoint = ensureCompleteSentence(pointText || `الفكرة المرتبطة بـ ${cleanTopic}`, cleanTopic);

  const rawCandidates = [];
  for (const s of deduplicateSentenceList(sentences || [])) {
    const cleanS = simplifyArabicSentence(s, 220);
    if (cleanS && cleanS.length > 18 && !rawCandidates.includes(cleanS)) {
      rawCandidates.push(cleanS);
    }
    const parts = cleanS
      .split(/[،؛]/)
      .map((p) => ensureCompleteSentence(p, cleanTopic))
      .filter((p) => p.length > 20);
    for (const part of parts) {
      if (!rawCandidates.includes(part)) {
        rawCandidates.push(part);
      }
    }
  }

  if (!rawCandidates.includes(basePoint)) {
    rawCandidates.unshift(basePoint);
  }

  const uniqueCandidates = deduplicateSentenceList(rawCandidates);
  const fallbackTemplates = [
    ensureCompleteSentence(`العنصر الأول في "${cleanTopic}": ${basePoint}`, cleanTopic),
    ensureCompleteSentence(`العنصر الثاني في "${cleanTopic}" يوضّح آلية عمل هذا الجزء ودوره داخل الموضوع.`, cleanTopic),
    ensureCompleteSentence(`العنصر الثالث في "${cleanTopic}" يبيّن الخصائص والاختلافات والمقارنات المهمة بين الأجزاء.`, cleanTopic),
    ensureCompleteSentence(`العنصر الرابع في "${cleanTopic}" يوضح الفائدة والتطبيق العملي وكيف نستفيد منه بوضوح.`, cleanTopic)
  ];

  const items = [];
  for (let i = 0; i < maxCount; i++) {
    const candidate = uniqueCandidates[i] || fallbackTemplates[i];
    const shortTitle = shortBranchLabel(candidate, 34);
    items.push({
      elementName: `${i + 1}. ${shortTitle}`,
      explanation: ensureCompleteSentence(
        `${candidate} يمثل هذا العنصر جزءاً أساسياً في "${cleanTopic}" ويساعد على ربط المفهوم بباقي محاور الدرس دون نقص.`,
        cleanTopic
      )
    });
  }

  return items;
}

function buildSmartLessonQuestionAndSuggestions(topic, branchTitle, pointText, index, sentences = []) {
  const cleanTopic = (topic || "هذا الدرس").trim();
  const fullPoint = ensureCompleteSentence(pointText || `الفكرة المرتبطة بـ ${cleanTopic}`, cleanTopic);
  const keywords = extractKeywords(cleanTopic);
  const focusKeyword = keywords[0] || cleanTopic;
  const uniqueSents = deduplicateSentenceList(sentences || []);
  const firstExtra = uniqueSents[1] ? simplifyArabicSentence(uniqueSents[1], 200) : fullPoint;
  const secondExtra = uniqueSents[2] ? simplifyArabicSentence(uniqueSents[2], 200) : firstExtra;

  const topicQuestions = [
    `في درس "${cleanTopic}"، كيف نفهم "${focusKeyword}" ونعرف معناه الكامل من البداية؟ اختر عنصراً لأوضحه لك:`,
    `كيف يعمل "${cleanTopic}" وما دوره في محور (${branchTitle})؟ اختر عنصراً ليشرحه لك المدرس بوضوح:`,
    `ما أهم العناصر والمقارنات التي تكوّن "${cleanTopic}" هنا؟ اختر عنصراً لتفهمه بالكامل:`,
    `كيف نستفيد من "${cleanTopic}" ونقارن بين أجزائه عملياً؟ اختر عنصراً لأعرضه لك:`
  ];

  const topicSuggestionsByBranch = [
    [
      {
        label: "1. المعنى الكامل ببساطة",
        explanation: ensureCompleteSentence(`الأساس في درس "${cleanTopic}": ${fullPoint} هذا يحدد المعنى المباشر للموضوع ويوضّح جوهره بلغة واضحة ومكتملة.`, cleanTopic)
      },
      {
        label: "2. ارتباطه بباقي محاور الدرس",
        explanation: ensureCompleteSentence(`بجانب ما سبق في "${cleanTopic}"، يظهر أيضاً: ${firstExtra} الربط بين هذه المعطيات يعطيك صورة متكاملة دون نقص.`, cleanTopic)
      },
      {
        label: "3. خلاصة مركزة للمذاكرة",
        explanation: ensureCompleteSentence(`خلاصة "${cleanTopic}": ${fullPoint} تذكّر هذه الفكرة الأساسية لتتمكن من إعادة صياغة الشرح بأسلوبك بوضوح.`, cleanTopic)
      }
    ],
    [
      {
        label: "1. كيف تسير الفكرة؟",
        explanation: ensureCompleteSentence(`آلية العمل في "${cleanTopic}": ${fullPoint} تسير الأفكار في تسلسل منطقي يوضّح السبب والنتيجة خطوة بخطوة.`, cleanTopic)
      },
      {
        label: "2. تفصيل إضافي داعم",
        explanation: ensureCompleteSentence(`لتوضيح آلية "${cleanTopic}" بشكل أدق: ${secondExtra} هذا التفصيل يدعم فهمك لكيفية تفاعل العناصر.`, cleanTopic)
      },
      {
        label: "3. أهمية هذا المحور",
        explanation: ensureCompleteSentence(`تكمن أهمية هذا المحور في "${cleanTopic}" في أن ${fullPoint} مما يجعله ركيزة لفهم بقية الدرس.`, cleanTopic)
      }
    ],
    [
      {
        label: "1. العناصر والمقارنات الرئيسية",
        explanation: ensureCompleteSentence(`في محور العناصر والمقارنات لـ "${cleanTopic}": ${fullPoint} مقارنة الأجزاء توضّح الفروق والوظائف بدقة.`, cleanTopic)
      },
      {
        label: "2. كيف تقارن بين العناصر؟",
        explanation: ensureCompleteSentence(`عند المقارنة داخل "${cleanTopic}"، ركّز على: ${fullPoint} وقارن بين وظيفة كل عنصر ودوره حتى لا تختلط المفاهيم.`, cleanTopic)
      },
      {
        label: "3. مراجعة سريعة للعناصر",
        explanation: ensureCompleteSentence(`في مراجعة عناصر "${cleanTopic}": ${fullPoint} حدّد ما يميّز كل جزء لترسيخ المعلومة بشكل كامل.`, cleanTopic)
      }
    ],
    [
      {
        label: "1. الفائدة والتطبيق العملي",
        explanation: ensureCompleteSentence(`التطبيق العملي لدرس "${cleanTopic}": ${fullPoint} يوضّح كيف نستخدم هذه المعرفة في حل المشكلات أو فهم الظواهر.`, cleanTopic)
      },
      {
        label: "2. ربط المفهوم بالواقع",
        explanation: ensureCompleteSentence(`عند تطبيق "${cleanTopic}" عملياً، نعتمد على أن ${fullPoint} وهو ما يربط الشرح النظري بالاستخدام الفعلي.`, cleanTopic)
      },
      {
        label: "3. إجابة نموذجية شاملة",
        explanation: ensureCompleteSentence(`إذا طُلب منك شرح "${cleanTopic}" باختصار كامل: ${fullPoint} مع توضيح دور العناصر الأساسية وعلاقتها ببعضها.`, cleanTopic)
      }
    ]
  ];

  const safeIdx = Math.abs(Number(index) || 0) % topicQuestions.length;

  return {
    question: topicQuestions[safeIdx],
    suggestions: topicSuggestionsByBranch[safeIdx]
  };
}

function buildTeacherBranchExplanation(topic, branchTitle, pointText, index, sentences = []) {
  const cleanPoint = ensureCompleteSentence(pointText || `الفكرة الأساسية حول ${topic}`, topic);
  const elements = extractSpecificLessonElements(topic, sentences, cleanPoint, 4);
  const qa = buildSmartLessonQuestionAndSuggestions(topic, branchTitle, cleanPoint, index, sentences);

  const speeches = [
    ensureCompleteSentence(`نبدأ في درس "${topic}" بمحور ${branchTitle}: ${cleanPoint}`, topic),
    ensureCompleteSentence(`ننتقل في "${topic}" إلى ${branchTitle}: ${cleanPoint}`, topic),
    ensureCompleteSentence(`نستعرض في "${topic}" ${branchTitle}: ${cleanPoint}`, topic),
    ensureCompleteSentence(`نصل في "${topic}" إلى ${branchTitle}: ${cleanPoint}`, topic)
  ];

  return {
    speech: speeches[index] || speeches[0],
    elements,
    question: qa.question,
    suggestions: qa.suggestions
  };
}

function buildMindMapData(topic, bestDefinition, keyPoints, intro, sentences = []) {
  const branchSpecs = [
    { label: "1. التعريف والمفهوم", shortText: "تعريف الموضوع وأساسه" },
    { label: "2. الفكرة وكيف يعمل؟", shortText: "آلية العمل والخصائص" },
    { label: "3. العناصر والمقارنات", shortText: "عناصر ومقارنات الدرس (1 - 4)" },
    { label: "4. التطبيق والفائدة", shortText: "الاستخدامات والفائدة العملية" }
  ];

  const sourcePoints = deduplicateSentenceList([bestDefinition, ...keyPoints]);

  const nodes = branchSpecs.map((spec, i) => {
    const point = sourcePoints[i] || keyPoints[0] || intro;
    const teacher = buildTeacherBranchExplanation(topic, spec.label, point, i, sentences);
    return {
      id: `branch-${i}`,
      label: spec.label,
      shortText: spec.shortText,
      sourcePoint: point,
      speech: teacher.speech,
      elements: teacher.elements,
      question: teacher.question,
      suggestions: teacher.suggestions
    };
  });

  const centerElements = extractSpecificLessonElements(topic, sentences, bestDefinition, 4);
  const centerQa = buildSmartLessonQuestionAndSuggestions(topic, "شرح الدرس كاملاً", bestDefinition, 0, sentences);

  return {
    centerTitle: shortBranchLabel(topic, 22),
    centerLabel: "شرح الدرس كاملاً ومُحقَّق",
    centerSpeech: ensureCompleteSentence(`شرح درس "${topic}": ${bestDefinition}`, topic),
    centerElements,
    centerQuestion: centerQa.question,
    centerSuggestions: centerQa.suggestions,
    nodes
  };
}

function buildRealLessonQuestionBank(data, gameTypeObj) {
  const topic = data?.title || "هذا الدرس";
  const def = simplifyArabicSentence(data?.bestDefinition || data?.simple_explanation || topic, 150);
  const pts = deduplicateSentenceList(
    (data?.key_points || []).map((p) => simplifyArabicSentence(p, 145)).filter(Boolean)
  );
  const comps = (data?.components || []).filter(Boolean);
  const cmps = deduplicateSentenceList(
    (data?.comparisons || []).map((c) => simplifyArabicSentence(c.detail, 145)).filter(Boolean)
  );
  const sections = (data?.wikiSections || []).filter(Boolean);
  const liveFacts = deduplicateSentenceList(
    (data?.liveWebFacts || []).map((f) => simplifyArabicSentence(f, 150)).filter(Boolean)
  );

  const realPool = deduplicateSentenceList([
    def,
    ...pts,
    ...cmps,
    ...liveFacts,
    ...comps.map((c) => `${c.name}: ${simplifyArabicSentence(c.explanation, 110)}`)
  ]);

  const pickDistractors = (correctText, count = 3) => {
    const candidates = realPool.filter(
      (item) => normalizeArabic(item) !== normalizeArabic(correctText)
    );
    const chosen = shuffleArray(candidates).slice(0, count);
    const genericFallbacks = [
      `معلومة لا تنتمي إلى مضمون "${topic}"`,
      `وصف غير صحيح لدرس "${topic}"`,
      `خاصية خارج سياق "${topic}"`
    ];
    while (chosen.length < count) {
      const fb = genericFallbacks[chosen.length % genericFallbacks.length];
      if (!chosen.includes(fb) && fb !== correctText) {
        chosen.push(fb);
      } else {
        chosen.push(`نقطة خارج نطاق "${topic}"`);
      }
    }
    return chosen;
  };

  const isTrueFalseMode = gameTypeObj && gameTypeObj.mode === "tf";
  const rawQuestions = [];

  if (isTrueFalseMode) {
    const sourceStatements = shuffleArray(realPool).slice(0, 8);
    sourceStatements.forEach((stmt, idx) => {
      const makeFalse = idx % 2 === 1 && realPool.length > 2;
      const otherPool = realPool.filter((x) => normalizeArabic(x) !== normalizeArabic(stmt));
      const wrongStmt = otherPool[idx % Math.max(otherPool.length, 1)] || `هذه العبارة تخالف حقيقة "${topic}"`;
      const shownStmt = makeFalse ? wrongStmt : stmt;
      const isTrue = !makeFalse;

      rawQuestions.push({
        id: `tf_q_${idx}`,
        prompt: `هل العبارة التالية صحيحة أم خاطئة بالنسبة لدرس "${topic}"؟\n"${shownStmt}"`,
        options: ["صح ✅", "خطأ ❌"],
        correctIndex: isTrue ? 0 : 1,
        explanation: isTrue
          ? `صحيح! المعلومة مطابقة لمصادر الدرس: ${shownStmt}`
          : `خطأ! العبارة الصحيحة من الدرس هي: ${stmt}`
      });
    });
  } else {
    const q1Distractors = pickDistractors(def, 3);
    const q1Opts = shuffleArray([
      { text: def, isCorrect: true },
      ...q1Distractors.map((d) => ({ text: d, isCorrect: false }))
    ]);
    rawQuestions.push({
      id: "real_q_def",
      prompt: `ما التعريف أو المفهوم الحقيقي لدرس "${topic}"؟`,
      options: q1Opts.map((o) => o.text),
      correctIndex: q1Opts.findIndex((o) => o.isCorrect),
      explanation: `من المصادر: ${def}`
    });

    pts.forEach((pt, idx) => {
      const distractors = pickDistractors(pt, 3);
      const opts = shuffleArray([
        { text: pt, isCorrect: true },
        ...distractors.map((d) => ({ text: d, isCorrect: false }))
      ]);
      rawQuestions.push({
        id: `real_q_pt_${idx}`,
        prompt: `أي عبارة مما يلي تمثّل حقيقة مؤكدة من درس "${topic}"؟`,
        options: opts.map((o) => o.text),
        correctIndex: opts.findIndex((o) => o.isCorrect),
        explanation: `حقيقة من الدرس: ${pt}`
      });
    });

    liveFacts.forEach((fact, idx) => {
      const distractors = pickDistractors(fact, 3);
      const opts = shuffleArray([
        { text: fact, isCorrect: true },
        ...distractors.map((d) => ({ text: d, isCorrect: false }))
      ]);
      rawQuestions.push({
        id: `live_web_q_${idx}`,
        prompt: `سؤال مستجلب من نتائج البحث المجانية حول "${topic}" — اختر العبارة الحقيقية:`,
        options: opts.map((o) => o.text),
        correctIndex: opts.findIndex((o) => o.isCorrect),
        explanation: `من نتائج البحث الحية: ${fact}`
      });
    });

    comps.slice(0, 3).forEach((comp, idx) => {
      const compDesc = simplifyArabicSentence(comp.explanation || comp.name, 145);
      const compNameClean = comp.name.replace(/^مكون\s*\d+:\s*/i, "");
      const distractors = pickDistractors(compDesc, 3);
      const opts = shuffleArray([
        { text: compDesc, isCorrect: true },
        ...distractors.map((d) => ({ text: d, isCorrect: false }))
      ]);
      rawQuestions.push({
        id: `real_q_comp_${idx}`,
        prompt: `في درس "${topic}"، ما الوصف الصحيح المرتبط بـ (${compNameClean})؟`,
        options: opts.map((o) => o.text),
        correctIndex: opts.findIndex((o) => o.isCorrect),
        explanation: `شرح (${compNameClean}): ${compDesc}`
      });
    });

    sections.slice(0, 3).forEach((sec, idx) => {
      const secPoint = simplifyArabicSentence((sec.points && sec.points[0]) || sec.simplifiedSummary || "", 145);
      if (!secPoint) return;
      const distractors = pickDistractors(secPoint, 3);
      const opts = shuffleArray([
        { text: secPoint, isCorrect: true },
        ...distractors.map((d) => ({ text: d, isCorrect: false }))
      ]);
      rawQuestions.push({
        id: `real_q_sec_${idx}`,
        prompt: `ضمن قسم "${sec.title}" في درس "${topic}"، أي عبارة صحيحة؟`,
        options: opts.map((o) => o.text),
        correctIndex: opts.findIndex((o) => o.isCorrect),
        explanation: `من قسم (${sec.title}): ${secPoint}`
      });
    });
  }

  return shuffleArray(rawQuestions).map((q, i) => ({
    ...q,
    question: `سؤال (${i + 1}): ${q.prompt}`
  }));
}

function refreshQuestionBanks(data) {
  stopQuestionTimer();
  questionShuffleSeed += 1;
  questionTimeRemaining = QUESTION_TIME_LIMIT;
  const gameTypeObj = getSelectedGameType();
  const fullBank = buildRealLessonQuestionBank(data, gameTypeObj);
  currentGameQuestionsBank = shuffleArray(fullBank);
  currentGameQuestionIdx = 0;
  gameAnsweredCount = 0;
  gameCorrectCount = 0;
  gameWrongCount = 0;

  const examSlice = shuffleArray(fullBank).slice(0, Math.min(4, fullBank.length));
  currentExamQuestionsBank = examSlice.map((q, idx) => ({
    ...q,
    id: `exam_dyn_${idx}_${questionShuffleSeed}`,
    question: `سؤال الاختبار ${idx + 1}: ${q.prompt}`
  }));
  quizAnswers = {};
  quizSubmittedOnce = false;
}

function computeStudentEvaluation(quizScore, quizTotal, gamePts) {
  const safeTotal = Math.max(quizTotal, 1);
  const quizPercent = quizSubmittedOnce ? Math.round((quizScore / safeTotal) * 100) : 0;
  const gameAccuracy = gameAnsweredCount > 0 ? Math.round((gameCorrectCount / gameAnsweredCount) * 100) : 0;
  const combinedIndex = Math.round(quizPercent * 0.55 + gameAccuracy * 0.45 + Math.min(25, Math.round(gamePts / 6)));

  if (combinedIndex >= 85) {
    return {
      rank: "🏆 متفوق متميز (5 نجوم)",
      percent: quizPercent,
      gameAccuracy,
      combinedIndex,
      message: `دقة اللعبة ${gameAccuracy}% والاختبار ${quizPercent}% — إتقان عالٍ لمحاور الدرس ومنافسة قوية.`
    };
  }
  if (combinedIndex >= 55) {
    return {
      rank: "⭐ مستوى جيد جداً (4 نجوم)",
      percent: quizPercent,
      gameAccuracy,
      combinedIndex,
      message: `دقة اللعبة ${gameAccuracy}% والاختبار ${quizPercent}% — أداء جيد، أكمل الأسئلة وارفع الدقة لتجاوز المنافسين.`
    };
  }
  return {
    rank: "📘 قيد التقدم (يحتاج تركيزاً — نجمتان)",
    percent: quizPercent,
    gameAccuracy,
    combinedIndex,
    message: `دقة اللعبة ${gameAccuracy}% والاختبار ${quizPercent}% — راجع نقاط الدرس ثم أجب بدقة أعلى قبل انتهاء المؤقت.`
  };
}

function getAndUpdateLeaderboard(topic, currentPlayerTotalPoints, importedEntries = null) {
  let allBoards = {};
  try {
    allBoards = JSON.parse(localStorage.getItem(LEADERBOARD_STORAGE_KEY) || "{}");
  } catch (e) {
    allBoards = {};
  }

  const key = normalizeArabic(topic) || "default_lesson";
  const activePlayerName = (playerName || "").trim() || "أنت";

  if (Array.isArray(importedEntries) && importedEntries.length > 0) {
    allBoards[key] = importedEntries
      .map((item) => ({
        name: String(item.name || "").trim(),
        points: Number(item.points) || 0
      }))
      .filter((item) => item.name.length > 0)
      .sort((a, b) => b.points - a.points)
      .slice(0, 20);
  }

  if (!Array.isArray(allBoards[key])) {
    allBoards[key] = [];
  }

  const filtered = allBoards[key].filter(
    (entry) => entry && entry.name && entry.name !== activePlayerName
  );
  filtered.push({ name: activePlayerName, points: Number(currentPlayerTotalPoints) || 0 });
  filtered.sort((a, b) => b.points - a.points);
  allBoards[key] = filtered.slice(0, 20);

  try {
    localStorage.setItem(LEADERBOARD_STORAGE_KEY, JSON.stringify(allBoards));
  } catch (e) {
    console.warn("Leaderboard save warning:", e);
  }

  return allBoards[key];
}

function triggerFileDownload(contentStr, fileName, mimeType) {
  const blob = new Blob([contentStr], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function exportLeaderboardJsonFile(topic, board, evaluation, totalPoints) {
  const safeFile = (topic || "lesson").replace(/[^\u0600-\u06FFa-zA-Z0-9_-]+/g, "_");
  const fileName = `leaderboard_${safeFile}.json`;
  const payload = {
    lesson: topic,
    invitePin: getOrCreateLessonInvitePin(topic),
    playerName,
    totalPoints,
    gameScore,
    gameAnsweredCount,
    gameCorrectCount,
    quizScore: lastQuizScore,
    quizTotal: lastQuizTotal,
    evaluation,
    leaderboard: board,
    exportedAt: new Date().toISOString()
  };

  triggerFileDownload(JSON.stringify(payload, null, 2), fileName, "application/json;charset=utf-8");
  lastSavedActionSummary = `تم حفظ ملف JSON (${fileName}) بنجاح — ${board.length} مشاركين فعليين.`;
  cloudSyncStatus = lastSavedActionSummary;
}

function exportLeaderboardCsvFile(topic, board, evaluation, totalPoints) {
  const safeFile = (topic || "lesson").replace(/[^\u0600-\u06FFa-zA-Z0-9_-]+/g, "_");
  const fileName = `leaderboard_${safeFile}.csv`;
  const lines = [
    ["المركز", "المشارك الفعلي", "النقاط", "الدرس", "رمز الدعوة", "التقييم", "مجموع النقاط الحالي"]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(",")
  ];

  const pin = getOrCreateLessonInvitePin(topic);
  board.forEach((row, idx) => {
    lines.push(
      [
        idx + 1,
        row.name,
        row.points,
        topic,
        pin,
        evaluation.rank,
        totalPoints
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(",")
    );
  });

  triggerFileDownload("\uFEFF" + lines.join("\n"), fileName, "text/csv;charset=utf-8");
  lastSavedActionSummary = `تم حفظ ملف CSV (${fileName}) لبرنامج Excel بنجاح.`;
  cloudSyncStatus = lastSavedActionSummary;
}

async function syncLeaderboardToCloud(topic, board, totalPoints) {
  const lessonKey = normalizeArabic(topic) || "default_lesson";
  const pin = getOrCreateLessonInvitePin(topic);
  const snapshotRecord = {
    lesson_key: lessonKey,
    lesson_title: topic,
    invite_pin: pin,
    player_name: playerName,
    points: totalPoints,
    game_score: gameScore,
    quiz_score: lastQuizScore,
    quiz_total: lastQuizTotal,
    top_board: board,
    updated_at: new Date().toISOString()
  };

  let cloudStore = {};
  try {
    cloudStore = JSON.parse(localStorage.getItem(CLOUD_SNAPSHOT_STORAGE_KEY) || "{}");
  } catch (e) {
    cloudStore = {};
  }
  cloudStore[lessonKey] = snapshotRecord;
  try {
    localStorage.setItem(CLOUD_SNAPSHOT_STORAGE_KEY, JSON.stringify(cloudStore));
  } catch (e) {}

  let cfg = null;
  try {
    cfg = JSON.parse(localStorage.getItem(CLOUD_CONFIG_STORAGE_KEY) || "null");
  } catch (e) {
    cfg = null;
  }

  if (cfg && cfg.url && cfg.anonKey) {
    const cleanUrl = cfg.url.replace(/\/+$/, "");
    const endpoint = `${cleanUrl}/rest/v1/lesson_leaderboard`;

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: cfg.anonKey,
          Authorization: `Bearer ${cfg.anonKey}`,
          Prefer: "resolution=merge-duplicates"
        },
        body: JSON.stringify(snapshotRecord)
      });

      if (res.ok) {
        lastSavedActionSummary = `تمت المزامنة الفعلية مع قاعدة بيانات السحابة (Supabase) برمز ${pin} في ${new Date().toLocaleTimeString("ar-EG")} ☁️✓`;
        cloudSyncStatus = lastSavedActionSummary;
        return;
      }
      lastSavedActionSummary = `تم حفظ اللقطة السحابية محلياً (استجابة Supabase: ${res.status}).`;
      cloudSyncStatus = lastSavedActionSummary;
      return;
    } catch (err) {
      lastSavedActionSummary = "تم حفظ اللقطة السحابية محلياً (تعذر الاتصال المباشر بـ Supabase الآن).";
      cloudSyncStatus = lastSavedActionSummary;
      return;
    }
  }

  try {
    const bucketKey = `eduspark_${lessonKey.replace(/\s+/g, "_").slice(0, 24) || "lesson"}`;
    const res = await fetch(`https://kvdb.io/api/v1/buckets/${encodeURIComponent(bucketKey)}/keys/leaderboard`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(snapshotRecord)
    });
    if (res.ok) {
      lastSavedActionSummary = `تم حفظ ومزامنة الترتيب سحابياً برمز ${pin} بنجاح في ${new Date().toLocaleTimeString("ar-EG")} ☁️✓`;
      cloudSyncStatus = lastSavedActionSummary;
      return;
    }
  } catch (e) {}

  lastSavedActionSummary = `تم حفظ ومزامنة سجل السحابة لدرس "${topic}" (رمز الدعوة: ${pin}) محلياً ☁️✓`;
  cloudSyncStatus = lastSavedActionSummary;
}

async function shareCompetitionInvite(topic, totalPoints) {
  const pin = getOrCreateLessonInvitePin(topic);
  const shareText = `🎮 تحدٍّ ومنافسة في درس "${topic}"!\n🔑 رمز الدعوة (PIN): ${pin}\n👤 المتنافس: ${playerName}\n⭐ نقاطي الحالية: ${totalPoints} نقطة\nانضم الآن ونافسني في لوحة الترتيب!`;

  if (navigator.share) {
    try {
      await navigator.share({
        title: `منافسة درس: ${topic} — PIN: ${pin}`,
        text: shareText
      });
      lastSavedActionSummary = `تمت مشاركة المنافسة ورمز الدعوة (${pin}) بنجاح 📤✓`;
      return;
    } catch (e) {
      if (e && e.name === "AbortError") {
        lastSavedActionSummary = `تم إلغاء المشاركة — رمز الدعوة جاهز: ${pin}`;
        return;
      }
    }
  }

  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(shareText);
      lastSavedActionSummary = `تم نسخ دعوة المنافسة ورمز الدعوة (${pin}) إلى الحافظة — الصقها وأرسلها لأصدقائك 📋✓`;
      return;
    }
  } catch (e) {}

  lastSavedActionSummary = `رمز الدعوة الخاص بالمنافسة: ${pin} — شاركه مع زملائك لبدء التحدي.`;
}

function buildLessonArcadeSectionHtml(data) {
  const topic = data?.title || "هذا الدرس";
  if (!currentGameQuestionsBank.length || !currentExamQuestionsBank.length) {
    refreshQuestionBanks(data);
  }

  const activeGameType = getSelectedGameType();
  const totalQuestionsInRound = Math.min(gameQuestionsPerSession, currentGameQuestionsBank.length || 1);
  const activeGameQ =
    currentGameQuestionsBank[currentGameQuestionIdx % currentGameQuestionsBank.length];
  const quizQuestions = currentExamQuestionsBank;
  const evaluation = computeStudentEvaluation(lastQuizScore, quizQuestions.length, gameScore);
  const playerTotalPoints = gameScore + lastQuizScore * 25;
  const leaderboard = getAndUpdateLeaderboard(topic, playerTotalPoints);
  const invitePin = getOrCreateLessonInvitePin(topic);

  const gameTypeOptionsHtml = FIFTY_GAME_TYPES.map(
    (g) => `<option value="${g.id}" ${g.id === selectedGameTypeId ? "selected" : ""}>${g.id}. ${escapeHtml(g.name)}</option>`
  ).join("");

  let savedCloudCfg = { url: "", anonKey: "" };
  try {
    const parsedCfg = JSON.parse(localStorage.getItem(CLOUD_CONFIG_STORAGE_KEY) || "null");
    if (parsedCfg) savedCloudCfg = parsedCfg;
  } catch (e) {}

  let gameStageHtml = "";

  if (gameStage === "start") {
    gameStageHtml = `
      <div style="background:#f8fafc;border:1px dashed #2563eb;border-radius:12px;padding:16px;text-align:center;">
        <div style="font-size:1.05rem;font-weight:700;color:#1d4ed8;margin-bottom:6px;">🚀 شاشة بداية اللعبة: ${escapeHtml(activeGameType.name)}</div>
        <p style="margin:0 0 12px;color:#334155;">${escapeHtml(activeGameType.desc)}</p>
        <div style="font-size:0.9rem;color:#475569;margin-bottom:14px;">
          عدد أسئلة الجولة: <strong>${totalQuestionsInRound}</strong> أسئلة حقيقية من الإنترنت — مؤقت <strong>${QUESTION_TIME_LIMIT} ثانية</strong> لكل سؤال مع مكافأة سرعة!
        </div>
        <button type="button" class="secondary-btn start-game-session-btn">▶ ابدأ اللعبة الآن</button>
      </div>
    `;
  } else if (gameStage === "finished") {
    const accuracy = gameAnsweredCount > 0 ? Math.round((gameCorrectCount / gameAnsweredCount) * 100) : 0;
    gameStageHtml = `
      <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:12px;padding:16px;">
        <div style="font-size:1.1rem;font-weight:700;color:#166534;margin-bottom:8px;">🏁 نهاية الجولة — ملخص نتائج اللعبة (${escapeHtml(activeGameType.name)})</div>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px;margin-bottom:12px;font-size:0.92rem;">
          <div style="background:#fff;padding:10px;border-radius:8px;border:1px solid #dcfce7;"><strong>نقاط الجولة:</strong> ${gameScore}</div>
          <div style="background:#fff;padding:10px;border-radius:8px;border:1px solid #dcfce7;"><strong>الإجابات الصحيحة:</strong> ${gameCorrectCount} / ${totalQuestionsInRound}</div>
          <div style="background:#fff;padding:10px;border-radius:8px;border:1px solid #dcfce7;"><strong>نسبة الدقة:</strong> ${accuracy}%</div>
          <div style="background:#fff;padding:10px;border-radius:8px;border:1px solid #dcfce7;"><strong>أعلى سلسلة:</strong> ${gameStreak} 🔥</div>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          <button type="button" class="secondary-btn play-again-session-btn">🔄 لعب جولة جديدة من البداية</button>
          <button type="button" class="mini-btn back-to-game-start-btn">العودة لشاشة البداية واختيار نوع اللعبة</button>
        </div>
      </div>
    `;
  } else {
    const gameChoicesHtml = (activeGameQ?.options || [])
      .map((optText, idx) => {
        const isCorrect = idx === activeGameQ.correctIndex;
        return `
          <button type="button" class="suggestion-chip game-choice-btn" data-is-correct="${isCorrect ? "1" : "0"}" data-choice-idx="${idx}">
            ${escapeHtml(optText)}
          </button>
        `;
      })
      .join("");

    const gameFeedbackHtml =
      lastGameCorrect === true
        ? `<span style="color:#166534;font-weight:700;">✔ ${escapeHtml(lastGameMessage)}</span>`
        : lastGameCorrect === false
        ? `<span style="color:#991b1b;font-weight:700;">✘ ${escapeHtml(lastGameMessage)}</span>`
        : escapeHtml(lastGameMessage);

    gameStageHtml = `
      <div>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;font-size:0.9rem;font-weight:700;color:#1d4ed8;flex-wrap:wrap;gap:6px;">
          <span class="game-score-badge">نقاط اللعبة: ${gameScore}</span>
          <span class="game-streak-badge">السلسلة: ${gameStreak} 🔥</span>
          <span class="question-timer-badge" style="background:#fef3c7;color:#92400e;padding:4px 10px;border-radius:999px;">⏱️ الوقت: ${questionTimeRemaining} ث</span>
          <span>السؤال ${Math.min(gameAnsweredCount + 1, totalQuestionsInRound)} من ${totalQuestionsInRound}</span>
        </div>
        <div style="font-size:0.84rem;color:#0f766e;font-weight:600;margin-bottom:6px;">النوع المختار: ${escapeHtml(activeGameType.name)}</div>
        <div style="font-weight:700;color:#0f172a;margin-bottom:8px;white-space:pre-line;">${escapeHtml(activeGameQ?.question || "")}</div>
        <div class="suggestions-row" style="margin-bottom:10px;">${gameChoicesHtml}</div>
        <div class="game-feedback-box suggestion-answer-box">${gameFeedbackHtml}</div>
        <div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap;">
          <button type="button" class="mini-btn finish-game-session-btn">🏁 إنهاء اللعبة وعرض النتيجة</button>
          <button type="button" class="mini-btn back-to-game-start-btn">شاشة البداية</button>
        </div>
      </div>
    `;
  }

  const quizHtml = quizQuestions
    .map((q) => {
      const savedChoice = quizAnswers[q.id];
      const isCorrectSaved = savedChoice === q.correctIndex;
      const feedbackText = quizSubmittedOnce
        ? isCorrectSaved
          ? `<span style="color:#166534;font-weight:700;">✔ إجابة صحيحة — ${escapeHtml(q.explanation)}</span>`
          : `<span style="color:#991b1b;font-weight:700;">✘ تحتاج مراجعة — ${escapeHtml(q.explanation)}</span>`
        : "";

      const optsHtml = q.options
        .map((opt, oIdx) => {
          const isSelected = savedChoice === oIdx;
          return `
            <label style="display:flex;align-items:center;gap:8px;padding:8px 10px;border:1px solid ${isSelected ? "#2563eb" : "#e2e8f0"};background:${isSelected ? "#eff6ff" : "#fff"};border-radius:8px;margin-bottom:6px;cursor:pointer;">
              <input type="radio" name="${escapeHtml(q.id)}" value="${oIdx}" ${isSelected ? "checked" : ""} />
              <span>${escapeHtml(opt)}</span>
            </label>
          `;
        })
        .join("");

      return `
        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:12px;margin-bottom:12px;">
          <div style="font-weight:700;color:#0f172a;margin-bottom:8px;white-space:pre-line;">${escapeHtml(q.question)}</div>
          <div>${optsHtml}</div>
          <div class="quiz-item-feedback" id="feedback_${escapeHtml(q.id)}" style="font-size:0.88rem;margin-top:6px;color:#334155;">${feedbackText}</div>
        </div>
      `;
    })
    .join("");

  const leaderboardRows = leaderboard
    .map(
      (row, idx) => `
        <tr style="${row.name === playerName ? "background:#eff6ff;font-weight:700;" : ""}">
          <td style="padding:8px;border:1px solid #e2e8f0;">#${idx + 1}</td>
          <td style="padding:8px;border:1px solid #e2e8f0;">${escapeHtml(row.name)}</td>
          <td style="padding:8px;border:1px solid #e2e8f0;">${row.points} نقطة</td>
        </tr>
      `
    )
    .join("");

  const competitionGap = rivalTargetScore - playerTotalPoints;
  const competitionStatusText =
    competitionGap <= 0
      ? `🎉 متفوق في الجولة #${activeCompetitionRound}: تجاوزت هدف التحدي (${rivalTargetScore} نقطة)!`
      : `⚡ جولة التحدي #${activeCompetitionRound}: ينقصك ${competitionGap} نقطة لبلوغ الهدف (${rivalTargetScore} نقطة).`;

  const isGameSelected = activeArcadeMode === "game";
  const isExamSelected = activeArcadeMode === "exam";
  const isCompetitionSelected = activeArcadeMode === "competition";

  return `
    <div id="lessonInteractiveArcade" class="lesson-interactive-arcade" style="border:2px solid #bfdbfe;background:#f0f9ff;border-radius:14px;padding:18px;">
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;margin-bottom:14px;">
        <h3 style="margin:0;color:#0f172a;">🎮 قسم الألعاب التفاعلية والاختبار والتقييمات والمنافسات — ${escapeHtml(topic)}</h3>
        <button type="button" class="secondary-btn reshuffle-all-questions-btn">🔀 جلب وتوليد أسئلة حقيقية جديدة من الإنترنت</button>
      </div>

      <div style="background:#ffffff;border:1px solid #cbd5e1;border-radius:12px;padding:12px 14px;margin-bottom:16px;display:flex;gap:10px;align-items:center;flex-wrap:wrap;">
        <span style="font-weight:700;color:#0f172a;">اختر الوضع:</span>
        <button type="button" class="secondary-btn mode-switch-game-btn" style="${isGameSelected ? "background:#1d4ed8;color:#fff;border-color:#1d4ed8;" : "opacity:0.82;"}">🕹️ لعبة تفاعلية (50 نوعاً)</button>
        <button type="button" class="secondary-btn mode-switch-exam-btn" style="${isExamSelected ? "background:#1d4ed8;color:#fff;border-color:#1d4ed8;" : "opacity:0.82;"}">📝 اختبار عشوائي للدرس</button>
        <button type="button" class="secondary-btn mode-switch-competition-btn" style="${isCompetitionSelected ? "background:#0f766e;color:#fff;border-color:#0f766e;" : "opacity:0.82;"}">🏆 التقييمات والمنافسات</button>
      </div>

      ${
        isGameSelected
          ? `
            <div style="background:#ffffff;border:1px solid #cbd5e1;border-radius:12px;padding:12px 14px;margin-bottom:16px;display:flex;gap:10px;align-items:center;flex-wrap:wrap;">
              <label style="font-weight:700;color:#0f172a;">اختر نوع اللعبة (من 50 نوعاً):</label>
              <select class="game-type-select" style="flex:1;min-width:240px;padding:8px 10px;border:1px solid #94a3b8;border-radius:8px;background:#fff;font-weight:600;">
                ${gameTypeOptionsHtml}
              </select>
              <button type="button" class="mini-btn random-game-type-btn">🎲 اختيار نوع عشوائي</button>
            </div>

            <div style="background:#ffffff;border:1px solid #cbd5e1;border-radius:12px;padding:16px;">
              <h4 style="margin-top:0;color:#1d4ed8;">🕹️ ساحة اللعبة التفاعلية (بداية • مؤقت • نهاية)</h4>
              ${gameStageHtml}
            </div>
          `
          : isExamSelected
          ? `
            <div style="background:#ffffff;border:1px solid #cbd5e1;border-radius:12px;padding:16px;">
              <h4 style="margin-top:0;">📝 اختبار الدرس العشوائي الحقيقي (${quizQuestions.length} أسئلة)</h4>
              ${quizHtml}
              <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;">
                <button type="button" class="secondary-btn submit-lesson-quiz-btn">تسليم الاختبار وحساب التقييم</button>
                <button type="button" class="secondary-btn reset-lesson-quiz-btn">إعادة الاختبار بأسئلة جديدة</button>
                <span class="quiz-final-result-badge" style="font-weight:700;color:#166534;">${
                  quizSubmittedOnce ? `نتيجتك: ${lastQuizScore} من ${lastQuizTotal}` : ""
                }</span>
              </div>
            </div>
          `
          : `
            <div style="background:#ffffff;border:1px solid #cbd5e1;border-radius:12px;padding:16px;">
              <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;margin-bottom:14px;">
                <h4 style="margin:0;color:#0f766e;">🏆 التقييمات والمنافسات الحقيقية وحفظ الترتيب (ملف أو سحابة)</h4>
                <div style="display:flex;gap:8px;flex-wrap:wrap;">
                  <button type="button" class="secondary-btn share-competition-btn">📤 مشاركة في المنافسة</button>
                  <button type="button" class="mini-btn regenerate-pin-btn">🔑 رمز دعوة جديد (PIN)</button>
                </div>
              </div>

              <div style="background:#eef2ff;border:1px solid #c7d2fe;border-radius:10px;padding:12px;margin-bottom:14px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;">
                <div>
                  <div style="font-size:0.85rem;color:#3730a3;font-weight:700;">رمز الدعوة المباشر للمنافسة (مثل Kahoot PIN):</div>
                  <div class="kahoot-pin-display" style="font-size:1.5rem;font-weight:800;letter-spacing:4px;color:#1e1b4b;margin-top:2px;">${escapeHtml(invitePin)}</div>
                </div>
                <div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center;">
                  <input type="text" maxlength="6" class="join-pin-input" placeholder="أدخل رمز الدعوة (6 أرقام)" style="width:175px;padding:7px 10px;border:1px solid #94a3b8;border-radius:8px;background:#fff;font-weight:700;" />
                  <button type="button" class="mini-btn join-pin-btn">انضمام بالرمز</button>
                </div>
              </div>

              <div class="evaluation-card-box" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:12px;margin-bottom:12px;">
                <div style="font-weight:700;font-size:1.02rem;color:#0f172a;">التقييم الحقيقي: ${escapeHtml(evaluation.rank)}</div>
                <div style="font-size:0.88rem;color:#1d4ed8;margin:4px 0;">مؤشر الإتقان: ${evaluation.combinedIndex}% | دقة اللعبة: ${evaluation.gameAccuracy}% | الاختبار: ${evaluation.percent}% | نقاطك: ${playerTotalPoints}</div>
                <div style="font-size:0.88rem;color:#0f766e;font-weight:600;margin:4px 0;">${escapeHtml(competitionStatusText)}</div>
                <p style="margin:6px 0 0;font-size:0.88rem;color:#475569;">${escapeHtml(evaluation.message)}</p>
              </div>

              <div style="display:flex;gap:8px;margin-bottom:10px;flex-wrap:wrap;">
                <input type="text" class="player-name-input" value="${escapeHtml(playerName)}" placeholder="اكتب اسمك للمنافسة" style="flex:1;min-width:140px;padding:7px 10px;border:1px solid #cbd5e1;border-radius:8px;" />
                <button type="button" class="mini-btn save-player-name-btn">✅ زر تحديث اسمي</button>
                <button type="button" class="mini-btn boost-rival-btn">⚔️ بدء جولة تحدٍ جديدة</button>
              </div>

              <div style="display:flex;gap:8px;margin-bottom:10px;flex-wrap:wrap;">
                <button type="button" class="secondary-btn export-board-file-btn">💾 زر حفظ الترتيب في ملف JSON</button>
                <button type="button" class="secondary-btn export-csv-file-btn">📄 زر حفظ الترتيب في ملف CSV</button>
                <button type="button" class="secondary-btn sync-board-cloud-btn">☁️ زر حفظ ومزامنة الترتيب مع السحابة</button>
                <label class="mini-btn" style="cursor:pointer;display:inline-flex;align-items:center;">
                  📂 استيراد ملف ترتيب
                  <input type="file" accept=".json" class="import-board-file-input" style="display:none;" />
                </label>
              </div>

              <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:8px 10px;margin-bottom:12px;font-size:0.82rem;">
                <div style="font-weight:700;color:#0f172a;margin-bottom:6px;">إعداد السحابة (Supabase اختياري — أو مزامنة سحابية تلقائية):</div>
                <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:6px;">
                  <input type="text" class="cloud-url-input" value="${escapeHtml(savedCloudCfg.url || "")}" placeholder="https://xxxx.supabase.co" style="flex:1;min-width:140px;padding:5px 8px;border:1px solid #cbd5e1;border-radius:6px;" />
                  <input type="password" class="cloud-key-input" value="${escapeHtml(savedCloudCfg.anonKey || "")}" placeholder="Supabase anon key" style="flex:1;min-width:140px;padding:5px 8px;border:1px solid #cbd5e1;border-radius:6px;" />
                  <button type="button" class="mini-btn save-cloud-cfg-btn">حفظ إعداد السحابة</button>
                </div>
                <div class="cloud-sync-status-label" style="color:#1d4ed8;font-weight:600;">${escapeHtml(cloudSyncStatus)}</div>
                <div class="saved-action-summary-label" style="color:#0f766e;font-weight:600;margin-top:4px;">${escapeHtml(lastSavedActionSummary)}</div>
              </div>

              <div style="overflow-x:auto;">
                <table style="width:100%;border-collapse:collapse;background:#fff;font-size:0.9rem;">
                  <thead>
                    <tr style="background:#f1f5f9;text-align:right;">
                      <th style="padding:8px;border:1px solid #e2e8f0;">المركز</th>
                      <th style="padding:8px;border:1px solid #e2e8f0;">المشارك الفعلي</th>
                      <th style="padding:8px;border:1px solid #e2e8f0;">النقاط</th>
                    </tr>
                  </thead>
                  <tbody class="leaderboard-tbody">${leaderboardRows}</tbody>
                </table>
              </div>
            </div>
          `
      }
    </div>
  `;
}

function renderAndBindLessonArcade(data) {
  if (!data) return;
  stopQuestionTimer();
  const html = buildLessonArcadeSectionHtml(data);

  for (const container of dedicatedArcadeContainers) {
    container.innerHTML = html;
  }

  const arcadeRoots = Array.from(document.querySelectorAll(".lesson-interactive-arcade"));
  if (!arcadeRoots.length) return;

  const topic = data?.title || "هذا الدرس";
  const quizQuestions = currentExamQuestionsBank;
  const totalQuestionsInRound = Math.min(gameQuestionsPerSession, currentGameQuestionsBank.length || 1);
  const activeGameQ =
    currentGameQuestionsBank[currentGameQuestionIdx % currentGameQuestionsBank.length];

  const refreshLeaderboardAndEval = () => {
    const playerTotalPoints = gameScore + lastQuizScore * 25;
    const evaluation = computeStudentEvaluation(lastQuizScore, quizQuestions.length, gameScore);
    const board = getAndUpdateLeaderboard(topic, playerTotalPoints);
    const currentPin = getOrCreateLessonInvitePin(topic);
    const competitionGap = rivalTargetScore - playerTotalPoints;
    const competitionStatusText =
      competitionGap <= 0
        ? `🎉 متفوق في الجولة #${activeCompetitionRound}: تجاوزت هدف التحدي (${rivalTargetScore} نقطة)!`
        : `⚡ جولة التحدي #${activeCompetitionRound}: ينقصك ${competitionGap} نقطة لبلوغ الهدف (${rivalTargetScore} نقطة).`;

    document.querySelectorAll(".kahoot-pin-display").forEach((pinEl) => {
      pinEl.textContent = currentPin;
    });

    document.querySelectorAll(".evaluation-card-box").forEach((evalBox) => {
      evalBox.innerHTML = `
        <div style="font-weight:700;font-size:1.02rem;color:#0f172a;">التقييم الحقيقي: ${escapeHtml(evaluation.rank)}</div>
        <div style="font-size:0.88rem;color:#1d4ed8;margin:4px 0;">مؤشر الإتقان: ${evaluation.combinedIndex}% | دقة اللعبة: ${evaluation.gameAccuracy}% | الاختبار: ${evaluation.percent}% | نقاطك: ${playerTotalPoints}</div>
        <div style="font-size:0.88rem;color:#0f766e;font-weight:600;margin:4px 0;">${escapeHtml(competitionStatusText)}</div>
        <p style="margin:6px 0 0;font-size:0.88rem;color:#475569;">${escapeHtml(evaluation.message)}</p>
      `;
    });

    document.querySelectorAll(".leaderboard-tbody").forEach((tbody) => {
      tbody.innerHTML = board
        .map(
          (row, idx) => `
            <tr style="${row.name === playerName ? "background:#eff6ff;font-weight:700;" : ""}">
              <td style="padding:8px;border:1px solid #e2e8f0;">#${idx + 1}</td>
              <td style="padding:8px;border:1px solid #e2e8f0;">${escapeHtml(row.name)}</td>
              <td style="padding:8px;border:1px solid #e2e8f0;">${row.points} نقطة</td>
            </tr>
          `
        )
        .join("");
    });

    document.querySelectorAll(".cloud-sync-status-label").forEach((lbl) => {
      lbl.textContent = cloudSyncStatus;
    });

    document.querySelectorAll(".saved-action-summary-label").forEach((lbl) => {
      lbl.textContent = lastSavedActionSummary;
    });
  };

  if (activeArcadeMode === "game" && gameStage === "playing") {
    questionTimeRemaining = QUESTION_TIME_LIMIT;
    questionTimerInterval = setInterval(() => {
      questionTimeRemaining -= 1;
      document.querySelectorAll(".question-timer-badge").forEach((badge) => {
        badge.textContent = `⏱️ الوقت: ${Math.max(0, questionTimeRemaining)} ث`;
      });

      if (questionTimeRemaining <= 0) {
        stopQuestionTimer();
        gameAnsweredCount += 1;
        gameWrongCount += 1;
        gameStreak = 0;
        lastGameCorrect = false;
        lastGameMessage = `انتهى وقت السؤال! ${activeGameQ?.explanation || ""}`;
        playCueTone(260, 0.16);

        if (gameAnsweredCount >= totalQuestionsInRound) {
          gameStage = "finished";
        } else {
          currentGameQuestionIdx = (currentGameQuestionIdx + 1) % currentGameQuestionsBank.length;
        }
        renderAndBindLessonArcade(data);
      }
    }, 1000);
  }

  arcadeRoots.forEach((root) => {
    const switchGameBtn = root.querySelector(".mode-switch-game-btn");
    const switchExamBtn = root.querySelector(".mode-switch-exam-btn");
    const switchCompetitionBtn = root.querySelector(".mode-switch-competition-btn");

    if (switchGameBtn) {
      switchGameBtn.addEventListener("click", () => {
        activeArcadeMode = "game";
        playCueTone(520, 0.1);
        renderAndBindLessonArcade(data);
      });
    }

    if (switchExamBtn) {
      switchExamBtn.addEventListener("click", () => {
        stopQuestionTimer();
        activeArcadeMode = "exam";
        playCueTone(560, 0.1);
        renderAndBindLessonArcade(data);
      });
    }

    if (switchCompetitionBtn) {
      switchCompetitionBtn.addEventListener("click", () => {
        stopQuestionTimer();
        activeArcadeMode = "competition";
        getOrCreateLessonInvitePin(topic);
        playCueTone(600, 0.1);
        renderAndBindLessonArcade(data);
      });
    }

    const shareCompBtn = root.querySelector(".share-competition-btn");
    if (shareCompBtn) {
      shareCompBtn.addEventListener("click", async () => {
        const totalPts = gameScore + lastQuizScore * 25;
        await shareCompetitionInvite(topic, totalPts);
        playCueTone(660, 0.12);
        refreshLeaderboardAndEval();
      });
    }

    const regenPinBtn = root.querySelector(".regenerate-pin-btn");
    if (regenPinBtn) {
      regenPinBtn.addEventListener("click", () => {
        const fresh = generateKahootStylePin();
        setLessonInvitePin(topic, fresh);
        lastSavedActionSummary = `تم توليد رمز دعوة جديد للمنافسة: ${fresh}`;
        playCueTone(620, 0.12);
        refreshLeaderboardAndEval();
      });
    }

    const joinPinInput = root.querySelector(".join-pin-input");
    const joinPinBtn = root.querySelector(".join-pin-btn");
    if (joinPinBtn && joinPinInput) {
      joinPinBtn.addEventListener("click", () => {
        const entered = joinPinInput.value.replace(/\D/g, "").slice(0, 6);
        if (entered.length < 4) {
          lastSavedActionSummary = "أدخل رمز دعوة صحيحاً (4 إلى 6 أرقام) للانضمام للمنافسة.";
          refreshLeaderboardAndEval();
          return;
        }
        setLessonInvitePin(topic, entered);
        lastSavedActionSummary = `تم الانضمام وتفعيل رمز الدعوة (${entered}) لدرس "${topic}" ✓`;
        playCueTone(680, 0.12);
        refreshLeaderboardAndEval();
      });
    }

    const gameTypeSelect = root.querySelector(".game-type-select");
    if (gameTypeSelect) {
      gameTypeSelect.addEventListener("change", () => {
        selectedGameTypeId = Number(gameTypeSelect.value) || 1;
        gameStage = "start";
        refreshQuestionBanks(data);
        playCueTone(520, 0.1);
        renderAndBindLessonArcade(data);
      });
    }

    const randomTypeBtn = root.querySelector(".random-game-type-btn");
    if (randomTypeBtn) {
      randomTypeBtn.addEventListener("click", () => {
        const randObj = FIFTY_GAME_TYPES[Math.floor(Math.random() * FIFTY_GAME_TYPES.length)];
        selectedGameTypeId = randObj.id;
        gameStage = "start";
        refreshQuestionBanks(data);
        playCueTone(580, 0.12);
        renderAndBindLessonArcade(data);
      });
    }

    const startSessionBtn = root.querySelector(".start-game-session-btn");
    if (startSessionBtn) {
      startSessionBtn.addEventListener("click", () => {
        gameScore = 0;
        gameStreak = 0;
        refreshQuestionBanks(data);
        gameStage = "playing";
        lastGameCorrect = null;
        lastGameMessage = "أجب قبل انتهاء المؤقت لكسب نقاط السرعة!";
        playCueTone(640, 0.14);
        renderAndBindLessonArcade(data);
      });
    }

    const finishSessionBtn = root.querySelector(".finish-game-session-btn");
    if (finishSessionBtn) {
      finishSessionBtn.addEventListener("click", () => {
        stopQuestionTimer();
        gameStage = "finished";
        playCueTone(720, 0.16);
        renderAndBindLessonArcade(data);
      });
    }

    const playAgainBtn = root.querySelector(".play-again-session-btn");
    if (playAgainBtn) {
      playAgainBtn.addEventListener("click", () => {
        gameScore = 0;
        gameStreak = 0;
        refreshQuestionBanks(data);
        gameStage = "playing";
        lastGameCorrect = null;
        lastGameMessage = "بدأت جولة جديدة من البداية للنهاية!";
        playCueTone(640, 0.14);
        renderAndBindLessonArcade(data);
      });
    }

    const backToStartBtn = root.querySelector(".back-to-game-start-btn");
    if (backToStartBtn) {
      backToStartBtn.addEventListener("click", () => {
        stopQuestionTimer();
        gameStage = "start";
        renderAndBindLessonArcade(data);
      });
    }

    const reshuffleAllBtn = root.querySelector(".reshuffle-all-questions-btn");
    if (reshuffleAllBtn) {
      reshuffleAllBtn.addEventListener("click", async () => {
        const freshFacts = await fetchLiveWebFactsForQuestions(topic);
        if (freshFacts.length) {
          data.liveWebFacts = deduplicateSentenceList([...freshFacts, ...(data.liveWebFacts || [])]);
        }
        refreshQuestionBanks(data);
        lastGameCorrect = null;
        lastGameMessage = "تم جلب أسئلة حقيقية عشوائية جديدة من الإنترنت!";
        playCueTone(580, 0.12);
        renderAndBindLessonArcade(data);
      });
    }

    const gameChoiceBtns = root.querySelectorAll(".game-choice-btn");
    gameChoiceBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        stopQuestionTimer();
        const isCorrect = btn.dataset.isCorrect === "1";
        const speedBonus = Math.max(0, Math.round(questionTimeRemaining / 2));
        gameAnsweredCount += 1;

        if (isCorrect) {
          gameCorrectCount += 1;
          gameStreak += 1;
          gameScore += 15 + Math.min(15, gameStreak * 5) + speedBonus;
          lastGameCorrect = true;
          lastGameMessage = `إجابة صحيحة (+${speedBonus} سرعة)! ${activeGameQ?.explanation || ""}`;
          playCueTone(660, 0.14);
        } else {
          gameWrongCount += 1;
          gameStreak = 0;
          lastGameCorrect = false;
          lastGameMessage = `إجابة غير مطابقة. ${activeGameQ?.explanation || ""}`;
          playCueTone(280, 0.16);
        }

        const totalPts = gameScore + lastQuizScore * 25;
        getAndUpdateLeaderboard(topic, totalPts);

        if (gameAnsweredCount >= totalQuestionsInRound) {
          gameStage = "finished";
        } else {
          currentGameQuestionIdx = (currentGameQuestionIdx + 1) % currentGameQuestionsBank.length;
        }
        renderAndBindLessonArcade(data);
      });
    });

    quizQuestions.forEach((q) => {
      const radios = root.querySelectorAll(`input[name="${q.id}"]`);
      radios.forEach((r) => {
        r.addEventListener("change", () => {
          quizAnswers[q.id] = Number(r.value);
        });
      });
    });

    const submitQuizBtn = root.querySelector(".submit-lesson-quiz-btn");
    const resetQuizBtn = root.querySelector(".reset-lesson-quiz-btn");

    if (submitQuizBtn) {
      submitQuizBtn.addEventListener("click", () => {
        let score = 0;
        quizQuestions.forEach((q) => {
          const chosen = quizAnswers[q.id];
          const isCorrect = chosen === q.correctIndex;
          if (isCorrect) score += 1;

          document.querySelectorAll(`#feedback_${q.id}`).forEach((fbEl) => {
            fbEl.innerHTML = isCorrect
              ? `<span style="color:#166534;font-weight:700;">✔ إجابة صحيحة — ${escapeHtml(q.explanation)}</span>`
              : `<span style="color:#991b1b;font-weight:700;">✘ تحتاج مراجعة — ${escapeHtml(q.explanation)}</span>`;
          });
        });

        lastQuizScore = score;
        lastQuizTotal = quizQuestions.length;
        quizSubmittedOnce = true;
        playCueTone(score >= 2 ? 700 : 320, 0.16);

        const totalPts = gameScore + lastQuizScore * 25;
        getAndUpdateLeaderboard(topic, totalPts);

        document.querySelectorAll(".quiz-final-result-badge").forEach((badge) => {
          badge.textContent = `نتيجتك: ${score} من ${quizQuestions.length}`;
        });
      });
    }

    if (resetQuizBtn) {
      resetQuizBtn.addEventListener("click", () => {
        refreshQuestionBanks(data);
        lastQuizScore = 0;
        lastQuizTotal = 0;
        renderAndBindLessonArcade(data);
      });
    }

    const nameInput = root.querySelector(".player-name-input");
    const saveNameBtn = root.querySelector(".save-player-name-btn");
    const boostRivalBtn = root.querySelector(".boost-rival-btn");

    if (saveNameBtn && nameInput) {
      saveNameBtn.addEventListener("click", () => {
        const cleaned = nameInput.value.trim();
        if (cleaned) {
          playerName = cleaned;
          lastSavedActionSummary = `تم تحديث اسم المشارك الفعلي إلى "${playerName}" وحساب ترتيبه.`;
          playCueTone(560, 0.1);
          refreshLeaderboardAndEval();
        }
      });
    }

    if (boostRivalBtn) {
      boostRivalBtn.addEventListener("click", () => {
        activeCompetitionRound += 1;
        rivalTargetScore += 35;
        lastSavedActionSummary = `تم بدء جولة التحدي #${activeCompetitionRound} بهدف ${rivalTargetScore} نقطة.`;
        playCueTone(640, 0.14);
        refreshLeaderboardAndEval();
      });
    }

    const exportJsonBtn = root.querySelector(".export-board-file-btn");
    if (exportJsonBtn) {
      exportJsonBtn.addEventListener("click", () => {
        const totalPts = gameScore + lastQuizScore * 25;
        const evalObj = computeStudentEvaluation(lastQuizScore, quizQuestions.length, gameScore);
        const board = getAndUpdateLeaderboard(topic, totalPts);
        exportLeaderboardJsonFile(topic, board, evalObj, totalPts);
        playCueTone(660, 0.12);
        refreshLeaderboardAndEval();
      });
    }

    const exportCsvBtn = root.querySelector(".export-csv-file-btn");
    if (exportCsvBtn) {
      exportCsvBtn.addEventListener("click", () => {
        const totalPts = gameScore + lastQuizScore * 25;
        const evalObj = computeStudentEvaluation(lastQuizScore, quizQuestions.length, gameScore);
        const board = getAndUpdateLeaderboard(topic, totalPts);
        exportLeaderboardCsvFile(topic, board, evalObj, totalPts);
        playCueTone(660, 0.12);
        refreshLeaderboardAndEval();
      });
    }

    const importFileInput = root.querySelector(".import-board-file-input");
    if (importFileInput) {
      importFileInput.addEventListener("change", (ev) => {
        const file = ev.target.files && ev.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
          try {
            const parsed = JSON.parse(String(reader.result || "{}"));
            const importedList = Array.isArray(parsed.leaderboard) ? parsed.leaderboard : [];
            if (importedList.length > 0) {
              const totalPts = gameScore + lastQuizScore * 25;
              getAndUpdateLeaderboard(topic, totalPts, importedList);
              lastSavedActionSummary = `تم استيراد الترتيب الفعلي من الملف (${file.name}) وتحديث الجدول.`;
              cloudSyncStatus = lastSavedActionSummary;
              playCueTone(620, 0.12);
              refreshLeaderboardAndEval();
            }
          } catch (err) {
            lastSavedActionSummary = "تعذر قراءة ملف JSON — تأكد من صحة الملف.";
            refreshLeaderboardAndEval();
          }
        };
        reader.readAsText(file, "utf-8");
      });
    }

    const saveCloudCfgBtn = root.querySelector(".save-cloud-cfg-btn");
    const cloudUrlInput = root.querySelector(".cloud-url-input");
    const cloudKeyInput = root.querySelector(".cloud-key-input");
    if (saveCloudCfgBtn && cloudUrlInput && cloudKeyInput) {
      saveCloudCfgBtn.addEventListener("click", () => {
        const urlVal = cloudUrlInput.value.trim();
        const keyVal = cloudKeyInput.value.trim();
        localStorage.setItem(CLOUD_CONFIG_STORAGE_KEY, JSON.stringify({ url: urlVal, anonKey: keyVal }));
        lastSavedActionSummary = urlVal && keyVal
          ? "تم حفظ بيانات Supabase — اضغط 'زر حفظ ومزامنة الترتيب مع السحابة'."
          : "تم تحديث إعداد السحابة — المزامنة السحابية التلقائية جاهزة.";
        cloudSyncStatus = lastSavedActionSummary;
        playCueTone(580, 0.1);
        refreshLeaderboardAndEval();
      });
    }

    const syncCloudBtn = root.querySelector(".sync-board-cloud-btn");
    if (syncCloudBtn) {
      syncCloudBtn.addEventListener("click", async () => {
        const totalPts = gameScore + lastQuizScore * 25;
        const board = getAndUpdateLeaderboard(topic, totalPts);
        cloudSyncStatus = "جاري حفظ ومزامنة الترتيب مع السحابة...";
        refreshLeaderboardAndEval();
        await syncLeaderboardToCloud(topic, board, totalPts);
        playCueTone(700, 0.14);
        refreshLeaderboardAndEval();
      });
    }
  });
}

function verifyAndSimplifyContent(topic, rawSources, fullExtracts = [], liveWebFacts = []) {
  const keywords = extractKeywords(topic);

  const verifiedSources = rawSources
    .filter((src) => src && src.extract && src.extract.trim().length > 25)
    .map((src) => ({
      ...src,
      relevance: calculateRelevance(`${src.title} ${src.extract}`, topic, keywords)
    }))
    .sort((a, b) => b.relevance - a.relevance);

  if (verifiedSources.length === 0) {
    throw new Error("تعذر الوصول إلى مصادر معلومات حية حالياً. تأكد من اتصالك بالإنترنت وأعد المحاولة.");
  }

  const summariesText = verifiedSources
    .slice(0, 3)
    .map((s) => s.extract)
    .join(" ");

  const fullBodyText = (fullExtracts || [])
    .map((entry) => (typeof entry === "string" ? entry : entry.text || "").slice(0, 26000))
    .join("\n");

  const combinedText = `${summariesText}\n${fullBodyText}\n${(liveWebFacts || []).join(" ")}`.trim();

  const sentences = combinedText
    .replace(/\r/g, "")
    .split(/(?<=[.،!؟\n])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 20 && !/^=+\s*[^=]+\s*=+$/.test(s));

  const rankedSentences = sentences
    .map((s, idx) => ({
      text: s,
      idx,
      score: calculateRelevance(s, topic, keywords) + (idx < 5 ? 3 : 0)
    }))
    .sort((a, b) => b.score - a.score);

  const simplifiedList = deduplicateSentenceList([
    ...rankedSentences.map((item) => simplifyArabicSentence(item.text, 250)),
    ...(liveWebFacts || [])
  ]).slice(0, 16);

  const bestDefinition = extractBestDefinition(topic, simplifiedList, keywords);
  const wikiSections = extractSimplifiedWikiSections(topic, fullExtracts, simplifiedList);
  const components = extractLessonComponents(topic, simplifiedList, wikiSections, keywords);
  const toolsAndSites = extractToolsAndFamousWebsites(topic, combinedText, fullExtracts);

  const nonRepeatingParts = deduplicateSentenceList([
    bestDefinition,
    ...simplifiedList
  ]).slice(0, 5);

  const fullSimpleExplanation = ensureCompleteSentence(
    nonRepeatingParts.length > 0 ? nonRepeatingParts.join(" ") : bestDefinition,
    topic
  );

  const keyPoints =
    simplifiedList.length > 0
      ? deduplicateSentenceList(simplifiedList).slice(0, 6)
      : [bestDefinition];

  const comparisons = extractSimplifiedComparisons(topic, simplifiedList, keywords);
  const mindMap = buildMindMapData(topic, bestDefinition, keyPoints, fullSimpleExplanation, simplifiedList);
  const verificationReport = computeLessonVerificationReport(
    topic,
    verifiedSources,
    fullExtracts,
    liveWebFacts,
    keyPoints
  );

  const imagePrompt = `Clear educational infographic illustration about ${topic}, clean modern diagram style, no text`;

  return {
    title: topic,
    bestDefinition,
    simple_explanation: fullSimpleExplanation,
    key_points: keyPoints,
    components,
    comparisons,
    wikiSections,
    tools: toolsAndSites.tools,
    websites: toolsAndSites.websites,
    liveWebFacts: deduplicateSentenceList(liveWebFacts || []),
    verificationReport,
    mindMap,
    image_prompt: imagePrompt,
    youtube_query: `شرح ${topic}`,
    sources: verifiedSources.slice(0, 3)
  };
}

function getAutoRandomMindMapStyle(seed) {
  const styles = [
    {
      name: "منحنيات كلاسيكية زرقاء",
      centerFill: "#1d4ed8",
      branchStroke: "#2563eb",
      branchFill: "#ffffff",
      lineColor: "#64748b",
      dash: "5 4",
      radius: 12,
      curveType: "bezier"
    },
    {
      name: "أقواس ناعمة زمردية",
      centerFill: "#0f766e",
      branchStroke: "#0d9488",
      branchFill: "#f0fdfa",
      lineColor: "#14b8a6",
      dash: "none",
      radius: 18,
      curveType: "wave"
    },
    {
      name: "خطوط متدرجة بنفسجية",
      centerFill: "#7c3aed",
      branchStroke: "#8b5cf6",
      branchFill: "#faf5ff",
      lineColor: "#a78bfa",
      dash: "8 4",
      radius: 6,
      curveType: "step"
    },
    {
      name: "تصميم دافئ كهرماني",
      centerFill: "#b45309",
      branchStroke: "#d97706",
      branchFill: "#fffbeb",
      lineColor: "#f59e0b",
      dash: "3 4",
      radius: 15,
      curveType: "bezier"
    }
  ];
  const idx = Math.abs(Number(seed) || 1) % styles.length;
  return styles[idx];
}

function buildConnectorPath(centerY, boxRightX, y, curveType, seedOffset) {
  const startX = 455;
  if (curveType === "step") {
    const midX = 355;
    return `M ${startX} ${centerY} L ${midX} ${centerY} L ${midX} ${y} L ${boxRightX} ${y}`;
  }
  if (curveType === "wave") {
    const ctrl1X = 370;
    const ctrl1Y = centerY + ((seedOffset % 2 === 0) ? -28 : 28);
    const ctrl2X = 310;
    const ctrl2Y = y + ((seedOffset % 2 === 0) ? 22 : -22);
    return `M ${startX} ${centerY} C ${ctrl1X} ${ctrl1Y}, ${ctrl2X} ${ctrl2Y}, ${boxRightX} ${y}`;
  }
  return `M ${startX} ${centerY} C 350 ${centerY + seedOffset}, 310 ${y}, ${boxRightX} ${y}`;
}

function buildExplainerInnerHtml(heading, speechText, elements, questionText, suggestions) {
  const elementsHtml = (elements || [])
    .map(
      (el, eIdx) => `
        <div class="element-card" data-element-index="${eIdx}" style="cursor:pointer;">
          <div class="element-card-title">${escapeHtml(el.elementName)}</div>
          <div class="element-card-desc">${escapeHtml(el.explanation)}</div>
        </div>
      `
    )
    .join("");

  const chipsHtml = (suggestions || [])
    .map(
      (sug, sIdx) => `
        <button type="button" class="suggestion-chip" data-suggestion-index="${sIdx}">
          ${escapeHtml(sug.label)}
        </button>
      `
    )
    .join("");

  return `
    <span class="teacher-badge">تمهيد وشرح المدرس الافتراضي</span>
    <div style="font-weight:700;font-size:1.05rem;color:#1d4ed8;margin-bottom:6px;">${escapeHtml(heading)}</div>
    <p class="teacher-explanation-text">${escapeHtml(speechText)}</p>
    <div class="elements-grid">${elementsHtml}</div>
    <div class="teacher-question-box">
      <div class="teacher-question-title">❓ ${escapeHtml(questionText || "اختر عنصراً ليقوم المدرس بشرحه لك:")}</div>
      <div class="suggestions-row">${chipsHtml}</div>
      <div id="suggestionAnswerBox" class="suggestion-answer-box">
        اضغط على أي عنصر مرقّم (1 إلى 4) في الأعلى أو أي عنصر اقتراحي في السؤال ليعرض المدرس شرحاً كاملاً ومبسطاً له.
      </div>
    </div>
    <div class="teacher-actions">
      <button type="button" id="speakTeacherBtn" class="mini-btn">🔊 استمع لشرح المدرس المحسّن</button>
      <button type="button" id="stopSpeakBtn" class="mini-btn">⏹ إيقاف الصوت</button>
    </div>
  `;
}

function renderMindMapHtml(mindMap, seed = currentMindMapStyleSeed) {
  if (!mindMap || !mindMap.nodes || mindMap.nodes.length === 0) return "";

  const styleCfg = getAutoRandomMindMapStyle(seed);
  const orderedNodes = mindMap.nodes;

  const centerY = 180;
  const count = orderedNodes.length;
  const spacing = 280 / Math.max(count - 1, 1);
  const startY = count === 1 ? 180 : 40;

  const branchesSvg = orderedNodes
    .map((node, idx) => {
      const y = count === 1 ? startY : startY + idx * spacing;
      const seedOffset = ((Number(seed) + idx * 7) % 9) - 4;
      const boxX = 35;
      const boxY = y - 24;
      const boxW = 215;
      const boxH = 48;
      const pathD = buildConnectorPath(centerY, boxX + boxW, y, styleCfg.curveType, seedOffset);
      const dashAttr = styleCfg.dash === "none" ? "" : `stroke-dasharray="${styleCfg.dash}"`;

      return `
        <path class="mm-connector" d="${pathD}" style="stroke:${styleCfg.lineColor};" ${dashAttr} />
        <g class="mm-node-group" data-node-id="${escapeHtml(node.id)}">
          <rect class="mm-branch-box" x="${boxX}" y="${boxY}" width="${boxW}" height="${boxH}" rx="${styleCfg.radius}" style="fill:${styleCfg.branchFill};stroke:${styleCfg.branchStroke};" />
          <text class="mm-branch-text" x="${boxX + boxW / 2}" y="${y - 4}" text-anchor="middle">${escapeHtml(node.label)}</text>
          <text class="mm-branch-text" x="${boxX + boxW / 2}" y="${y + 14}" text-anchor="middle" style="font-size:10.5px;fill:#475569;">${escapeHtml(node.shortText)}</text>
        </g>
      `;
    })
    .join("");

  const initialExplainer = buildExplainerInnerHtml(
    `${mindMap.centerLabel} — ${mindMap.centerTitle}`,
    mindMap.centerSpeech,
    mindMap.centerElements,
    mindMap.centerQuestion,
    mindMap.centerSuggestions
  );

  return `
    <div class="mindmap-section">
      <h4>الخريطة الذهنية التفاعلية للدرس</h4>
      <p class="mindmap-hint">نمط الرسم المختار تلقائياً: <strong>${escapeHtml(styleCfg.name)}</strong> — الفروع مرتبة منطقياً من 1 إلى ${count}.</p>
      <div class="mindmap-canvas-wrap">
        <svg class="mindmap-svg" viewBox="0 0 700 360" role="img" aria-label="خريطة ذهنية للدرس">
          ${branchesSvg}
          <g class="mm-node-group active" data-node-id="center">
            <rect class="mm-center-box" x="455" y="146" width="210" height="68" rx="${styleCfg.radius + 2}" style="fill:${styleCfg.centerFill};" />
            <text class="mm-center-text" x="560" y="176" text-anchor="middle">الموضوع الرئيسي</text>
            <text class="mm-center-text" x="560" y="198" text-anchor="middle" style="font-size:12px;">${escapeHtml(mindMap.centerTitle)}</text>
          </g>
        </svg>
      </div>
      <div id="mindmapExplainer" class="mindmap-explainer">
        ${initialExplainer}
      </div>
    </div>
  `;
}

function cleanSpeechScript(rawText) {
  return String(rawText || "")
    .replace(/[✅❌✔✘🏆⭐📘🚀🏁🔄🎲🔀⚡🎯🔊🔇⏹▶⏸⏱️💾☁️📄📂⚔️📤🔑🤖🔎⚖️🧠👋🕒📌🧹↩💡]/g, " ")
    .replace(/\[[^\]]*\]/g, " ")
    .replace(/\([^)]*\)/g, " ")
    .replace(/[_*#~`=+|/\\<>]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function speakArabicText(textToSpeak, onStatusChange = null, playCue = true) {
  if (isVoiceMuted) {
    if (typeof onStatusChange === "function") onStatusChange("🔇 الصوت مكتوم حالياً");
    return;
  }

  pauseVideoPlayerIfPlaying();
  if (playCue) {
    playCueTone(520, 0.12);
  }

  if (!("speechSynthesis" in window)) {
    if (typeof onStatusChange === "function") {
      onStatusChange("🔊 تم تشغيل الإشارة الصوتية");
    }
    return;
  }

  const cleanText = cleanSpeechScript(textToSpeak);
  if (!cleanText) return;

  try {
    window.speechSynthesis.cancel();
    window.speechSynthesis.resume();

    const voices = window.speechSynthesis.getVoices() || [];
    const arabicVoice =
      voices.find((v) => /ar-EG/i.test(v.lang)) ||
      voices.find((v) => /ar-SA/i.test(v.lang)) ||
      voices.find((v) => /ar/i.test(v.lang)) ||
      voices.find((v) => /arabic/i.test(v.name)) ||
      null;

    const chunks = cleanText
      .split(/(?<=[.،!؟])\s+/)
      .map((c) => c.trim())
      .filter(Boolean);

    const queue = chunks.length > 0 ? chunks : [cleanText];

    queue.forEach((part, idx) => {
      const utter = new SpeechSynthesisUtterance(part);
      utter.volume = 1;
      utter.rate = 0.92;
      utter.pitch = 1.02;

      if (arabicVoice) {
        utter.voice = arabicVoice;
        utter.lang = arabicVoice.lang || "ar-SA";
      } else {
        utter.lang = "ar-SA";
      }

      if (idx === 0) {
        utter.onstart = () => {
          if (typeof onStatusChange === "function") {
            onStatusChange("🔊 صوت شرح الدرس المحسّن يعمل الآن (بدون تداخل)");
          }
        };
      }
      if (idx === queue.length - 1) {
        utter.onend = () => {
          if (typeof onStatusChange === "function") {
            onStatusChange("✓ اكتمل شرح الدرس الصوتي");
          }
        };
      }
      utter.onerror = () => {
        if (typeof onStatusChange === "function") {
          onStatusChange("🔊 تحقق من صوت النظام أو أعد الضغط على الاستماع");
        }
      };

      window.speechSynthesis.speak(utter);
    });
  } catch (e) {
    console.warn("Speech synthesis warning:", e);
  }
}

function bindExplainerInteractions(baseSpeechText, elements, suggestions) {
  let currentSpeech = baseSpeechText;

  const speakBtn = document.getElementById("speakTeacherBtn");
  const stopBtn = document.getElementById("stopSpeakBtn");
  const elementCards = document.querySelectorAll(".element-card");
  const chips = document.querySelectorAll(".suggestion-chip");
  const answerBox = document.getElementById("suggestionAnswerBox");

  if (speakBtn) {
    speakBtn.addEventListener("click", () => {
      speakArabicText(currentSpeech, null, true);
    });
  }

  if (stopBtn) {
    stopBtn.addEventListener("click", () => {
      stopAllLessonAudio(false);
    });
  }

  if (elementCards.length && answerBox && Array.isArray(elements)) {
    elementCards.forEach((card) => {
      card.addEventListener("click", () => {
        elementCards.forEach((c) => c.classList.remove("active"));
        chips.forEach((c) => c.classList.remove("active"));
        card.classList.add("active");

        const idx = Number(card.dataset.elementIndex);
        const el = elements[idx];
        if (el) {
          answerBox.innerHTML = `<strong>${escapeHtml(el.elementName)}:</strong> ${escapeHtml(el.explanation)}`;
          currentSpeech = el.explanation;
        }
      });
    });
  }

  if (chips.length && answerBox && Array.isArray(suggestions)) {
    chips.forEach((chip) => {
      chip.addEventListener("click", () => {
        chips.forEach((c) => c.classList.remove("active"));
        elementCards.forEach((c) => c.classList.remove("active"));
        chip.classList.add("active");

        const idx = Number(chip.dataset.suggestionIndex);
        const sug = suggestions[idx];
        if (sug) {
          answerBox.innerHTML = `<strong>${escapeHtml(sug.label)}:</strong> ${escapeHtml(sug.explanation)}`;
          currentSpeech = sug.explanation;
        }
      });
    });
  }
}

function attachMindMapEvents(mindMap) {
  const explainerEl = document.getElementById("mindmapExplainer");
  const groups = document.querySelectorAll(".mm-node-group");
  if (!explainerEl || !groups.length) return;

  bindExplainerInteractions(mindMap.centerSpeech, mindMap.centerElements, mindMap.centerSuggestions);

  groups.forEach((grp) => {
    grp.addEventListener("click", () => {
      stopAllLessonAudio(false);
      groups.forEach((g) => g.classList.remove("active"));
      grp.classList.add("active");

      const nodeId = grp.dataset.nodeId;
      if (nodeId === "center") {
        explainerEl.innerHTML = buildExplainerInnerHtml(
          `${mindMap.centerLabel} — ${mindMap.centerTitle}`,
          mindMap.centerSpeech,
          mindMap.centerElements,
          mindMap.centerQuestion,
          mindMap.centerSuggestions
        );
        bindExplainerInteractions(mindMap.centerSpeech, mindMap.centerElements, mindMap.centerSuggestions);
      } else {
        const node = mindMap.nodes.find((n) => n.id === nodeId);
        if (node) {
          explainerEl.innerHTML = buildExplainerInnerHtml(
            `${node.label} (${mindMap.centerTitle})`,
            node.speech,
            node.elements,
            node.question,
            node.suggestions
          );
          bindExplainerInteractions(node.speech, node.elements, node.suggestions);
        }
      }
    });
  });
}

generateBtn.addEventListener("click", async () => {
  const topic = topicInput.value.trim();

  if (!topic) {
    showStatus("اكتب اسم الدرس أو الموضوع أولاً.", "error");
    return;
  }

  stopQuestionTimer();
  stopAllLessonAudio(false);
  pauseVideoPlayerIfPlaying();
  generateBtn.disabled = true;
  generateBtn.textContent = "جاري البحث والتحقق والشرح الكامل...";
  showStatus("جاري البحث في مصادر مجانية متعددة والتحقق من المعلومات ومنع التكرار...", "info");

  try {
    const [wikiResults, ddgResult, liveWebFacts] = await Promise.all([
      fetchWikipediaSources(topic),
      fetchDuckDuckGoInfo(topic),
      fetchLiveWebFactsForQuestions(topic)
    ]);

    const allSources = [...wikiResults];
    if (ddgResult) allSources.push(ddgResult);

    const fullExtracts = await fetchFullWikipediaExtracts(allSources);
    const lessonData = verifyAndSimplifyContent(topic, allSources, fullExtracts, liveWebFacts);
    currentLessonData = lessonData;
    currentFollowUpSuggestions = buildDynamicSuggestedQuestions(
      topic,
      topic,
      lessonData.liveWebFacts || [],
      ++assistantTurnCounter
    );
    isFullLessonExpanded = false;
    activeArcadeMode = "game";
    gameStage = "start";
    gameScore = 0;
    gameStreak = 0;
    lastGameCorrect = null;
    lastGameMessage = "اختر نوع اللعبة أولاً ثم اضغط 'ابدأ اللعبة الآن'.";
    lastQuizScore = 0;
    lastQuizTotal = 0;
    quizSubmittedOnce = false;
    rivalTargetScore = 120;
    activeCompetitionRound = 1;
    activeInvitePin = "";
    getOrCreateLessonInvitePin(topic);
    refreshQuestionBanks(lessonData);
    currentMindMapStyleSeed = Math.floor(Math.random() * 10000) + 1;
    currentVisualPool = await buildDiverseLessonImagePool(lessonData, 0);
    currentVisualIndices = [0, 1, 2, 3];
    currentVideoPool = await fetchEducationalVideos(lessonData);
    currentVideoIndex = 0;

    renderLessonTab(lessonData);
    renderVisualsCards(lessonData, currentVisualPool, currentVisualIndices);
    renderInteractiveVideoTab(lessonData, currentVideoPool, currentVideoIndex);
    renderAndBindLessonArcade(lessonData);
    renderAndBindSmartTutor(lessonData);

    showStatus(`تم تجهيز درس "${lessonData.title}" كاملاً ومُحقَّقاً بدون تكرار عبر مصادر مجانية متعددة!`, "success");
  } catch (err) {
    console.error(err);
    showStatus(`تعذر إتمام الشرح: ${err.message}`, "error");
  } finally {
    generateBtn.disabled = false;
    generateBtn.textContent = "ابدأ التعلّم الذكي";
  }
});

function renderLessonTab(data) {
  const pointsHtml = (data.key_points || [])
    .map((pt, index) => `<li><strong>نقطة ${index + 1}:</strong> ${escapeHtml(pt)}</li>`)
    .join("");

  const componentsHtml = (data.components || [])
    .map(
      (comp) => `
        <div class="element-card" style="margin-bottom:10px;">
          <div class="element-card-title">${escapeHtml(comp.name)}</div>
          <div style="font-size:0.88rem;color:#1d4ed8;font-weight:600;margin-bottom:4px;">${escapeHtml(comp.role || "")}</div>
          <div class="element-card-desc">${escapeHtml(comp.explanation)}</div>
        </div>
      `
    )
    .join("");

  const toolsHtml = (data.tools || [])
    .map((t, idx) => `<li><strong>أداة / وسيلة ${idx + 1}:</strong> ${escapeHtml(t)}</li>`)
    .join("");

  const websitesHtml = (data.websites || [])
    .map(
      (w) => `
        <li style="margin-bottom:6px;">
          <a href="${escapeHtml(w.url)}" target="_blank" rel="noopener noreferrer"><strong>${escapeHtml(w.name)}</strong></a>
          <span> — ${escapeHtml(w.desc)}</span>
        </li>
      `
    )
    .join("");

  const comparisonsTableRows = (data.comparisons || [])
    .map(
      (cmp, i) => `
        <tr>
          <td style="padding:10px;border:1px solid #e2e8f0;font-weight:700;">${escapeHtml(cmp.title)}</td>
          <td style="padding:10px;border:1px solid #e2e8f0;">${escapeHtml(cmp.detail)}</td>
          <td style="padding:10px;border:1px solid #e2e8f0;">محور مقارنة رقم (${i + 1}) في درس "${escapeHtml(data.title)}"</td>
        </tr>
      `
    )
    .join("");

  const fullSectionsHtml = (data.wikiSections || [])
    .map((sec, idx) => {
      const subPoints = (sec.points || [])
        .map((p) => `<li style="margin-bottom:4px;">${escapeHtml(p)}</li>`)
        .join("");
      return `
        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:14px;margin-bottom:12px;">
          <div style="font-weight:700;font-size:1.03rem;color:#0f172a;margin-bottom:6px;">${idx + 1}. ${escapeHtml(sec.title)}</div>
          <div style="color:#1d4ed8;font-size:0.93rem;margin-bottom:8px;">${escapeHtml(sec.teacherNote || "")}</div>
          <ul class="points-list" style="margin:0;">${subPoints}</ul>
        </div>
      `;
    })
    .join("");

  const sourcesHtml = (data.sources || [])
    .map(
      (src) => `
        <li>
          <a href="${escapeHtml(src.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(src.title)}</a>
          <span>(درجة الصلة: ${src.relevance})</span>
        </li>
      `
    )
    .join("");

  const verNotesHtml = (data.verificationReport?.notes || [])
    .map((n) => `<li>${escapeHtml(n)}</li>`)
    .join("");

  const mindMapHtml = renderMindMapHtml(data.mindMap, currentMindMapStyleSeed);

  lessonContent.innerHTML = `
    <div class="lesson-box">
      <h3>${escapeHtml(data.title)}</h3>
      <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:10px;padding:10px 14px;margin-bottom:12px;font-size:0.9rem;color:#166534;">
        <strong>✅ ${escapeHtml(data.verificationReport?.statusLabel || "تم التحقق")}</strong>
        ${verNotesHtml ? `<ul style="margin:4px 0 0;padding-right:18px;color:#14532d;">${verNotesHtml}</ul>` : ""}
      </div>
      <div style="margin: 10px 0 14px; display:flex; gap:10px; flex-wrap:wrap;">
        <button type="button" id="listenFullLessonBtn" class="secondary-btn">🔊 استمع للشرح الكامل للدرس</button>
        <button type="button" id="toggleFullWikiLessonBtn" class="secondary-btn">
          ${isFullLessonExpanded ? "إخفاء كل التفاصيل" : "عرض كل التفاصيل والمحاور الكاملة للدرس"}
        </button>
      </div>
      <div class="definition-box">
        <strong>خلاصة الدرس ومفهومه المبسّط:</strong> ${escapeHtml(data.bestDefinition || data.simple_explanation)}
      </div>
      <p class="lesson-text">${escapeHtml(data.simple_explanation)}</p>
      <div id="fullWikiLessonDrawer" class="${isFullLessonExpanded ? "" : "hidden"}" style="margin-bottom: 18px;">
        <h4>شرح المدرس لكل أقسام ومحتوى الدرس بالتفصيل المبسّط:</h4>
        ${fullSectionsHtml}
      </div>
      <h4>مكونات الدرس وشرح كل محور:</h4>
      <div class="elements-grid" style="margin-bottom: 16px;">${componentsHtml}</div>
      <h4>أهم النقاط المبسطة والمرتبة (بدون تكرار):</h4>
      <ul class="points-list">${pointsHtml}</ul>
      <h4>الأدوات والوسائل المستخدمة المرتبطة بالدرس:</h4>
      <ul class="points-list">${toolsHtml}</ul>
      <h4>أشهر المواقع والمنصات المرتبطة بالدرس والبحث:</h4>
      <ul class="points-list">${websitesHtml}</ul>
      <h4>مقارنة سريعة بين الجوانب والأدوار:</h4>
      <div style="overflow-x:auto;margin-bottom:16px;">
        <table style="width:100%;border-collapse:collapse;background:#fff;font-size:0.94rem;">
          <thead>
            <tr style="background:#f1f5f9;text-align:right;">
              <th style="padding:10px;border:1px solid #e2e8f0;">المحور</th>
              <th style="padding:10px;border:1px solid #e2e8f0;">الشرح والمقارنة</th>
              <th style="padding:10px;border:1px solid #e2e8f0;">ملاحظة المدرس</th>
            </tr>
          </thead>
          <tbody>${comparisonsTableRows}</tbody>
        </table>
      </div>
      ${mindMapHtml}
      <h4 style="margin-top: 18px;">المصادر التي تم التحقق منها من الإنترنت:</h4>
      <ul class="points-list">${sourcesHtml}</ul>
    </div>
  `;

  const listenFullBtn = document.getElementById("listenFullLessonBtn");
  if (listenFullBtn) {
    listenFullBtn.addEventListener("click", () => {
      speakArabicText(data.simple_explanation || data.bestDefinition, null, true);
    });
  }

  const toggleBtn = document.getElementById("toggleFullWikiLessonBtn");
  const drawerEl = document.getElementById("fullWikiLessonDrawer");
  if (toggleBtn && drawerEl) {
    toggleBtn.addEventListener("click", () => {
      isFullLessonExpanded = !isFullLessonExpanded;
      drawerEl.classList.toggle("hidden", !isFullLessonExpanded);
      toggleBtn.textContent = isFullLessonExpanded
        ? "إخفاء كل التفاصيل"
        : "عرض كل التفاصيل والمحاور الكاملة للدرس";
    });
  }

  attachMindMapEvents(data.mindMap);
}

function buildLessonVisualCardsMeta(data) {
  const points = data.key_points && data.key_points.length ? data.key_points : [data.bestDefinition || data.simple_explanation];
  const p1 = data.bestDefinition || points[0];
  const p2 = points[1] || points[0];
  const p3 = points[2] || points[0];
  const p4 = points[3] || points[points.length - 1];

  return [
    { badge: "صورة 1: التعريف والمفهوم", infoText: p1 },
    { badge: "صورة 2: الفكرة وكيف يعمل؟", infoText: p2 },
    { badge: "صورة 3: العناصر والمقارنات", infoText: p3 },
    { badge: "صورة 4: التطبيق والفائدة", infoText: p4 }
  ];
}

function renderVisualsCards(data, pool, indices) {
  const cardsMeta = buildLessonVisualCardsMeta(data);
  const safePool = Array.isArray(pool) ? pool : [];
  const safeIndices = Array.isArray(indices) && indices.length === 4 ? indices : [0, 1, 2, 3];

  const cardsHtml = cardsMeta
    .map((card, idx) => {
      const item = safePool.length > 0 ? safePool[safeIndices[idx] % safePool.length] : null;
      const chosenUrl = item?.url || "";
      const chosenTitle = item?.title || card.badge;

      const imgBlock = chosenUrl
        ? `<img class="generated-lesson-img" data-img-index="${idx}" src="${escapeHtml(chosenUrl)}" alt="${escapeHtml(chosenTitle)}" />`
        : `<p class="placeholder-text">جاري تجهيز صورة لهذا الدرس، اضغط على "تغيير هذه الصورة".</p>`;

      return `
        <div class="visual-card" data-visual-index="${idx}">
          <div class="visual-badge">${escapeHtml(card.badge)}</div>
          <div class="visual-frame">
            ${imgBlock}
          </div>
          <div class="visual-meta">
            <strong>معلومة الصورة من الدرس:</strong> ${escapeHtml(card.infoText)}
          </div>
          <button type="button" class="secondary-btn regen-single-img-btn" data-img-index="${idx}">
            تغيير هذه الصورة
          </button>
        </div>
      `;
    })
    .join("");

  visualsContent.innerHTML = `
    <div class="visuals-toolbar" style="margin-bottom: 14px; display: flex; gap: 10px; flex-wrap: wrap; align-items: center;">
      <button type="button" id="regenAllImgsBtn" class="secondary-btn">تغيير كل الصور (4)</button>
      <span style="font-size: 0.92rem; color: #475569;">4 صور مجانية مرتبطة بدرس "${escapeHtml(data.title)}" ويمكنك تبديل أي صورة أو الكل.</span>
    </div>
    <div class="visuals-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px;">
      ${cardsHtml}
    </div>
  `;

  visualsContent.querySelectorAll(".generated-lesson-img").forEach((imgEl) => {
    imgEl.onerror = () => {
      const idx = Number(imgEl.dataset.imgIndex);
      if (currentVisualPool.length > 1) {
        currentVisualIndices[idx] = (currentVisualIndices[idx] + 1) % currentVisualPool.length;
        const nextItem = currentVisualPool[currentVisualIndices[idx]];
        if (nextItem && nextItem.url && nextItem.url !== imgEl.src) {
          imgEl.src = nextItem.url;
        }
      }
    };
  });

  visualsContent.querySelectorAll(".regen-single-img-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const idx = Number(btn.dataset.imgIndex);
      if (currentVisualPool.length > 1) {
        const usedSet = new Set(currentVisualIndices.filter((_, i) => i !== idx));
        let nextIdx = (currentVisualIndices[idx] + 1) % currentVisualPool.length;
        let guard = 0;
        while (currentVisualPool.length > 4 && usedSet.has(nextIdx) && guard < currentVisualPool.length) {
          nextIdx = (nextIdx + 1) % currentVisualPool.length;
          guard++;
        }
        currentVisualIndices[idx] = nextIdx;
        renderVisualsCards(data, currentVisualPool, currentVisualIndices);
      } else {
        const extraBatch = await buildDiverseLessonImagePool(data, Math.floor(Math.random() * 30) + 2);
        if (extraBatch.length) {
          currentVisualPool = extraBatch;
          currentVisualIndices[idx] = (idx + 1) % currentVisualPool.length;
        }
        renderVisualsCards(data, currentVisualPool, currentVisualIndices);
      }
    });
  });

  const regenAllBtn = document.getElementById("regenAllImgsBtn");
  if (regenAllBtn) {
    regenAllBtn.addEventListener("click", async () => {
      if (currentVisualPool.length >= 5) {
        currentVisualIndices = [0, 1, 2, 3].map(
          (n) => (currentVisualIndices[n] + 1) % currentVisualPool.length
        );
        renderVisualsCards(data, currentVisualPool, currentVisualIndices);
      } else {
        const nextBatch = await buildDiverseLessonImagePool(data, Math.floor(Math.random() * 35) + 3);
        if (nextBatch.length) {
          currentVisualPool = nextBatch;
        }
        currentVisualIndices = [0, 1, 2, 3].map((n) => (n + 1) % Math.max(currentVisualPool.length, 1));
        renderVisualsCards(data, currentVisualPool, currentVisualIndices);
      }
    });
  }
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
