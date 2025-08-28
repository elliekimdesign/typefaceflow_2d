class FontFlowDemo {
    constructor() {
        this.fonts = [
            'Arial', 'Helvetica', 'Times New Roman', 'Georgia', 'Verdana',
            'Trebuchet MS', 'Impact', 'Comic Sans MS', 'Courier New', 'Lucida Console',
            'Palatino', 'Garamond', 'Bookman', 'Avant Garde', 'Optima',
            'Futura', 'Gill Sans', 'Century Gothic', 'Franklin Gothic', 'Tahoma'
        ];
        
        this.currentFont = 'Arial';
        this.isAnimationPaused = false;
        this.highlightedFont = null;
        this.handTracking = null;
        this.camera = null;
        this.hoverStartTime = null;
        
        this.init();
    }
    
    init() {
        this.setupFontRows();
        this.setupEventListeners();
        this.initHandTracking();
        // Auto-start camera after initialization
        setTimeout(() => {
            this.startCamera();
        }, 1000);
    }
    
    setupFontRows() {
        const rows = ['row1', 'row2', 'row3'];
        
        rows.forEach((rowId, index) => {
            const row = document.getElementById(rowId);
            const startIndex = index * 7;
            const rowFonts = this.fonts.slice(startIndex, startIndex + 7);
            
            // Create multiple sets of fonts for continuous flow
            for (let set = 0; set < 60; set++) {
                rowFonts.forEach(font => {
                    const fontItem = this.createFontItem(font);
                    row.appendChild(fontItem);
                });
            }
            
            // Add different animation delays for each row
            row.style.animationDelay = `${index * 2}s`;
        });
    }
    
    createFontItem(fontName) {
        const item = document.createElement('div');
        item.className = 'font-item';
        item.textContent = fontName;
        item.style.fontFamily = fontName;
        item.dataset.font = fontName;
        
        // Add click event for fallback interaction
        item.addEventListener('click', () => {
            this.selectFont(fontName);
        });
        
        return item;
    }
    
    setupEventListeners() {
        
        // Keyboard shortcuts for testing
        document.addEventListener('keydown', (e) => {
            switch(e.key) {
                case ' ': // Spacebar to pause/resume
                    e.preventDefault();
                    this.toggleAnimation();
                    break;
                case 'Enter': // Enter to select highlighted font
                    if (this.highlightedFont) {
                        this.selectFont(this.highlightedFont);
                    }
                    break;
                case '1': // Test font selection
                    e.preventDefault();
                    this.selectFont('Arial');
                    break;
                case '2':
                    e.preventDefault();
                    this.selectFont('Comic Sans MS');
                    break;
                case '3':
                    e.preventDefault();
                    this.selectFont('Times New Roman');
                    break;
            }
        });
    }
    
    async initHandTracking() {
        try {
            this.hands = new Hands({
                locateFile: (file) => {
                    return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
                }
            });
            
            this.hands.setOptions({
                maxNumHands: 1,
                modelComplexity: 1,
                minDetectionConfidence: 0.5,
                minTrackingConfidence: 0.5
            });
            
            this.hands.onResults((results) => this.onHandResults(results));
            
            console.log('Hand tracking initialized');
        } catch (error) {
            console.error('Error initializing hand tracking:', error);
            this.updateStatus('Hand tracking initialization failed');
        }
    }
    
    async startCamera() {
        try {
            const video = document.getElementById('video');
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { 
                    width: 1280, 
                    height: 720,
                    facingMode: 'user'
                } 
            });
            
            video.srcObject = stream;
            
            this.camera = new Camera(video, {
                onFrame: async () => {
                    if (this.hands) {
                        await this.hands.send({ image: video });
                    }
                },
                width: 1280,
                height: 720
            });
            
            await this.camera.start();
            this.updateStatus('Ready! Make a fist to pause, point to select fonts', 'active');
            
        } catch (error) {
            console.error('❌ Camera access failed:', error);
            this.updateStatus('Camera access denied or not available');
        }
    }
    
    stopCamera() {
        if (this.camera) {
            this.camera.stop();
        }
        
        const video = document.getElementById('video');
        if (video.srcObject) {
            const tracks = video.srcObject.getTracks();
            tracks.forEach(track => track.stop());
            video.srcObject = null;
        }
        
        this.updateStatus('Camera stopped');
        this.clearHandOverlay();
    }
    
    onHandResults(results) {
        console.log('👋 Hand detection results:', results.multiHandLandmarks ? results.multiHandLandmarks.length : 0);
        
        if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
            const landmarks = results.multiHandLandmarks[0];
            console.log('✅ Hand detected! Processing gestures...');
            this.processHandGestures(landmarks);
            this.updateStatus('Hand detected - Tracking gestures', 'tracking');
        } else {
            // Only clear overlay when no hand is detected for a short time
            setTimeout(() => {
                if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
                    this.clearHandOverlay();
                }
            }, 100);
            this.updateStatus('Camera active - No hand detected', 'active');
        }
    }
    
    processHandGestures(landmarks) {
        // Get key landmarks
        const indexTip = landmarks[8];  // Index finger tip
        const indexPip = landmarks[6];  // Index finger PIP joint
        const middleTip = landmarks[12]; // Middle finger tip
        const middlePip = landmarks[10]; // Middle finger PIP joint
        const thumbTip = landmarks[4];   // Thumb tip
        const wrist = landmarks[0];      // Wrist
        
        // Filter to only detect hands in front of screen (not holding camera)
        // Calculate hand size based on wrist to middle finger distance
        const handSize = Math.sqrt(
            Math.pow(middleTip.x - wrist.x, 2) + 
            Math.pow(middleTip.y - wrist.y, 2)
        );
        
        // More lenient filtering - only exclude obvious camera-holding hands
        const isNotAtEdge = indexTip.x >= 0.05 && indexTip.x <= 0.95 && 
                           indexTip.y >= 0.05 && indexTip.y <= 0.95;
        
        // Only exclude extremely large hands (very close to camera)
        const isNotTooClose = handSize <= 0.3;
        
        // Allow most hands through, only filter out obvious camera-holding cases
        if (!isNotAtEdge || !isNotTooClose) {
            return; // Skip processing this hand
        }
        
        // Convert normalized coordinates to screen coordinates with better mapping
        // Adjust the mapping to be more responsive and natural
        const screenX = (1 - indexTip.x) * window.innerWidth; // Flip horizontally for mirror effect
        const screenY = (indexTip.y - 0.1) * window.innerHeight * 1.2; // Shift up and scale for better range
        
        // Always show hand position (both when paused and flowing)
        this.showHandPosition(screenX, screenY);
        
        // Get additional landmarks for finger detection
        const ringPip = landmarks[14];
        const pinkyPip = landmarks[18];
        
        // Compare finger tips to their PIP joints (more reliable)
        const isIndexUp = indexTip.y < indexPip.y;
        const isMiddleUp = middleTip.y < middlePip.y;
        const ringTip = landmarks[16];
        const isRingUp = ringTip.y < ringPip.y;
        const pinkyTip = landmarks[20];
        const isPinkyUp = pinkyTip.y < pinkyPip.y;
        
        // Fist: All fingers down
        const isFist = !isIndexUp && !isMiddleUp && !isRingUp && !isPinkyUp;
        // Open hand: more lenient - any 2+ fingers up OR 3+ fingers up
        const fingersUp = [isIndexUp, isMiddleUp, isRingUp, isPinkyUp].filter(Boolean).length;
        const isOpenHand = fingersUp >= 2;
        // Pointing: only index finger up
        const isPointing = isIndexUp && !isMiddleUp && !isRingUp && !isPinkyUp;
        
        console.log('🖐️ DETAILED GESTURE:', { 
            '🎯 RESULT': {
                isFist: isFist ? '✊ FIST DETECTED' : '❌ NOT FIST',
                animationPaused: this.isAnimationPaused ? '⏸️ PAUSED' : '▶️ PLAYING'
            },
            '👆 FINGERS': {
                index: isIndexUp ? '☝️ UP' : '👇 DOWN',
                middle: isMiddleUp ? '☝️ UP' : '👇 DOWN', 
                ring: isRingUp ? '☝️ UP' : '👇 DOWN',
                pinky: isPinkyUp ? '☝️ UP' : '👇 DOWN',
                total: `${fingersUp}/4 UP`
            },
            '🔍 FIST CHECK': {
                indexDown: !isIndexUp ? '✅' : '❌',
                middleDown: !isMiddleUp ? '✅' : '❌',
                ringDown: !isRingUp ? '✅' : '❌',
                pinkyDown: !isPinkyUp ? '✅' : '❌'
            }
        });
        
        // ANIMATION CONTROL - Fist OR pointing pauses, only open hand resumes
        if (isFist || isPointing) {
            // Pause animation when fist or pointing is detected
            if (!this.isAnimationPaused) {
                this.pauseAnimation();
                const gestureType = isFist ? 'Fist' : 'Pointing';
                this.updateStatus(`${gestureType} detected - Animation paused`, 'tracking');
            }
        } else if (fingersUp >= 1 && !isPointing) {
            // Resume animation when opening hand (any finger up except pointing)
            if (this.isAnimationPaused) {
                this.resumeAnimation();
                this.clearAllSelections(); // Only clear font selections, not cursor
                this.updateStatus('Hand opened - Animation resumed', 'active');
            }
        }
        
        // Font selection by hovering red dot (hand position)
        if (this.isAnimationPaused) {
            const fontAtPosition = this.getFontAtPosition(screenX, screenY);
            if (fontAtPosition) {
                this.highlightFont(fontAtPosition);
                
                // INSTANT PREVIEW - Apply font immediately when hovering
                this.previewFont(fontAtPosition);
                
                // Auto-select after hovering for 0.3 seconds
                if (this.highlightedFont === fontAtPosition) {
                    if (!this.hoverStartTime) {
                        this.hoverStartTime = Date.now();
                        this.updateStatus(`Previewing ${fontAtPosition} - Hold to select`, 'tracking');
                    } else {
                        const elapsed = Date.now() - this.hoverStartTime;
                        if (elapsed > 300) {
                            this.selectFont(fontAtPosition);
                            this.hoverStartTime = null;
                            this.updateStatus(`Font ${fontAtPosition} selected!`, 'active');
                        } else {
                            const progress = Math.round((elapsed / 300) * 100);
                            this.updateStatus(`Selecting ${fontAtPosition}... ${progress}%`, 'tracking');
                        }
                    }
                } else {
                    this.hoverStartTime = null;
                }
            } else {
                this.hoverStartTime = null;
                // Clear highlight if not hovering over any font
                if (this.highlightedFont) {
                    document.querySelectorAll('.font-item.highlighted').forEach(item => {
                        item.classList.remove('highlighted');
                    });
                    this.highlightedFont = null;
                }
            }
        } else {
            this.hoverStartTime = null;
        }
    }
    
    showHandPosition(x, y) {
        const overlay = document.getElementById('handOverlay');
        let handPoint = overlay.querySelector('.hand-point');
        
        if (!handPoint) {
            handPoint = document.createElement('div');
            handPoint.className = 'hand-point';
            overlay.appendChild(handPoint);
        }
        
        // Clamp coordinates to screen bounds for better visibility
        const clampedX = Math.max(0, Math.min(x, window.innerWidth - 40));
        const clampedY = Math.max(0, Math.min(y, window.innerHeight - 40));
        
        handPoint.style.left = `${clampedX}px`;
        handPoint.style.top = `${clampedY}px`;
    }
    
    clearHandOverlay() {
        const overlay = document.getElementById('handOverlay');
        overlay.innerHTML = '';
    }
    
    clearAllSelections() {
        // Clear all highlighted and selected states
        document.querySelectorAll('.font-item.highlighted').forEach(item => {
            item.classList.remove('highlighted');
        });
        document.querySelectorAll('.font-item.selected').forEach(item => {
            item.classList.remove('selected');
        });
        
        // Reset selection tracking variables
        this.highlightedFont = null;
        this.hoverStartTime = null;
    }
    
    getFontAtPosition(x, y) {
        const elements = document.elementsFromPoint(x, y);
        const fontItem = elements.find(el => el.classList.contains('font-item'));
        return fontItem ? fontItem.dataset.font : null;
    }
    
    highlightFont(fontName) {
        // Remove previous highlight
        document.querySelectorAll('.font-item.highlighted').forEach(item => {
            item.classList.remove('highlighted');
        });
        
        // Add highlight to current font
        document.querySelectorAll(`[data-font="${fontName}"]`).forEach(item => {
            item.classList.add('highlighted');
        });
        
        this.highlightedFont = fontName;
    }
    
    previewFont(fontName) {
        // Apply font immediately for preview (without permanent selection)
        const sampleText = document.getElementById('sampleText');
        const fontNameDisplay = document.getElementById('fontNameDisplay');
        
        if (sampleText) {
            sampleText.style.fontFamily = `"${fontName}", sans-serif`;
        }
        
        if (fontNameDisplay) {
            fontNameDisplay.textContent = fontName;
        }
        
        console.log('👀 Previewing font:', fontName);
    }
    
    selectFont(fontName) {
        console.log('Selecting font:', fontName);
        
        // Remove all highlights and selections
        document.querySelectorAll('.font-item').forEach(item => {
            item.classList.remove('highlighted', 'selected');
        });
        
        // Add selection effect
        document.querySelectorAll(`[data-font="${fontName}"]`).forEach(item => {
            item.classList.add('selected');
        });
        
        // Apply font to sample text
        const sampleText = document.getElementById('sampleText');
        const fontNameDisplay = document.getElementById('fontNameDisplay');
        if (sampleText) {
            sampleText.style.fontFamily = `"${fontName}", sans-serif`;
            console.log('Font applied to Hello World:', fontName);
        } else {
            console.error('Sample text element not found!');
        }
        
        // Update font name display
        if (fontNameDisplay) {
            fontNameDisplay.textContent = fontName;
        }
        
        this.currentFont = fontName;
        this.highlightedFont = null;
        
        // Show selection feedback
        this.updateStatus(`Font selected: ${fontName}`, 'active');
        
        // Remove selection effect after animation
        setTimeout(() => {
            document.querySelectorAll('.font-item.selected').forEach(item => {
                item.classList.remove('selected');
            });
        }, 500);
    }
    
    pauseAnimation() {
        document.querySelectorAll('.font-row').forEach(row => {
            row.classList.add('paused');
        });
        this.isAnimationPaused = true;
    }
    
    resumeAnimation() {
        document.querySelectorAll('.font-row').forEach(row => {
            row.classList.remove('paused');
        });
        this.isAnimationPaused = false;
        this.highlightedFont = null;
        
        // Clear highlights
        document.querySelectorAll('.font-item.highlighted').forEach(item => {
            item.classList.remove('highlighted');
        });
    }
    
    toggleAnimation() {
        if (this.isAnimationPaused) {
            this.resumeAnimation();
        } else {
            this.pauseAnimation();
        }
    }
    
    updateStatus(message, type = '') {
        const status = document.getElementById('status');
        status.textContent = message;
        status.className = `status-indicator ${type}`;
    }
}

// Initialize the demo when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new FontFlowDemo();
});

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        // Pause animations when tab is not visible
        document.querySelectorAll('.font-row').forEach(row => {
            row.style.animationPlayState = 'paused';
        });
    } else {
        // Resume animations when tab becomes visible
        document.querySelectorAll('.font-row').forEach(row => {
            row.style.animationPlayState = 'running';
        });
    }
});
