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
                return issue.labels.map(label => label.name).includes(phase);
            });
        });

        // Add unphased issues as an extra section
        phasedIssues["unphased"] = this.props.issues.filter(issue => {
            const labels = issue.labels.map(label => label.name);
            return !labels.some(label => label.startsWith("phase:"));
        });
        if (phasedIssues["unphased"].length > 0) {
            phases.push("unphased");
        }

        // Sort issues in all phases (including unphased) by state
        phases.forEach(phase => {
            phasedIssues[phase].sort((a, b) => {
                let states = ['done', 'wip', 'todo'];
                if (a.state === b.state) {
                    return a.number - b.number;
                }
                else {
                    return states.indexOf(a.state) - states.indexOf(b.state);
                }
            });
        });

        return (
            <div className="Plan">
                <p className="label">{ this.props.labels.join(' ') }</p>
                <ul>
                    {
                        phases.map(phase => {
                            return (
                                <li className="phase" key={ phase }>{ phase }
                                    <ul>
                                        {
                                            phasedIssues[phase].map(issue =>
                                                <li className="task" key={ issue.number }>
                                                    <a href={ issue.url } target="_blank" rel="noopener noreferrer" >{ `${issue.number} ${issue.title}` }</a>
                                                    <span className={ 'state ' + issue.state }>
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
