import React, { Component } from 'react';
import WebMidi from 'webmidi';
import SynthOscillator, { OSC_TYPES } from '../Classes/SynthOscillator';

import OptionSelector from './OptionSelector';
import Knob from './Knob';
import ScreenControl from './ScreenControl';
import Keyboard from './Keyboard';

class Synth extends Component {

    constructor(props){
        super(props);

        const recording = false;

        this.state = {
            oscType : OSC_TYPES[0].name,
            volume : 50,
            notes : null,
            fadeIn : 0.05,
            fadeOut : 0.05,
            lfoFrequency : 4,
        }

    }

    componentWillMount(){
        this.osc = this.startOscilator();
    }

    componentWillUpdate(){
        this.removeListeners()
    }

    componentDidUpdate(){
        this.removeListeners()
        this.addListeners(this.osc);
    }


    handleOscTypeSelect = (typeId) => {
        const obj = OSC_TYPES.find((item) => item.id === typeId);
        this.osc.waveType = obj.name;
        this.setState({ oscType : obj.name })
    }

    handleFadeIn = (fadeIn) => {
        fadeIn = _.toFinite(fadeIn);
        this.osc.fadeIn = fadeIn;
        this.setState({ fadeIn });
    }

    handleFadeOut = (fadeOut) => {
        fadeOut = _.toFinite(fadeOut);
        this.osc.fadeOut = fadeOut;
        this.setState({ fadeOut });
    }

    handleLfo = (freq) => {
        freq = _.toInteger(freq);
        this.osc.modulateLfo(freq);
        this.setState({ lfoFrequency : freq });
    }

    handleRecord = (e) => {
        if(!this.recording){
            this.recording = true;
            this.osc.record = true;
            console.log(this.props);
            this.osc.startRecording(this.props.recorder);
        } else {
            this.recording = false;
            this.osc.stopRecording();
        }
    }

    

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
        
        this.setState({ notes : synthOsc.notes });
        
    }

    handleFrequency = (val) => {
        this.osc.modulateNodes(Math.ceil(val)*10);
    }

    startOscilator = () => {
        const master = this.props.master;
        const ac = this.props.audioContext;
        
        const synthOsc = new SynthOscillator(ac, master);
        return synthOsc;
    }

    removeListeners = () => {
        const input = this.props.input;
        if(input){
            input.removeListener('noteon', 'all');
            input.removeListener('noteoff', 'all');
        }
    }

    addListeners = (synthOsc) => {
        const input = this.props.input;
        const self = this;
        const mediaRecorder = this.props.recorder.mediaRecorder;

        let chunks = [];
        
        mediaRecorder.ondataavailable = function(evt) {
            // push each chunk (blobs) in an array
            chunks.push(evt.data);
          };
     
        mediaRecorder.onstop = function(evt) {
            // Make blob out of our blobs, and open it.
            var blob = new Blob(chunks, { 'type' : 'audio/ogg; codecs=opus' });
            document.querySelector("audio").src = URL.createObjectURL(blob);
          };

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

    renderTypes=() => {
        return OSC_TYPES.map(item => {
            const classnames = this.state.oscType == item.name ? `${item.name} selected` : item.name;

            return (<li key={item.id} onClick={() => this.handleOscTypeSelect(item.id)} className={classnames}>
                        <span className="image"></span><span>{item.name}</span>
                    </li>)
        })
    }

    render(){
        const oscTypes = OSC_TYPES;

        return (
            <div className="synth">
                <div className="panel">
                    <div className="control waveform-selector">
                        <ul>
                            {this.renderTypes()}
                        </ul>
                    </div>
                    <div className="control knob">
                        <Knob
                            class="knob-class"
                            name="fadeIn"
                            min="0"
                            max="4"
                            value={this.state.fadeIn}
                            onEnd={this.handleFadeIn}
                            valueTransformDisplay={(val) => _.floor(val, 2)}
                            showNumber={true}
                            />
                            <span>fade in</span>
                    </div>
                    
                    <div className="control knob">
                        <Knob
                            class="knob-class"
                            name="fadeOut"
                            min="0"
                            max="4"
                            value={this.state.fadeOut}
                            onEnd={this.handleFadeOut}
                            valueTransformDisplay={(val) => _.floor(val, 2)}
                            showNumber={true}
                            />
                            <span>fade out</span>
                    </div>
                    <div className="control knob">
                        <Knob
                            class="knob-class"
                            name="lfo"
                            min="2"
                            max="10"
                            value={this.state.lfoFrequency}
                            onEnd={this.handleLfo}
                            showNumber={true}
                            />
                        <span>LFO freq.</span>
                    </div>
                    <div className="control">
                       <ScreenControl 
                            onChange={this.handleFrequency}
                       />
                    </div>
                    <button onClick={this.handleRecord}>Record</button>
                    <audio controls></audio>
                </div>
                <Keyboard notes={this.osc.notes} handleNote={ this.handleNote } />  
            </div>
            
        );
    }

}

export default Synth;