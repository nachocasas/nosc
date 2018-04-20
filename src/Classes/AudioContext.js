class AudioContext {

    constructor(){
        return this._audioCtx = this.startAudioContext();
    }

    startAudioContext(){
        return  new (window.AudioContext || window.webkitAudioContext)
    }

    get audioCtx(){
        return this._audioCtx;
    }

    set audioCtx(ac){
        this._audioCtx = ac;
    }
    
}

export default AudioContext;