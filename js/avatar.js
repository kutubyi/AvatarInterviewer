import { TalkingHead } from 'talkinghead';

export class Avatar {
    #head;
    constructor(container) {
        this.#head = new TalkingHead(container, {
            ttsEndpoint: 'https://eu-texttospeech.googleapis.com/v1beta1/text:synthesize',
            ttsApikey: '',  
            lipsyncModules: ['en'],
            cameraView: 'upper'
        });
    }

    async load(modelUrl, onProgress) {
        await this.#head.showAvatar(
            {
                url: modelUrl,
                body: 'F',
                avatarMood: 'neutral',
                ttsLang: 'en-GB',
                ttsVoice: 'en-GB-Standard-A',
                lipsyncLang: 'en'
            },
            onProgress
        );
    }

    /** speak and resolve when done */
    speak(text) {
        return this.#head.speakText(text);
    }

    start() { this.#head.start(); }
    stop() { this.#head.stop(); }
}
