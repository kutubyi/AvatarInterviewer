// js/ui.js
export class UI {
    constructor() {
        this.mainBtn = document.getElementById('mainBtn');
        this.replayBtn = document.getElementById('replayBtn');
        this.restartBtn = document.getElementById('restartBtn');
        this.exitBtn = document.getElementById('exitBtn');
        this.question = document.getElementById('question');
        this.loading = document.getElementById('loading');
        this.progress = document.getElementById('progress');
        this.timer = document.getElementById('timer');
    }

    setLoading(text) { this.loading.textContent = text; }
    hideLoading() { this.loading.style.display = 'none'; }

    setQuestion(text) { this.question.textContent = text; }

    setProgress(phase, current, total) {
        this.progress.textContent = `${phase}: ${current}/${total}`;
    }

    setTimer(seconds) {
        const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
        const secs = (seconds % 60).toString().padStart(2, '0');
        this.timer.textContent = `${mins}:${secs}`;
    }

    showTimer() { this.timer.style.display = 'block'; }

    hideTimer() { this.timer.style.display = 'none'; }

    setBtn(label, disabled = false) {
        this.mainBtn.textContent = label;
        this.mainBtn.disabled = disabled;
    }

    setReplayBtn(disabled) {
        this.replayBtn.disabled = disabled;
    }

    setRestartBtn(disabled) {
        this.restartBtn.disabled = disabled;
    }

    setExitBtn(disabled) {
        this.exitBtn.disabled = disabled;
    }

    onClick(cb) { this.mainBtn.addEventListener('click', cb); }

    onReplayClick(cb) {
        this.replayBtn.addEventListener('click', cb);
    }

    onRestartClick(cb) {
        this.restartBtn.addEventListener('click', cb);
    }

    onExitClick(cb) {
        this.exitBtn.addEventListener('click', cb);
    }
}
