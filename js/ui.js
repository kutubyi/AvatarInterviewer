export class UI {
    constructor() {
        this.mainBtn = document.getElementById('mainBtn');
        this.question = document.getElementById('question');
        this.loading = document.getElementById('loading');
    }

    setLoading(text) { this.loading.textContent = text; }
    hideLoading() { this.loading.style.display = 'none'; }

    setQuestion(text) { this.question.textContent = text; }

    setBtn(label, disabled = false) {
        this.mainBtn.textContent = label;
        this.mainBtn.disabled = disabled;
    }

    onClick(cb) { this.mainBtn.addEventListener('click', cb); }
}
