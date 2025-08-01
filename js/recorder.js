export class Recorder {
    #mediaRec;
    #chunks = [];
    #stream = null;
    #startTime = 0;
    #previewEl = null;
    #audioContext = null;
    #analyser = null;
    #silenceTimeout = null;
    #silenceCallback = null;

    constructor() {
        this.#previewEl = document.createElement('video');
        this.#previewEl.autoplay = true;
        this.#previewEl.muted = true;
        this.#previewEl.playsInline = true;
        this.#previewEl.style.cssText = `
            position: fixed;
            width: 120px;
            bottom: 10px;
            right: 10px;
            border: 2px solid red;
            display: none;
            z-index: 100;
        `;
        document.body.appendChild(this.#previewEl);
    }

    async start() {
        this.#chunks = [];

        this.#stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: { facingMode: "user" }
        });

        // Show preview
        this.#previewEl.srcObject = this.#stream;
        this.#previewEl.style.display = 'block';

        // Setup audio analysis for silence detection
        this.#setupAudioAnalysis();

        const options = { mimeType: this.#getSupportedMimeType() };
        this.#mediaRec = new MediaRecorder(this.#stream, options);
        this.#mediaRec.ondataavailable = e => this.#chunks.push(e.data);
        this.#mediaRec.start();
        this.#startTime = Date.now();

        return true;

    }

    #setupAudioAnalysis() {
        this.#audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const source = this.#audioContext.createMediaStreamSource(this.#stream);
        this.#analyser = this.#audioContext.createAnalyser();
        source.connect(this.#analyser);
        this.#analyser.fftSize = 256;
        const bufferLength = this.#analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const detectSilence = () => {
            if (!this.#analyser) return;

            this.#analyser.getByteFrequencyData(dataArray);
            let sum = 0;
            for (const amplitude of dataArray) {
                sum += amplitude;
            }
            const average = sum / bufferLength;

            // Adjust this threshold based on testing
            const isSilent = average < 10;

            if (isSilent) {
                if (!this.#silenceTimeout) {
                    this.#silenceTimeout = setTimeout(() => {
                        if (this.#silenceCallback) this.#silenceCallback();
                    }, 5000); // 5 seconds of silence
                }
            } else {
                if (this.#silenceTimeout) {
                    clearTimeout(this.#silenceTimeout);
                    this.#silenceTimeout = null;
                }
            }

            requestAnimationFrame(detectSilence);
        };

        detectSilence();
    }

    onSilenceDetected(callback) {
        this.#silenceCallback = callback;
    }

    #getSupportedMimeType() {
        const types = [
            'video/webm;codecs=vp9,opus',
            'video/webm;codecs=vp8,opus',
            'video/webm'
        ];
        return types.find(type => MediaRecorder.isTypeSupported(type)) || '';
    }

    async stop() {
        return new Promise(resolve => {
            if (!this.#mediaRec) {
                resolve(null);
                return;
            }

            this.#mediaRec.onstop = () => {
                const endTime = Date.now();
                const duration = endTime - this.#startTime;

                // Cleanup audio analysis
                if (this.#audioContext) {
                    this.#audioContext.close();
                    this.#audioContext = null;
                }
                if (this.#silenceTimeout) {
                    clearTimeout(this.#silenceTimeout);
                    this.#silenceTimeout = null;
                }
                this.#analyser = null;

                // Stop stream and hide preview
                this.#stream.getTracks().forEach(track => track.stop());
                this.#previewEl.style.display = 'none';

                const blob = new Blob(this.#chunks, { type: this.#mediaRec.mimeType });
                resolve({ blob, duration });
            };
            this.#mediaRec.stop();
        });
    }
}

