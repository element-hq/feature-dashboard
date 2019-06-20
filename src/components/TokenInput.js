/*
Copyright 2019 New Vector Ltd

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

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
