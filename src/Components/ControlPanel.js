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
            allowVisuals : true
        }
        
    }

    componentDidMount(){
        this.initAnaliser();
    }

    initAnaliser = () =>{
        const analyser = this.osc.analyser
        
        analyser.fftSize = 1024;
        this.bufferLength = analyser.frequencyBinCount;
        this.dataArray = new Uint8Array(this.bufferLength);
        this.canvasCtx = this.visualization.getContext("2d")
        analyser.getByteTimeDomainData(this.dataArray);
        this.drawVisuals();

    }

    drawVisuals = () =>{
        const analyser = this.osc.analyser
        const canvasCtx = this.canvasCtx;
        const canvas = this.visualization;
        const dataArray = this.dataArray;
        const bufferLength = this.bufferLength;
        requestAnimationFrame(this.drawVisuals);

        analyser.getByteTimeDomainData(dataArray);

        canvasCtx.fillStyle = "rgb(255, 0, 0)";
        canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

        this.canvasCtx.lineWidth = 2;
        canvasCtx.strokeStyle = "rgb(255, 255, 255)";

        canvasCtx.beginPath();

        var sliceWidth = canvas.width * 1.0 / bufferLength;
        var x = 0;

        for (var i = 0; i < bufferLength; i++) {

            var v = dataArray[i] / 128.0;
            var y = v * canvas.height / 2;
            
            if (i === 0) {
                canvasCtx.moveTo(x, y);
            } else {
                canvasCtx.lineTo(x, y);
            }

            x += sliceWidth;
        }

        canvasCtx.lineTo(canvas.width, canvas.height / 2);
        canvasCtx.stroke();
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
                    <div className="waveform-logo">
                        <div className="control waveform-selector">
                            <ul>
                                {this.renderTypes()}
                            </ul>
                        </div>
                        <div className="logo">
                            <h1>NOsc <sub>0.1</sub></h1>
                        </div>
                    </div>
                    <div className="control-visualization">
                        <div className="controls-wrapper">
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
                        </div>
                        <div className="visualization">
                            <div className="canvas-blur"></div>
                            <canvas width="350"  height="100" ref={(ref) => this.visualization = ref }></canvas>
                        </div>
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