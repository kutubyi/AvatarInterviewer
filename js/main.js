import { calibration, questions } from './questions.js';
import { Avatar } from './avatar.js';
import { Recorder } from './recorder.js';
import { UI } from './ui.js';

const ui = new UI();
const avatar = new Avatar(document.getElementById('avatar'));
const recorder = new Recorder();

// Session metadata
const sessionData = {
    startTime: new Date().toISOString(),
    calibration: [],
    interview: []
};

let currentPhase = 'calibration'; // 'calibration' or 'interview'
let qIndex = 0;
let awaitingAnswer = false;

// Initialize
(async () => {
    await avatar.load(
        'https://models.readyplayer.me/64bfa15f0e72c63d7c3934a6.glb?morphTargets=ARKit,Oculus+Visemes,mouthOpen,mouthSmile,eyesClosed,eyesLookUp,eyesLookDown&textureSizeLimit=1024&textureFormat=png',
        ev => ev.lengthComputable && ui.setLoading(`Loading ${Math.round(ev.loaded / ev.total * 100)}%`)
    );

    ui.hideLoading();
    ui.setProgress(0, calibration.length + questions.length);
    ui.setBtn('Start Calibration ▶︎');

    ui.onClick(handleClick);
    document.addEventListener('visibilitychange', () =>
        document.visibilityState === 'visible' ? avatar.start() : avatar.stop()
    );
})();

async function handleClick() {
    if (awaitingAnswer) {
        // User finished answering
        await finishRecording();
    } else {
        // Start new question/calibration
        await startRecording();
    }
}

async function startRecording() {
    let prompt;
    let isCalibration = currentPhase === 'calibration';

    if (isCalibration) {
        prompt = calibration[qIndex];
        ui.setBtn('Speaking...', true);
    } else {
        prompt = questions[qIndex];
        ui.setBtn('Speaking...', true);
    }

    ui.setQuestion(prompt);


    await avatar.speak(prompt);
    const recordingStarted = await recorder.start();

    if (recordingStarted) {
        awaitingAnswer = true;
        ui.setBtn(isCalibration ? 'Finish Calibration ⏹︎' :
            (qIndex === questions.length - 1 ?
                'Finish Interview ⏹︎' : 'Finish Answer ⏹︎'));
    } else {
        ui.setBtn('Start Failed.');
    }

}

async function finishRecording() {
    const isCalibration = currentPhase === 'calibration';
    ui.setBtn('Processing...', true);

    const recordingData = await recorder.stop(qIndex, isCalibration);

    if (recordingData) {
        const entry = {
            index: qIndex,
            prompt: isCalibration ? calibration[qIndex] : questions[qIndex],
            ...recordingData
        };

        if (isCalibration) {
            sessionData.calibration.push(entry);
        } else {
            sessionData.interview.push(entry);
        }
    }

    qIndex++;
    awaitingAnswer = false;

    // Check phase transitions
    if (isCalibration && qIndex >= calibration.length) {
        currentPhase = 'interview';
        qIndex = 0;
        ui.setQuestion('Calibration complete. Ready for first interview question.');
        ui.setBtn('Start Interview ▶︎');
    }
    else if (!isCalibration && qIndex >= questions.length) {
        ui.setQuestion('Interview complete! Thank you.');
        ui.setBtn('Done', true);
        saveSessionData();
        return;
    }
    else {
        ui.setQuestion('(ready for next)');
        ui.setBtn(isCalibration ? 'Next Calibration ▶︎' : 'Next Question ▶︎');
    }

    // Update progress
    const total = calibration.length + questions.length;
    const completed = currentPhase === 'calibration' ?
        qIndex : calibration.length + qIndex;
    ui.setProgress(completed, total);
}

function saveSessionData() {
    const blob = new Blob([JSON.stringify(sessionData, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `session_${sessionData.startTime.replace(/[:.]/g, '-')}.json`;
    a.click();
}
