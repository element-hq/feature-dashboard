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

        let { label, sort, unbucketed } = categories[0];

        let headings = [...new Set(items.filter(label).map(label))].sort(sort);

        let buckets = {};
        headings.forEach(heading => {
            buckets[heading] = items.filter(item => label(item) === heading);
        });

        // If we're interested in issues that weren't matched by the filter,
        // throw them into an 'unbucketed' category.
        if (unbucketed) {
            let unbucketedItems = items.filter(item =>
                !Object.values(buckets).reduce(Array.concat, []).includes(item));

            if (unbucketedItems.length > 0) {
                buckets[unbucketed] = unbucketedItems;
            }
        }

        return (
            Object.keys(buckets).map(bucket => {
                if (buckets[bucket].length > 0) {
                    return (
                        <ul>
                            <li className="heading" key={ bucket }>{ bucket }
                                <IssueTree
                                    categories={ categories.slice(1) }
                                    items={ buckets[bucket] }
                                    renderItem={ renderItem }
                                    sortItems={ this.props.sortItems }
                                />
                            </li>
                        </ul>
                    )
                }
                else return null;
            })
        );
    }
}


class Plan extends Component {

    render() {
        let categories = [
            {
                label: issue => {
                    let phases = issue.labels.filter(label => label.name.startsWith('phase:'));
                    if (phases.length > 0) {
                        return phases[0].name;
                    }
                    else return null;
                },
                sort: (a, b) => {
                    return Number(a.split(":")[1]) - Number(b.split(":")[1]);
                },
                unbucketed: 'unphased'
            }
        ];
        if (this.props.repos.length > 1) {
            categories.push({
                label: issue => issue.owner + '/' + issue.repo,
            });
        }
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
        };

        let sortItems = (a, b) => {
            let states = ['done', 'wip', 'todo'];
            if (a.state !== b.state) {
                return states.indexOf(a.state) - states.indexOf(b.state);
            }
            return a.number - b.number;
        };

        return (
            <div className="Plan">
                <p className="label">{ this.props.labels.join(' ') }</p>
                <IssueTree
                    categories={ categories }
                    items={ this.props.issues }
                    renderItem={ renderItem }
                    sortItems={ sortItems }
                />
                <TokenInput status={ this.props.connectionStatus }/>
            </div>
        )

    }
}

export default Plan;
