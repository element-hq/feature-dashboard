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

class IssueTree extends Component {
    render() {
        let categories = this.props.categories;
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

        const { bucket } = props;

        const totalItems = bucket.items.length;
        const doneItems = bucket.items.filter(item => item.state === "done").length;
        const allDone = doneItems === totalItems;

        this.state = {
            totalItems,
            doneItems,
            allDone,
            expanded: !allDone,
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

        let children;
        if (expanded) {
            children = (
                <IssueTree
                    categories={categories.slice(1)}
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
                        <span className={stateClasses}>({doneItems} / {totalItems})</span>
                    </span>
                    {children}
                </li>
            </ul>
        );
    }
}

export default IssueTree;
