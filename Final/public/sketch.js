// Socket.IO connection
let socket;

// Remote players
let remotePlayers = {};
let isRegistered = false;
let myUsername = '';

// ml5
let handPose;
let video;
let hands = [];

// sound
let audioStarted = false;
let selectedInstrument = 'piano';
let currentScale = 'major';

// Tone.js instruments
let piano, violin, flute, drums;
let pianoGain, violinGain, fluteGain, drumsGain;
let reverb;

// Scale 
let octave;
let currentNotes = [null, null];
let currentNote = null;
let lastZones = [-1, -1];
let lastOctaves = [-1, -1];

// Musical scales
let scales = {
    major: ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4'],
    minor: ['C4', 'D4', 'Eb4', 'F4', 'G4', 'Ab4', 'Bb4'],
    pentatonic: ['C4', 'D4', 'E4', 'G4', 'A4', 'C5', 'D5'],
    blues: ['C4', 'Eb4', 'F4', 'F#4', 'G4', 'Bb4', 'C5'],
    dorian: ['C4', 'D4', 'Eb4', 'F4', 'G4', 'A4', 'Bb4']
};

// Canvas zones (7 parts for 7 notes)
const numZones = 7;
let zoneWidth;

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

    // Process hand input
    if (hands.length > 0 && audioStarted && selectedInstrument) {
        // Collect active zones for all hands
        let activeZones = [];

        // Process ALL detected hands
        for (let i = 0; i < hands.length; i++) {
            let hand = hands[i];
            let wrist = hand.keypoints[0];
            let middleBase = hand.keypoints[9];

            let controlX = (wrist.x + middleBase.x) / 2;
            let controlY = (wrist.y + middleBase.y) / 2;

            let zone = getZone(controlX);

            // Calculate octave
            let octave = 5 - Math.floor(controlY / (height / 3));
            octave = constrain(octave, 3, 5);

            // Add to active zones
            activeZones.push({ zone: zone, octave: octave });

            // Draw wrist indicator for each hand (different colors)
            drawWrist(controlX, controlY, i);

            // Play note for this hand
            playNoteForHand(i, zone, octave, controlX, controlY);
        }

        // Draw zones with all active zones highlighted
        drawZones(activeZones);

    } else {
        drawZones();
        stopAllNotes();

        if (!selectedInstrument) {
            document.getElementById('status').textContent = 'Choose an instrument!';
        } else if (!audioStarted) {
            document.getElementById('status').textContent = 'Click "Start" to play!';
        } else {
            document.getElementById('status').textContent = '👋 Show your hands!';
        }
    }
}

function drawZones(activeZones = []) {
    stroke(255, 255, 255, 100);
    strokeWeight(2);

    // Notes lines
    for (let i = 1; i < numZones; i++) {
        let x = i * zoneWidth;
        line(x, 0, x, height);
    }

    // Octave lines
    for (let i = 1; i < 3; i++) {
        let y = (height / 3) * i;
        line(0, y, width, y);
    }

    // Draw note labels at top of each zone
    noStroke();
    textAlign(CENTER, TOP);
    textSize(24);
    textStyle(BOLD);

    const baseNotes = scales[currentScale];
    for (let i = 0; i < numZones; i++) {
        let x = i * zoneWidth + zoneWidth / 2;

        // Check if this zone is active for any hand
        let isActive = false;
        let activeOctave = null;

        for (let j = 0; j < activeZones.length; j++) {
            if (activeZones[j].zone === i) {
                isActive = true;
                activeOctave = activeZones[j].octave;
                break;
            }
        }

        // Get note name
        let baseNote = baseNotes[i];
        let noteName = baseNote.replace(/[0-9]/g, '');

        // If active, show note+octave, otherwise just note name
        let displayText = noteName;

        // Change color if active
        if (isActive) {
            fill(255, 200, 100); // Orange for active
            displayText = noteName + activeOctave;
        } else {
            fill(255, 255, 255, 200); // White for inactive
            displayText = noteName
        }

        text(displayText, x, 10);
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

function playNoteForHand(handIndex, zone, octave, x, y) {
    const baseNotes = scales[currentScale];

    let baseNote = baseNotes[zone];
    let noteName = baseNote.replace(/[0-9]/g, '');
    let note = noteName + octave;

    // Only trigger if zone or octave changed for THIS hand
    if (zone !== lastZones[handIndex] || octave !== lastOctaves[handIndex]) {
        // Stop previous note for this hand
        stopNoteForHand(handIndex);

        // Play new note
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
                let drumPitch = note.replace(/[0-9]/, '1');
                drums.triggerAttackRelease(drumPitch, "8n");
                break;
        }

        currentNotes[handIndex] = note;
        lastZones[handIndex] = zone;
        lastOctaves[handIndex] = octave;

        // Emit to other players
        if (socket) {
            socket.emit('playNote', {
                instrument: selectedInstrument,
                note: note,
                volume: -10,
                zone: zone,
                octave: octave,
                handIndex: handIndex
            });
        }
    }
}

function stopNoteForHand(handIndex) {
    let note = currentNotes[handIndex];

    if (note && selectedInstrument !== 'drums') {
        switch (selectedInstrument) {
            case 'piano':
                piano.triggerRelease(note);
                break;
            case 'violin':
                violin.triggerRelease(note);
                break;
            case 'flute':
                flute.triggerRelease(note);
                break;
        }

        if (socket && selectedInstrument) {
            socket.emit('stopNote', {
                instrument: selectedInstrument,
                note: note,
                handIndex: handIndex
            });
        }

        currentNotes[handIndex] = null;
    }
    lastZones[handIndex] = -1;
    lastOctaves[handIndex] = -1;
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

        if (selectedInstrument) {
            socket.emit('stopNote', {
                instrument: selectedInstrument,
                note: currentNote
            });
        }

        currentNote = null;
    }
    lastZone = -1;
    lastOctave = -1;
}

function stopAllNotes() {
    for (let i = 0; i < 2; i++) {
        stopNoteForHand(i);
    }
}

function displayInfo(zone, octave) {
    const baseNotes = scales[currentScale];
    let baseNote = baseNotes[zone];
    let noteName = baseNote.replace(/[0-9]/g, '');
    let fullNote = noteName + octave;

    fill(255);
    stroke(0);
    strokeWeight(3);
    textAlign(LEFT, BOTTOM);
    textSize(18);
    text(`Note: ${fullNote}  |  Octave: ${octave}`, 10, height - 10);
}

function gotHands(results) {
    // Store previous hand count
    let previousHandCount = hands.length;
    hands = results;

    // If hand count decreased, stop notes for missing hands
    if (results.length < previousHandCount) {
        for (let i = results.length; i < previousHandCount; i++) {
            stopNoteForHand(i);
        }
    }

    // If no hands, stop all
    if (results.length === 0) {
        stopAllNotes();
    }
}

function playRemoteNote(data) {
    // Use fixed volume for remote notes
    const linearVolume = 0.5; // Medium volume

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
            let drumPitch = data.note.replace(/[0-9]/, '1');
            drums.triggerAttackRelease(drumPitch, "8n");
            break;
    }

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