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

class IssueTree extends Component {

    render() {
        let fields = this.props.fields;
        let items = this.props.items;
        let renderItem = this.props.renderItem;

        let thisLevel = fields[0];

        let thisField = thisLevel.field;
        let unbucketedName = thisLevel.unbucketed || 'noname';
        let sort = thisLevel.sort || Array.sort;

        let headings = sort([...new Set(items.filter(thisField).map(thisField))]);
        let buckets = {};
        let bucketed = [];
        headings.forEach(heading => {
            buckets[heading] = items.filter(item => thisField(item) === heading);
            bucketed = bucketed.concat(buckets[heading]);
        });
        let unbucketed = items.filter(item => !bucketed.includes(item));
        if (unbucketed.length > 0) {
            buckets[unbucketedName] = unbucketed;
        }

        if (fields.length === 1) {
            return (
                Object.keys(buckets).map(bucket => {
                    if (buckets[bucket].length === 0) {
                        return null;
                    }
                    else {
                        return (
                            <li className="heading" key={bucket}>{ bucket }
                                <ul>
                                {
                                    buckets[bucket].map(item => renderItem(item))
                                }
                                </ul>
                            </li>
                        )
                    }
                })
            );
        }
        else {
            let body = fields.slice(1);
            return (
                Object.keys(buckets).map(bucket => {
                    return (
                        <li className="heading" key={ bucket }>{ bucket }
                            <ul>
                                <IssueTree fields={ body } items={ buckets[bucket] } renderItem={ renderItem } />
                            </ul>
                        </li>
                    )
                })
            );
        }
    }
}


class Plan extends Component {

    render() {
        let fields = [
            {
                field: issue => {
                    let phases = issue.labels.filter(label => label.name.startsWith('phase:'));
                    if (phases.length > 0) {
                        return phases[0].name;
                    }
                    else return null;
                },
                unbucketed: 'unphased'
            },
            {
                field: issue => issue.owner + '/' + issue.repo,
            }
        ];
        let renderItem = issue => {
            return (
                <li className="task" key={ issue.number }>
                    <a href={ issue.url } target="_blank" rel="noopener noreferrer" >{ `${issue.number} ${issue.title}` }</a>
                    <span className={ 'state ' + issue.state }>
                    {
                        issue.state === 'done' ? ' (done)' : issue.state === 'wip' ? ' (in progress)' : ''
                    }
                    </span>
                </li>
            );
        }
        return (
            <div className="Plan">
                <p className="label">{ this.props.labels.join(' ') }</p>
                <ul>
                    <IssueTree fields={ fields } items={ this.props.issues } renderItem={ renderItem } />
                </ul>
                <TokenInput status={ this.props.connectionStatus }/>
            </div>
        )

    }
}
    /*
        let repos = this.props.repos;
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
            phasedIssues[phase] = {};
            repos.forEach(repo => {
                phasedIssues[phase][repo] = this.props.issues.filter(issue => {
                    // FIXME: repo should either mean "vector-im/riot-web" or "riot-web"
                    // consistently
                    return (issue.labels.map(label => label.name).includes(phase)
                        && (issue.owner + '/' + issue.repo) === repo );
                });
            });
        });

        // Add unphased issues as an extra section
        phasedIssues["unphased"] = {};
        repos.forEach(repo => {
            phasedIssues["unphased"][repo] = this.props.issues.filter(issue => {
                const labels = issue.labels.map(label => label.name);
                // FIXME: repo should either mean "vector-im/riot-web" or "riot-web"
                // consistently
                return (!labels.some(label => label.startsWith("phase:"))
                    && (issue.owner + '/' + issue.repo) === repo);
            });
            if (phasedIssues["unphased"][repo].length > 0) {
                phases.push("unphased");
            }
        });

        // Sort issues in all phases (including unphased) by state
        phases.forEach(phase => {
            repos.forEach(repo => {
                phasedIssues[phase][repo].sort((a, b) => {
                    let states = ['done', 'wip', 'todo'];
                    if (a.state === b.state) {
                        return a.number - b.number;
                    }
                    else {
                        return states.indexOf(a.state) - states.indexOf(b.state);
                    }
                });
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
                                        repos.map(repo => {
                                            if (phasedIssues[phase][repo].length === 0) return null;
                                            return (
                                                <li className="repo" key={ repo }>{ repo }
                                                    <ul>
                                                        {
                                                            phasedIssues[phase][repo].map(issue =>
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
*/
export default Plan;
