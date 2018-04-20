import React, { Component } from 'react';
import _ from 'lodash';

//"z","s","x","d","c", "f", "v", "b", "h", "n","j","m","k"
const KEY_TABLE = [90, 83, 88, 68, 67, 70, 86, 66, 72, 78, 74, 77]

export default class Keyboard extends Component {b


    constructor(props){
        super(props)
        this.clicked = false;
        this.keymap = false;
        this.state = {
            startNote: this.props.startNote || 53,
            octaves: this.props.octaves || 2,
            keyMap : this.assignKeys(this.props.startNote || 53)
        }
    }

    componentDidMount(){
        this.startListeners();
    }

    startListeners = () => {
        
        document.addEventListener('keydown', (e) => {
            const midiValue = this.state.keyMap[event.keyCode]
            if(midiValue){
                this.props.handleNote('play', midiValue);
            }
        });

        document.addEventListener('keyup', (e) => {
            const midiValue = this.state.keyMap[event.keyCode]
            if(midiValue){
                this.props.handleNote('stop', midiValue);
            }
        });

        this.keyboardNode.addEventListener('mousedown', (e) => {
            this.clicked = true;
            const note = e.target.dataset.note;
            if(note){
                this.props.handleNote('play', note)
            }
        });

        this.keyboardNode.addEventListener('mouseup', (e) => {
            this.clicked = false;
            const note = e.target.dataset.note;
            this.props.handleNote('stopAll');
        });
    };

    assignKeys = (start) =>{
        const startNote = start;
        let updatedKeyTable = {};
        for (let i=0; i < KEY_TABLE.length; i++){
            updatedKeyTable[KEY_TABLE[i]] = startNote + i
        };
        return updatedKeyTable;
    }

    handleOctavesChange = (event) => {
        const val = event.target.value;
        this.setState({ octaves : val });
    }

    handleStartNoteChange = (up) => {
        const current = this.state.startNote;
        let newStart = null;

        if(up && current < 125){
            newStart = current + 2;
        }
        if(!up && current > 6){
            newStart = current - 2;
        }
        this.setState({ startNote : newStart, keyMap: this.assignKeys(newStart) });
    }

    renderKeys(pressedKeys){
        const whites = [1, 0, 1, 0, 1, 0, 1, 1, 0, 1, 0, 1];
        const startNote = this.state.startNote;
        const stopNote = this.state.startNote + (12 * this.state.octaves);
        const allOctavesKeys = _.flatten(Array(7).fill(whites));
        const offset = startNote > 5 ? startNote - 5 : startNote;
        let keyLis = [];
        let orderCount = 0;

        for(let i = this.state.startNote; i <= stopNote; i++){
            let pressed = pressedKeys.includes(i.toString()) ? "pressed" : "";
            
            let className = allOctavesKeys[orderCount + offset] === 1 ? `white ${pressed}` : `black ${pressed}`;
            
            keyLis.push(<li tabIndex="-1"
                            key={i} 
                            data-note={i}
                            className={className}
                            onMouseOver={() => { if(this.clicked) { this.props.handleNote('play', i) } }}
                            onMouseLeave={() => { if(this.clicked) { this.props.handleNote('stop', i) } }}
                        ></li>);
            orderCount == 11 ? orderCount = 0 : orderCount++;
        }

        return keyLis;
    }

    renderOctaveSelector = () => {
        const options = _.times(7, (i) => <option key={i} value={i}>{i}</option>).slice(1);
        return(
            <select value={this.state.octaves} onChange={this.handleOctavesChange} name="octaves">
                {[...options]}
            </select>
        );
    }

    render(){
        let pressedKeys = [];

        if(this.props.notes){
            pressedKeys = Object.keys(this.props.notes);
        }

        return (
            <div className="keyboard-container">
                <div className="keyboard-controls">
                    <button onClick={() => this.handleStartNoteChange(false) }>&lt;</button>
                    <button onClick={() => this.handleStartNoteChange(true) }>&gt;</button>
                    <div className="octave-selector">
                        <span>Octaves: </span>
                        {this.renderOctaveSelector()};
                    </div>
                </div>
                <div className='keyboard' ref={elem => this.keyboardNode = elem}>
                    <ul className="set">
                        {this.renderKeys(pressedKeys)}
                    </ul>
                </div>
            </div>
        );

    }

   
}