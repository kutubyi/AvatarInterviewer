import { questions } from './questions.js';
import { Avatar } from './avatar.js';
import { Recorder } from './recorder.js';
import { UI } from './ui.js';

const ui = new UI();
const avatar = new Avatar(document.getElementById('avatar'));
const recorder = new Recorder();

let qIndex = 0;
let awaitingAnswer = false;

await avatar.load(
    'https://models.readyplayer.me/64bfa15f0e72c63d7c3934a6.glb?morphTargets=ARKit,Oculus+Visemes,mouthOpen,mouthSmile,eyesClosed,eyesLookUp,eyesLookDown&textureSizeLimit=1024&textureFormat=png',
    ev => ev.lengthComputable && ui.setLoading(`Loading ${Math.round(ev.loaded / ev.total * 100)}%`)
);
ui.hideLoading();
ui.setBtn('Start ▶︎');

ui.onClick(handleClick);
document.addEventListener('visibilitychange', () =>
    document.visibilityState === 'visible' ? avatar.start() : avatar.stop()
);

async function handleClick() {
    if (awaitingAnswer) {
        // user just finished answering
        await recorder.stop(qIndex);
        awaitingAnswer = false;
        qIndex++;

        if (qIndex >= questions.length) {
            ui.setQuestion('Interview done 🎉');
            ui.setBtn('Done', true);
            return;
        }

        ui.setQuestion('(ready for next question)');
        ui.setBtn('Next Question ▶︎');
        return;
    }

    // ask question
    const qText = questions[qIndex];
    ui.setQuestion(qText);
    ui.setBtn('Speaking…', true);

    await avatar.speak(qText);
    await recorder.start();

    awaitingAnswer = true;
    ui.setBtn(qIndex === questions.length - 1 ? 'Finish Interview ⏹︎'
        : 'Finish Answer ⏹︎');
}
