import React, { Component } from 'react';

class AudioPlayer extends Component {

    constructor(props){
        super(props);
        
        this.audio = new Audio(this.props.src);

        this.state = { 
            loop : false,
            play : false
        };

        this.addListeners();
    }

    addListeners(){
        this.audio.addEventListener('timeupdate', ()  =>{
            let curtime = parseFloat(this.audio.currentTime, 10);
                if(curtime == this.audio.duration && !this.loop){
                    this.setState({ play: false})
                }
            });
    }
  
    handlePlay = (e) => {
        this.audio.play();
        this.setState({ play : true })
    }

    handleStop = (e) => {
        this.audio.pause()
        this.audio.currentTime = 0;
        this.setState( { play : false });
    }

    handleLoop = (e) => {
        const loop = !this.state.loop;
        this.audio.loop = loop;
        this.setState( { loop });        
    }
    
    handleDownload = (e) => {
        this.downloadLink.click();
    }
   
    render(){
        let playBtnClass = "play button";
        if(this.state.play){
            playBtnClass = playBtnClass +" active";
        }

        let loopBtnClass = "loop button";
        if(this.state.loop){
            loopBtnClass = loopBtnClass+ " active";
        }

        return(
            <div className="playback">
                <button onClick={ this.handlePlay } className={playBtnClass}></button>
                <button onClick={ this.handleStop } className="stop button"></button>
                <button onClick={ this.handleLoop } className={loopBtnClass}></button>
                <button onClick={ this.handleDownload } className="download button"></button>
                <a ref={(ref) => this.downloadLink = ref }href={this.props.src} style={{display:"none"}} download="nosc_sound.ogg" />
            </div>
        );
    }

}

export default AudioPlayer;