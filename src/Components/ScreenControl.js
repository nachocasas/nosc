import React, { Component } from 'react';

class ScreenControl extends Component {

    constructor(props){
        super(props);
    }

    onMove = (e) => {
        const specs = this.container.getBoundingClientRect()
        const y = specs.y + specs.height - e.clientY;
        const x = specs.x + specs.width - e.clientX;
        this.hbar.style.display = "block";
        this.hbar.style.bottom = (y-1)+"px";
        this.vbar.style.display = "block";
        this.vbar.style.right = (x-1)+"px";
        this.props.onChange(y)
    }

    onOut = (e) => {
        this.hbar.style.display = "none";
        this.vbar.style.display = "none";
    }


    render(){
        return(
            <div ref={(elem) => this.container = elem } 
            style={{position:"relative"}} 
            onMouseMove={this.onMove} 
            onMouseOut={this.onOut}
            className="screen-control">

                <div ref={(elem) => this.hbar = elem } 
                    className="hbar" 
                    style={{width:"100%", height:"1px", bottom:"0px", position: "absolute", display:"none"}}></div>
                <div ref={(elem) => this.vbar = elem } 
                    className="vbar" 
                    style={{ width: "1px", height:"100%", right:"0px", position: "absolute", display:"none"}}></div>

            </div>
        );
    }

}

export default ScreenControl;