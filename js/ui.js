export class UI {
    constructor() {
        this.mainBtn = document.getElementById('mainBtn');
        this.question = document.getElementById('question');
        this.loading = document.getElementById('loading');
        this.progress = document.getElementById('progress'); 
    }

    setLoading(text) { this.loading.textContent = text; }
    hideLoading() { this.loading.style.display = 'none'; }

    setQuestion(text) { this.question.textContent = text; }

    setProgress(phase, current, total) {
        this.progress.textContent = `${phase}: ${current}/${total}`;
    }

    setBtn(label, disabled = false) {
        this.mainBtn.textContent = label;
        this.mainBtn.disabled = disabled;
    }

    onClick(cb) { this.mainBtn.addEventListener('click', cb); }
}
