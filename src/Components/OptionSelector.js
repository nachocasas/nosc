import React from 'react';

export default function OptionSelector(props) {
    let emptyNode = null;

    const options = props.options.map(elem => {
        return (<option value={elem.id} key={elem.id}>{elem.name}</option>);
    });

    if(props.emptyNode){
        emptyNode = <option value="" key="select">----</option>
    }

    return (
        <div className="optionSelector">
            <span>{props.title}</span>
            <select value={props.value} className={props.selectStyles} onChange={ props.handleChange }>
                {emptyNode}
                {options}
            </select>
        </div>
    );
}