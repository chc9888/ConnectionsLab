// Socket.IO connection
let socket;

// Remote players' instruments
let remotePlayers = {};

let handPose;
let video;
let hands = [];
let audioStarted = false;
let selectedInstrument = 'piano';
let currentScale = 'major';

// Tone.js instruments
let piano, violin, flute, drums;
let pianoGain, violinGain, fluteGain, drumsGain;
let reverb;

// Musical scales (all in octave 4)
const scales = {
    major: ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4'],
    minor: ['C4', 'D4', 'Eb4', 'F4', 'G4', 'Ab4', 'Bb4'],
    pentatonic: ['C4', 'D4', 'E4', 'G4', 'A4', 'C5', 'D5'],
    blues: ['C4', 'Eb4', 'F4', 'F#4', 'G4', 'Bb4', 'C5'],
    dorian: ['C4', 'D4', 'Eb4', 'F4', 'G4', 'A4', 'Bb4']
};

// Canvas zones (7 parts for 7 notes)
const numZones = 7;
let zoneWidth;

// Currently playing notes (to prevent retriggering)
let currentNote = null;
let lastZone = -1;

function preload() {
    handPose = ml5.handPose({ flipped: true });
}

function setup() {
    createCanvas(640, 480);
    select('canvas').parent('rightDiv');
    video = createCapture(VIDEO, videoReady);
    video.size(640, 480);
    video.hide();

    zoneWidth = width / numZones;

    setupAudio();
    setupSocket();
    setupUI();
}

function setupAudio() {
    // Create reverb for atmosphere
    reverb = new Tone.Reverb({ decay: 3, wet: 0.4 }).toDestination();

    // PIANO - Rich, warm piano sound
    pianoGain = new Tone.Gain(0.8).toDestination();
    piano = new Tone.PolySynth(Tone.FMSynth, {
        harmonicity: 3,
        modulationIndex: 10,
        envelope: { attack: 0.01, decay: 0.4, sustain: 0.1, release: 1.0 }
    }).connect(pianoGain);
    pianoGain.connect(reverb);

    // VIOLIN - Smooth, sustained string sound
    violinGain = new Tone.Gain(0.6).toDestination();
    violin = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: "sawtooth" },
        envelope: {
            attack: 0.08,
            decay: 0.2,
            sustain: 0.7,
            release: 1.5
        }
    }).connect(violinGain);
    violinGain.connect(reverb);

    // FLUTE - Airy, soft woodwind sound
    fluteGain = new Tone.Gain(0.5).toDestination();
    flute = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: "sine" },
        envelope: {
            attack: 0.02,
            decay: 0.1,
            sustain: 0.5,
            release: 0.8
        }
    }).connect(fluteGain);
    fluteGain.connect(reverb);

    // DRUMS - Percussive sounds
    drumsGain = new Tone.Gain(0.9).toDestination();
    drums = new Tone.MembraneSynth({
        pitchDecay: 0.05,
        octaves: 10,
        oscillator: { type: "sine" },
        envelope: { attack: 0.001, decay: 0.4, sustain: 0.01, release: 1.4 }
    }).connect(drumsGain);
}

function setupSocket() {
    socket = io(); // Connect to server

    // Listen for remote players playing notes
    socket.on('remotePlayNote', (data) => {
        playRemoteNote(data);
    });

    // Listen for remote players stopping notes
    socket.on('remoteStopNote', (data) => {
        stopRemoteNote(data);
    });

    // Update connected users list
    socket.on('updateUsers', (users) => {
        console.log('Connected users:', users);
        // You can display this in the UI if you want
    });
}

function setupUI() {

    // Start/Stop button
    document.getElementById('startBtn').addEventListener('click', async () => {
        if (!audioStarted) {
            await Tone.start();
            audioStarted = true;
            document.getElementById('startBtn').textContent = 'Stop';
        } else {
            stopCurrentNote();
            audioStarted = false;
            document.getElementById('startBtn').textContent = 'Start';
        }
    });

    // Scale selection
    document.getElementById('scaleSelect').addEventListener('change', (e) => {
        currentScale = e.target.value;
    });

    // Instrument selection dropdown
    document.getElementById('instrumentDropdown').addEventListener('change', (e) => {
        selectedInstrument = e.target.value;
        stopCurrentNote();

        // Notify server of instrument selection
        socket.emit('selectInstrument', selectedInstrument);
    });
}

function videoReady() {
    console.log("Video ready");
    handPose.detectStart(video, gotHands);
    document.getElementById('status').textContent = '👋 Show your hand to play!';
}

function draw() {
    // Draw video (mirrored)
    push();
    translate(width, 0);
    scale(-1, 1);
    image(video, 0, 0, width, height);
    pop();

    // Draw zone dividers (7 vertical lines for 7 notes)
    drawZones();

    // Process hand input
    if (hands.length > 0 && audioStarted) {
        let hand = hands[0];
        let wrist = hand.keypoints[0];
        let middleBase = hand.keypoints[9];

        let controlX = (wrist.x + middleBase.x) / 2;
        let controlY = (wrist.y + middleBase.y) / 2;

        // Determine which zone the hand is in (X position)
        let zone = getZone(controlX);

        // Draw zones with active zone highlighted
        drawZones(zone);

        // Draw wrist indicator
        drawWrist(controlX, controlY);

        // Calculate volume based on Y position
        let volume = map(controlY, 0, height, 0, -30);

        // Play note based on zone and volume
        playNote(zone, volume, controlX, controlY);

        // Display current note and volume
        displayInfo(zone, volume);
    } else {
        // No hand detected - draw zones without highlight
        drawZones();

        // Stop any playing notes
        stopCurrentNote();
        document.getElementById('status').textContent = audioStarted ? '👋 Show your hand to play!' : 'Click "Start" first';
    }
}

function drawZones(activeZone = -1) {
    stroke(255, 255, 255, 100);
    strokeWeight(2);

    for (let i = 1; i < numZones; i++) {
        let x = i * zoneWidth;
        line(x, 0, x, height);
    }

    // Draw note labels at top of each zone
    noStroke();
    textAlign(CENTER, TOP);
    textSize(24);
    textStyle(BOLD);

    const notes = scales[currentScale];
    for (let i = 0; i < numZones; i++) {
        let x = i * zoneWidth + zoneWidth / 2;
        let noteName = notes[i].replace(/[0-9]/g, ''); // Remove octave number

        // Change color if this is the active zone
        if (i === activeZone) {
            fill(255, 200, 100); // Bright orange/yellow for active note
        } else {
            fill(255, 255, 255, 200); // White for inactive notes
        }

        text(noteName, x, 10);
    }
}

function drawWrist(x, y) {
    // Glow effect
    noStroke();
    fill(255, 200, 100, 80);
    circle(x, y, 50);
    fill(255, 200, 100, 150);
    circle(x, y, 30);
    fill(255, 255, 255);
    circle(x, y, 15);

    // Crosshair
    stroke(255, 255, 255, 200);
    strokeWeight(2);
    line(x - 20, y, x + 20, y);
    line(x, y - 20, x, y + 20);
}

function getZone(x) {
    return constrain(floor(x / zoneWidth), 0, numZones - 1);
}

function playNote(zone, volume, x, y) {
    const notes = scales[currentScale];
    const note = notes[zone];

    // Only trigger new note if zone changed
    if (zone !== lastZone) {
        stopCurrentNote();

        // Set volume for current instrument
        setInstrumentVolume(volume);

        // Play note on selected instrument
        switch (selectedInstrument) {
            case 'piano':
                piano.triggerAttack(note);
                break;
            case 'violin':
                violin.triggerAttack(note);
                break;
            case 'flute':
                flute.triggerAttack(note);
                break;
            case 'drums':
                let drumPitch = note.replace('4', '1');
                drums.triggerAttackRelease(drumPitch, "8n");
                break;
        }

        currentNote = note;
        lastZone = zone;

        // Emit to server for other players to hear
        socket.emit('playNote', {
            instrument: selectedInstrument,
            note: note,
            volume: volume,
            zone: zone
        });
    } else {
        // Same zone - just update volume smoothly
        setInstrumentVolume(volume);
    }
}

function setInstrumentVolume(volumeDb) {
    // Convert dB to linear scale
    const linearVolume = Math.pow(10, volumeDb / 20);

    switch (selectedInstrument) {
        case 'piano':
            pianoGain.gain.rampTo(linearVolume * 0.8, 0.05);
            break;
        case 'violin':
            violinGain.gain.rampTo(linearVolume * 0.6, 0.05);
            break;
        case 'flute':
            fluteGain.gain.rampTo(linearVolume * 0.5, 0.05);
            break;
        case 'drums':
            drumsGain.gain.rampTo(linearVolume * 0.9, 0.05);
            break;
    }
}

function stopCurrentNote() {
    if (currentNote && selectedInstrument !== 'drums') {
        switch (selectedInstrument) {
            case 'piano':
                piano.triggerRelease(currentNote);
                break;
            case 'violin':
                violin.triggerRelease(currentNote);
                break;
            case 'flute':
                flute.triggerRelease(currentNote);
                break;
        }

        // Emit stop to server
        socket.emit('stopNote', {
            instrument: selectedInstrument,
            note: currentNote
        });

        currentNote = null;
    }
    lastZone = -1;
}

function displayInfo(zone, volume) {
    const notes = scales[currentScale];
    const noteName = notes[zone];
    const volumePercent = Math.round(map(volume, 0, -30, 100, 0));

    fill(255);
    stroke(0);
    strokeWeight(3);
    textAlign(LEFT, BOTTOM);
    textSize(18);
    text(`Note: ${noteName}  |  Volume: ${volumePercent}%`, 10, height - 10);
}

function gotHands(results) {
    hands = results;

    // If no hands detected, stop any playing notes
    if (results.length === 0) {
        stopCurrentNote();
    }
}

function playRemoteNote(data) {
    // Play note from remote user on their instrument
    const linearVolume = Math.pow(10, data.volume / 20);

    switch (data.instrument) {
        case 'piano':
            pianoGain.gain.rampTo(linearVolume * 0.8, 0.05);
            piano.triggerAttack(data.note);
            break;
        case 'violin':
            violinGain.gain.rampTo(linearVolume * 0.6, 0.05);
            violin.triggerAttack(data.note);
            break;
        case 'flute':
            fluteGain.gain.rampTo(linearVolume * 0.5, 0.05);
            flute.triggerAttack(data.note);
            break;
        case 'drums':
            drumsGain.gain.rampTo(linearVolume * 0.9, 0.05);
            let drumPitch = data.note.replace('4', '1');
            drums.triggerAttackRelease(drumPitch, "8n");
            break;
    }

    // Store reference for cleanup
    if (!remotePlayers[data.userId]) {
        remotePlayers[data.userId] = {};
    }
    remotePlayers[data.userId][data.instrument] = data.note;
}

function stopRemoteNote(data) {
    if (data.instrument !== 'drums') {
        switch (data.instrument) {
            case 'piano':
                piano.triggerRelease(data.note);
                break;
            case 'violin':
                violin.triggerRelease(data.note);
                break;
            case 'flute':
                flute.triggerRelease(data.note);
                break;
        }
    }

    // Clean up reference
    if (remotePlayers[data.userId]) {
        delete remotePlayers[data.userId][data.instrument];
    }
}