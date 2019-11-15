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
import Github from '../Github';
import IssueTree from './IssueTree';

class Epic extends Component {

    constructor(props) {
        super();
        this.state = {
            issues: [],
            repos: [],
            labels: []
        }
    }

    async update(props) {
        if (props.query) {
            this.setState({
                issues: await Github.getEpics(
                    props.token,
                    props.query.epic,
                    props.query.repo
                )
            });
        }
    }

    async componentWillReceiveProps(nextProps) {
        if (nextProps.query !== this.props.query) {
            await this.update(nextProps);
        }
    }

    async componentDidMount() {
        this.update(this.props);
    }

    render() {
        let categories = [
            {
                label: issue => {
                    return issue.story.title;
                    /*
                    let stories = issue.labels.filter(label => label.startsWith('story:'));
                    console.log('issue', issue.story);
                    if (stories.length > 0) {
                        return stories[0];
                    }
                    else return null;
                    */
                },
                sort: (a, b) => {
                    return Number(a.split(":")[1]) - Number(b.split(":")[1]);
                },
                unbucketed: 'unstoried'
            }
        ];
        if (this.state.repos.length > 1) {
            categories.push({
                label: issue => issue.owner + '/' + issue.repo,
                sort: (a, b) => {
                    // Preserve repo ordering as entered by user
                    const ai = this.state.repos.indexOf(a);
                    const bi = this.state.repos.indexOf(b);
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
                        { issue.state === 'done' ? ' (done)' : issue.state === 'wip' ? ' (in progress)' : '' }
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
                <p className="query-labels">{ this.state.labels.join(' ') }</p>
                <IssueTree
                    categories={ categories }
                    items={ this.state.issues }
                    renderItem={ renderItem }
                    sortItems={ sortItems }
                />
            </div>
        )

    }

}

export default Epic;
