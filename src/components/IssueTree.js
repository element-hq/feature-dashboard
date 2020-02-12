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
import classNames from 'classnames';

class IssueTree extends Component {

    render() {
        let categories = this.props.categories;
        let items = this.props.items;
        let renderItem = this.props.renderItem;

        if (categories.length === 0) {
            return (
                <ul>
                    { items.sort(this.props.sortItems).map(item => renderItem(item)) }
                </ul>
            );
        }

        let categorize = categories[0];
        let categorized = categorize(items);

        return (
            categorized.map(bucket => {
                const total = bucket.items.length;
                const done = bucket.items.filter(item => item.state === "done").length;

                const headingClasses = classNames({
                    heading: true,
                    done: done === total,
                });

                const stateClasses = classNames({
                    state: true,
                    done: done === total,
                });

                return (
                    <ul key={ bucket.key }>
                        <li>
                            <span className={headingClasses}>{bucket.heading}&nbsp;
                                <span className={stateClasses}>({done} / {total})</span>
                            </span>
                            <IssueTree
                                categories={ categories.slice(1) }
                                items={ bucket.items }
                                renderItem={ renderItem }
                                sortItems={ this.props.sortItems }
                            />
                        </li>
                    </ul>
                )
            })
        );
    }
}

export default IssueTree;
