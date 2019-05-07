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
        console.log(this.props);
        return (
        this.props.feature.repos.map(repo => (
            <div>
                <h3 key={ repo.repo }>{ repo.repo }</h3>
                {
                    repo.todo.concat(repo.wip)
                    .concat(repo.done)
                    .map(issue => (<div key={ issue.number }>{ issue }</div>
                    ))
                }
            </div>
            ))
        );
    }

}

export default Plan;
