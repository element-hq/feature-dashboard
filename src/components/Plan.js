import React, { Component } from 'react';
// import DashboardUtils from '../DashboardUtils';

class Plan extends Component {

    constructor(props) {
        super();
        this.state = {
            feature: {
                label: 'Loading...',
                repos: []
            },
            connection: {
                octokit: undefined,
                status: 'connecting'
            }
        }
    }

    render() {
        return (
            <div>I'm... a detailed { this.props.turtle }.</div>
        );
    }

}

export default Plan;
