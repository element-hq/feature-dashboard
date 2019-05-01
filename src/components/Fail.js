import React, { Component } from 'react';

class FailWhale extends Component {

    render() {
        return (
            <pre>
                {`
    ▄██████████████▄▐█▄▄▄▄█▌
    ██████▌▄▌▄▐▐▌███▌▀▀██▀▀
    ████▄█▌▄▌▄▐▐▌▀███▄▄█▌
    ▄▄▄▄▄██████████████

    Please what means "`}
            { Array.join(
                this.props.location.pathname.match(/.{1,36}/g),
                '\n                       ')
            }"?
            </pre>
        );
    }
}

export default FailWhale;
