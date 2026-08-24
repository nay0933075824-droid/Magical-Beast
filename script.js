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
    const summons = [
        {
            id: "dragon",
            name: "มังกร",                  // สำหรับใช้จัดการภายในเท่านั้น (ห้ามแสดงใน UI หรือพูดก่อนเปิดวิดีโอ)
            command: "มังกรจงออกมา",           // คำสั่งเสียงสั่งงาน
            video: "dragon.mp4"
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
    let currentTargetVideo = "dragon.mp4"; // ไฟล์วิดีโอเป้าหมาย

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
     * พูดประโยคเดี่ยวและลดเสียงเพลงดนตรีลงชั่วคราวขณะ AI กำลังพูด (Ducking)
     * @param {string} text 
     * @param {number} rate 
     * @param {number} pitch 
     */
    function speakLine(text, rate = 0.72, pitch = 0.75) {
        return new Promise((resolve) => {
            if (!('speechSynthesis' in window)) {
                resolve();
                return;
            }

            // แสดงข้อความบน UI ทันทีเพื่อให้คนดูอ่านตามได้
            if (statusTitle) statusTitle.textContent = text;
            if (transcriptText) transcriptText.textContent = `"${text}"`;

            loadTTSVoices(); // โหลดเสียงล่าสุดเผื่อยังไม่ได้จัดเก็บ

            try {
                window.speechSynthesis.cancel();
                if (window.speechSynthesis.paused) {
                    window.speechSynthesis.resume();
                }
            } catch(e) {}

            // Duck music volume down for voice clarity
            setOrchestraDucking(true);

            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = "th-TH";
            utterance.rate = rate;
            utterance.pitch = pitch;

            if (ttsVoice) {
                utterance.voice = ttsVoice;
            }

            let hasResolved = false;

            function finishLine() {
                if (!hasResolved) {
                    hasResolved = true;
                    setOrchestraDucking(false); // Restore music volume
                    resolve();
                }
            }

            utterance.onstart = () => {
                console.log("AI เริ่มพูด:", text);
                try {
                    if (window.speechSynthesis.paused) {
                        window.speechSynthesis.resume();
                    }
                } catch(e) {}
            };

            utterance.onend = () => {
                console.log("AI พูดจบ:", text);
                finishLine();
            };

            utterance.onerror = (err) => {
                console.warn("TTS line error:", err);
                finishLine();
            };

            try {
                window.speechSynthesis.speak(utterance);
                window.speechSynthesis.resume();
            } catch (e) {
                console.warn("Speech Synthesis Exception:", e);
                finishLine();
            }

            // Dynamic Safety timeout based on text length and rate
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
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
            if (!isSummoning) {
                updateStatusDisplay("กำลังฟังเสียง...", "กำลังรอคำอัญเชิญ...", "listening");
                magicCircleWrapper.classList.add('listening');
            }
        };

        recognition.onresult = (event) => {
            if (isSummoning) return;

            let currentTranscript = "";
            for (let i = event.resultIndex; i < event.results.length; i++) {
                currentTranscript += event.results[i][0].transcript;
            }

            const rawText = currentTranscript.trim();
            if (rawText) {
                transcriptText.textContent = `"${rawText}"`;
            }

            const normalizedText = normalizeSpeech(rawText);

            for (const item of summons) {
                const targetCmd = normalizeSpeech(item.command);
                if (normalizedText.includes(targetCmd)) {
                    console.log("ตรวจพบคำสั่งอัญเชิญ:", rawText);
                    currentTargetVideo = item.video;
                    runCinematicSummoningShow();
                    break;
                }
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
     */
    function playCreatureVideo() {
        flashOverlay.classList.remove('active');

        // Fade ดนตรีอัญเชิญออก 400ms ไม่ให้เพลงชนกับเสียงวิดีโอ
        stopAllOrchestralMusic(400);

        const sourceElem = dragonVideo.querySelector('source');
        if (sourceElem && currentTargetVideo) {
            sourceElem.src = currentTargetVideo;
            dragonVideo.load();
        }

        document.body.classList.add('video-active');
        dragonVideo.classList.add('active');
        dragonVideo.currentTime = 0;

        const playPromise = dragonVideo.play();
        if (playPromise !== undefined) {
            playPromise.then(() => {
                console.log("วิดีโออัญเชิญมังกรเริ่มเล่นแล้ว");
            }).catch(err => {
                console.error("การเล่นวิดีโอล้มเหลว:", err);
                finishVideoSummoning();
            });
        }
    }

    /**
     * เมื่อวิดีโอจบ คืนค่าระบบกลับสู่หน้ารอฟังคำสั่ง
     */
    function finishVideoSummoning() {
        dragonVideo.pause();
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
