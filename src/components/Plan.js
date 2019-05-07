import React, { Component } from 'react';

import TokenInput from './TokenInput';

class Plan extends Component {

    render() {
        let phases = [...new Set(
            [].concat(...this.props.issues.map(issue =>
                issue.labels.map(label => label.name)
            )))]
            .filter(label => label.startsWith("phase:"))
            .sort((a, b) => {
                return Number(a.split(":")[1]) -
                    Number(b.split(":")[1]);
            });

        let phasedIssues = {};
        phases.forEach(phase => {
            phasedIssues[phase] = this.props.issues.filter(issue => {
                return issue.labels.map(label => label.name)
                    .includes(phase);
            })
                .sort((a, b) => {
                    return a.number - b.number;
                });
        });
        console.log(phasedIssues);
        return (
            <div class="Plan">
                <p class="label">{ this.props.labels.join(' ') }</p>
                <ul>
                    {
                        phases.map(phase => {
                            return (
                                <li class="phase" key={ phase }>{ phase }
                                    <ul>
                                        {
                                            phasedIssues[phase].map(issue =>
                                                <li class="task" key={ issue.number }>
                                                    <a href={ issue.url }>{ `${issue.number} ${issue.title}` }</a>
                                                    <span class='state'>
                                                    {
                                                        issue.state === 'done' ? ' (done)' : issue.state === 'wip' ? ' (in progress)' : ''
                                                    }
                                                    </span>
                                                </li>
                                            )
                                        }
                                    </ul>
                                </li>
                            )
                        })
                    }
                </ul>
                <TokenInput status={ this.props.connectionStatus }/>
            </div>
        );
    }

}

export default Plan;
