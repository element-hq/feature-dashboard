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
import { categorise } from '../data/categories';
import IssueTree from './IssueTree';

function template() {
    return {
        todo: {
            issues: [],
            p1bugs: [],
            p2bugs: [],
            p3bugs: [],
        },
        wip: {
            issues: [],
            p1bugs: [],
            p2bugs: [],
            p3bugs: [],
        },
        done: {
            issues: [],
            p1bugs: [],
            p2bugs: [],
            p3bugs: [],
        }
    };
}

function calculatePercentCompleted(buckets) {
    let counted = ['issues', 'p1bugs'];

    let completed = counted.map(type => buckets.done[type].length).reduce((a, b) => a + b);
    let total = counted.map(type =>
        buckets.todo[type].length +
        buckets.wip[type].length +
        buckets.done[type].length).reduce((a, b) => a + b, 0);

    if (total === 0) {
        return '~';
    }
    return (completed / total * 100).toFixed(0);
}

class SummaryRow extends Component {
    getAssigneesFilter(issues) {
        let filter = [...new Set(issues.map(issue => issue.assignees)
            .reduce((a, b) => a.concat(b), []))]
            .map(assignee => `assignee:${assignee}`)
            .join('+');
        if (!filter) {
            filter = 'no:assignee';
        }
        return filter;
    }

    makeLink(requirements, q, issues) {
        const { repo, labels } = requirements;

        if (issues.length === 0) {
            return (
                <span>0</span>
            );
        }
        if (!q) {
            q = []
        }
        let advanced = false;

        if (q.includes('assignee:*')) {
            /* If the list of labels includes ['assignee', '*'], we'll strip it from the
             * list and implement our search link using github's _advanced_ search
             * functionality instead. This is because assignee:* doesn't reliably work
             * with regular search (or advanced), so instead we have to apply the other
             * search criteria _and_ a list of assignee:x where x all the assignees of
             * all the issues which have assignees. Is that clear? Good, great. */
            q = q.filter(item => item !== 'assignee:*')
            advanced = true;
        }
        if (labels) {
            // FIXME: Links won't work for epics :(
            q = q.concat(labels.map(label => `label:${label}`));
        }

        let queryString = q.join('+');

        let searchUrl = "";
        if (advanced) {
            let assigneesFilter = this.getAssigneesFilter(issues);
            searchUrl = `https://github.com/search?utf8=%E2%9C%93&q=repo%3A${repo}+${queryString}+${assigneesFilter}&type=Issues&ref=advsearch&l=&l=+`;
        }
        else {
            searchUrl = `https://github.com/${repo}/issues?utf8=%E2%9C%93&q=${queryString}`;
        }

        let issueNumbers = issues.map(x => `#${x.number} ${x.title}`).reduce((a, b) => a.concat(b), []);
        return (
            <a href={ searchUrl } target="_blank" rel="noopener noreferrer" title={ issueNumbers.join("\n") }>
                { issueNumbers.length }
            </a>
        );
    }

    render() {
        const {
            requirements,
            items,
        } = this.props;

        if (!items) {
            return <div className="Summary-Row"><div>&nbsp;</div></div>;
        }

        const buckets = template();
        for (const issue of items) {
            buckets[issue.state][issue.type].push(issue);
        }

        return (
            <div className="Summary-Row">
                <div>{
                    this.makeLink(
                        requirements,
                        [
                            'is:open',
                            'no:assignee',
                            '-label:bug',
                        ],
                        buckets.todo.issues
                    )
                }</div>
                <div>{
                    this.makeLink(
                        requirements,
                        [
                            'is:open',
                            'assignee:*',
                            '-label:bug',
                        ],
                        buckets.wip.issues
                    )
                }</div>
                <div>{
                    this.makeLink(
                        requirements,
                        [
                            'is:closed',
                            '-label:bug',
                        ],
                        buckets.done.issues
                    )
                }</div>
                <div>{
                    this.makeLink(
                        requirements,
                        [
                            'is:open',
                            'no:assignee',
                            'label:bug',
                            '-label:p2', /* Any bug not flagged as p2-5 is p1 */
                            '-label:p3', /* This is weird, but encourages the triaging */
                            '-label:p4', /* of unprioritised bugs. */
                            '-label:p5'
                        ],
                        buckets.todo.p1bugs
                    )
                }</div>
                <div>{
                    this.makeLink(
                        requirements,
                        [
                            'is:open',
                            'no:assignee',
                            'label:bug',
                            'label:p2'
                        ],
                        buckets.todo.p2bugs
                    )
                }</div>
                <div>{
                    this.makeLink(
                        requirements,
                        [
                            'is:open',
                            'no:assignee',
                            'label:bug',
                            'label:p3'
                        ],
                        buckets.todo.p3bugs
                    )
                }</div>
                <div>{
                    this.makeLink(
                        requirements,
                        [
                            'is:open',
                            'assignee:*',
                            'label:bug'
                        ],
                        buckets.wip.p1bugs.concat(buckets.wip.p2bugs).concat(buckets.wip.p3bugs)
                    )
                }</div>
                <div>{
                    this.makeLink(
                        requirements,
                        [
                            'is:closed',
                            'label:bug'
                        ],
                        buckets.done.p1bugs.concat(buckets.done.p2bugs).concat(buckets.done.p3bugs)
                    )
                }</div>
                <div className="Completed">{ calculatePercentCompleted(buckets) }%</div>
            </div>
        );
    }
}

const title = query => {

    if (query.epics) {
        return query.epics.join(' ');
    }
    else if (query.labels) {
        return query.labels.join(' ');
    }

    return 'Untitled.';

};

class Summary extends Component {
    render() {
        const { query, issues, meta } = this.props;
        const { categories, requirements } = categorise({ query, issues, meta });

        // Bucket issues by state just for the overall progress
        const buckets = template();
        for (const issue of issues) {
            buckets[issue.state][issue.type].push(issue);
        }

        const rows = [];

        const renderHeading = {
            phase: heading => {
                const { phase } = heading;
                let title = 'unphased';
                if (phase) {
                    title = `phase:${phase}`;
                }
                rows.push(<SummaryRow />);
                return title;
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
                rows.push(<SummaryRow />);
                return title;
            },
            repo: heading => {
                const { repo, requirements, items } = heading;
                const title = repo;
                rows.push(
                    <SummaryRow
                        requirements={requirements}
                        items={items}
                    />
                );
                return title;
            },
        };

        return (
            <div className="Summary raised-box">
                <div className="Summary-Header">
                    <div className="Label">{ this.props.meta.milestoneTitle || title(this.props.query) }</div>
                    <div className="PercentComplete">{ calculatePercentCompleted(buckets) }%</div>
                </div>
                <div className="Summary-Body">
                    <div className="Summary-CategoryTree">
                        <div className="Summary-TableHeader">Category</div>
                        <IssueTree
                            categories={categories}
                            requirements={requirements}
                            items={this.props.issues}
                            renderHeading={renderHeading}
                        />
                    </div>
                    <div className="Summary-Table">
                        <div className="Summary-Column"></div>
                        <div className="Summary-Column Implementation"></div>
                        <div className="Summary-Column Implementation"></div>
                        <div className="Summary-Column Implementation"></div>
                        <div className="Summary-Column Bugs"></div>
                        <div className="Summary-Column Bugs"></div>
                        <div className="Summary-Column Bugs"></div>
                        <div className="Summary-Column Bugs"></div>
                        <div className="Summary-Column Bugs"></div>
                        <div className="Summary-Column"></div>
                        <div className="Summary-Column"></div>
                        <div className="Summary-Row Summary-TableHeader">
                            <div><span className="MetaTitleHolder"><span className="MetaTitle">Planned Work</span></span>Todo</div>
                            <div>WIP</div>
                            <div>Done</div>
                            <div><span className="MetaTitleHolder"><span className="MetaTitle">Bugs</span></span>P1</div>
                            <div>P2</div>
                            <div>P3</div>
                            <div>WIP</div>
                            <div>Fixed</div>
                            <div>Progress</div>
                        </div>
                        {rows}
                    </div>
                </div>
            </div>
        );
    }
}

export default Summary;
