export class Recorder {
    #mediaRec;
    #chunks = [];
    #stream = null;
    #startTime = 0;
    #previewEl = null;

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
        try {
            this.#stream = await navigator.mediaDevices.getUserMedia({
                audio: true,
                video: { facingMode: "user" }
            });

            // Show preview
            this.#previewEl.srcObject = this.#stream;
            this.#previewEl.style.display = 'block';

            const options = { mimeType: 'video/webm' };

            this.#mediaRec = new MediaRecorder(this.#stream, options);
            this.#mediaRec.ondataavailable = e => this.#chunks.push(e.data);
            this.#mediaRec.start();
            this.#startTime = performance.now();
            return true;
        } catch (error) {
            console.error("Recording error:", error);
            return false;
        }
    }

    async stop(questionIdx, isCalibration = false) {
        return new Promise(resolve => {
            if (!this.#mediaRec) {
                resolve(null);
                return;
            }

            this.#mediaRec.onstop = () => {
                const endTime = performance.now();
                const duration = endTime - this.#startTime;

                // Stop stream and hide preview
                this.#stream.getTracks().forEach(track => track.stop());
                this.#previewEl.style.display = 'none';

                const blob = new Blob(this.#chunks, { type: this.#mediaRec.mimeType });
                const prefix = isCalibration ? 'calibration' : 'answer';
                const filename = `${prefix}_${questionIdx + 1}_${Date.now()}.${this.#getFileExtension()}`;

                // Trigger download
                const a = document.createElement('a');
                a.href = URL.createObjectURL(blob);
                a.download = filename;
                a.click();

                resolve({
                    filename,
                    duration,
                    timestamp: new Date().toISOString()
                });
            };
            this.#mediaRec.stop();
        });
    }

    #getFileExtension() {
        return 'webm';
    }
}
