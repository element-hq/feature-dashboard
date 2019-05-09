import React, { Component } from 'react';

class TokenInput extends Component {

    handleClick(e) {
        e.preventDefault();
        let token = prompt('Personal github token', localStorage.getItem('github_token') || '');
        if (token !== null) {
            localStorage.setItem('github_token', token);
            window.location.reload();
        }
    }

    render() {
        return (
            <div className={ `TokenInput ${this.props.status}` } 
                onClick={ this.handleClick }
                title={
                    this.props.status === 'unauthenticated' ? 'Add a personal GitHub token to raise the limit of requests you can make to the API' :
                    this.props.status === 'invalid-credentials' ? 'Your github token is invalid (fell back to unauthenticated access)' : 'Successfully connecting using personal GitHub token'
                }>
                { this.props.status === 'unauthenticated' ? 'Add ' : '' }Personal GitHub Token
            </div>
        );
    }

}

export default TokenInput;
