import React, { Component } from 'react';
import Knob from './Knob';

import { getMidiToFreqArray } from '../Helpers/MidiHelper';
import WebMidi from 'webmidi';
import AudioContext from '../Classes/AudioContext';
import SynthOscillator from '../Classes/SynthOscillator';

import ControlPanel from './ControlPanel';
import Keyboard from './Keyboard';
import OptionSelector from './OptionSelector';
import AudioPlayer from './AudioPlayer';

// SCSS
require('../sass/style.scss');

class App extends Component {

    constructor(props){
        super(props);

        this.ac = new AudioContext();
        const master = this.ac.createGain()
       
        this.osc = new SynthOscillator(this.ac, master);
        
        //master.connect(ac.destination);
        
        this.state = {
            midiIsEnabled : false,
            master : master,
            volume : 50,
            input : "",
            recording : false,
            audioSrc : null
        }

        WebMidi.enable((err) => {
            
            if(!err && WebMidi.inputs.length > 0){
                this.setState({
                    midiIsEnabled : true,
                    input : WebMidi.inputs[0]
                });
            }
        });

    }

    componentDidUpdate(){
        this.removeListeners();
        this.addListeners();
    }

    handleMidiInputSelect = (event) => {
        if(event.target.value == ""){
            this.setState( { input : "" });
        }
        this.setState( { input : WebMidi.getInputById(event.target.value) });
    }

    handleMasterVolume = (volume) => {
        const master = this.state.master;
        master.gain.setValueAtTime(volume/100, this.state.audioContext.currentTime);
        this.setState({ volume });
    };

     

    handleNote = (action, note = null) => {
        const synthOsc = this.osc;
        const currentNotes = synthOsc.notes || [];
        switch(action){
            case 'play':
                synthOsc.play(note, null)
            break;
            case 'stop':
                synthOsc.stop(note, null)
            break;
            case 'stopAll':
                synthOsc.stopAllNodes();
            break;
        }

        this.setState({ notes: synthOsc.notes });

    }


    removeListeners = () => {
        const input = this.state.input;
        if(input){
            input.removeListener('noteon', 'all');
            input.removeListener('noteoff', 'all');
        }
    }

    addListeners = () => {
        const synthOsc = this.osc
        const input = this.state.input;
        const self = this;
        const mediaRecorder = this.mediaRecorder;

        let chunks = [];
      
        if(input){
            input.addListener('noteon', "all",
                function (e) {
                    synthOsc.play(e.note.number, e.rawVelocity)
                    self.setState({ notes: synthOsc.notes });
                });
            
            input.addListener('noteoff', "all",
                function (e) {
                    synthOsc.stop(e.note.number);
                     self.setState({ notes: synthOsc.notes });
                }
            );
        }
    }

    handleRecord = (e) => {
        if(!this.state.recording){
            this.osc.record = true;
            this.osc.startRecording((src) => {
                this.setState({ audioSrc: src, recording : false })
            });
            this.setState({ recording : true })
        } else {
            this.osc.stopRecording();
        }
    }


    render(){
        let inputs = []
        let audioComponent = <div />;

        if(this.state.midiIsEnabled){
            inputs = WebMidi.inputs;
        }            

        let recordClass = "record button gradient";
        let recordTxt = ""
        if(this.state.recording){
            recordClass = "active record button gradient";
            recordTxt = <span>Recording...</span>;
        }
        if(this.state.audioSrc && !this.state.recording){
             audioComponent = <AudioPlayer src={this.state.audioSrc} />;
        }
        return (
            <div className='app-container'>
                <div className="panel master">
                    <div className="control midi-input">
                        <OptionSelector 
                            emptyNode={true} 
                            title="MIDI Input" 
                            value={this.state.input.id}
                            options={inputs} 
                            handleChange={ this.handleMidiInputSelect } />
                    </div>
                    <div className="recording-player">
                        {recordTxt}
                        <button title="Record" onClick={this.handleRecord} className={recordClass} />
                        {audioComponent}
                    </div>
                </div>
                <div className="synth">
                    <ControlPanel osc={this.osc}  />
                    <Keyboard notes={this.state.notes} handleNote={ this.handleNote } />  
                </div>
            </div>
        );
    }
}

export default App;