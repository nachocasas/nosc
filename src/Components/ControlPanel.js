import React, { Component } from 'react';
import WebMidi from 'webmidi';
import { OSC_TYPES } from '../Classes/SynthOscillator';

import OptionSelector from './OptionSelector';
import Knob from './Knob';
import ScreenControl from './ScreenControl';


class ControlPanel extends Component {

    constructor(props){
        super(props);
        
        this.osc = this.props.osc;

        this.state = {
            oscType : OSC_TYPES[0].name,
            volume : 50,
            notes : null,
            fadeIn : 0.05,
            fadeOut : 0.05,
            lfoFrequency : 4,
        }

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

   
   
    handleFrequency = (val) => {
        this.osc.modulateNodes(Math.ceil(val)*10);
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

                </div>
        );
    }

}

export default ControlPanel;