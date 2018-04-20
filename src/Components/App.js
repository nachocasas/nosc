import React, { Component } from 'react';
import Knob from './Knob';

import { getMidiToFreqArray } from '../Helpers/MidiHelper';
import WebMidi from 'webmidi';
import AudioContext from '../Classes/AudioContext';


import Synth from './Synth';
import OptionSelector from './OptionSelector';

class App extends Component {

    constructor(props){
        super(props);

        const ac = new AudioContext();
        const master = ac.createGain()
        const recorderDest = ac.createMediaStreamDestination();
        const mediaRecorder = new MediaRecorder(recorderDest.stream);
       
        //master.connect(ac.destination);
        
        this.state = {
            midiIsEnabled : false,
            audioContext : ac,
            master : master,
            volume : 50,
            input : "",
            recording : { mediaRecorder, recorderDest }
        }

        WebMidi.enable((err) => {
            
            if(!err && WebMidi.inputs.length > 0){
                console.log(WebMidi.inputs[0].id)
                this.setState({
                    midiIsEnabled : true,
                    input : WebMidi.inputs[0]
                });
            }
        });

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

    render(){
        let inputs = []
        if(this.state.midiIsEnabled){
            inputs = WebMidi.inputs;
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
                    
                </div>
                <Synth audioContext = { this.state.audioContext } input = { this.state.input } 
                recorder = { this.state.recording } master = { this.state.master }
                 />
            </div>
        );
        }
}


export default App;