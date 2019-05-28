import React, { Component } from 'react';

class Fail extends Component {

    render() {
        return (
            <pre>
                {`
    ▄██████████████▄▐█▄▄▄▄█▌
    ██████▌▄▌▄▐▐▌███▌▀▀██▀▀
    ████▄█▌▄▌▄▐▐▌▀███▄▄█▌
    ▄▄▄▄▄██████████████

    What is a "`}
            { Array.join(
                this.props.location.pathname.match(/.{1,36}/g),
                '\n                       ')
            }"?
            </pre>
        );
    }
}

export default Fail;
