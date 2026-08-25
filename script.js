/**
 * ==========================================================================
 * MAGICAL GATEWAY - CINEMATIC FANTASY ORCHESTRAL SHOW ENGINE
 * - Zero-spoiler mystery reveal
 * - Pure Orchestral Soundscape (No electric zaps, sparks, or glitch noise)
 * - Dynamic Voice Ducking (background music ducks when AI speaks)
 * - Orchestral Timpani Countdown (3..2..1)
 * - Pitch Blackout Silence (1.0s) & Epic Orchestra Reveal Impact
 * ==========================================================================
 */

document.addEventListener('DOMContentLoaded', () => {

    // ==========================================================================
    // 1. EXTENSIBLE CONFIGURATION
    // ==========================================================================
    /**
     * ==========================================================================
     * 1.1. CENTRAL SUMMON MAPPING (ระบบแมปสัตว์กลาง)
     * --------------------------------------------------------------------------
     * ระบบแมปทั้งหมดรวมไว้ที่นี่จุดเดียว เพื่อให้เพิ่มสัตว์ใหม่ในอนาคตได้ง่าย
     * โดยไม่ต้องไปแก้โค้ดส่วนอื่น เช่น:
     *
     *     { id: "IceDragon", name: "IceDragon", video: "IceDragon.mp4", aliases: [...] }
     *
     * - id       : ตัวระบุภายในของสัตว์
     * - name     : ชื่อ (ใช้แสดงกับ Mapping เท่านั้น ไม่มีการแสดงใบ D ด)
     * - command  : คำสั่งเสียงดั้งเดิม (เพื่อรักษาความเข้ากันได้กับระบบเดิม)
     * - video    : ไฟล์วิดีโอของสัตว์ตัวนั้น (ตรวจสอบจริงก่อนเสมอ)
     * - aliases  : ชื่อเรียกอื่นที่ AI อาจส่งมา (รวมทั้งภาษาไทย/อังกฤษ)
     *              ความสำคัญ: ชื่อที่เจาะจง/ยาวกว่าจะถูกเลือกมาก่อน เช่น
     *              มังกรเกราะ = ArmoredDr.mp4 (ไม่ไปเป็น dragon.mp4)
     * ==========================================================================
     */
    const summons = [
        {
            id: "dragon",
            name: "มังกร",                       // สำหรับใช้จัดการภายในเท่านั้น (ห้ามแสดงใน UI หรือพูดก่อนเปิดวิดีโอ)
            command: "มังกรจงออกมา",             // คำสั่งเสียงเดิม
            video: "mp4/dragon.mp4",
            aliases: ["มังกร", "dragon", "DRAGON"]
        },
        {
            id: "armored-dragon",
            name: "มังกรเกราะ",
            command: "เกราะมังกรจงออกมา",
            video: "mp4/ArmoredDr.mp4",
            aliases: ["มังกรเกราะ", "armored dragon", "armoreddragon", "armoreddr", "ArmoredDr", "มังกรหุ้มเกราะ"]
        },
        {
            id: "yeti",
            name: "เยติ",
            command: "เยติจงออกมา",
            video: "mp4/Yeti.mp4",
            aliases: ["เยติ", "yeti", "YETI", "เยตี้"]
        },
        {
            id: "phoenix",
            name: "ฟีนิกซ์",
            command: "ฟีนิกซ์จงออกมา",
            video: "mp4/phoenix.mp4",
            aliases: ["ฟีนิกซ์", "ฟีนิก", "phoenix", "Phoenix", "นกฟีนิกซ์", "ฟินิกซ์"]
        },
        {
            id: "lion",
            name: "สิงโต",
            command: "สิงโตจงออกมา",
            video: "mp4/lion.mp4",
            aliases: ["สิงโต", "lion", "LION"]
        }
    ];

    const suspenseDialogue = [
        "มีบางอย่าง...กำลังเกิดขึ้น",           // index 0 — ช้า ลึกลับ (rate 0.75)
        "พลังงานบางอย่าง...กำลังเข้ามาใกล้",   // index 1 — ช้า ลึกลับ (rate 0.75)
        "เดี๋ยวก่อน...",                       // index 2 — หยุดสั้นๆ 0.5s หลังจบ
        "มันกำลังจะปรากฏตัว",                  // index 3 — ก่อน Energy Meter
        "เตรียมตัวให้พร้อม...มันกำลังมา!"      // index 4 — เร็วขึ้น (rate 0.9)
    ];

    // --- State Variables ---
    let isSummoning = false;        // ป้องกันการอัญเชิญซ้ำขณะกำลังทำงาน
    let isSystemActive = false;     // สถานะระบบฟังเสียงเปิดอยู่หรือไม่
    let recognition = null;         // ตัวแปร SpeechRecognition
    let ttsVoice = null;            // เสียงพากย์ภาษาไทย
    let currentTargetVideo = "mp4/dragon.mp4"; // ไฟล์วิดีโอเป้าหมาย (ค่าเริ่มต้น)

    // --- DOM Elements ---
    const mainContainer = document.getElementById('mainContainer');
    const magicCircleWrapper = document.getElementById('magicCircleWrapper');
    const statusDot = document.getElementById('statusDot');
    const statusBadgeText = document.getElementById('statusBadgeText');
    const statusTitle = document.getElementById('statusTitle');
    const statusEnglish = document.getElementById('statusEnglish');
    const transcriptText = document.getElementById('transcriptText');
    const startBtn = document.getElementById('startBtn');
    const fullscreenBtn = document.getElementById('fullscreenBtn');
    
    // HUD & Overlay Elements
    const energyMeterContainer = document.getElementById('energyMeterContainer');
    const energyValue = document.getElementById('energyValue');
    const energyFill = document.getElementById('energyFill');
    const warningHud = document.getElementById('warningHud');
    const countdownHud = document.getElementById('countdownHud');
    const countdownDigit = document.getElementById('countdownDigit');
    const magicalEnergyAura = document.getElementById('magicalEnergyAura');
    const blackoutOverlay = document.getElementById('blackoutOverlay');
    const flashOverlay = document.getElementById('flashOverlay');
    const dragonVideo = document.getElementById('dragonVideo');
    const particleCanvas = document.getElementById('particleCanvas');

    // ==========================================================================
    // 2. HELPER & NORMALIZATION
    // ==========================================================================

    function normalizeSpeech(text) {
        if (!text) return "";
        return text
            .toLowerCase()
            .replace(/\s+/g, "")
            .trim();
    }

    // ==========================================================================
    // 2.1. CENTRAL MAPPING RESOLUTION (จับคู่คำสั่ง → สัตว์ → วิดีโอ)
    // --------------------------------------------------------------------------
    // normalizeSpeech จะตัดช่องว่าง/ตัวพิมพ์ใหญ่เล็กหมดแล้ว จึงรองรับทั้ง
    // "มังกร" , "dragon", "DRAGON", "Armored Dragon" เป็นต้น
    // ตัดสินโดยเลือก alias ที่ "ยาวที่สุดที่ตรง" เพื่อแยก มังกรเกราะ ออกจาก มังกร
    // ==========================================================================

    const summonAliasCache = new Map();

    /**
     * รวบรวม alias ที่ normalize แล้วของสัตว์ตัวหนึ่ง (รวม name/command/ชื่อไฟล์)
     * @returns {Set<string>}
     */
    function getNormalizedAliases(item) {
        if (!item || !item.id) return new Set();
        if (summonAliasCache.has(item.id)) return summonAliasCache.get(item.id);

        const set = new Set();
        if (item.name) set.add(normalizeSpeech(item.name));
        if (item.command) set.add(normalizeSpeech(item.command));
        // ชื่อไฟล์วิดีโอ (ตัดเส้นทางและ .mp4 ออก) เช่น "dragon" ใช้เป็น alias ได้ด้วย
        if (item.video) {
            const base = String(item.video).split('/').pop().replace(/\.mp4$/i, "");
            set.add(normalizeSpeech(base));
        }
        (Array.isArray(item.aliases) ? item.aliases : []).forEach(a => set.add(normalizeSpeech(a)));

        summonAliasCache.set(item.id, set);
        return set;
    }

    /**
     * ค้นหาสัตว์ที่ตรงกับข้อความที่ AI รับมา โดยเลือก alias ที่ยาวที่สุด
     * ช่วยให้แยก "มังกรเกราะ" ออกจาก "มังกร" ได้ถูกต้อง
     * @param {string} rawText ข้อความดิบจากเสียง/คำสั่ง
     * @returns {object|null} สัตว์ที่ตรง หรือ null หากไม่พบ (ไม่ crash)
     */
    function resolveSummons(rawText) {
        const normalized = normalizeSpeech(rawText);
        if (!normalized) return null;

        let best = null;
        let bestLength = -1;
        for (const s of summons) {
            for (const alias of getNormalizedAliases(s)) {
                if (alias && alias.length > bestLength && normalized.includes(alias)) {
                    best = s;
                    bestLength = alias.length;
                }
            }
        }
        return best;
    }

    /**
     * ตรวจสอบอย่างปลอดภัยว่าไฟล์วิดีโอ .mp4 มีอยู่จริงหรือไม่
     * - เมื่อเปิดผ่าน protocol file:// (ดับเบิลคลิก index.html) fetch จะถูก CORS
     *   บล็อกเสมอ เราจึงไม่บล็อกเส้นทางนี้ (ให้ video element ตรวจสอบเองผ่านบน error)
     * @param {string} path
     * @returns {Promise<boolean>}
     */
    function videoFileExists(path) {
        return new Promise((resolve) => {
            if (!path) { resolve(false); return; }
            // HEAD บน http/https: ตรวจว่ามีจริง (case-sensitive)
            fetch(path, { method: 'HEAD' })
                .then(res => resolve(res.ok))
                .catch(() => resolve(true)); // file:// หรือ CORS: ยืนยันไม่ได้ → ให้ video element ตรวจสอบเอง
        });
    }

    // ==========================================================================
    // 2.2. VOICE AI — UNDERSTANDING LAYER (ความเข้าใจเจตนา + คำเพี้ยน)
    // --------------------------------------------------------------------------
    // เพิ่มเป็น "Input Layer" เท่านั้น ไม่แตะระบบ Effect/Sound/Animation/Timing
    // เดิม ช่วยให้ AI เข้าใจเจตนาของเด็กๆ แม้พูดไม่ชัด ออกเสียงเพี้ยน หรือ
    // พิมพ์เผลอเล็กน้อย แล้วส่งผลเป็น "ชนิดสัตว์" เข้าสู่ระบบ Mapping เดิม
    // เพื่อเรียกโชว์เดิมตามปกติ
    // ==========================================================================

    // ค่าความมั่นใจขั้นต่ำ จะยอมรับว่าช่วงคำมีเจตนเรียกสัตว์ (0..1)
    const FUZZY_MIN_SIMILARITY = 0.46;

    // ค่าปรับเมื่อ alias ยาว/สั้นกว่าเจตนาที่พูดมากเกินไป (ให้เลือกชนิดที่มีความยาว
    // ใกล้เคียงกัน เช่น พูด "มังกร" สั้น → ไม่เผลอไป "มังกรเกราะ" ที่ยาวกว่า)
    const FUZZY_LENGTH_PENALTY = 0.12;

    // คำสั่ง/คำประกอบการเรียกที่ถอดออกก่อนวิเคราะห์ "ชื่อสัตว์ที่ตั้งใจ"
    const COMMAND_NOISE = [
        "จงออกมา", "ออกมา", "เรียก", "ออก", "ขึ้นมา", "ตามมา", "จง", "มา",
        "จงเรียก", "เอามา", "เอาออก", "ขอดู", "โชว์", "ตัว", "เลย",
        "หน่อย", "จ้ะ", "ซิ", "ฮ่ะ", "ให้", "ด้วย", "นึง", "กับ", "ของ"
    ];

    /**
     * ระยะห่างการแก้ไขระหว่างสองสตริง (Levenshtein) — ใช้กับไทยและอังกฤษได้
     */
    function levenshteinDistance(a, b) {
        a = String(a); b = String(b);
        const al = a.length, bl = b.length;
        if (al === 0) return bl;
        if (bl === 0) return al;
        const prev = new Array(bl + 1);
        const curr = new Array(bl + 1);
        for (let j = 0; j <= bl; j++) prev[j] = j;
        for (let i = 1; i <= al; i++) {
            curr[0] = i;
            for (let j = 1; j <= bl; j++) {
                const cost = a[i - 1] === b[j - 1] ? 0 : 1;
                curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
            }
            for (let j = 0; j <= bl; j++) prev[j] = curr[j];
        }
        return prev[bl];
    }

    /**
     * ค่าความคล้าย 0..1 (1 = เหมือนมากที่สุด)
     */
    function stringSimilarity(a, b) {
        const maxLen = Math.max(String(a).length, String(b).length);
        if (maxLen === 0) return 1;
        return 1 - levenshteinDistance(a, b) / maxLen;
    }

    /**
     * ถอดเฉพาะ "ชื่อสัตว์ที่ตั้งใจจะเรียก" ออกจากประโยคคำสั่ง
     */
    function extractTargetName(text) {
        if (!text) return "";
        let t = normalizeSpeech(text);
        const noises = COMMAND_NOISE.slice().sort((x, y) => y.length - x.length);
        for (const n of noises) t = t.split(n).join("");
        t = t.replace(/[่้๊๋์ๆเแไโ]/g, "").trim();
        return t;
    }

    /**
     * ทอนเป็น "โครงสร้างพยัญชนะ" (ทิ้งสระ+วรรณยุกต์) เพื่อลดผลต่างที่เกิดจาก
     * การออกเสียงเพี้ยนสระ เช่น "มะกรอก" กับ "มังกร" มีโครงพยัญชนะใกล้กัน
     */
    function thaiSkeleton(text) {
        return String(text || "")
            .replace(/[ะัิีึืุูแโไใๆำ]/g, "")
            .replace(/[่้๊๋์็]/g, "")
            .replace(/[อา]/g, "");
    }

    /**
     * ค่าความคล้ายที่ผสาน 2 มิติ: ตัวอักษรเต็ม + โครงสร้างพยัญชนะ
     * ใช้ค่าที่ดีกว่า (สูงกว่า) เพื่อจับคำเพี้ยนทั้งสองแบบ
     */
    function combinedSimilarity(target, alias) {
        const raw = stringSimilarity(target, alias);
        const sk = stringSimilarity(thaiSkeleton(target), thaiSkeleton(alias));
        return Math.max(raw, sk);
    }

    /**
     * ความยาวของ alias ที่ยาวที่สุดซึ่งเป็นส่วนย่อย (substring) ของข้อความ
     * ใช้ระบบเดิม (resolveSummons) เพื่อเปรียบเทียบความเฉพาะ
     */
    function longestSubstringAliasLength(rawText) {
        const normalized = normalizeSpeech(rawText);
        let bestLen = 0;
        for (const s of summons) {
            for (const alias of getNormalizedAliases(s)) {
                if (alias && alias.length > bestLen && normalized.includes(alias)) bestLen = alias.length;
            }
        }
        return bestLen;
    }

    /**
     * วิเคราะห์ "เจตนา/ความหมาย" ของคำพูดที่อาจเพี้ยน
     * - ตรวจตรงกับระบบเดิม (exact) ก่อน เพื่อคงพฤติกรรมเดิม
     * - แล้วประเมินคำเพี้ยนด้วย Fuzzy Matching (อักษร + โครงสร้างพยัญชนะ)
     * - ให้ความสำคัญกับ alias ที่ "ยาว/เจาะจงกว่า" เมื่อเป็นชื่อหลาย-คำ เช่น
     *   "มังกรเกราะ" (ยาวกว่า) ชนะ "มังกร" → จึงเลือก ArmoredDr แทน dragon
     */
    function analyzeSummonIntent(raw) {
        if (!raw) return null;

        // 1) ตรงกับระบบเดิมก่อน (เร็วสุด + คงพฤติกรรมเดิม)
        const direct = resolveSummons(raw);
        const directLen = longestSubstringAliasLength(raw);

        // 2) ถอดชื่อ แล้วทำ Fuzzy Matching กับ alias ทั้งหมด
        const target = extractTargetName(raw);
        let fuzzyBest = null;
        if (target && target.length >= 2) {
            let bestScored = -1, bestRaw = -1, bestLenFound = -1, bestSummon = null;
            for (const s of summons) {
                for (const alias of getNormalizedAliases(s)) {
                    const sim = combinedSimilarity(target, alias);
                    if (sim < FUZZY_MIN_SIMILARITY) continue;
                    // หักคะแนนเมื่อ alias ยาว/สั้นเกินไป เทียบกับคำพูดที่ตั้งใจ
                    const scored = sim - FUZZY_LENGTH_PENALTY * Math.abs(alias.length - target.length);
                    if (scored > bestScored || (Math.abs(scored - bestScored) < 1e-9 && alias.length > bestLenFound)) {
                        bestScored = scored;
                        bestRaw = sim;
                        bestSummon = s;
                        bestLenFound = alias.length;
                    }
                }
            }
            if (bestSummon) fuzzyBest = { summon: bestSummon, score: bestRaw, aliasLen: bestLenFound };
        }

        // 3) เลือกผลที่ดีที่สุด: ชอบคำเพี้ยนที่เจาะไป alias ยาวกว่า (compound)
        if (direct && !fuzzyBest) return { summon: direct, score: 1, method: "direct", fromTranscript: raw };
        if (!direct && fuzzyBest) return { summon: fuzzyBest.summon, score: fuzzyBest.score, method: "fuzzy", fromTranscript: raw };
        if (direct && fuzzyBest) {
            // ชอบ fuzzy เมื่อเจาะได้ alias ที่ยาว/เฉพาะกว่า เช่น มังกรเกาะ ＞ มังกร
            if (fuzzyBest.aliasLen > directLen) {
                return { summon: fuzzyBest.summon, score: fuzzyBest.score, method: "fuzzy", fromTranscript: raw };
            }
            // หายาก: เจาะชนิดอื่นด้วยความมั่นใจสูงกว่ามาก
            if (fuzzyBest.summon.id !== direct.id && fuzzyBest.score >= 0.6) {
                return { summon: fuzzyBest.summon, score: fuzzyBest.score, method: "fuzzy", fromTranscript: raw };
            }
            return { summon: direct, score: 1, method: "direct", fromTranscript: raw };
        }
        return null;
    }

    /**
     * เลือกผลดีที่สุดจากทางเลือก (alternatives) ของคำพูดทั้งหมด
     */
    function findBestSummonIntent(transcripts) {
        if (!Array.isArray(transcripts)) transcripts = [transcripts];
        let bestResult = null;
        for (const t of transcripts) {
            if (!t) continue;
            const res = analyzeSummonIntent(t);
            if (res && (!bestResult || res.score > bestResult.score)) bestResult = res;
        }
        return bestResult;
    }

    // ==========================================================================
    // 2.3. VOICE AI — MICROPHONE DEVICE SUPPORT (เลือกไมโครโฟนอัตโนมัติ)
    // --------------------------------------------------------------------------
    // ค้นหาไมโครโฟนที่ใช้งานได้ ให้ความสำคัญกับ USB/Bluetooth/Headset/Mic ภายนอก
    // ถ้าไม่มีค่อย fallback ไป Built-in Microphone (โน้ตบุ๊ค) ไม่ crash หากยังไม่
    // อนุญาตสิทธิ์
    // ==========================================================================
    let micProbeStream = null;

    /**
     * เลือกไมโครโฟนที่ต้องการจากรายการอุปกรณ์
     * ชอบอุปกรณ์ภายนอกที่อ่าน label ได้ > default (built-in)
     */
    function pickMicrophone(devices) {
        const mics = (devices || []).filter(d => d.kind === "audioinput");
        if (mics.length === 0) return null;
        const labeled = mics.filter(m => m.label && m.label.length > 1);
        const external = labeled.filter(m =>
            /(usb|bluetooth|headset|ear|mic|microphone|wireless)/i.test(m.label) &&
            !/(built.?in|internal|module|integrated|default)/i.test(m.label)
        );
        if (external.length > 0) return external[0];
        if (labeled.length > 0) return labeled[0];
        return mics.find(m => m.deviceId === "default") || mics[0];
    }

    /**
     * ขอสิทธิ์ใช้ไมโครโฟน + เปิดใช้งานอุปกรณ์เสียงที่ดีที่สุดโดยไม่ crash
     * - ถ้าไม่มี getUserMedia (เบราว์เซอร์เก่า) จะปล่อยให้ SpeechRecognition จัดการเอง
     * - ถ้าผู้ใช้ยังไม่อนุญาต จะไม่ crash และไม่บล็อกระบบเดิม
     * @returns {Promise<boolean>} เท่ากับว่าเตรียมไมค์เรียบร้อยหรือไม่
     */
    function ensureMicrophoneReady() {
        return new Promise((resolve) => {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                resolve(true);
                return;
            }
            // ปล่อย stream เก่า (ถ้ามี) เพื่อไม่ผูกไมค์ค้าง
            if (micProbeStream && micProbeStream.getTracks) {
                try { micProbeStream.getTracks().forEach(t => t.stop()); } catch (e) {}
                micProbeStream = null;
            }

            Promise.resolve()
                .then(() => navigator.mediaDevices.enumerateDevices())
                .then((devices) => {
                    const preferred = pickMicrophone(devices);
                    const base = {
                        echoCancellation: true,
                        noiseSuppression: true,
                        autoGainControl: true
                    };
                    const audioConstraints = preferred && preferred.deviceId && preferred.deviceId !== "default"
                        ? Object.assign({}, base, { deviceId: { exact: preferred.deviceId } })
                        : base;
                    return navigator.mediaDevices.getUserMedia({ audio: audioConstraints })
                        .then((stream) => {
                            micProbeStream = stream;
                            // ปล่อย probe สั้นๆ แล้วคืนไมค์ให้ SpeechRecognition ใช้ต่อเอง
                            const tracks = stream.getTracks();
                            setTimeout(() => {
                                try { tracks.forEach(t => t.stop()); } catch (e) {}
                                if (micProbeStream === stream) micProbeStream = null;
                            }, 400);
                            resolve(true);
                        })
                        .catch((err) => {
                            // ไม่อนุญาต/ไม่มีอุปกรณ์ → ไม่ crash ไม่บล็อก
                            console.warn("ไมโครโฟนไม่พร้อมหรือไม่อนุญาต:", (err && (err.name || err.message)) || err);
                            resolve(false);
                        });
                })
                .catch(() => resolve(false));
        });
    }

    function delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // ==========================================================================
    // 3. CINEMATIC FANTASY ORCHESTRAL AUDIO ENGINE
    // ==========================================================================
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    let audioCtx = null;
    let masterGainNode = null;
    let activeOrchestralNodes = [];

    function initAudioContext() {
        if (!audioCtx && AudioCtx) {
            audioCtx = new AudioCtx();
            masterGainNode = audioCtx.createGain();
            masterGainNode.gain.setValueAtTime(1.0, audioCtx.currentTime);
            masterGainNode.connect(audioCtx.destination);
        }
        if (audioCtx && audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
    }

    /**
     * ดึงหรือลดเสียงเพลงพื้นหลังชั่วคราวขณะ AI กำลังพูด (Voice Ducking)
     */
    function setOrchestraDucking(isDucked) {
        if (!masterGainNode || !audioCtx) return;
        const now = audioCtx.currentTime;
        // ลดเสียงดนตรีลง 0.2 ขณะ AI พูด แล้วเพิ่มกลับเป็น 0.5 หลังพูดจบ
        const targetGain = isDucked ? 0.2 : 0.5;
        masterGainNode.gain.cancelScheduledValues(now);
        masterGainNode.gain.linearRampToValueAtTime(targetGain, now + 0.3);
    }

    /**
     * หยุดและเคลียร์เสียงดนตรีทั้งหมดทันที (ใช้ตอน Blackout)
     */
    function stopAllOrchestralMusic(fadeDurationMs = 200) {
        if (!audioCtx || !masterGainNode) return;
        const now = audioCtx.currentTime;
        masterGainNode.gain.cancelScheduledValues(now);
        masterGainNode.gain.linearRampToValueAtTime(0.001, now + fadeDurationMs / 1000);
        
        setTimeout(() => {
            activeOrchestralNodes.forEach(node => {
                try { node.stop(); } catch(e){}
            });
            activeOrchestralNodes = [];
            if (masterGainNode) {
                masterGainNode.gain.setValueAtTime(1.0, audioCtx.currentTime);
            }
        }, fadeDurationMs + 50);
    }

    /**
     * เล่นเสียงเอฟเฟกต์ หรือสังเคราะห์ด้วย Web Audio API (เฉพาะเสียงซิมโฟนีซาวด์สเคป)
     * @param {string} soundName (mystery-intro, tension-build, orchestral-rise, cinematic-boom, timpani-hit, final-build, reveal-impact)
     * @param {number} volume 
     */
    function playOrchestralSound(soundName, volume = 0.35) {
        initAudioContext();
        if (!audioCtx) return;

        // ลองพยายามเล่นไฟล์ MP3 ก่อน
        const audio = new Audio(`sounds/${soundName}.mp3`);
        audio.volume = volume;
        const playPromise = audio.play();

        if (playPromise !== undefined) {
            playPromise.catch(() => {
                // หากไม่มีไฟล์ MP3 ให้สังเคราะห์ผ่าน Web Audio API Pure Orchestral Synthesizer
                synthesizeOrchestralSound(soundName, volume);
            });
        }
    }

    /**
     * สังเคราะห์เสียงซิมโฟนีซาวด์สเคป (Web Audio API Pure Orchestral Synthesizer)
     * ห้ามมีเสียงไฟช็อต สายฟ้า เสียงซ่า หรือเสียงไมค์แตกเด็ดขาด!
     */
    function synthesizeOrchestralSound(type, volume = 0.35) {
        if (!audioCtx || !masterGainNode) return;
        const now = audioCtx.currentTime;

        try {
            if (type === 'mystery-intro') {
                // Cello & Contrabass warm low pad (C2 65.41Hz, G2 98.00Hz, C3 130.81Hz)
                const freqs = [65.41, 98.00, 130.81];
                freqs.forEach(freq => {
                    const osc = audioCtx.createOscillator();
                    const filter = audioCtx.createBiquadFilter();
                    const gain = audioCtx.createGain();

                    osc.type = 'triangle'; // เสียงอุ่นคล้ายเครื่องสาย Cello
                    osc.frequency.setValueAtTime(freq, now);

                    filter.type = 'lowpass';
                    filter.frequency.setValueAtTime(320, now);

                    gain.gain.setValueAtTime(0.01, now);
                    gain.gain.linearRampToValueAtTime(volume * 0.3, now + 1.2);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + 4.0);

                    osc.connect(filter);
                    filter.connect(gain);
                    gain.connect(masterGainNode);

                    osc.start(now);
                    osc.stop(now + 4.0);
                    activeOrchestralNodes.push(osc);
                });
            }
            else if (type === 'tension-build') {
                // Low Brass Swell (F2 87.31Hz, C3 130.81Hz) + Orchestra Resonance
                [87.31, 130.81].forEach(freq => {
                    const osc = audioCtx.createOscillator();
                    const filter = audioCtx.createBiquadFilter();
                    const gain = audioCtx.createGain();

                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(freq, now);

                    filter.type = 'lowpass';
                    filter.frequency.setValueAtTime(450, now);

                    gain.gain.setValueAtTime(0.01, now);
                    gain.gain.linearRampToValueAtTime(volume * 0.4, now + 0.8);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + 2.5);

                    osc.connect(filter);
                    filter.connect(gain);
                    gain.connect(masterGainNode);

                    osc.start(now);
                    osc.stop(now + 2.5);
                    activeOrchestralNodes.push(osc);
                });
            }
            else if (type === 'orchestral-rise') {
                // Orchestra Rising String Swell (Lowpass Filter Sweep 200Hz -> 1000Hz)
                const osc1 = audioCtx.createOscillator();
                const osc2 = audioCtx.createOscillator();
                const filter = audioCtx.createBiquadFilter();
                const gain = audioCtx.createGain();

                osc1.type = 'triangle';
                osc2.type = 'sine';
                osc1.frequency.setValueAtTime(110, now); // A2
                osc2.frequency.setValueAtTime(220, now); // A3

                filter.type = 'lowpass';
                filter.frequency.setValueAtTime(200, now);
                filter.frequency.linearRampToValueAtTime(1200, now + 2.5);

                gain.gain.setValueAtTime(0.01, now);
                gain.gain.linearRampToValueAtTime(volume * 0.5, now + 1.8);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 2.8);

                osc1.connect(filter);
                osc2.connect(filter);
                filter.connect(gain);
                gain.connect(masterGainNode);

                osc1.start(now);
                osc2.start(now);
                osc1.stop(now + 2.8);
                osc2.stop(now + 2.8);
                activeOrchestralNodes.push(osc1, osc2);
            }
            else if (type === 'cinematic-boom') {
                // Cinematic Low Bass Hit / Orchestra Boom (Sub Thump 60Hz -> 30Hz)
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(65, now);
                osc.frequency.exponentialRampToValueAtTime(25, now + 0.5);

                gain.gain.setValueAtTime(volume * 1.1, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

                osc.connect(gain);
                gain.connect(masterGainNode);

                osc.start(now);
                osc.stop(now + 0.85);
            }
            else if (type === 'timpani-hit') {
                // Cinematic Timpani Drum Hit (110Hz -> 50Hz Timpani Decay)
                const osc = audioCtx.createOscillator();
                const filter = audioCtx.createBiquadFilter();
                const gain = audioCtx.createGain();

                osc.type = 'triangle';
                osc.frequency.setValueAtTime(110, now);
                osc.frequency.exponentialRampToValueAtTime(45, now + 0.35);

                filter.type = 'lowpass';
                filter.frequency.setValueAtTime(500, now);

                gain.gain.setValueAtTime(volume * 0.9, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

                osc.connect(filter);
                filter.connect(gain);
                gain.connect(masterGainNode);

                osc.start(now);
                osc.stop(now + 0.5);
            }
            else if (type === 'final-build') {
                // Epic Orchestra Final Crescendo (Heavy Brass + Choir Formant)
                [130.81, 164.81, 196.00, 261.63].forEach(freq => {
                    const osc = audioCtx.createOscillator();
                    const gain = audioCtx.createGain();
                    osc.type = 'triangle';
                    osc.frequency.setValueAtTime(freq, now);

                    gain.gain.setValueAtTime(0.05, now);
                    gain.gain.linearRampToValueAtTime(volume * 0.45, now + 1.2);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + 2.0);

                    osc.connect(gain);
                    gain.connect(masterGainNode);

                    osc.start(now);
                    osc.stop(now + 2.0);
                    activeOrchestralNodes.push(osc);
                });
            }
            else if (type === 'reveal-impact') {
                // Full Orchestra Climax Impact + Bass Drop
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(220, now);
                osc.frequency.exponentialRampToValueAtTime(30, now + 0.7);

                gain.gain.setValueAtTime(volume * 1.4, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 1.0);

                osc.connect(gain);
                gain.connect(masterGainNode);

                osc.start(now);
                osc.stop(now + 1.05);
            }
        } catch (e) {
            console.warn("Orchestral audio synth error:", e);
        }
    }

    // ==========================================================================
    // 4. TEXT-TO-SPEECH (Suspense Voice Tuning)
    // ==========================================================================

    function loadTTSVoices() {
        if ('speechSynthesis' in window) {
            const voices = window.speechSynthesis.getVoices();
            ttsVoice = voices.find(v => v.lang && (v.lang.includes('th') || v.lang.includes('TH'))) || 
                       voices.find(v => v.name && (v.name.includes('Thai') || v.name.includes('Kanya') || v.name.includes('Pattara'))) || 
                       null;
        }
    }

    if ('speechSynthesis' in window) {
        window.speechSynthesis.onvoiceschanged = loadTTSVoices;
        loadTTSVoices();
    }

    /**
     * ดึงเสียงพากย์ภาษาไทยจาก Online Audio API (Google TTS API)
     * รองรับเสียงภาษาไทย 100% บนทุกเบราว์เซอร์ ไม่ต้องติดตั้งภาษาเพิ่มใน Windows
     * @param {string} text 
     * @param {number} rate 
     */
    function playOnlineThaiTTS(text, rate = 1.0) {
        return new Promise((resolve, reject) => {
            // ทำความสะอาดข้อความเพื่อสร้าง URL เสียงภาษาไทย
            const cleanText = text.replace(/[\.\.\.]+/g, " ").trim();
            const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(cleanText)}&tl=th&client=tw-ob`;
            
            const audio = new Audio(url);
            // ปรับความเร็วเสียง (playbackRate) เพื่อสร้างความเร้าใจ
            audio.playbackRate = Math.min(1.35, Math.max(0.85, rate));

            let resolved = false;

            function finish(isError = false) {
                if (!resolved) {
                    resolved = true;
                    if (isError) {
                        reject(new Error("Online TTS failed"));
                    } else {
                        resolve();
                    }
                }
            }

            audio.onended = () => {
                console.log("Online Thai Audio finished playing:", text);
                finish(false);
            };

            audio.onerror = (e) => {
                console.warn("Online Thai Audio load error:", e);
                finish(true);
            };

            const playPromise = audio.play();
            if (playPromise !== undefined) {
                playPromise.then(() => {
                    console.log("Online Thai Audio playing:", text);
                }).catch(err => {
                    console.warn("Autoplay block or audio fetch fail:", err);
                    finish(true);
                });
            }

            // Safety timeout 4.5 วินาที
            setTimeout(() => {
                finish(false);
            }, 4500);
        });
    }

    /**
     * พูดประโยคเดี่ยวผ่าน Online Audio API + Fallback Web Speech API
     * ลดเสียงเพลงดนตรีลงชั่วคราวขณะ AI กำลังพูด (Ducking)
     * @param {string} text 
     * @param {number} rate 
     * @param {number} pitch 
     */
    async function speakLine(text, rate = 0.78, pitch = 0.88) {
        // แสดงข้อความบน UI ทันทีเพื่อให้คนดูอ่านตามได้
        if (statusTitle) statusTitle.textContent = text;
        if (transcriptText) transcriptText.textContent = `"${text}"`;

        // ลดเสียงดนตรีลงเพื่อเปิดทางให้เสียงพากย์ AI ชัดเจน 100%
        setOrchestraDucking(true);

        // 1. พยายามใช้ Online Thai Audio API ก่อน (เสียงภาษาไทยชัดเจน 100% ไม่พึ่ง Windows TTS)
        try {
            await playOnlineThaiTTS(text, rate);
            setOrchestraDucking(false);
            return;
        } catch (onlineErr) {
            console.warn("Online Thai Audio API error, switching to SpeechSynthesis fallback:", onlineErr);
        }

        // 2. Fallback: เบราว์เซอร์ Web Speech API
        return new Promise((resolve) => {
            if (!('speechSynthesis' in window)) {
                setOrchestraDucking(false);
                resolve();
                return;
            }

            loadTTSVoices();
            try {
                window.speechSynthesis.cancel();
                if (window.speechSynthesis.paused) window.speechSynthesis.resume();
            } catch(e) {}

            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = "th-TH";
            utterance.rate = rate;
            utterance.pitch = pitch;
            if (ttsVoice) utterance.voice = ttsVoice;

            let hasResolved = false;
            function finishLine() {
                if (!hasResolved) {
                    hasResolved = true;
                    setOrchestraDucking(false); // Restore music volume
                    resolve();
                }
            }

            utterance.onstart = () => {
                try { if (window.speechSynthesis.paused) window.speechSynthesis.resume(); } catch(e) {}
            };
            utterance.onend = finishLine;
            utterance.onerror = finishLine;

            try {
                window.speechSynthesis.speak(utterance);
                window.speechSynthesis.resume();
            } catch (e) {
                finishLine();
            }

            const approxDurationMs = Math.max(3000, (text.length * 280) / rate);
            setTimeout(finishLine, approxDurationMs);
        });
    }

    /**
     * พูด 8 ประโยคสร้างความลุ้นก่อนเปิดวิดีโอ — ห้ามพูดชื่อสัตว์ออกมา!
     * อารมณ์: ลึกลับ → สงสัย/ตื่นเต้น → เร่งเร้าเหมือนสิ่งนั้นกำลังจะปรากฏทันที
     */
    async function speakSuspenseLines() {
        const aiLines = [
            "มีบางอย่าง...กำลังเกิดขึ้น",              // 0 — ลึกลับ (rate 0.78, pitch 0.88)
            "เดี๋ยวก่อน...ฉันตรวจพบบางสิ่ง",           // 1 — ลึกลับ
            "พลังงานของมัน...กำลังเพิ่มขึ้น",         // 2 — เริ่มตื่นเต้น (rate 0.85, pitch 0.92)
            "มันกำลังเข้ามาใกล้ขึ้นเรื่อย ๆ",         // 3 — เริ่มตื่นเต้น
            "ฉันยังระบุไม่ได้...ว่ามันคืออะไร",        // 4 — เริ่มตื่นเต้น
            "เดี๋ยวนะ...มันกำลังเคลื่อนไหว",            // 5 — เร่งเร้า (rate 0.95, pitch 1.0)
            "มันกำลังจะออกมาแล้ว...",                     // 6 — เร่งเร้า
            "ทุกคน...เตรียมตัวให้พร้อม!"                // 7 — สุดตื่นเต้น
        ];

        // กำหนด rate, pitch ตามช่วงอารมณ์
        function getVoiceParams(i) {
            if (i <= 1) return { rate: 0.78, pitch: 0.88 };   // ลึกลับ
            if (i <= 5) return { rate: 0.85, pitch: 0.92 };   // สงสัย/ตื่นเต้น
            return       { rate: 0.95, pitch: 1.0  };         // เร่งเร้า
        }

        // กำหนด delay ระหว่างประโยค (ถี่ขึ้นทีละน้อยเพื่อสร้างความรู้สึกว่าเหตุการณ์เร่งขึ้น)
        function getLineDelay(i) {
            if (i < 2)  return 500;  // ช่วงแรก — ช้า ลึกลับ
            if (i < 5)  return 350;  // ช่วงกลาง — เริ่มตื่นเต้น
            return      200;         // ช่วงท้าย — พูดถี่ขึ้น
        }

        for (let i = 0; i < aiLines.length; i++) {
            if (!isSummoning) return;

            // หลังประโยคที่ 0 จบ: วงเวทปรากฏ + ดนตรีเพิ่ม
            if (i === 1) {
                playOrchestralSound('tension-build', 0.42);
                magicCircleWrapper.classList.add('summoning-active');
            }
            // ประโยคที่ 2: ดนตรีเพิ่ม String + Cello + Choir
            if (i === 2) {
                playOrchestralSound('orchestral-rise', 0.45);
            }
            // ประโยคที่ 5: ดนตรีไต่ระดับ Heavy Brass
            if (i === 5) {
                playOrchestralSound('final-build', 0.5);
            }
            // ประโยคที่ 6: Cinematic Boom ก่อนประโยคสุดท้าย
            if (i === 6) {
                playOrchestralSound('cinematic-boom', 0.65);
            }

            const { rate, pitch } = getVoiceParams(i);
            await speakLine(aiLines[i], rate, pitch); // รอ onend จริง — ห้ามใช้ setTimeout เดาเวลา

            // เว้นจังหวะระหว่างประโยค (ถี่ขึ้นเรื่อยๆ ช่วงท้าย)
            if (i < aiLines.length - 1) {
                await delay(getLineDelay(i));
            }
        }
    }

    // ==========================================================================
    // 5. SPEECH RECOGNITION (Web Speech API)
    // ==========================================================================

    function initSpeechRecognition() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

        if (!SpeechRecognition) {
            alert("เบราว์เซอร์ของคุณไม่รองรับ Web Speech API กรุณาใช้ Google Chrome หรือ Microsoft Edge");
            updateStatusDisplay("ไม่รองรับไมค์", "เบราว์เซอร์ไม่รองรับ SpeechRecognition");
            return false;
        }

        recognition = new SpeechRecognition();
        recognition.lang = "th-TH";
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.maxAlternatives = 3; // ขอหลายทางเลือก เพื่อใช้กับเจตนาเมื่อพูดเพี้ยน

        recognition.onstart = () => {
            if (!isSummoning) {
                updateStatusDisplay("กำลังฟังเสียง...", "กำลังรอคำอัญเชิญ...", "listening");
                magicCircleWrapper.classList.add('listening');
            }
        };

        recognition.onresult = (event) => {
            if (isSummoning) return;

            // เก็บทุกทางเลือกคำ (alternatives) ของทุก result ก้อน
            const transcripts = [];
            for (let i = event.resultIndex; i < event.results.length; i++) {
                const result = event.results[i];
                for (let j = 0; j < result.length; j++) {
                    const t = (result[j] && result[j].transcript || "").trim();
                    if (t) transcripts.push(t);
                }
            }

            const rawText = (transcripts[0] || "").trim();
            if (rawText) {
                transcriptText.textContent = `"${rawText}"`;
            }

            // 2) VOICE AI: วิเคราะห์เจตนาจากทุกทางเลือก (ตรงกับระบบเดิม → แล้วค่อย Fuzzy)
            const analyzed = findBestSummonIntent(transcripts);
            if (analyzed) {
                console.log("[Voice AI] ตรวจพบเจตนาเรียกสัตว์:", JSON.stringify(analyzed.fromTranscript), "→", analyzed.summon.name,
                    "(", analyzed.summon.video, ")", analyzed.method, "score:", analyzed.score.toFixed(3));

                // === DEBUG VIDEO CHAIN ===
                console.log("[Animal] Detected:", analyzed.summon.name);
                console.log("[Animal] Normalized:", analyzed.summon.id);
                console.log("[Video] Mapping:", analyzed.summon.video);

                currentTargetVideo = analyzed.summon.video;
                runCinematicSummoningShow();
            } else if (rawText) {
                // ไม่มีเจตนาเรียกสัตว์ที่สอดคล้อง → ไม่ crash ระบบเดิมทำงานต่อไป
                console.warn("[Voice AI] ไม่พบเจตนาเรียกสัตว์ในข้อความ:", rawText);
            }
        };

        recognition.onerror = (event) => {
            console.warn("Speech Recognition Error:", event.error);
            if (event.error === 'no-speech') return;
            if (isSystemActive && !isSummoning) {
                restartRecognitionWithDelay(1000);
            }
        };

        recognition.onend = () => {
            magicCircleWrapper.classList.remove('listening');
            if (isSystemActive && !isSummoning) {
                restartRecognitionWithDelay(300);
            }
        };

        return true;
    }

    function restartRecognitionWithDelay(ms) {
        setTimeout(() => {
            if (isSystemActive && !isSummoning && recognition) {
                try {
                    recognition.start();
                } catch (e) {}
            }
        }, ms);
    }

    function stopSpeechRecognition() {
        if (recognition) {
            try {
                recognition.stop();
                recognition.abort();
            } catch (e) {}
        }
        magicCircleWrapper.classList.remove('listening');
    }

    // ==========================================================================
    // 6. CINEMATIC FANTASY ORCHESTRAL SHOW TIMELINE
    // ==========================================================================

    /**
     * รันการแสดงฉากเปิดตัวซิมโฟนีแฟนตาซีระดับตำนาน
     * ลำดับ: หน้าจอมืด → ดนตรี → 5 ประโยค AI (onend) → Energy Steps → Countdown → Blackout → Reveal
     * ห้าม: เสียงไฟช็อต / สายฟ้า / Beep / พูดคำว่า "มังกร" ก่อนวิดีโอ
     */
    async function runCinematicSummoningShow() {
        if (isSummoning) return;
        isSummoning = true;

        // 1. หยุดไมโครโฟนฟังเสียงทันที
        stopSpeechRecognition();

        // ── SCENE 1: หน้าจอค่อยๆ มืดลง + เริ่มดนตรี Cinematic Fantasy เบาๆ ──
        document.body.className = '';
        statusDot.className = 'status-dot suspense';
        statusBadgeText.textContent = "กำลังตรวจจับ...";
        statusTitle.textContent = "...";
        statusEnglish.textContent = "DETECTING ANOMALY";

        // หน้าจอค่อยๆ มืดลง (semi-transparent dim ~60%)
        blackoutOverlay.classList.add('active');
        blackoutOverlay.style.transition = 'opacity 0.9s ease';
        blackoutOverlay.style.opacity = '0.62';

        // เริ่มดนตรี Cinematic Fantasy เบาๆ (Cello, Contrabass, Soft Choir)
        playOrchestralSound('mystery-intro', 0.28);

        // เว้น 0.8 วินาทีก่อนพูด
        await delay(800);
        if (!isSummoning) return;

        // ── SCENE 2-7: AI พูด 8 ประโยคสร้างความลุ้น (ลึกลับ → ตื่นเต้น → เร่งเร้า) ──
        statusBadgeText.textContent = "ตรวจพบสัญญาณผิดปกติ";
        statusTitle.textContent = "มีสิ่งผิดปกติบางอย่าง...";
        statusEnglish.textContent = "ANOMALY SIGNAL DETECTED";

        await speakSuspenseLines();
        if (!isSummoning) return;

        // ── SCENE 6: Energy Meter วิ่ง 35 → 58 → 76 → 91 → 99 ──
        energyMeterContainer.classList.add('active');
        warningHud.classList.add('active');
        magicalEnergyAura.style.opacity = '1';
        statusDot.className = 'status-dot danger';
        statusBadgeText.textContent = "พลังงานพุ่งเกินขีดจำกัด";
        statusTitle.textContent = "พลังงานกำลังพุ่งสูง!";
        statusEnglish.textContent = "ENERGY SURGING — GATE UNSTABLE";
        document.body.classList.add('scene-shake-subtle');

        await animateEnergySteps([35, 58, 76, 91, 99], 420);
        if (!isSummoning) return;

        document.body.classList.add('scene-shake-medium');

        // ── SCENE 8: Countdown 3, 2, 1 ด้วยกลอง Timpani (ห้าม Beep Electronic) ──
        warningHud.classList.remove('active');
        countdownHud.classList.add('active');
        document.body.classList.add('scene-shake-violent');

        for (let num = 3; num >= 1; num--) {
            if (!isSummoning) return;
            countdownDigit.textContent = num;
            // Timpani Drum Boom 1 ครั้งต่อตัวเลข
            playOrchestralSound('timpani-hit', 0.78);
            await delay(800);
        }

        // ── SCENE 9: หลังเลข 1 — หยุดดนตรีทันที ──
        window.speechSynthesis.cancel();
        stopAllOrchestralMusic(80); // หยุดทันที ไม่ fade

        countdownHud.classList.remove('active');
        energyMeterContainer.classList.remove('active');
        document.body.className = '';

        // ── SCENE 10: จอดำสนิทและเงียบ 1 วินาที ──
        blackoutOverlay.style.transition = 'opacity 0.12s ease';
        blackoutOverlay.style.opacity = '1'; // ดำสนิท

        await delay(1000); // ความเงียบสนิท สร้างความลุ้นสูงสุด
        if (!isSummoning) return;

        // ── SCENE 11: Orchestra Impact + Flash + เปิดวิดีโอเต็มจอ ──
        // เล่น Orchestra Impact / Epic Drum / Bass Hit ก่อน
        playOrchestralSound('reveal-impact', 0.95);

        // Flash หน้าจอสีขาววาบ
        blackoutOverlay.style.opacity = '0';
        blackoutOverlay.style.transition = 'opacity 0.05s';
        flashOverlay.classList.add('active');

        setTimeout(() => {
            playCreatureVideo();
        }, 300);
    }

    /**
     * วิ่งหลอดพลังงาน Energy Meter แบบ Smooth Interpolation (startVal → endVal)
     */
    function animateEnergyMeter(startVal, endVal, durationMs) {
        return new Promise(resolve => {
            const steps = 15;
            const stepDuration = durationMs / steps;
            let currentStep = 0;

            const timer = setInterval(() => {
                currentStep++;
                const currentVal = Math.floor(startVal + (endVal - startVal) * (currentStep / steps));
                energyValue.textContent = `${currentVal}%`;
                energyFill.style.width = `${currentVal}%`;

                if (currentStep >= steps) {
                    clearInterval(timer);
                    resolve();
                }
            }, stepDuration);
        });
    }

    /**
     * วิ่ง Energy Meter แบบขั้น (Stepped) ตาม milestones ที่กำหนด
     * @param {number[]} steps - ค่าพลังงานแต่ละขั้น เช่น [35, 58, 76, 91, 99]
     * @param {number} stepDelayMs - เวลา (ms) ในการวิ่งจากขั้นหนึ่งไปอีกขั้น
     */
    async function animateEnergySteps(steps, stepDelayMs = 400) {
        let prev = 0;
        for (const target of steps) {
            await animateEnergyMeter(prev, target, stepDelayMs);
            prev = target;
            await delay(180); // หยุดสั้นๆ ระหว่างขั้นเพื่อให้เห็นค่าแต่ละขั้น
        }
    }

    /**
     * เปิดวิดีโอสัตว์เวทมนตร์แบบเต็มหน้าจอพร้อม Fade ดนตรีออก 300-500ms
     * - แก้ไขปัญหา: ตรวจไฟล์แบบไม่บล็อก (รองรับ file://), ตั้ง video.src ตรงๆ แล้ว load()
     * - รองรับ autoplay policy บนมือถือ: ถ้าเบราว์เซอร์ block การเล่นมีเสียง
     *   จะลองเล่นแบบ muted อีกครั้งเพื่อให้วิดีโอแสดงผล
     * - ไม่แตะระบบ Effect/Sound/Animation/Timing เดิมของโชว์
     */
    async function playCreatureVideo() {
        flashOverlay.classList.remove('active');

        // Fade ดนตรีอัญเชิญออก 400ms ไม่ให้เพลงชนกับเสียงวิดีโอ
        stopAllOrchestralMusic(400);

        if (!currentTargetVideo) {
            console.error("[Video ERROR] ไม่มีไฟล์วิดีโอเป้าหมาย (currentTargetVideo ว่าง)");
            finishVideoSummoning();
            return;
        }

        // ตรวจสอบว่าไฟล์มีอยู่จริงก่อน (ไม่บล็อกบน file://) — case-sensitive
        if (!(await videoFileExists(currentTargetVideo))) {
            console.error("[Video ERROR] File not found:", currentTargetVideo);
            finishVideoSummoning();
            return;
        }

        console.log("[Video] Path:", currentTargetVideo);

        // ตั้ง src ทั้งบน <source> และ video.src ตรงๆ (src attribute ชนะเสมอ
        // และรองรับทั้ง desktop/mobile ได้แน่นอนกว่า)
        const sourceElem = dragonVideo.querySelector('source');
        if (sourceElem) sourceElem.src = currentTargetVideo;
        dragonVideo.src = currentTargetVideo;

        document.body.classList.add('video-active');
        dragonVideo.classList.add('active');

        console.log("[Video] Loading...", currentTargetVideo);
        dragonVideo.load();

        // เล่น: ลองแบบปกติก่อน ถ้า autoplay ถูก block บนมือถือ → retry muted
        const attemptPlay = (muted) => {
            dragonVideo.muted = muted;
            dragonVideo.currentTime = 0;
            const p = dragonVideo.play();
            if (p !== undefined) {
                p.then(() => {
                    console.log(muted ? "[Video] Playing (muted fallback)" : "[Video] Playing...", currentTargetVideo);
                }).catch(err => {
                    const reason = (err && (err.name || err.message)) || err;
                    console.error("[Video ERROR] Cannot play:", currentTargetVideo, reason);
                    if (!muted && (reason === 'NotAllowedError' || (err && err.name === 'NotAllowedError'))) {
                        // เบราว์เซอร์ block autoplay (มือถือ) → ลองแบบ muted
                        console.log("[Video] Autoplay blocked, retrying muted...");
                        attemptPlay(true);
                    } else {
                        finishVideoSummoning();
                    }
                });
            }
        };

        attemptPlay(false);
    }

    /**
     * เมื่อวิดีโอจบ คืนค่าระบบกลับสู่หน้ารอฟังคำสั่ง
     */
    function finishVideoSummoning() {
        dragonVideo.pause();
        dragonVideo.muted = false; // รีเซ็ตกลับเพื่อรอบต่อไปเล่นแบบมีเสียงได้
        dragonVideo.classList.remove('active');
        document.body.className = '';
        
        // Reset Overlays, HUDs & summoning state
        flashOverlay.classList.remove('active');
        blackoutOverlay.classList.remove('active');
        blackoutOverlay.style.opacity = '';          // reset inline opacity
        blackoutOverlay.style.transition = '';
        energyMeterContainer.classList.remove('active');
        warningHud.classList.remove('active');
        countdownHud.classList.remove('active');
        magicalEnergyAura.style.opacity = '0';
        magicCircleWrapper.classList.remove('summoning-active'); // reset dim effect
        energyFill.style.width = '0%';
        energyValue.textContent = '0%';

        isSummoning = false;

        updateStatusDisplay("พร้อมรับคำสั่ง", "ระบบประตูเวทมนตร์พร้อมใช้งาน", "listening");
        statusEnglish.textContent = "READY FOR SUMMONING COMMAND";
        transcriptText.textContent = '"..."';

        if (isSystemActive && recognition) {
            restartRecognitionWithDelay(400);
        }
    }

    dragonVideo.onended = () => {
        console.log("วิดีโอจบแล้ว");
        finishVideoSummoning();
    };

    // ===== Video Loader ตรวจสอบ Media load/error (debug + fallback ปลอดภัย) =====
    // เมื่อโหลดวิดีโอได้แล้ว จะถูกเรียกจาก attemptPlay อยู่แล้ว แต่ให้ log เพื่อดู
    dragonVideo.addEventListener('canplay', () => {
        console.log("[Video] Ready (canplay):", currentTargetVideo);
    });

    // ตรวจว่าไฟล์วิดีโอจริงๆ โหลดไม่ได้ (เช่น path ผิด / ไฟล์หาย) โดยไม่ crash
    dragonVideo.addEventListener('error', () => {
        const srcForLog = currentTargetVideo || dragonVideo.currentSrc || "(unknown)";
        const code = dragonVideo.error ? ("code=" + dragonVideo.error.code) : "";
        console.error("[Video ERROR] Cannot load:", srcForLog, code);
        // Guard: ไม่ให้ finishVideoSummoning ซ้ำเมื่อ error ซ้ำกัน
        if (dragonVideo.classList.contains('active') && !dragonVideo.classList.contains('video-error-handled')) {
            dragonVideo.classList.add('video-error-handled');
            finishVideoSummoning();
            dragonVideo.classList.remove('video-error-handled');
        }
    });

    // ปุ่ม ESC หยุดวิดีโอหรือยกเลิกฉุกเฉิน
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' || e.key === 'Esc') {
            if (isSummoning || dragonVideo.classList.contains('active')) {
                console.log("กด ESC หยุดฉุกเฉิน");
                window.speechSynthesis.cancel();
                stopAllOrchestralMusic(100);
                finishVideoSummoning();
            }
        }
    });

    // ==========================================================================
    // 7. UI CONTROLLER & BUTTONS
    // ==========================================================================

    function updateStatusDisplay(badge, text, stateClass = 'active') {
        statusBadgeText.textContent = badge;
        statusTitle.textContent = text;

        statusDot.className = 'status-dot';
        if (stateClass) {
            statusDot.classList.add(stateClass);
        }
    }

    startBtn.addEventListener('click', () => {
        initAudioContext();

        // VOICE AI: ขอสิทธิ์ใช้ไมโครโฟน + เลือกอุปกรณ์อัตโนมัติ (ไม่ crash ไม่แน่นอน)
        // ถ้าอนุญาตแล้ว/ปฏิเสธ ก็ยังเข้าไป setup ต่อไปเพื่อให้ระบบเดิมทำงานเหมือนเดิม
        ensureMicrophoneReady().then(() => {
            if (!recognition) {
                const success = initSpeechRecognition();
                if (!success) return;
            }

            isSystemActive = true;
            isSummoning = false;

            try {
                recognition.start();
                updateStatusDisplay("เปิดใช้งานไมค์", "ระบบประตูเวทมนตร์พร้อมใช้งาน", "listening");
                startBtn.querySelector('.btn-text').textContent = "ระบบเวทมนตร์ทำงานอยู่";
                startBtn.style.opacity = "0.8";
            } catch (e) {
                console.log("Recognition active");
            }
        });
    });

    fullscreenBtn.addEventListener('click', () => {
        toggleFullscreen();
    });

    function toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().then(() => {
                fullscreenBtn.querySelector('.btn-text').textContent = "ออกจากโหมดงานแสดง";
            }).catch(err => {
                console.warn("Fullscreen failed:", err);
            });
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen().then(() => {
                    fullscreenBtn.querySelector('.btn-text').textContent = "เข้าสู่โหมดงานแสดง";
                });
            }
        }
    }

    // ==========================================================================
    // 8. BACKGROUND PARTICLE CANVAS ENGINE
    // ==========================================================================
    function initParticleCanvas() {
        const ctx = particleCanvas.getContext('2d');
        let width = particleCanvas.width = window.innerWidth;
        let height = particleCanvas.height = window.innerHeight;

        const particles = [];
        const particleCount = Math.min(80, Math.floor(width / 18));

        class Particle {
            constructor() {
                this.reset();
            }

            reset() {
                this.x = Math.random() * width;
                this.y = Math.random() * height;
                this.size = Math.random() * 2.5 + 0.5;
                this.speedX = (Math.random() - 0.5) * 0.4;
                this.speedY = -Math.random() * 0.6 - 0.2;
                this.alpha = Math.random() * 0.7 + 0.2;
                this.color = Math.random() > 0.4 ? '#ffd700' : '#a855f7';
            }

            update() {
                this.x += this.speedX;
                this.y += this.speedY;
                this.alpha -= 0.002;

                if (this.y < 0 || this.alpha <= 0) {
                    this.reset();
                    this.y = height + 10;
                }
            }

            draw() {
                ctx.save();
                ctx.globalAlpha = this.alpha;
                ctx.fillStyle = this.color;
                ctx.shadowBlur = 8;
                ctx.shadowColor = this.color;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }
        }

        for (let i = 0; i < particleCount; i++) {
            particles.push(new Particle());
        }

        function animate() {
            ctx.clearRect(0, 0, width, height);
            particles.forEach(p => {
                p.update();
                p.draw();
            });
            requestAnimationFrame(animate);
        }

        animate();

        window.addEventListener('resize', () => {
            width = particleCanvas.width = window.innerWidth;
            height = particleCanvas.height = window.innerHeight;
        });
    }

    initParticleCanvas();
});
