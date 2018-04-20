import React from 'react';
import { render } from 'react-dom';

const arcStartOffset = 0.65;
const arcStart = arcStartOffset * Math.PI;
const arcEndOffset = 1 - arcStartOffset + 2;
const arcEnd = arcEndOffset * Math.PI;
const arcOffsetRange = arcEndOffset - arcStartOffset;

class Knob extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            min: props.min || 0,
            max: (props.max !== null) ? props.max : 1,
            value: (props.value !== null) ? props.value : (props.min || 0)
        }
        this.state.value = Math.max(this.state.min, Math.min(this.state.max, this.state.value));
        this.setTextValue();
        this.state.range = Math.abs(this.state.max - this.state.min);
        this.state.rawValue = this.calculateRawValue(this.state.value);
        this.currentValue = this.state.rawValue;
        this.startX = this.startY = 0;
        this.startTime = null;
        this.touchId = null;
        this.touchDirection = 0;
        this.moveAxis = null;
    }

    getValue() {
        return this.state.value;
    }

    setValue(value, disableAnimation) {
        value = Math.max(this.state.min, Math.min(this.state.max, value));
        let newVal = this.calculateRawValue(value);
        if (disableAnimation || this.props.disableAnimation) {
            this.setState({ value: value, rawValue: newVal });
            return;
        }
        this.animateToValue(newVal);
    }

    componentDidUpdate() {
        if (this.container.offsetWidth !== this.width) {
            this.width = this.container.offsetWidth;
            this.canvas.setAttribute("width", this.width);
            this.canvas.setAttribute("height", this.width);
        }
        this.draw();
        if (this.props.onChange) this.props.onChange(this.state.value);
    }

    componentWillReceiveProps(newProps) {
        if (newProps.value !== this.state.value) {
            //this.setValue(newProps.value, this.props.disableAnimation);
        }
    }

    componentDidMount() {
        this.width = this.container.offsetWidth;
        this.canvas.setAttribute("width", this.width);
        this.canvas.setAttribute("height", this.width);

        this.draw();
        this.initListeners();
    }

    initListeners() {
        window.addEventListener("resize", () => {
            this.width = this.container.offsetWidth;
            this.canvas.setAttribute("width", this.width);
            this.canvas.setAttribute("height", this.width);
            this.draw();
        });

        this.canvas.onmousedown = (e) => {
            if (this.props.disabled) return;
            e.preventDefault();
            let newVal = this.pointerInLane(e);
            if (newVal) {
                this.state.rawValue = newVal;
                this.updateValue();
                this.startedInLane = true;
            } else {
                this.initMove(e);
                this.startedInLane = false;
            }
            this.mouseActive = true;
        }

        window.addEventListener("mousemove", (e) => {
            if (!this.mouseActive) return;
            e.preventDefault();

            this.handleMove(e);
        });

        window.addEventListener("mouseup", (e) => {
            if (!this.mouseActive) return;

            e.preventDefault();
            if (!this.props.disableAnimation)
                this.flingIfFastEnough(e);
            this.mouseActive = false;
        });

        if (!("ontouchstart" in document.documentElement)) return;

        this.canvas.ontouchstart = (e) => {
            if (this.props.disabled) return;
            e.preventDefault();
            let touchTracker = e.targetTouches[0];
            this.touchId = touchTracker.identifier;
            let laneAngle = this.pointerInLane(touchTracker);
            if (laneAngle) {
                this.state.rawValue = laneAngle;
                this.updateValue();
                this.startedInLane = true;
            } else {
                this.initMove(touchTracker);
                this.startedInLane = false;
            }
        }

        document.body.addEventListener("touchend", (e) => {
            let localTouch = this.getActiveTouch(e.changedTouches);
            if (!localTouch) return;

            e.preventDefault();
            if (!this.props.disableAnimation)
                this.flingIfFastEnough(localTouch);
        });

        document.body.addEventListener("touchmove", (e) => {
            let localTouch = this.getActiveTouch(e.changedTouches);
            if (!localTouch) return;
            e.preventDefault();

            this.handleMove(localTouch);
        });
    }

    initMove(e) {
        clearTimeout(this.timer);
        this.startTime = Date.now();
        this.startX = this.lastX = e.screenX;
        this.startY = this.lastY = e.screenY;
        this.moveAxis = null;
    }

    getActiveTouch(touches) {
        let t = touches[0];
        if (t.identifier === this.touchId) return t;
        return;
    }

    handleMove(e) {
        if (this.startedInLane) {
            this.state.rawValue = this.getNewRawValueFromPoint(e);
            this.updateValue();
            return;
        }
        let dx = e.screenX - this.lastX;
        let dy = e.screenY - this.lastY;
        let dist;
        if (this.moveAxis) {
            dist = (this.moveAxis === 1) ? dx : (dy * -1);
        }
        if (!dist) {
            if (Math.abs(dx) > Math.abs(dy)) {
                this.moveAxis = 1;
            } else {
                this.moveAxis = 2;
            }
            dist = (this.moveAxis === 1) ? dx : (dy * -1);
        } else if (Math.abs(dist) / (Date.now() - this.lastMoveTime) < 0.03) {
            this.moveAxis = null;
        }

        this.lastMoveTime = Date.now();
        this.lastX = e.screenX;
        this.lastY = e.screenY;

        this.state.rawValue += dist / (this.container.offsetWidth * (this.props.fineness || 10));
        this.state.rawValue = Math.max(0, Math.min(1, this.state.rawValue));
        this.updateValue();
    }

    flingIfFastEnough(e) {
        let elapsed = Date.now() - this.startTime;
        if (elapsed > 300) {
            if (this.props.onEnd) this.props.onEnd(this.state.value);
            return;
        }
        let dx = e.screenX - this.startX;
        let dy = e.screenY - this.startY;
        let dist;
        if (Math.abs(dx) > Math.abs(dy)) {
            dist = dx;
        } else {
            dist = dy * -1;
        }
        this.animateToValue(Math.max(0, Math.min(1, this.state.rawValue + (1 / (this.props.fineness || 10) * dist / elapsed))));
    }

    animateToValue(value) {
        if (Math.round(this.state.rawValue * 100) === Math.round(value * 100)) {
            this.state.rawValue = value;
            this.updateValue();
            if (this.props.onEnd) this.props.onEnd(this.state.value);
            return;
        }
        let d = value - this.state.rawValue;
        this.state.rawValue += d * 0.25;
        this.updateValue();
        this.timer = setTimeout(() => { this.animateToValue(value) }, 20);
    }

    updateValue() {
        this.state.value = this.state.rawValue * this.state.range + this.state.min;
        if (this.props.showNumber)
            this.setTextValue();
        this.setState({ value: this.state.value });
    }

    setTextValue() {
        let outText;
        if (this.props.valueTransformDisplay)
            outText = this.props.valueTransformDisplay(this.state.value);
        else
            outText = Math.round(this.state.value).toString();
        this.state.text = outText;
    }

    calculateRawValue(value) {
        return ((value - this.state.min) / this.state.range);
    }

    pointerInLane(e) {
        let x = e.clientX;
        let y = e.clientY;
        let r = this.width * 0.5;
        let rect = this.canvas.getBoundingClientRect();
        let centerX = rect.left + r;
        let centerY = rect.top + r;
        let style = getComputedStyle(this.container);
        let laneWidth = parseFloat(style.lineHeight) || 12;
        let xnorm = x - centerX;
        let ynorm = centerY - y;
        let dist = Math.sqrt(xnorm ** 2 + ynorm ** 2);
        if (dist <= r && dist >= (r - laneWidth)) {
            let canvasAngle = Math.atan2(xnorm, ynorm) / Math.PI + 1.5;
            if (canvasAngle < arcStartOffset || canvasAngle > arcEndOffset)
                return false;
            return (canvasAngle - arcStartOffset) / arcOffsetRange;
        }
        return false;
    }

    getNewRawValueFromPoint(e) {
        let x = e.clientX;
        let y = e.clientY;
        let r = this.width * 0.5;
        let rect = this.canvas.getBoundingClientRect();
        let centerX = rect.left + r;
        let centerY = rect.top + r;
        let xnorm = x - centerX;
        let ynorm = centerY - y;
        let canvasAngle = Math.atan2(xnorm, ynorm) / Math.PI + 1.5;
        canvasAngle = Math.max(arcStartOffset, Math.min(arcEndOffset, canvasAngle));
        return (canvasAngle - arcStartOffset) / arcOffsetRange;
    }

    draw() {
        let size = this.width;
        let ctx = this.canvas.getContext("2d");
        let style = getComputedStyle(this.container);
        let r = size * 0.5;
        let laneWidth = parseFloat(style.lineHeight) || 12;
        let lh = laneWidth * 0.5;
        let laneColor = style.borderBottomColor;
        let meterColor = style.borderTopColor;
        if (laneColor === meterColor)
            laneColor = "#ccc";

        ctx.clearRect(0, 0, size, size);

        ctx.beginPath();
        ctx.strokeStyle = laneColor;
        ctx.lineWidth = laneWidth;
        if (this.props.rounded)
            ctx.lineCap = "round";
        ctx.arc(r, r, r - lh, arcStart, arcEnd);
        ctx.stroke();

        ctx.beginPath();
        ctx.strokeStyle = meterColor;
        ctx.arc(r, r, r - lh, arcStart, (this.state.rawValue * arcOffsetRange + arcStartOffset) * Math.PI)
        ctx.stroke();
    }

    render() {
        let textElement;
        if (this.props.showNumber) {
            textElement = (
                <div className="label"
                    style={{ position: "absolute", top: "50%", left: 0, width: "100%", textAlign: "center", transform: "translateY(-50%)", zIndex: -1 }}>
                    {this.state.text}
                </div>
            )
        }

        return (
            <div 
                className={this.props.class} 
                ref={ref => this.container = ref} 
                style={{ position: "relative", borderWidth: 0 }} >
                <canvas ref={ref => this.canvas = ref}>
                </canvas>
                {textElement}
                <input
                    type="number"
                    name={this.props.name}
                    value={this.state.value}
                    onChange={e => {return}}
                    style={{ display: "none" }} />
            </div>
        )
    }
}

export default Knob