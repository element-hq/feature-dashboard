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
import moment from 'moment';
import IssueTree from './IssueTree'


const title = query => {

    if (query.epics) {
        return query.epics.join(' ');
    }
    else if (query.labels) {
        return query.labels.join(' ');
    }

    return 'Untitled.';

};

class Plan extends Component {

    render() {
        const { query } = this.props;
        let categories = [];
        if (query.epics) {
            categories.push({
                label: issue => {
                    return issue.story.title;
                },
                sort: (a, b) => {
                    return Number(a.split(":")[1]) - Number(b.split(":")[1]);
                },
                unbucketed: 'unstoried'
            });
        }
        if ([].concat(...this.props.issues
                .map(issue => issue.labels)
            )
            .some(label => label.startsWith('phase:'))){
            categories.push({
                label: issue => {
                    let phases = issue.labels.filter(label => label.startsWith('phase:'));
                    if (phases.length > 0) {
                        return phases[0];
                    }
                    else return null;
                },
                sort: (a, b) => {
                    return Number(a.split(":")[1]) - Number(b.split(":")[1]);
                },
                unbucketed: 'unphased'
            });
        }
        if (this.props.query &&
            this.props.query.repos.length > 1) {
            categories.push({
                label: issue => issue.owner + '/' + issue.repo,
                sort: (a, b) => {
                    // Preserve repo ordering as entered by user
                    const ai = this.props.query.repos.indexOf(a);
                    const bi = this.props.query.repos.indexOf(b);
                    return ai - bi;
                },
            });
        }
        let renderLabel = (issue, label) => {
            if (!issue.labels.some(({ name }) => name === label)) {
                return null;
            }
            return <span className={'label ' + label}>
                {` (${label})`}
            </span>;
        };
        let renderItem = issue => {
            return (
                <li className={`task ${issue.state}`} key={ issue.number }>
                    <a href={ issue.url } target="_blank" rel="noopener noreferrer" >{ `${issue.number} ${issue.title}` }</a>
                    <span className={ 'state ' + issue.state }>
                            { issue.state === 'done' ? ' (done)' : 
                              issue.state === 'wip' ? ` (${issue.assignees[0]} started ${moment(issue.inProgressSince).fromNow()}${issue.progress ? ': ' + issue.progress + ' complete': ''})` : '' }
                    </span>
                    { renderLabel(issue, 'blocked') }
                </li>
            );
        };

        let sortItems = (a, b) => {
            let states = ['done', 'wip', 'todo'];
            if (a.state !== b.state) {
                return states.indexOf(a.state) - states.indexOf(b.state);
            }
            return a.number - b.number;
        };

        return (
            <div className="Plan raised-box">
                <p className="title">{ title(this.props.query) }</p>
                <IssueTree
                    categories={ categories }
                    items={ this.props.issues }
                    renderItem={ renderItem }
                    sortItems={ sortItems }
                />
            </div>
        )

    }
}

export default Plan;
