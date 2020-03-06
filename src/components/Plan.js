/*
Copyright 2019, 2020 New Vector Ltd

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
import classNames from 'classnames';
import IssueTree from './IssueTree'
import { categorise } from '../data/categories';
import Github from '../data/Github';

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
        const { query, issues, meta } = this.props;
        const { categories, requirements } = categorise({ query, issues, meta });

        const decorateHeadingTitle = ({
            title,
            hasChildCategories,
            requirements,
            doneItems,
            totalItems,
            allDone,
        }) => {
            let newIssueButtons;
            if (!hasChildCategories && requirements.repo) {
                // For the bug button, append the `bug` label.
                const bugRequirements = Object.assign({}, requirements);
                bugRequirements.labels = [...bugRequirements.labels, "bug"];

                newIssueButtons = (
                    <span>
                        <a
                            className="new-issue"
                            onClick={this.onNewIssueClick}
                            href={Github.getNewIssueURL(requirements)}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            Add Task
                    </a>
                        <a
                            className="new-issue"
                            onClick={this.onNewIssueClick}
                            href={Github.getNewIssueURL(bugRequirements)}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            Add Bug
                    </a>
                    </span>
                );
            }

            const stateClasses = classNames({
                state: true,
                done: allDone,
            });

            return (
                <React.Fragment>
                    {title}&nbsp;<span
                        className={stateClasses}>({doneItems} / {totalItems})</span>&nbsp;
                    {newIssueButtons}
                </React.Fragment>
            );
        };

        const renderHeading = {
            phase: heading => {
                const { phase } = heading;
                let title = 'unphased';
                if (phase) {
                    title = `phase:${phase}`;
                }
                return decorateHeadingTitle({ title, ...heading });
            },
            story: heading => {
                const { story } = heading;
                let title = 'Issues not associated with a story';
                if (story) {
                    title = (
                        <a key={story.number}
                            target="_blank"
                            rel="noopener noreferrer"
                            href={story.url}>User Story: {story.number} {story.title}</a>
                    );
                }
                return decorateHeadingTitle({ title, ...heading });
            },
            repo: heading => {
                const { repo } = heading;
                const title = repo;
                return decorateHeadingTitle({ title, ...heading });
            },
        };

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
                <p className="title">{this.props.meta.milestoneTitle || title(query)}</p>
                <IssueTree
                    categories={categories}
                    requirements={requirements}
                    items={this.props.issues}
                    renderItem={renderItem}
                    sortItems={sortItems}
                    renderHeading={renderHeading}
                    collapsable={true}
                />
            </div>
        );
    }
}

export default Plan;
