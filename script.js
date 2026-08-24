/**
 * ==========================================================================
 * MAGICAL GATEWAY - BOSS REVEAL CINEMATIC SHOW ENGINE
 * - Zero-spoiler mystery reveal
 * - 8-Scene Cinematic Timeline (~10-12s total duration)
 * - Energy Meter HUD (18% -> 99%) & Warning HUD Alert
 * - Fake Countdown (3... 2... 1) with instant pitch blackout silence
 * - Layered Dual Audio Engine (9 sound effects + Web Audio API synthesizer)
 * - Fullscreen video reveal controller
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
    const glitchOverlay = document.getElementById('glitchOverlay');
    const magicCrackOverlay = document.getElementById('magicCrackOverlay');
    const lightningOverlay = document.getElementById('lightningOverlay');
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
    // 3. LAYERED AUDIO ENGINE (9 Sound Effects + Web Audio API Synthesizer)
    // ==========================================================================
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    let audioCtx = null;

    function initAudioContext() {
        if (!audioCtx && AudioCtx) {
            audioCtx = new AudioCtx();
        }
        if (audioCtx && audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
    }

    /**
     * เล่นเสียงเอฟเฟกต์ (พยายามเล่นไฟล์ MP3 หากไม่มีจะใช้ Web Audio API สังเคราะห์)
     * @param {string} soundName 
     * @param {number} volume 
     */
    function playSound(soundName, volume = 0.3) {
        initAudioContext();
        if (!audioCtx) return;

        const audio = new Audio(`sounds/${soundName}.mp3`);
        audio.volume = volume;
        const playPromise = audio.play();

        if (playPromise !== undefined) {
            playPromise.catch(() => {
                // Synthesize procedurally using Web Audio API if MP3 file is absent
                synthesizeSound(soundName, volume);
            });
        }
    }

    /**
     * สังเคราะห์เสียงเอฟเฟกต์ทั้ง 9 ชนิดผ่าน Web Audio API
     */
    function synthesizeSound(type, volume = 0.3) {
        if (!audioCtx) return;
        const now = audioCtx.currentTime;

        try {
            if (type === 'low-rumble') {
                // เสียงความถี่ต่ำสะเทือน (Low Sub-Bass Vibration)
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(35, now);
                osc.frequency.linearRampToValueAtTime(55, now + 2.0);
                gain.gain.setValueAtTime(volume * 0.7, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 2.5);
                osc.connect(gain);
                gain.connect(audioCtx.destination);
                osc.start(now);
                osc.stop(now + 2.5);
            }
            else if (type === 'heartbeat') {
                // เสียงหัวใจเต้น (Sub Thump)
                [0, 0.22].forEach(d => {
                    const osc = audioCtx.createOscillator();
                    const gain = audioCtx.createGain();
                    osc.type = 'triangle';
                    osc.frequency.setValueAtTime(75, now + d);
                    osc.frequency.exponentialRampToValueAtTime(30, now + d + 0.12);
                    gain.gain.setValueAtTime(volume * 0.9, now + d);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + d + 0.16);
                    osc.connect(gain);
                    gain.connect(audioCtx.destination);
                    osc.start(now + d);
                    osc.stop(now + d + 0.18);
                });
            }
            else if (type === 'gate-hit') {
                // เสียงบางอย่างชนกระแทกประตู (Heavy Gate Impact Thud)
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(140, now);
                osc.frequency.exponentialRampToValueAtTime(25, now + 0.35);
                gain.gain.setValueAtTime(volume * 1.2, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
                osc.connect(gain);
                gain.connect(audioCtx.destination);
                osc.start(now);
                osc.stop(now + 0.45);
            }
            else if (type === 'creature-growl') {
                // เสียงคำรามต่ำลึกลับของสิ่งมีชีวิต (Mysterious Low Growl Resonance)
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(60, now);
                osc.frequency.linearRampToValueAtTime(90, now + 0.5);
                osc.frequency.linearRampToValueAtTime(45, now + 1.2);
                gain.gain.setValueAtTime(0.01, now);
                gain.gain.linearRampToValueAtTime(volume * 0.6, now + 0.3);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 1.3);
                osc.connect(gain);
                gain.connect(audioCtx.destination);
                osc.start(now);
                osc.stop(now + 1.35);
            }
            else if (type === 'warning') {
                // เสียงระบบเตือนภัย (Emergency Warning Beep)
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                osc.type = 'square';
                osc.frequency.setValueAtTime(880, now);
                gain.gain.setValueAtTime(volume * 0.3, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
                osc.connect(gain);
                gain.connect(audioCtx.destination);
                osc.start(now);
                osc.stop(now + 0.28);
            }
            else if (type === 'countdown-beep') {
                // เสียงนับถอยหลัง Beep
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(1050, now);
                gain.gain.setValueAtTime(volume * 0.4, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
                osc.connect(gain);
                gain.connect(audioCtx.destination);
                osc.start(now);
                osc.stop(now + 0.18);
            }
            else if (type === 'magic-crack') {
                // เสียงประตูแตกพลังงานรั่วไหล
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(400, now);
                osc.frequency.exponentialRampToValueAtTime(100, now + 0.3);
                gain.gain.setValueAtTime(volume * 0.5, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
                osc.connect(gain);
                gain.connect(audioCtx.destination);
                osc.start(now);
                osc.stop(now + 0.38);
            }
            else if (type === 'bass-drop') {
                // เสียง Bass Drop ตูมใหญ่ก่อนเปิดตัว
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(200, now);
                osc.frequency.exponentialRampToValueAtTime(20, now + 0.8);
                gain.gain.setValueAtTime(volume * 1.3, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 1.0);
                osc.connect(gain);
                gain.connect(audioCtx.destination);
                osc.start(now);
                osc.stop(now + 1.0);
            }
            else if (type === 'impact') {
                // เสียง Impact ระเบิดประตู
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(300, now);
                osc.frequency.exponentialRampToValueAtTime(40, now + 0.5);
                gain.gain.setValueAtTime(volume * 1.5, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
                osc.connect(gain);
                gain.connect(audioCtx.destination);
                osc.start(now);
                osc.stop(now + 0.65);
            }
        } catch (e) {
            console.warn("Audio synthesis error:", e);
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
     * พูดประโยคเดี่ยวและรอจนกว่าจะพูดจบ
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
                    resolve();
                }
            };

            utterance.onerror = (err) => {
                console.warn("TTS line error:", err);
                if (!hasResolved) {
                    hasResolved = true;
                    resolve();
                }
            };

            window.speechSynthesis.speak(utterance);

            // Safety timeout
            setTimeout(() => {
                if (!hasResolved) {
                    hasResolved = true;
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
            if (isSummoning) return; // ป้องกันการเรียกซ้ำ

            let currentTranscript = "";
            for (let i = event.resultIndex; i < event.results.length; i++) {
                currentTranscript += event.results[i][0].transcript;
            }

            const rawText = currentTranscript.trim();
            if (rawText) {
                transcriptText.textContent = `"${rawText}"`;
            }

            const normalizedText = normalizeSpeech(rawText);

            // ตรวจจับคำสั่ง
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
    // 6. CINEMATIC 8-SCENE TIMELINE SHOW ENGINE
    // ==========================================================================

    /**
     * รันการแสดงฉากเปิดตัวระดับตำนาน 8 ฉาก (~10-12 วินาที)
     */
    async function runCinematicSummoningShow() {
        if (isSummoning) return;
        isSummoning = true;

        // 1. หยุดรับเสียงไมค์ทันที
        stopSpeechRecognition();

        // ----------------------------------------------------------------------
        // SCENE 1: ทุกอย่างเงียบ (0s - 1s)
        // ----------------------------------------------------------------------
        document.body.className = '';
        statusDot.className = 'status-dot suspense';
        statusBadgeText.textContent = "ความเงียบสงบ";
        statusTitle.textContent = "...";
        statusEnglish.textContent = "SYSTEM SILENCE DETECTED";

        playSound('low-rumble', 0.2);
        playSound('heartbeat', 0.3);

        await delay(1000);
        if (!isSummoning) return;

        // ----------------------------------------------------------------------
        // SCENE 2: ตรวจพบสิ่งผิดปกติ (1s - 3s)
        // ----------------------------------------------------------------------
        statusBadgeText.textContent = "ตรวจพบสิ่งผิดปกติ";
        statusTitle.textContent = "ตรวจพบบางสิ่งจากอีกฝั่ง";
        statusEnglish.textContent = "ANOMALY DETECTED BEYOND THE GATE";

        await speakLine(suspenseDialogue[0], 0.72, 0.75); // "เดี๋ยวก่อน..."
        if (!isSummoning) return;
        await delay(700);

        await speakLine(suspenseDialogue[1], 0.72, 0.75); // "ระบบตรวจพบบางสิ่ง...จากอีกฝั่งของประตู"
        if (!isSummoning) return;

        // เสียงกระแทกประตูครั้งแรก
        playSound('gate-hit', 0.6);
        document.body.classList.add('scene-shake-subtle');
        await delay(500);

        // ----------------------------------------------------------------------
        // SCENE 3: สิ่งนั้นกำลังเข้ามา / ENERGY SURGE (3s - 6s)
        // ----------------------------------------------------------------------
        energyMeterContainer.classList.add('active');
        statusTitle.textContent = "ระดับพลังงานเพิ่มขึ้นอย่างรวดเร็ว";
        statusEnglish.textContent = "ENERGY LEVEL SURGING RAPIDLY";

        // Speak Line 2: "สัญญาณพลังงาน...กำลังเพิ่มขึ้นอย่างรวดเร็ว"
        const line2Promise = speakLine(suspenseDialogue[2], 0.78, 0.8);

        // Energy Meter Tick (18% -> 32% -> 51% -> 74% -> 92%)
        await animateEnergyMeter(18, 92, 2200);
        await line2Promise;

        if (!isSummoning) return;

        // ----------------------------------------------------------------------
        // SCENE 4: มีบางอย่างตอบกลับ / GROWL (6s - 8s)
        // ----------------------------------------------------------------------
        await delay(500); // ทุกอย่างหยุด 0.5s ก่อนคำราม
        
        // เล่นเสียงคำรามต่ำลึกลับ
        playSound('creature-growl', 0.7);
        playSound('gate-hit', 0.5);
        document.body.classList.add('scene-shake-medium');
        
        await delay(1000);
        if (!isSummoning) return;

        statusTitle.textContent = "มันตอบกลับมา...";
        statusEnglish.textContent = "THE ENTITY RESPONDED";
        
        await speakLine(suspenseDialogue[3], 0.75, 0.75); // "มัน...ตอบกลับมา"
        if (!isSummoning) return;
        await delay(600);

        // ----------------------------------------------------------------------
        // SCENE 5: ระบบเริ่มควบคุมไม่ได้ / WARNING EMERGENCY (8s - 10s)
        // ----------------------------------------------------------------------
        warningHud.classList.add('active');
        glitchOverlay.classList.add('active');
        magicCrackOverlay.style.opacity = '0.9';
        lightningOverlay.style.opacity = '1';

        document.body.className = 'scene-shake-violent';
        statusDot.className = 'status-dot danger';
        statusBadgeText.textContent = "เตือนภัยขั้นสูง";
        statusTitle.textContent = "พลังงานเกินขีดจำกัด!";
        statusEnglish.textContent = "CRITICAL: UNCONTROLLED GATE BREACH";

        playSound('warning', 0.4);
        playSound('magic-crack', 0.5);

        // Energy Spike 97% -> 99%
        await animateEnergyMeter(92, 99, 800);

        // พูดรวดเร็วและตื่นเต้นขึ้น (rate: 0.9)
        await speakLine(suspenseDialogue[4], 0.88, 0.85); // "พลังงานเกินขีดจำกัด"
        if (!isSummoning) return;

        await speakLine(suspenseDialogue[5], 0.9, 0.88);  // "ระบบไม่สามารถควบคุมประตูได้"
        if (!isSummoning) return;

        playSound('gate-hit', 0.9);
        await speakLine(suspenseDialogue[6], 0.95, 1.05); // "มีบางอย่าง...กำลังพยายามออกมา!"
        if (!isSummoning) return;

        // ----------------------------------------------------------------------
        // SCENE 6: FAKE COUNTDOWN (10s - 11s)
        // ----------------------------------------------------------------------
        warningHud.classList.remove('active');
        countdownHud.classList.add('active');

        for (let num = 3; num >= 1; num--) {
            if (!isSummoning) return;
            countdownDigit.textContent = num;
            playSound('countdown-beep', 0.5);
            if (num === 2) {
                playSound('creature-growl', 0.5);
            }
            await delay(700);
        }

        // ----------------------------------------------------------------------
        // SCENE 7: ความเงียบสนิทก่อนเปิดตัว (11s - 12s)
        // ----------------------------------------------------------------------
        // ตัดเสียงและ UI ทั้งหมดออกกะทันหันก่อนเลข 1 จบ!
        window.speechSynthesis.cancel();
        countdownHud.classList.remove('active');
        energyMeterContainer.classList.remove('active');
        glitchOverlay.classList.remove('active');

        // Blackout Screen
        blackoutOverlay.classList.add('active');
        document.body.className = '';

        // ความเงียบสนิท 1.0 วินาที
        await delay(1000);
        if (!isSummoning) return;

        // ----------------------------------------------------------------------
        // SCENE 8: เปิดตัวอย่างยิ่งใหญ่ (REVEAL CLIMAX)
        // ----------------------------------------------------------------------
        blackoutOverlay.classList.remove('active');
        
        // เสียง Bass Drop + Impact ตูมใหญ่
        playSound('bass-drop', 0.9);
        playSound('impact', 0.9);
        playSound('creature-growl', 0.8);

        // Flash สีขาววาบ
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
     * เล่นวิดีโอสัตว์เวทมนตร์แบบเต็มหน้าจอ
     */
    function playCreatureVideo() {
        flashOverlay.classList.remove('active');

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
                console.log("วิดีโอเปิดตัวมังกรเริ่มเล่นแล้ว");
            }).catch(err => {
                console.error("การเล่นวิดีโอล้มเหลว:", err);
                finishVideoSummoning();
            });
        }
    }

    /**
     * จบการเล่นวิดีโอ และกลับสู่หน้ารอรับคำสั่ง
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
        glitchOverlay.classList.remove('active');
        magicCrackOverlay.style.opacity = '0';
        lightningOverlay.style.opacity = '0';

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
