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
import classNames from 'classnames';
import Github from '../Github';

class IssueTree extends Component {
    render() {
        let categories = this.props.categories;
        let requirements = this.props.requirements || {
            repo: null,
            labels: [],
        };
        let items = this.props.items;
        let renderItem = this.props.renderItem;
        let sortItems = this.props.sortItems;

        if (categories.length === 0) {
            return (
                <ul>
                    { items.sort(sortItems).map(item => renderItem(item)) }
                </ul>
            );
        }

        let categorize = categories[0];
        let categorized = categorize(items);

        return (
            categorized.map(bucket => {
                return <IssueTreeBucket
                    key={bucket.key}
                    bucket={bucket}
                    parentRequirements={requirements}
                    categories={categories}
                    renderItem={renderItem}
                    sortItems={sortItems}
                />
            })
        );
    }
}

class IssueTreeBucket extends Component {
    constructor(props) {
        super(props);

        const {
            bucket,
            parentRequirements,
        } = props;

        const totalItems = bucket.items.length;
        const doneItems = bucket.items.filter(item => item.state === "done").length;
        const allDone = doneItems === totalItems;

        const requirements = Object.assign({}, parentRequirements);
        if (bucket.addRequirements) {
            bucket.addRequirements(requirements);
        }

        this.state = {
            totalItems,
            doneItems,
            allDone,
            expanded: !allDone,
            requirements,
        };
    }

    onBucketClick = (e) => {
        const targetClasses = e.target.classList;
        if (!targetClasses.contains("bucket") && !targetClasses.contains("heading")) {
            // Ignore events from child list items
            return;
        }
        e.stopPropagation();
        this.setState({
            expanded: !this.state.expanded,
        });
    }

    onNewIssueClick = (e) => {
        e.stopPropagation();
    }

    render() {
        const {
            bucket,
            categories,
            renderItem,
            sortItems,
        } = this.props;

        const {
            totalItems,
            doneItems,
            allDone,
            expanded,
            requirements,
        } = this.state;

        const bucketClasses = classNames({
            bucket: true,
            expanded,
        })

        const headingClasses = classNames({
            heading: true,
            done: allDone,
        });

        const stateClasses = classNames({
            state: true,
            done: allDone,
        });

        const childCategories = categories.slice(1);
        let newIssueButtons;
        if (childCategories.length === 0 && requirements.repo) {
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

        let children;
        if (expanded) {
            children = (
                <IssueTree
                    categories={childCategories}
                    requirements={requirements}
                    items={bucket.items}
                    renderItem={renderItem}
                    sortItems={sortItems}
                />
            );
        }

        return (
            <ul>
                <li
                    className={bucketClasses}
                    onClick={this.onBucketClick}
                >
                    <span
                        className={headingClasses}
                    >{bucket.heading}&nbsp;
                        <span className={stateClasses}>({doneItems} / {totalItems})</span>&nbsp;
                        {newIssueButtons}
                    </span>
                    {children}
                </li>
            </ul>
        );
    }
}

export default IssueTree;
