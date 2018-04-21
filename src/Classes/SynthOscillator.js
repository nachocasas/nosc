import { getMidiToFreqArray } from '../Helpers/MidiHelper';

export const OSC_TYPES = [
    {id: 1, name: "triangle"}, 
    {id: 2, name: "square"}, 
    {id: 3, name: "sawtooth"}, 
    {id: 4, name: "sine"}];

export default class SynthOscillator {

    constructor (context, master = null){
        this.context = context;
        this.master = master;
        this.midiTable = getMidiToFreqArray();
        this.recorderDest = this.context.createMediaStreamDestination();
        this.mediaRecorder = new MediaRecorder(this.recorderDest.stream);
        this._velocityFlag = false;
        this._waveType = OSC_TYPES[0].name;
        this._notes = {};
        this._fadeIn = 0.05;
        this._fadeOut = 0.05;
        this.record = false;
        this.streamDest = null;
        this.lfoOn = true;
        this.lfo = null;
        this.lfoFrequency = 4;
        this.recordSrc = null;
    }

    play(noteNumber, velocity = null){
        if(noteNumber in this.notes) return;

        const ac = this.context;
        const gainNode = ac.createGain();
        const oscNode = ac.createOscillator();
        let lfoNode = null;
        oscNode.type = this.waveType;
        oscNode.frequency.setValueAtTime(this.midiTable[noteNumber], ac.currentTime); 
        oscNode.connect(gainNode);
        
        if(this.lfoOn){
            lfoNode = ac.createOscillator();
            lfoNode.frequency.setValueAtTime(this.lfoFrequency, ac.currentTime);
            lfoNode.connect(gainNode);
            lfoNode.start();
        }
        
        gainNode.gain.setValueAtTime(0.00001, ac.currentTime);
        //gainNode.connect(this.master);
        gainNode.connect(ac.destination);

        if(!this.velocityFlag){
            gainNode.gain.exponentialRampToValueAtTime(
                0.6, ac.currentTime + this.fadeIn
            )
        } else {
            gainNode.gain.exponentialRampToValueAtTime(
                (velocity/127), ac.currentTime + this.fadeIn
            )
        }
        if(this.record){
            gainNode.connect(this.recorderDest);
        }
        oscNode.start(ac.currentTime);
        this.setNotes(noteNumber, { oscNode , gainNode, lfoNode });
    }

    stop(noteNumber){
        try {
            const ac = this.context;
            if(this.notes[noteNumber]){
                let { oscNode, gainNode, lfoNode } = this.notes[noteNumber];
                //gainNode.gain.setValueAtTime(1, ac.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(
                    0.00001, ac.currentTime + this.fadeOut
                )
                if(lfoNode){
                    lfoNode.stop(ac.currentTime + this.fadeOut);
                }
                delete this.notes[noteNumber];
                oscNode.stop(ac.currentTime + this.fadeOut + 0.05);
            }
        } catch(e){
            console.error("Something happened when stopping node");
        }
    }

    startRecording(onStopCallback){
        this.initRecordingEvents(onStopCallback);
        this.record = true;
        this.mediaRecorder.start();
    }

    initRecordingEvents(onStopCallback){
        let chunks = [];
        this.mediaRecorder.ondataavailable = (evt) => {
            // push each chunk (blobs) in an array
            chunks.push(evt.data);
          };
     
        this.mediaRecorder.onstop = (evt) => {
            // Make blob out of our blobs, and open it.
            const blob = new Blob(chunks, { 'type' : 'audio/ogg; codecs=opus' });
            const recordSrc = URL.createObjectURL(blob);
            onStopCallback(recordSrc)
          };

    }

    stopRecording(){
        this.mediaRecorder.stop();
        this.record = false;
    }


    stopAllNodes(){
        const keys = Object.keys(this.notes);
        keys.map(note => this.stop(note));
    }
    
    modulateLfo(val){
        this.lfoFrequency = val;
        for (let note in this.notes) {
            let { lfoNode } = this.notes[note];
            lfoNode.frequency.setValueAtTime(val, this.context.currentTime);
        };
    }

    modulateNodes(val){
        for (let note in this.notes) {
            let { oscNode } = this.notes[note];
            oscNode.frequency.setValueAtTime(this.midiTable[note] + val, this.context.currentTime);
        };
    }

    set velocityFlag(velocityFlag){
        this._velocityFlag = velocityFlag;
    }

    get velocityFlag(){
        return this._velocityFlag;
    }

    setNotes(note, nodes){
        this._notes[note] = nodes;
    }

    get notes(){
        return this._notes;
    }

    set fadeIn(fadeIn){
        this._fadeIn = fadeIn;
    }

    get fadeIn(){
        return this._fadeIn;
    }

    set fadeOut(fadeOut){
        this._fadeOut = fadeOut;
    }

    get fadeOut(){
        return this._fadeOut;
    }

    set waveType(waveType){
        const oscTypes = OSC_TYPES.map(item => item.name);
        if(oscTypes.indexOf(waveType) !== -1){
            this._waveType = waveType;
        }
    }

    get waveType(){
        return this._waveType;
    }

}