import React, { Component } from 'react';
import Knob from './Knob';
import Modal from 'react-modal';

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

Modal.setAppElement('#container')

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
            audioSrc : null,
            modalIsOpen: false
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

    openModal = () => {
        this.setState({modalIsOpen: true});
    }
 
    
    closeModal = () => {
        this.setState({modalIsOpen: false});
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
            <div>
                <div className='app-container'>
                    <div className="panel master">
                        <div className="control midi-input">
                            <OptionSelector 
                                emptyNode={true} 
                                title="MIDI Input" 
                                value={this.state.input.id}
                                options={inputs} 
                                handleChange={ this.handleMidiInputSelect } />

                            <button className="instructions-button" onClick={this.openModal}>?</button>
                            <Modal
                            isOpen={this.state.modalIsOpen}
                            onRequestClose={this.closeModal}
                            contentLabel="Instructions"
                            >
                                <h2 ref={subtitle => this.subtitle = subtitle}>How to play</h2>
                                <button onClick={this.closeModal} />
                                <div className="instructions">
                                    <h3>Inputs:</h3>
                                    <ul>
                                        <li><strong>Midi Keyboard</strong>: Just plug your midi device and refresh the page, then select the correct device from
                                            the "MIDI input" list at the top.
                                        </li>
                                        <li>
                                        <strong>Keyboard</strong>: You can use the normal keyboard. White keys are on the Z row, and black keys on the A row <br/>
                                            <i>Whites</i>: (z,x,c,v,b,n,m)<br/>
                                            <i>Blacks</i>: (s,d,f,h,j)
                                        </li>
                                        <li>
                                        <strong>Mouse</strong>: You can play using your mouse! (but you'll be able to play one note at a time only)
                                        </li>
                                    </ul>
                                </div>
                            </Modal>
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
            </div>
        );
    }
}

export default App;