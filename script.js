/**
 * ==========================================================================
 * MAGICAL DRAGON SUMMONING SYSTEM
 * - Web Speech API (th-TH) recognition & normalization
 * - SpeechSynthesisUtterance (th-TH) Text-to-Speech
 * - Fullscreen video controller with auto-restart recognition
 * ==========================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
    // --- State Variables ---
    let isSummoning = false;        // ป้องกันการเรียกคำสั่งซ้ำขณะกำลังอัญเชิญ
    let isSystemActive = false;     // สถานะว่าผู้ใช้เปิดระบบเวทมนตร์แล้วหรือยัง
    let recognition = null;         // ตัวแปร SpeechRecognition
    let ttsVoice = null;            // เสียงพากย์ภาษาไทย
    let isFullscreenMode = false;   // สถานะ Fullscreen

    // --- DOM Elements ---
    const mainContainer = document.getElementById('mainContainer');
    const magicCircleWrapper = document.getElementById('magicCircleWrapper');
    const coreNode = document.getElementById('coreNode');
    const statusDot = document.getElementById('statusDot');
    const statusBadgeText = document.getElementById('statusBadgeText');
    const statusText = document.getElementById('statusText');
    const transcriptText = document.getElementById('transcriptText');
    const startBtn = document.getElementById('startBtn');
    const fullscreenBtn = document.getElementById('fullscreenBtn');
    const summonPortalOverlay = document.getElementById('summonPortalOverlay');
    const portalTitle = document.getElementById('portalTitle');
    const dragonVideo = document.getElementById('dragonVideo');
    const particleCanvas = document.getElementById('particleCanvas');

    // ==========================================================================
    // 1. HELPER FUNCTIONS & NORMALIZATION
    // ==========================================================================

    /**
     * ลบช่องว่าง และเปลี่ยนเป็นอักษรตัวพิมพ์เล็กเพื่อเปรียบเทียบคำสั่งเสียง
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

    // คำสั่งเป้าหมายในการอัญเชิญมังกร (หลังจาก normalize แล้ว)
    const TARGET_COMMAND = normalizeSpeech("มังกรจงออกมา");

    // ==========================================================================
    // 2. AUDIO SYNTHESIZER (Web Audio API Magic SFX)
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
     * เล่นเสียงเอฟเฟกต์เวทมนตร์ (Magic Chime SFX)
     */
    function playMagicSound() {
        try {
            initAudioContext();
            if (!audioCtx) return;

            const now = audioCtx.currentTime;
            
            // Bright chime notes (E5, G#5, B5, E6)
            const freqs = [659.25, 830.61, 987.77, 1318.51];
            freqs.forEach((freq, idx) => {
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, now + idx * 0.08);
                
                gain.gain.setValueAtTime(0.01, now + idx * 0.08);
                gain.gain.exponentialRampToValueAtTime(0.2, now + idx * 0.08 + 0.04);
                gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.8);

                osc.connect(gain);
                gain.connect(audioCtx.destination);

                osc.start(now + idx * 0.08);
                osc.stop(now + idx * 0.08 + 0.85);
            });
        } catch (e) {
            console.warn("Audio Context sound effect failed:", e);
        }
    }

    // ==========================================================================
    // 3. TEXT-TO-SPEECH (SpeechSynthesisUtterance)
    // ==========================================================================
    
    function loadTTSVoices() {
        if ('speechSynthesis' in window) {
            const voices = window.speechSynthesis.getVoices();
            // ค้นหาเสียงภาษาไทย
            ttsVoice = voices.find(v => v.lang.includes('th') || v.lang.includes('TH')) || null;
        }
    }

    if ('speechSynthesis' in window) {
        window.speechSynthesis.onvoiceschanged = loadTTSVoices;
        loadTTSVoices();
    }

    /**
     * ให้ AI พูดข้อความ "กำลังอัญเชิญ มังกร"
     * @param {Function} onEndCallback - ทำงานเมื่อ AI พูดจบ
     */
    function speakSummoningAnnouncement(onEndCallback) {
        if (!('speechSynthesis' in window)) {
            console.warn("SpeechSynthesis ไม่รองรับในเบราว์เซอร์นี้");
            if (onEndCallback) onEndCallback();
            return;
        }

        // ยกเลิกการพูดเดิมก่อนหน้า (ถ้ามี)
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance("กำลังอัญเชิญ มังกร");
        utterance.lang = "th-TH";
        utterance.rate = 0.85;
        utterance.pitch = 0.9;
        
        if (ttsVoice) {
            utterance.voice = ttsVoice;
        }

        let hasTriggered = false;

        // เมื่อ AI พูดจบ
        utterance.onend = () => {
            if (!hasTriggered) {
                hasTriggered = true;
                if (onEndCallback) onEndCallback();
            }
        };

        // จัดการกรณีเกิดข้อผิดพลาด ให้ข้ามไปเล่นวิดีโอทันที
        utterance.onerror = (err) => {
            console.error("SpeechSynthesis error:", err);
            if (!hasTriggered) {
                hasTriggered = true;
                if (onEndCallback) onEndCallback();
            }
        };

        // สั่งให้ AI พูดออกลำโพง
        window.speechSynthesis.speak(utterance);

        // Fallback เพื่อความชัวร์ หาก event onend ไม่ถูกเรียกภายใน 5 วินาที
        setTimeout(() => {
            if (!hasTriggered) {
                hasTriggered = true;
                if (onEndCallback) onEndCallback();
            }
        }, 5000);
    }

    // ==========================================================================
    // 4. SPEECH RECOGNITION (Web Speech API)
    // ==========================================================================

    function initSpeechRecognition() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

        if (!SpeechRecognition) {
            alert("เบราว์เซอร์ของคุณไม่รองรับ Web Speech API กรุณาใช้ Google Chrome หรือ Microsoft Edge");
            updateStatusDisplay("ไม่รองรับการฟังเสียง", "เบราว์เซอร์ไม่รองรับ SpeechRecognition");
            return false;
        }

        recognition = new SpeechRecognition();
        recognition.lang = "th-TH";
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.maxAlternatives = 1;

        // เมื่อเริ่มฟังเสียง
        recognition.onstart = () => {
            if (!isSummoning) {
                updateStatusDisplay("กำลังฟังเสียง...", "กำลังรอคำอัญเชิญ...", "listening");
                magicCircleWrapper.classList.add('listening');
            }
        };

        // ได้ยินเสียงและแปลข้อความ
        recognition.onresult = (event) => {
            if (isSummoning) return; // ห้ามรับคำสั่งใหม่ขณะอัญเชิญ

            let currentTranscript = "";
            for (let i = event.resultIndex; i < event.results.length; i++) {
                currentTranscript += event.results[i][0].transcript;
            }

            const rawText = currentTranscript.trim();
            if (rawText) {
                transcriptText.textContent = `"${rawText}"`;
            }

            const normalizedText = normalizeSpeech(rawText);

            // ตรวจจับคำสั่ง "มังกรจงออกมา" หรือ "มังกร จงออกมา"
            if (normalizedText.includes(TARGET_COMMAND)) {
                console.log("ตรวจพบคำอัญเชิญ:", rawText);
                handleSummonCommand();
            }
        };

        // เมื่อเกิดข้อผิดพลาด
        recognition.onerror = (event) => {
            console.warn("Speech Recognition Error:", event.error);
            if (event.error === 'no-speech') return;
            
            // หากเกิด error และไม่ได้กำลังอัญเชิญ ให้พยายามเริ่มใหม่
            if (isSystemActive && !isSummoning) {
                restartRecognitionWithDelay(1000);
            }
        };

        // เมื่อระบบฟังเสียงหยุดลงอัตโนมัติ
        recognition.onend = () => {
            magicCircleWrapper.classList.remove('listening');
            // หากไม่ได้กำลังเล่นวิดีโออัญเชิญ ให้รีสตาร์ทฟังเสียงต่อ
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
                } catch (e) {
                    // หากยังทำงานอยู่แล้ว ให้ข้าม
                }
            }
        }, ms);
    }

    /**
     * หยุดฟังเสียงชั่วคราวเพื่อป้องกันไมโครโฟนได้ยินเสียง AI หรือเสียงวิดีโอ
     */
    function stopSpeechRecognition() {
        if (recognition) {
            try {
                recognition.stop();
                recognition.abort();
            } catch (e) {
                console.log("Stop recognition:", e);
            }
        }
        magicCircleWrapper.classList.remove('listening');
    }

    // ==========================================================================
    // 5. SUMMONING FLOW EXECUTION
    // ==========================================================================

    /**
     * ประมวลผลคำสั่งอัญเชิญมังกร
     */
    function handleSummonCommand() {
        // ป้องกันการเปิดซ้ำ
        if (isSummoning) return;
        isSummoning = true;

        // 1. หยุด Speech Recognition ทันที เพื่อไม่ให้ได้ยินเสียง AI ตัวเอง
        stopSpeechRecognition();

        // 2. เล่นเสียงเอฟเฟกต์เวทมนตร์
        playMagicSound();

        // 3. ปรับเปลี่ยนสถานะหน้าจอ
        updateStatusDisplay("ตรวจพบคำอัญเชิญ", "ตรวจพบคำอัญเชิญ", "summoning");
        magicCircleWrapper.classList.add('summoning');

        // 4. แสดงเอฟเฟกต์ประตูเวทมนตร์
        setTimeout(() => {
            updateStatusDisplay("กำลังอัญเชิญ", "กำลังเปิดประตูเวทมนตร์...", "summoning");
            summonPortalOverlay.classList.add('active');
            portalTitle.textContent = "กำลังเปิดประตูเวทมนตร์...";
        }, 500);

        // 5. AI พูดออกลำโพง “กำลังอัญเชิญ มังกร”
        // เมื่อ AI พูดจบแล้ว จึงค่อยเปิด dragon.mp4
        speakSummoningAnnouncement(() => {
            playDragonVideo();
        });
    }

    /**
     * เปิดวิดีโอ dragon.mp4 แบบเต็มหน้าจอ
     */
    function playDragonVideo() {
        // ซ่อน Portal Overlay
        summonPortalOverlay.classList.remove('active');
        magicCircleWrapper.classList.remove('summoning');

        // เข้าสู่โหมดเล่นวิดีโอ
        document.body.classList.add('video-active');
        dragonVideo.classList.add('active');

        // รีเซ็ตเวลาวิดีโอและเริ่มเล่น
        dragonVideo.currentTime = 0;
        
        const playPromise = dragonVideo.play();
        if (playPromise !== undefined) {
            playPromise.then(() => {
                console.log("วิดีโอมังกรเริ่มเล่นแล้ว");
            }).catch(err => {
                console.error("การเล่นวิดีโอล้มเหลว:", err);
                // หากออโต้เพลย์โดนบล็อก ให้จบการอัญเชิญและกลับหน้าหลัก
                finishVideoSummoning();
            });
        }
    }

    /**
     * เมื่อวิดีโอเล่นจบแล้ว ให้กลับสู่หน้ารอรับคำสั่ง
     */
    function finishVideoSummoning() {
        // หยุดและซ่อนวิดีโอ
        dragonVideo.pause();
        dragonVideo.classList.remove('active');
        document.body.classList.remove('video-active');

        // คืนค่าตัวแปรป้องกันการเปิดซ้ำ
        isSummoning = false;

        // อัปเดตสถานะหน้าจอ
        updateStatusDisplay("พร้อมรับคำสั่ง", "กำลังรอคำอัญเชิญ...", "listening");
        transcriptText.textContent = '"..."';

        // เปิด Speech Recognition ใหม่อัตโนมัติ
        if (isSystemActive && recognition) {
            restartRecognitionWithDelay(400);
        }
    }

    // เมื่อวิดีโอ dragon.mp4 เล่นจบ
    dragonVideo.onended = () => {
        console.log(" dragon.mp4 เล่นจบแล้ว");
        finishVideoSummoning();
    };

    // ปุ่ม ESC สำหรับหยุดวิดีโอฉุกเฉิน
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' || e.key === 'Esc') {
            if (isSummoning || dragonVideo.classList.contains('active')) {
                console.log("กด ESC หยุดวิดีโอฉุกเฉิน");
                window.speechSynthesis.cancel();
                summonPortalOverlay.classList.remove('active');
                finishVideoSummoning();
            }
        }
    });

    // ==========================================================================
    // 6. UI UPDATE & BUTTON LISTENERS
    // ==========================================================================

    function updateStatusDisplay(badge, text, stateClass = 'active') {
        statusBadgeText.textContent = badge;
        statusText.textContent = text;

        statusDot.className = 'status-dot';
        if (stateClass) {
            statusDot.classList.add(stateClass);
        }
    }

    // กดปุ่ม "เริ่มระบบเวทมนตร์"
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
            console.log("Recognition already started");
        }
    });

    // กดปุ่ม "เข้าสู่โหมดงานแสดง" (Fullscreen)
    fullscreenBtn.addEventListener('click', () => {
        toggleFullscreen();
    });

    function toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().then(() => {
                isFullscreenMode = true;
                fullscreenBtn.querySelector('.btn-text').textContent = "ออกจากโหมดงานแสดง";
            }).catch(err => {
                console.warn("ไม่สามารถเข้าสู่ Fullscreen:", err);
            });
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen().then(() => {
                    isFullscreenMode = false;
                    fullscreenBtn.querySelector('.btn-text').textContent = "เข้าสู่โหมดงานแสดง";
                });
            }
        }
    }



    // ==========================================================================
    // 7. BACKGROUND PARTICLE CANVAS ENGINE
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
