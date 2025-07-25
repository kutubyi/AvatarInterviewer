export class Recorder {
    #mediaRec;
    #chunks = [];

    async start() {
        this.#chunks = [];
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        this.#mediaRec = new MediaRecorder(stream);
        this.#mediaRec.ondataavailable = e => this.#chunks.push(e.data);
        this.#mediaRec.start();
    }

    stop(questionIdx) {
        return new Promise(res => {
            this.#mediaRec.onstop = () => {
                const blob = new Blob(this.#chunks, { type: 'audio/webm' });
                // 👉 upload here or trigger download
                const a = document.createElement('a');
                a.href = URL.createObjectURL(blob);
                a.download = `answer_${questionIdx + 1}.webm`;
                a.click();
                res(blob);
            };
            this.#mediaRec.stop();
        });
    }
}
