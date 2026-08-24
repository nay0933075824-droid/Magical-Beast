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
        "เดี๋ยวก่อน...",                                     // index 0
        "ระบบตรวจพบบางสิ่ง...จากอีกฝั่งของประตู",         // index 1
        "สัญญาณพลังงาน...กำลังเพิ่มขึ้นอย่างรวดเร็ว",      // index 2
        "มัน...ตอบกลับมา",                                 // index 3
        "พลังงานเกินขีดจำกัด",                             // index 4
        "ระบบไม่สามารถควบคุมประตูได้",                     // index 5
        "มีบางอย่าง...กำลังพยายามออกมา!"                    // index 6
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
        const targetGain = isDucked ? 0.22 : 0.55;
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
            ttsVoice = voices.find(v => v.lang.includes('th') || v.lang.includes('TH')) || null;
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

            window.speechSynthesis.cancel();

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

            utterance.onend = () => {
                if (!hasResolved) {
                    hasResolved = true;
                    setOrchestraDucking(false); // Restore music volume
                    resolve();
                }
            };

            utterance.onerror = (err) => {
                console.warn("TTS line error:", err);
                if (!hasResolved) {
                    hasResolved = true;
                    setOrchestraDucking(false);
                    resolve();
                }
            };

            window.speechSynthesis.speak(utterance);

            // Safety timeout
            setTimeout(() => {
                if (!hasResolved) {
                    hasResolved = true;
                    setOrchestraDucking(false);
                    resolve();
                }
            }, 4000);
        });
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
     * รันการแสดงฉากเปิดตัวซิมโฟนีแฟนตาซีระดับตำนาน (8 ฉาก)
     */
    async function runCinematicSummoningShow() {
        if (isSummoning) return;
        isSummoning = true;

        // 1. หยุดไมโครโฟนฟังเสียงทันที
        stopSpeechRecognition();

        // ----------------------------------------------------------------------
        // SCENE 1: ช่วงเริ่มต้น — ทุกอย่างเงียบ (0s - 1s)
        // ----------------------------------------------------------------------
        document.body.className = '';
        statusDot.className = 'status-dot suspense';
        statusBadgeText.textContent = "บรรยากาศลึกลับ";
        statusTitle.textContent = "...";
        statusEnglish.textContent = "MYSTERY INTRO";

        // เริ่มเพลงเบาๆ ด้วย Cello, Contrabass & Soft Choir (ห้ามเพลงดังทันที)
        playOrchestralSound('mystery-intro', 0.25);

        await delay(1000);
        if (!isSummoning) return;

        // ----------------------------------------------------------------------
        // SCENE 2: ช่วงที่ 2 — ตรวจพบสิ่งผิดปกติ (1s - 3s)
        // ----------------------------------------------------------------------
        statusBadgeText.textContent = "ตรวจพบสิ่งผิดปกติ";
        statusTitle.textContent = "ตรวจพบบางสิ่งจากอีกฝั่ง";
        statusEnglish.textContent = "ANOMALY DETECTED BEYOND THE GATE";

        // ดนตรีเริ่มเพิ่มเครื่องดนตรีทีละน้อย (Low Brass & Strings)
        playOrchestralSound('tension-build', 0.35);

        await speakLine(suspenseDialogue[0], 0.72, 0.75); // "เดี๋ยวก่อน..."
        if (!isSummoning) return;
        await delay(700);

        await speakLine(suspenseDialogue[1], 0.72, 0.75); // "ระบบตรวจพบบางสิ่ง...จากอีกฝั่งของประตู"
        if (!isSummoning) return;

        // เสียงกระแทกประตูแบบ Cinematic Drum Thud (ไม่ใช่เสียงไฟช็อต)
        playOrchestralSound('cinematic-boom', 0.5);
        document.body.classList.add('scene-shake-subtle');
        await delay(500);

        // ----------------------------------------------------------------------
        // SCENE 3: ช่วงที่ 3 — พลังงานเพิ่มขึ้น / ORCHESTRAL RISE (3s - 6s)
        // ----------------------------------------------------------------------
        energyMeterContainer.classList.add('active');
        statusTitle.textContent = "ระดับพลังงานเพิ่มขึ้นอย่างรวดเร็ว";
        statusEnglish.textContent = "ENERGY LEVEL RISING";

        // ดนตรีค่อยๆ เร็วและหนักขึ้นด้วย String Ostinato & Low Drums
        playOrchestralSound('orchestral-rise', 0.45);

        const line2Promise = speakLine(suspenseDialogue[2], 0.78, 0.8); // "สัญญาณพลังงาน...กำลังเพิ่มขึ้นอย่างรวดเร็ว"

        // หลอด Energy Meter วิ่ง 18% -> 32% -> 51% -> 74% -> 92%
        await animateEnergyMeter(18, 92, 2200);
        await line2Promise;

        if (!isSummoning) return;

        // ----------------------------------------------------------------------
        // SCENE 4: ช่วงที่ 4 — มีบางอย่างตอบกลับ (6s - 8s)
        // ----------------------------------------------------------------------
        await delay(500); // ทุกอย่างหยุดสั้นๆ 0.5s เพื่อสร้างความลุ้น
        
        // เล่นเสียง Cinematic Orchestra Boom & Timpani Hit
        playOrchestralSound('cinematic-boom', 0.7);
        playOrchestralSound('timpani-hit', 0.6);
        document.body.classList.add('scene-shake-medium');
        
        await delay(900);
        if (!isSummoning) return;

        statusTitle.textContent = "มันตอบกลับมา...";
        statusEnglish.textContent = "THE ENTITY RESPONDED";
        
        await speakLine(suspenseDialogue[3], 0.75, 0.75); // "มัน...ตอบกลับมา"
        if (!isSummoning) return;
        
        // ดนตรีหยุดสั้นๆ 0.4s แล้วกลับเข้ามาใหญ่กว่าเดิม
        await delay(400);

        // ----------------------------------------------------------------------
        // SCENE 5: ช่วงที่ 5 — ระบบเริ่มควบคุมไม่ได้ (8s - 10s)
        // ----------------------------------------------------------------------
        warningHud.classList.add('active');
        magicalEnergyAura.style.opacity = '1';

        document.body.className = 'scene-shake-violent';
        statusDot.className = 'status-dot danger';
        statusBadgeText.textContent = "สภาวะฉุกเฉิน";
        statusTitle.textContent = "พลังงานเกินขีดจำกัด!";
        statusEnglish.textContent = "CRITICAL: ENERGY LIMIT EXCEEDED";

        // ดนตรี Orchestra สปีดขึ้นและโหมกระหน่ำ (Fast Strings, Heavy Brass, Choir)
        playOrchestralSound('final-build', 0.55);

        // Energy Spike 92% -> 99%
        await animateEnergyMeter(92, 99, 800);

        await speakLine(suspenseDialogue[4], 0.88, 0.85); // "พลังงานเกินขีดจำกัด"
        if (!isSummoning) return;

        await speakLine(suspenseDialogue[5], 0.9, 0.88);  // "ระบบไม่สามารถควบคุมประตูได้"
        if (!isSummoning) return;

        playOrchestralSound('cinematic-boom', 0.8);
        await speakLine(suspenseDialogue[6], 0.95, 1.05); // "มีบางอย่าง...กำลังพยายามออกมา!"
        if (!isSummoning) return;

        // ----------------------------------------------------------------------
        // SCENE 6: ช่วงที่ 6 — COUNTDOWN ORCHESTRAL TIMPANI (10s - 11s)
        // ----------------------------------------------------------------------
        warningHud.classList.remove('active');
        countdownHud.classList.add('active');

        for (let num = 3; num >= 1; num--) {
            if (!isSummoning) return;
            countdownDigit.textContent = num;
            
            // ใช้เสียงกลองใหญ่ Timpani Boom 1 ครั้งต่อตัวเลข (ห้ามใช้ Beep Electronic เด็ดขาด!)
            playOrchestralSound('timpani-hit', 0.7);

            await delay(700);
        }

        // ----------------------------------------------------------------------
        // SCENE 7: ช่วงที่ 7 — ความเงียบก่อนเฉลย (11s - 12s)
        // ----------------------------------------------------------------------
        // หยุดดนตรีและข้อความทั้งหมดลงทันทีก่อนเลข 1 จบ
        window.speechSynthesis.cancel();
        stopAllOrchestralMusic(100);

        countdownHud.classList.remove('active');
        energyMeterContainer.classList.remove('active');

        // Blackout Screen ชัตดาวน์หน้าจอดำสนิท
        blackoutOverlay.classList.add('active');
        document.body.className = '';

        // ความเงียบสนิท 1.0 วินาที สร้างความลุ้นสูงสุด
        await delay(1000);
        if (!isSummoning) return;

        // ----------------------------------------------------------------------
        // SCENE 8: ช่วงเปิดตัว — REVEAL CLIMAX (12s+)
        // ----------------------------------------------------------------------
        blackoutOverlay.classList.remove('active');
        
        // เสียงเปิดตัวด้วย Orchestra Impact + Epic Drum Hit + Bass Drop
        playOrchestralSound('reveal-impact', 0.9);

        // Flash สีขาววาบเปิดประตู
        flashOverlay.classList.add('active');

        setTimeout(() => {
            playCreatureVideo();
        }, 300);
    }

    /**
     * วิ่งหลอดพลังงาน Energy Meter (18% -> 99%)
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
        
        // Reset Overlays & HUDs
        flashOverlay.classList.remove('active');
        blackoutOverlay.classList.remove('active');
        energyMeterContainer.classList.remove('active');
        warningHud.classList.remove('active');
        countdownHud.classList.remove('active');
        magicalEnergyAura.style.opacity = '0';

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
