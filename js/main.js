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

let currentPhase = 'calibration';
let qIndex = 0;
let isRunning = false;

// Initialize
(async () => {
    await avatar.load(
        'https://models.readyplayer.me/64bfa15f0e72c63d7c3934a6.glb?morphTargets=ARKit,Oculus+Visemes,mouthOpen,mouthSmile,eyesClosed,eyesLookUp,eyesLookDown&textureSizeLimit=1024&textureFormat=png',
        ev => ev.lengthComputable && ui.setLoading(`Loading ${Math.round(ev.loaded / ev.total * 100)}%`)
    );

    ui.hideLoading();
    ui.setProgress('Calibration', 0, calibration.length);
    ui.setBtn('Start Interview ▶︎');

    // Setup silence detection callback
    recorder.onSilenceDetected(() => {
        if (isRunning) {
            finishRecording();
        }
    });

    ui.onClick(handleClick);
    document.addEventListener('visibilitychange', () =>
        document.visibilityState === 'visible' ? avatar.start() : avatar.stop()
    );
})();

async function handleClick() {
    if (isRunning) return;
    startInterview();
}

async function startInterview() {
    isRunning = true;
    ui.setBtn('Running...', true);
    ui.setStatus('Starting interview...');
    await askQuestion();
}

async function askQuestion() {
    if (currentPhase === 'calibration' && qIndex >= calibration.length) {
        // Transition to interview questions
        currentPhase = 'interview';
        qIndex = 0;
    }

    if (currentPhase === 'interview' && qIndex >= questions.length) {
        endInterview();
        return;
    }

    const isCalibration = currentPhase === 'calibration';
    const prompt = isCalibration ? calibration[qIndex] : questions[qIndex];

    ui.setQuestion(prompt);
    ui.setStatus('Asking question...');
    ui.setProgress(
        currentPhase,
        qIndex + 1,
        isCalibration ? calibration.length : questions.length
    );

    try {
        // Avatar asks question
        await avatar.speak(prompt);

        // Start recording automatically
        ui.setStatus('Listening for answer...');
        const started = await recorder.start();

        if (!started) {
            ui.setStatus('Recording failed. Please check permissions.');
            isRunning = false;
            ui.setBtn('Start Interview ▶︎');
            return;
        }

    } catch (error) {
        console.error("Error during question:", error);
        ui.setStatus('Error: ' + error.message);
        isRunning = false;
        ui.setBtn('Start Interview ▶︎');
    }
}

async function finishRecording() {
    ui.setStatus('Processing response...');
    const isCalibration = currentPhase === 'calibration';

    try {
        const result = await recorder.stop();
        if (result) {
            const { blob, duration } = result;
            const prefix = isCalibration ? 'calibration' : 'answer';
            const filename = `${prefix}_${qIndex + 1}_${Date.now()}.webm`;

            // Save to session data
            const entry = {
                index: qIndex,
                prompt: isCalibration ? calibration[qIndex] : questions[qIndex],
                filename,
                duration,
                timestamp: new Date().toISOString()
            };

            if (isCalibration) {
                sessionData.calibration.push(entry);
            } else {
                sessionData.interview.push(entry);
            }

            // Trigger download
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = filename;
            a.click();
        }

        // Move to next question
        qIndex++;
        await askQuestion();

    } catch (error) {
        console.error("Error finishing recording:", error);
        ui.setStatus('Error processing response');
        isRunning = false;
        ui.setBtn('Start Interview ▶︎');
    }
}

function endInterview() {
    ui.setQuestion('Interview complete! Thank you.');
    ui.setStatus('All questions answered');
    ui.setBtn('Done', true);
    saveSessionData();
    isRunning = false;
}

function saveSessionData() {
    const blob = new Blob([JSON.stringify(sessionData, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `session_${sessionData.startTime.replace(/[:.]/g, '-')}.json`;
    a.click();
}
