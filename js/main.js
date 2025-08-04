// js/main.js
import { calibration, questions } from './questions.js';
import { Avatar } from './avatar.js';
import { Recorder } from './recorder.js';
import { UI } from './ui.js';

const ui = new UI();
const avatar = new Avatar(document.getElementById('avatar'));
const recorder = new Recorder();

// Session metadata
let sessionData = {
    startTime: new Date().toISOString(),
    calibration: [],
    interview: []
};

let currentPhase = 'calibration'; // 'calibration' or 'interview'
let qIndex = 0;
let awaitingAnswer = false;
let currentPrompt = '';

let timerInterval = null;
let elapsedSeconds = 0;
let isReplaying = false;

// Initialize
(async () => {
    await avatar.load(
        '/assets/doctor.glb',
        ev => ev.lengthComputable && ui.setLoading(`Loading ${Math.round(ev.loaded / ev.total * 100)}%`)
    );

    ui.hideLoading();
    resetUI();

    ui.onClick(handleClick);
    ui.onReplayClick(handleReplayClick);
    ui.onRestartClick(handleRestartClick);
    ui.onExitClick(handleExitClick);

    document.addEventListener('visibilitychange', () =>
        document.visibilityState === 'visible' ? avatar.start() : avatar.stop()
    );
})();

function resetUI() {
    ui.setProgress('Calibration', 0, calibration.length);
    ui.setBtn('Start Calibration ▶︎');
    ui.setReplayBtn(true);
    ui.setRestartBtn(false);
    ui.setExitBtn(false);
    ui.setQuestion('(ready)');
    ui.hideTimer();
}

function resetSession() {
    stopTimer();
    recorder.stop(); // Stop any ongoing recording
    awaitingAnswer = false;
    isReplaying = false;
    qIndex = 0;
    currentPhase = 'calibration';
    sessionData = {
        startTime: new Date().toISOString(),
        calibration: [],
        interview: []
    };
    resetUI();
}

function startTimer() {
    elapsedSeconds = 0;
    ui.setTimer(0);
    ui.showTimer();

    timerInterval = setInterval(() => {
        elapsedSeconds++;
        ui.setTimer(elapsedSeconds);
    }, 1000);
}

function stopTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    ui.hideTimer();
}

async function handleReplayClick() {
    if (isReplaying) return; // Prevent multiple clicks

    isReplaying = true;
    ui.setReplayBtn(true); // Disable during replay
    ui.setRestartBtn(true);
    ui.setExitBtn(true);

    try {
        await avatar.speak(currentPrompt);
    } catch (error) {
        console.error('Replay failed', error);
    } finally {
        isReplaying = false;
        // Only re-enable if we're still in answer mode
        if (awaitingAnswer) {
            ui.setReplayBtn(false);
        }
        ui.setRestartBtn(false);
        ui.setExitBtn(false);
    }
}

async function handleRestartClick() {
    if (confirm('Are you sure you want to restart? All progress will be lost.')) {
        resetSession();
    }
}

function handleExitClick() {
    if (confirm('Are you sure you want to exit?')) {
        // Save any collected data before exiting
        if (sessionData.calibration.length > 0 || sessionData.interview.length > 0) {
            saveSessionData();
        }
        // Show thank you message
        ui.setQuestion('Session ended. Thank you for your participation.');
        ui.setBtn('Exit', true);
        ui.setReplayBtn(true);
        ui.setRestartBtn(true);
        ui.setExitBtn(true);
    }
}

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

    currentPrompt = prompt; 
    ui.setQuestion(prompt);
    ui.setReplayBtn(true); 
    ui.setRestartBtn(true);
    ui.setExitBtn(true);

    await avatar.speak(prompt);

    const recordingStarted = await recorder.start();

    if (recordingStarted) {
        awaitingAnswer = true;
        startTimer();
        ui.setReplayBtn(false);
        ui.setRestartBtn(false);
        ui.setExitBtn(false);

        ui.setBtn(isCalibration ? 'Finish Calibration ⏹︎' :
            (qIndex === questions.length - 1 ?
                'Finish Interview ⏹︎' : 'Finish Answer ⏹︎'));
    } else {
        ui.setBtn('Start Failed.');
        ui.setReplayBtn(false);
        ui.setRestartBtn(false);
        ui.setExitBtn(false);
    }
}

async function finishRecording() {
    const isCalibration = currentPhase === 'calibration';
    ui.setBtn('Processing...', true);
    ui.setReplayBtn(true);
    ui.setRestartBtn(true);
    ui.setExitBtn(true);

    stopTimer();

    const recordingData = await recorder.stop(qIndex, isCalibration);

    if (recordingData) {
        const entry = {
            index: qIndex,
            prompt: isCalibration ? calibration[qIndex] : questions[qIndex],
            duration: elapsedSeconds, 
            ...recordingData
        };

        if (isCalibration) {
            sessionData.calibration.push(entry);
        } else {
            sessionData.interview.push(entry);
        }
    }

    awaitingAnswer = false;
    ui.setRestartBtn(false);
    ui.setExitBtn(false);

    if (isCalibration) {
        ui.setProgress('Calibration', qIndex + 1, calibration.length);
    } else {
        ui.setProgress('Interview', qIndex + 1, questions.length);
    }

    // Phase transition
    if (isCalibration && qIndex >= calibration.length - 1) {
        currentPhase = 'interview';
        qIndex = 0;
        ui.setQuestion('Calibration complete. Ready for first interview question.');
        ui.setBtn('Start Interview ▶︎');
        ui.setProgress('Interview', 0, questions.length); 
    }
    else if (!isCalibration && qIndex >= questions.length - 1) {
        ui.setQuestion('Interview complete! Thank you.');
        ui.setBtn('Done', true);
        ui.setRestartBtn(true);
        ui.setExitBtn(true);
        saveSessionData();
        return;
    }
    else {
        qIndex++;
        ui.setQuestion('(ready for next)');
        ui.setBtn(isCalibration ? 'Next Calibration ▶︎' : 'Next Question ▶︎');
    }
}

function saveSessionData() {
    const blob = new Blob([JSON.stringify(sessionData, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `session_${sessionData.startTime.replace(/[:.]/g, '-')}.json`;
    a.click();
}
