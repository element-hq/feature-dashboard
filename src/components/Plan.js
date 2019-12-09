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
        // FIXME: Inconsistent - can we speicify one epic or many?
        console.log('titling', query.epics[0]);
        return query.epics[0].replace(/^epic:/, '');
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
            categories.push(issues => {
                let categorized = [];

                for (const userStory of this.props.meta.userStories) {
                    categorized.push({
                        key: userStory.number,
                        heading: (
                            <a key={ userStory.number }
                               target="_blank"
                               rel="noopener noreferrer" 
                               href={ userStory.url }>
                                <span className="id">{ userStory.number }</span>
                                <span className="story">{ userStory.title }</span>
                            </a>
                        ),
                        class: 'stories',
                        items: issues.filter(issue => issue.story && issue.story.number === userStory.number)
                    });
                }
                let unstoried = issues.filter(issue => !issue.story);
                if (unstoried.length > 0) {
                    categorized.push({
                        key: -1,
                        heading: 'Issues not associated with a story',
                        class: 'stories',
                        items: unstoried
                    });
                }

                return categorized;
            });
        }
        /*
        if ([].concat(...this.props.issues
                .map(issue => issue.labels)
            )
            .some(label => label.startsWith('phase:'))) {
            categories.push(issues => {
                let phases = issues.map(issue => issue.getNumberedLabelValue('phase')).sort();

                let categorized = [];
                for (const phase of phases) {
                    categorized.push({
                        key: phase,
                        heading: `phase:${phase}`,
                        class: 'phases',
                        items: issues.filter(issue => issue.getNumberedLabelValue('phase') === phase)
                    });
                }
                categorized.push({
                    key: -1,
                    heading: 'unphased',
                    class: 'phases',
                    items: issues.filter(issue => issue.getNumberedLabelValue('phase') === null)
                });

                return categorized;
            });
        }
        */
        if (this.props.query &&
            this.props.query.repos.length > 1) {
            categories.push(issues => {
                let repos = [...new Set(issues.map(issue => `${issue.owner}/${issue.repo}`))]
                    .sort((repoA, repoB) => {
                        return this.props.query.repos
                                .indexOf(repoA)
                               - this.props.query.repos
                                .indexOf(repoB);
                    });

                let categorized = [];
                for (const repo of repos) {
                    categorized.push({
                        key: repo,
                        heading: (
                            <span className="repo">{ repo }</span>
                        ),
                        class: 'repos',
                        items: issues.filter(issue => `${issue.owner}/${issue.repo}` === repo)
                    });
                }

                return categorized;
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
            let topRight = null;
            if (issue.state !== 'wip') {
                topRight = (
                    <span className="topRight">
                        <span className="stateText">{ issue.state }</span>
                    </span>
                );
            }
            else if (issue.assignees && issue.assignees.length > 0) {
                topRight = (
                    <span className="topRight">
                        <span className="owner">{ issue.assignees && issue.assignees[0] }</span>
                        <span className="time">Started { moment(issue.inProgressSince).fromNow() }</span>
                    </span>
                );
            }

            let progress = null;
            if(issue.state === 'wip' && issue.progress) {
                let done = issue.progress.done / issue.progress.total * 100;
                let remaining = 100 - done;
                progress = (
                    <span className="progress">
                        <span className="progress-description">{ `${issue.progress.done}/${issue.progress.total}` }</span>
                        <span className="progress-done" style={{width: `${done}%`}}></span>
                        <span className="progress-total" style={{width: `${remaining}%`}}></span>
                    </span>

                );
            }

            let labels = null;
            let relevantLabels = issue.labels.filter(x => ['defect', 'regression'].includes(x) || x.startsWith('blocked'));
            if(relevantLabels.length > 0) {
                labels = (
                    <span className="labels">
                        <span style={{background: '#E34E4E'}}>{ relevantLabels[0] }</span>
                    </span>
                )
            }
            return (
                <li key={ issue.number }>
                    <a className={ `card ${issue.state }` } href={ issue.url } target="_blank" rel="noopener noreferrer" >
                        <span className="status"></span>
                        <span className="card-body">
                            <span className="top">
                                <span className="id">{ issue.number }</span>
                                { topRight }
                            </span>
                            <span className="title">{ issue.title }</span>
                            { progress }
                            { labels }
                        </span>
                    </a>

                </li>
            );
        };

        /*
         
                    <!--
                        { `${issue.number} ${issue.title}` }</a>
                    <span className={ 'state ' + issue.state }>
                            { issue.state === 'done' ? ' (done)' : 
                              issue.state === 'wip' ? ` (${issue.assignees[0]} started ${moment(issue.inProgressSince).fromNow()}${issue.progress ? ': ' + issue.progress + ' complete': ''})` : '' }
                    </span>
                        { renderLabel(issue, 'blocked') }
                        -->

*/

        let sortItems = (a, b) => {
            let states = ['done', 'wip', 'todo'];
            if (a.state !== b.state) {
                return states.indexOf(a.state) - states.indexOf(b.state);
            }
            return a.number - b.number;
        };

        return (
            <div className="plan">
                <h1>{ this.props.meta.milestoneTitle && this.props.meta.milestoneTitle.replace(/^epic:/, '') || title(this.props.query) }</h1>
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
