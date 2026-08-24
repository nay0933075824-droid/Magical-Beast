/**
 * ==========================================================================
 * MAGICAL CREATURE SUMMONING SHOW - SUSPENSE ENGINE
 * - Zero spoiler creature reveal
 * - Multi-stage AI narration with randomized suspense delays
 * - Visual stage controller (screen shake, rotation, lightning, white flash)
 * - Dual Audio Engine (Web Audio API Synthesizer + MP3 fallback)
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
            name: "มังกร",                  // สำหรับใช้จัดการภายในเท่านั้น (ห้ามแสดงใน UI ก่อนเปิดวิดีโอ)
            command: "มังกรจงออกมา",           // คำสั่งเสียงที่ต้องการให้ระบบฟัง
            video: "dragon.mp4"
        }
    ];

    // --- State Variables ---
    let isSummoning = false;        // ตัวแปรป้องกันการอัญเชิญซ้ำขณะกำลังทำงาน
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
    const flashOverlay = document.getElementById('flashOverlay');
    const dragonVideo = document.getElementById('dragonVideo');
    const particleCanvas = document.getElementById('particleCanvas');

    // ==========================================================================
    // 2. HELPER & NORMALIZATION
    // ==========================================================================

    /**
     * ลบช่องว่างและอักขระพิเศษเพื่อเปรียบเทียบคำสั่งเสียง
     * @param {string} text
     * @returns {string}
     */
    function normalizeSpeech(text) {
        if (!text) return "";
        return text
            .toLowerCase()
            .replace(/\s+/g, "")
            .trim();
    }

    // ==========================================================================
    // 3. AUDIO SYNTHESIZER & MP3 ENGINE
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
     * โหลดและเล่นไฟล์เสียงหรือสังเคราะห์เสียงผ่าน Web Audio API
     * @param {string} soundName - ชื่อเสียง (magic-start, heartbeat, energy-rise, rumble, impact)
     * @param {number} volume - ความดังเสียง (0.0 ถึง 1.0)
     */
    function playSoundEffect(soundName, volume = 0.25) {
        initAudioContext();
        if (!audioCtx) return;

        // ลองพยายามเปิดจากไฟล์ MP3 ก่อน
        const audio = new Audio(`sounds/${soundName}.mp3`);
        audio.volume = volume;
        const playPromise = audio.play();

        if (playPromise !== undefined) {
            playPromise.catch(() => {
                // หากไฟล์ไม่มีหรือเบราว์เซอร์บล็อก ให้เล่นด้วย Web Audio API Synthesizer แทน
                synthesizeSoundEffect(soundName, volume);
            });
        }
    }

    /**
     * สังเคราะห์เสียงเอฟเฟกต์บรรยากาศในตัว (Web Audio API Synthesizer)
     */
    function synthesizeSoundEffect(type, volume = 0.25) {
        if (!audioCtx) return;
        const now = audioCtx.currentTime;

        try {
            if (type === 'magic-start') {
                // เสียงพลังงานเวทมนตร์เริ่มเปิดตัว (Ethereal Sine Chime)
                [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
                    const osc = audioCtx.createOscillator();
                    const gain = audioCtx.createGain();
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(freq, now + i * 0.08);
                    gain.gain.setValueAtTime(0.01, now + i * 0.08);
                    gain.gain.exponentialRampToValueAtTime(volume * 0.5, now + i * 0.08 + 0.05);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.9);
                    osc.connect(gain);
                    gain.connect(audioCtx.destination);
                    osc.start(now + i * 0.08);
                    osc.stop(now + i * 0.08 + 1.0);
                });
            } else if (type === 'heartbeat') {
                // เสียงจังหวะหัวใจเต้น (Double Sub-Bass Thump)
                [0, 0.22].forEach(delay => {
                    const osc = audioCtx.createOscillator();
                    const gain = audioCtx.createGain();
                    osc.type = 'triangle';
                    osc.frequency.setValueAtTime(80, now + delay);
                    osc.frequency.exponentialRampToValueAtTime(35, now + delay + 0.12);
                    gain.gain.setValueAtTime(volume * 0.9, now + delay);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.15);
                    osc.connect(gain);
                    gain.connect(audioCtx.destination);
                    osc.start(now + delay);
                    osc.stop(now + delay + 0.18);
                });
            } else if (type === 'energy-rise') {
                // เสียงพลังงานเวทมนตร์พุ่งสูงขึ้น (Pitch Sweep)
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(150, now);
                osc.frequency.exponentialRampToValueAtTime(600, now + 1.5);
                gain.gain.setValueAtTime(0.01, now);
                gain.gain.linearRampToValueAtTime(volume * 0.4, now + 1.0);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 1.6);
                osc.connect(gain);
                gain.connect(audioCtx.destination);
                osc.start(now);
                osc.stop(now + 1.6);
            } else if (type === 'rumble') {
                // เสียงสั่นสะเทือน (Low Frequency Vibrating Sub-Bass)
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(45, now);
                osc.frequency.linearRampToValueAtTime(65, now + 1.2);
                gain.gain.setValueAtTime(volume * 0.6, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);
                osc.connect(gain);
                gain.connect(audioCtx.destination);
                osc.start(now);
                osc.stop(now + 1.5);
            } else if (type === 'impact') {
                // เสียงระเบิดตูมใหญ่ Climax (Impact Sub-Boom)
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(250, now);
                osc.frequency.exponentialRampToValueAtTime(30, now + 0.4);
                gain.gain.setValueAtTime(volume, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
                osc.connect(gain);
                gain.connect(audioCtx.destination);
                osc.start(now);
                osc.stop(now + 0.85);
            }
        } catch (e) {
            console.warn("Audio synthesis note failed:", e);
        }
    }

    // ==========================================================================
    // 4. SEQUENTIAL TEXT-TO-SPEECH (Suspense Narrator)
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
     * พูดประโยคเดี่ยว และรอจนพูดจบ
     * @param {string} text - ข้อความที่ต้องพูด
     * @param {number} rate - ความเร็วเสียง
     * @param {number} pitch - ระดับความสูงเสียง
     * @returns {Promise<void>}
     */
    function speakLine(text, rate = 0.8, pitch = 0.85) {
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

            let resolved = false;

            utterance.onend = () => {
                if (!resolved) {
                    resolved = true;
                    resolve();
                }
            };

            utterance.onerror = (err) => {
                console.warn("TTS line error:", err);
                if (!resolved) {
                    resolved = true;
                    resolve();
                }
            };

            window.speechSynthesis.speak(utterance);

            // Safety fallback timeout
            setTimeout(() => {
                if (!resolved) {
                    resolved = true;
                    resolve();
                }
            }, 4500);
        });
    }

    /**
     * สุ่มเวลาหน่วงระหว่างประโยค (500ms - 900ms) เพื่อความลุ้นธรรมชาติ
     */
    function getRandomSuspenseDelay() {
        return Math.floor(Math.random() * 400) + 500; // 500..900 ms
    }

    function delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // ==========================================================================
    // 5. STAGE VISUAL CONTROLLER (setMagicStage 1..4)
    // ==========================================================================

    /**
     * ปรับเปลี่ยนระดับความอลังการบนหน้าจอ (Stage 1 ถึง Stage 4)
     * @param {number} stage - หมายเลขสเตจ (1, 2, 3, 4)
     */
    function setMagicStage(stage) {
        // ล้างสเตจเดิมก่อนหน้า
        document.body.classList.remove('stage-1', 'stage-2', 'stage-3', 'stage-4');
        statusDot.className = 'status-dot suspense';

        if (stage === 1) {
            document.body.classList.add('stage-1');
            statusTitle.textContent = "ตรวจพบพลังงานที่ไม่ทราบชนิด";
            statusEnglish.textContent = "UNKNOWN MAGICAL ENERGY DETECTED";
            playSoundEffect('magic-start', 0.25);
        } 
        else if (stage === 2) {
            document.body.classList.add('stage-2');
            statusTitle.textContent = "มีบางสิ่ง...กำลังตื่นขึ้น";
            statusEnglish.textContent = "SOMETHING IS AWAKENING...";
            playSoundEffect('heartbeat', 0.35);
        } 
        else if (stage === 3) {
            document.body.classList.add('stage-3');
            statusTitle.textContent = "ระดับพลังงานกำลังเพิ่มขึ้น";
            statusEnglish.textContent = "ENERGY LEVEL RISING";
            playSoundEffect('energy-rise', 0.3);
            playSoundEffect('rumble', 0.25);
        } 
        else if (stage === 4) {
            document.body.classList.add('stage-4');
            statusTitle.textContent = "ประตูอัญเชิญกำลังเปิด!";
            statusEnglish.textContent = "SUMMONING GATE OPENING!";
            playSoundEffect('impact', 0.85); // เสียงตูม Climax ดัง 0.85

            // เกิด Flash แสงสีขาววาบ
            flashOverlay.classList.add('active');
        }
    }

    // ==========================================================================
    // 6. SPEECH RECOGNITION (Web Speech API)
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
            if (isSummoning) return; // ป้องกันคำสั่งซ้ำ

            let currentTranscript = "";
            for (let i = event.resultIndex; i < event.results.length; i++) {
                currentTranscript += event.results[i][0].transcript;
            }

            const rawText = currentTranscript.trim();
            if (rawText) {
                transcriptText.textContent = `"${rawText}"`;
            }

            const normalizedText = normalizeSpeech(rawText);

            // ค้นหาว่าตรงกับคำสั่งอัญเชิญของสัตว์ตัวใดใน config หรือไม่
            for (const item of summons) {
                const targetCmd = normalizeSpeech(item.command);
                if (normalizedText.includes(targetCmd)) {
                    console.log("ตรวจพบคำสั่งอัญเชิญ:", rawText);
                    currentTargetVideo = item.video;
                    startSuspenseSummoningFlow();
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
    // 7. SUSPENSE SUMMONING FLOW EXECUTION
    // ==========================================================================

    /**
     * ลำดับการทำงานสร้างความลุ้นก่อนเฉลยสัตว์เวทมนตร์
     */
    async function startSuspenseSummoningFlow() {
        if (isSummoning) return;
        isSummoning = true;

        // 1. หยุด Speech Recognition ทันที เพื่อไม่ให้ฟังเสียง AI
        stopSpeechRecognition();

        // 2. Stage 1: ตรวจพบพลังงานบางอย่าง...
        setMagicStage(1);
        await speakLine("ตรวจพบพลังงานบางอย่าง...", 0.8, 0.85);

        if (!isSummoning) return; // กรณีถูกยกเลิกด้วย ESC
        await delay(getRandomSuspenseDelay());

        // 3. Stage 2: มีบางสิ่ง...กำลังตื่นขึ้น
        setMagicStage(2);
        await speakLine("มีบางสิ่ง...กำลังตื่นขึ้น", 0.8, 0.85);

        if (!isSummoning) return;
        await delay(getRandomSuspenseDelay());

        // 4. Stage 3: พลังงานกำลังเพิ่มขึ้น...
        setMagicStage(3);
        await speakLine("พลังงานกำลังเพิ่มขึ้น...", 0.8, 0.85);

        if (!isSummoning) return;
        await delay(getRandomSuspenseDelay());

        // 5. Stage 4: มัน...กำลังจะออกมา! (พูดตื่นเต้น เสียงเร็วขึ้น)
        await speakLine("มัน...กำลังจะออกมา!", 0.95, 1.05);

        if (!isSummoning) return;

        // 6. เกิด Flash แสงวาบ + Impact Sound และเปิดวิดีโอทันที
        setMagicStage(4);
        
        setTimeout(() => {
            playCreatureVideo();
        }, 300);
    }

    /**
     * เล่นวิดีโอสัตว์เวทมนตร์แบบเต็มหน้าจอ
     */
    function playCreatureVideo() {
        // ซ่อน Flash Overlay
        flashOverlay.classList.remove('active');

        // ตั้งค่าไฟล์วิดีโอ
        const sourceElem = dragonVideo.querySelector('source');
        if (sourceElem && currentTargetVideo) {
            sourceElem.src = currentTargetVideo;
            dragonVideo.load();
        }

        // เข้าสู่โหมดเล่นวิดีโอเต็มหน้าจอ
        document.body.classList.add('video-active');
        dragonVideo.classList.add('active');
        dragonVideo.currentTime = 0;

        const playPromise = dragonVideo.play();
        if (playPromise !== undefined) {
            playPromise.then(() => {
                console.log("วิดีโอสัตว์เวทมนตร์เริ่มเล่นแล้ว");
            }).catch(err => {
                console.error("การเล่นวิดีโอล้มเหลว:", err);
                finishVideoSummoning();
            });
        }
    }

    /**
     * เมื่อวิดีโอเล่นจบ กลับสู่หน้ารอฟังคำสั่ง
     */
    function finishVideoSummoning() {
        dragonVideo.pause();
        dragonVideo.classList.remove('active');
        document.body.classList.remove('video-active', 'stage-1', 'stage-2', 'stage-3', 'stage-4');
        flashOverlay.classList.remove('active');

        isSummoning = false;

        updateStatusDisplay("พร้อมรับคำสั่ง", "กำลังรอคำอัญเชิญ...", "listening");
        statusEnglish.textContent = "READY FOR SUMMONING COMMAND";
        transcriptText.textContent = '"..."';

        // เปิด Speech Recognition ใหม่อัตโนมัติ
        if (isSystemActive && recognition) {
            restartRecognitionWithDelay(400);
        }
    }

    dragonVideo.onended = () => {
        console.log("วิดีโอเล่นจบแล้ว");
        finishVideoSummoning();
    };

    // ปุ่ม ESC สำหรับหยุดวิดีโอหรือยกเลิกการอัญเชิญฉุกเฉิน
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' || e.key === 'Esc') {
            if (isSummoning || dragonVideo.classList.contains('active')) {
                console.log("กด ESC ยกเลิกอัญเชิญฉุกเฉิน");
                window.speechSynthesis.cancel();
                finishVideoSummoning();
            }
        }
    });

    // ==========================================================================
    // 8. UI CONTROLLER & BUTTONS
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
            updateStatusDisplay("เปิดใช้งานไมค์", "กำลังรอคำอัญเชิญ...", "listening");
            startBtn.querySelector('.btn-text').textContent = "ระบบเวทมนตร์ทำงานอยู่";
            startBtn.style.opacity = "0.8";
        } catch (e) {
            console.log("Recognition already active");
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
    // 9. BACKGROUND PARTICLE CANVAS ENGINE
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
