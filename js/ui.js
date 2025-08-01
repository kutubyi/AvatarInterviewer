export class UI {
    constructor() {
        this.mainBtn = document.getElementById('mainBtn');
        this.question = document.getElementById('question');
        this.progress = document.getElementById('progress');
        this.loading = document.getElementById('loading');
        this.status = document.getElementById('status');
    }

    setLoading(text) { this.loading.textContent = text; }
    hideLoading() { this.loading.style.display = 'none'; }

    setQuestion(text) { this.question.textContent = text; }

    setProgress(phase, current, total) {
        this.progress.textContent = `${phase}: ${current}/${total}`;
    }

    setStatus(text) { this.status.textContent = text; }

    setBtn(label, disabled = false) {
        this.mainBtn.textContent = label;
        this.mainBtn.disabled = disabled;
    }

    onClick(cb) { this.mainBtn.addEventListener('click', cb); }
}
