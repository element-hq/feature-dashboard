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

        if (fields.length === 0) {
            return items.sort(this.props.sortItems).map(item => renderItem(item));
        }

        let thisLevel = fields[0];

        let thisField = thisLevel.field;
        let unbucketedName = thisLevel.unbucketedName || 'noname';

        let headings = [...new Set(items.filter(thisField).map(thisField))].sort(thisLevel.sort);

        let buckets = {};
        headings.forEach(heading => {
            buckets[heading] = items.filter(item => thisField(item) === heading);
        });

        // Put any of the items that didn't land in a headered bucket into the
        // 'unbucketed' category.
        let unbucketed = items.filter(item =>
            !Object.values(buckets).reduce(Array.concat, []).includes(item));

        if (unbucketed.length > 0) {
            buckets[unbucketedName] = unbucketed;
        }

        return (
            Object.keys(buckets).map(bucket => {
                if (buckets[bucket].length > 0) {
                    return (
                        <li className="heading" key={ bucket }>{ bucket }
                            <ul>
                                <IssueTree
                                    fields={ fields.slice(1) }
                                    items={ buckets[bucket] }
                                    renderItem={ renderItem }
                                    sortItems={ this.props.sortItems }
                                />
                            </ul>
                        </li>
                    )
                }
                else return null;
            })
        );
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
                sort: (a, b) => {
                    return Number(a.split(":")[1]) -
                        Number(b.split(":")[1]);
                },
                unbucketedName: 'unphased'
            }
        ];
        if (this.props.repos.length > 1) {
            fields.push({
                field: issue => issue.owner + '/' + issue.repo,
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

        return (
            <div className="Plan">
                <p className="label">{ this.props.labels.join(' ') }</p>
                <ul>
                    <IssueTree
                        fields={ fields }
                        items={ this.props.issues }
                        renderItem={ renderItem }
                        sortItems={ (a, b) => a.number - b.number }
                    />
                </ul>
                <TokenInput status={ this.props.connectionStatus }/>
            </div>
        )

    }
}

export default Plan;
