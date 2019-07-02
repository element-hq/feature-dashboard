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
import dateFormat from 'dateformat';

import TokenInput from './TokenInput';

function template(labels, repo) {
    return {
        labels: labels,
        repo: repo,
        deliveryDate: undefined,
        todo: {
            issues: [],
            p1bugs: [],
            p2bugs: [],
            p3bugs: [],
            others: []
        },
        wip: {
            issues: [],
            p1bugs: [],
            p2bugs: [],
            p3bugs: [],
            others: []
        },
        done: {
            issues: [],
            p1bugs: [],
            p2bugs: [],
            p3bugs: [],
            others: []
        }
    };
}

function establishDeliveryDate(issue, deliveryDate) {
    if (deliveryDate === null) {
        return null;
    }
    else if (issue.milestone && issue.milestone.due_on) {
        if (deliveryDate === undefined) {
            return new Date(issue.milestone.due_on);
        }
        else {
            return Math.max(deliveryDate, new Date(issue.milestone.due_on));
        }
    }
    else {
        return null;
    }
}


function generateSummary(issues, labels, searchRepos) { 
    const repos = {};
    for (const repo of searchRepos) {
        repos[repo] = template(labels, repo);
    }

    for (const issue of issues) {
        const repoName = `${issue.owner}/${issue.repo}`
        const repo = repos[repoName];

        repo[issue.state][issue.type].push(issue);
        if (issue.state !== 'done' && ['issues', 'p1bugs'].includes(issue.type)) {
            repo.deliveryDate = establishDeliveryDate(issue, repo.deliveryDate);
        }

    }
    return {
        labels: labels,
        repos: Object.values(repos)
    }
}


class SummaryRow extends Component {
    calculatePercentCompleted(repoFeature) {
        let counted = ['issues', 'p1bugs'];

        let completed = counted.map(type => repoFeature.done[type].length).reduce((a, b) => a + b);
        let total = counted.map(type =>
            repoFeature.todo[type].length +
            repoFeature.wip[type].length +
            repoFeature.done[type].length).reduce((a, b) => a + b, 0);

        if (total === 0) {
            return '~';
        }
        return (completed / total * 100).toFixed(0);
    }

    getAssigneesFilter(issues) {
        let filter = [...new Set(issues.map(issue => issue.assignees.map(assignee => assignee.login))
            .reduce((a, b) => a.concat(b), []))]
            .map(assignee => `assignee:${assignee}`)
            .join('+');
        if (!filter) {
            filter = 'no:assignee';
        }
        return filter;
    }

    makeLink(repo, labels, q, issues) {
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
        q = q.concat(labels.map(label => `label:${label}`));

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
        let repoFeature = this.props.repoFeature;

        return (
            <div className="Summary-Row">
                <div><a href={ `https://github.com/${ repoFeature.repo }/issues` }>{ repoFeature.repo }</a></div>
                <div>{
                    this.makeLink(
                        repoFeature.repo,
                        repoFeature.labels,
                        [
                            'is:open',
                            'no:assignee',
                            'label:feature'
                        ],
                        repoFeature.todo.issues
                    )
                }</div>
                <div>{
                    this.makeLink(
                        repoFeature.repo,
                        repoFeature.labels,
                        [
                            'is:open',
                            'assignee:*',
                            'label:feature'
                        ],
                        repoFeature.wip.issues
                    )
                }</div>
                <div>{
                    this.makeLink(
                        repoFeature.repo,
                        repoFeature.labels,
                        [
                            'is:closed',
                            'label:feature'
                        ],
                        repoFeature.done.issues
                    )
                }</div>
                <div>{
                    this.makeLink(
                        repoFeature.repo,
                        repoFeature.labels,
                        [
                            'is:open',
                            'no:assignee',
                            'label:bug',
                            '-label:p2', /* Any bug not flagged as p2-5 is p1 */
                            '-label:p3', /* This is weird, but encourages the triaging */
                            '-label:p4', /* of unprioritised bugs. */
                            '-label:p5'
                        ],
                        repoFeature.todo.p1bugs
                    )
                }</div>
                <div>{
                    this.makeLink(
                        repoFeature.repo,
                        repoFeature.labels,
                        [
                            'is:open',
                            'no:assignee',
                            'label:bug',
                            'label:p2'
                        ],
                        repoFeature.todo.p2bugs
                    )
                }</div>
                <div>{
                    this.makeLink(
                        repoFeature.repo,
                        repoFeature.labels,
                        [
                            'is:open',
                            'no:assignee',
                            'label:bug',
                            'label:p3'
                        ],
                        repoFeature.todo.p3bugs
                    )
                }</div>
                <div>{
                    this.makeLink(
                        repoFeature.repo,
                        repoFeature.labels,
                        [
                            'is:open',
                            'assignee:*',
                            'label:bug'
                        ],
                        repoFeature.wip.p1bugs.concat(repoFeature.wip.p2bugs).concat(repoFeature.wip.p3bugs)
                    )
                }</div>
                <div>{
                    this.makeLink(
                        repoFeature.repo,
                        repoFeature.labels,
                        [
                            'is:closed',
                            'label:bug'
                        ],
                        repoFeature.done.p1bugs.concat(repoFeature.done.p2bugs).concat(repoFeature.done.p3bugs)
                    )
                }</div>
                <div>{
                    this.makeLink(
                        repoFeature.repo,
                        repoFeature.labels,
                        ['is:open'].concat(repoFeature.todo.others.concat(repoFeature.wip.others).map(issue => issue.number)),
                        repoFeature.todo.others.concat(repoFeature.wip.others)
                    )
                }</div>
                <div className={ repoFeature.deliveryDate ? "" : "NoDate" }>{ repoFeature.deliveryDate ?
                        dateFormat(repoFeature.deliveryDate, 'yyyy-mm-dd') :
                    'n/a' }</div>
                <div className="Completed">{ this.calculatePercentCompleted(repoFeature) }%</div>
            </div>
        );
    }
}

class Summary extends Component {
    calculatePercentCompleted(feature) {
        let counted = ['issues', 'p1bugs'];

        let completed = 0;
        let total = 0;

        for (const repoFeature of feature.repos) {
            completed += counted.map(type => repoFeature.done[type].length).reduce((a, b) => a + b);
            total += counted.map(type => 
                repoFeature.todo[type].length +
                repoFeature.wip[type].length +
                repoFeature.done[type].length).reduce((a, b) => a + b, 0);
        }

        if (total === 0) {
            return "~";
        }
        return (completed / total * 100).toFixed(0);
    }

    render() {
        let feature = generateSummary(
            this.props.issues,
            this.props.labels,
            this.props.repos
        );

        let rows = feature.repos.map(repo => <SummaryRow repoFeature={ repo }
            key={ repo.repo } />
        );

        return (
            <div className="Summary raised-box">
                <div className="Summary-Header">
                    <div className="Label">{ feature.labels.join(' ') }</div>
                    <div className="PercentComplete">{ this.calculatePercentCompleted(feature) }%</div>
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
                    <div className="Summary-Column"></div>
                    <div className="Summary-Row Summary-TableHeader">
                        <div>Repo</div>
                        <div><span className="MetaTitleHolder"><span className="MetaTitle">Planned Work</span></span>Todo</div>
                        <div>WIP</div>
                        <div>Done</div>
                        <div><span className="MetaTitleHolder"><span className="MetaTitle">Bugs</span></span>P1</div>
                        <div>P2</div>
                        <div>P3</div>
                        <div>WIP</div>
                        <div>Fixed</div>
                        <div>Other</div>
                        <div>Delivery</div>
                        <div></div>
                    </div>
                    { rows }
                </div>
                <TokenInput status={ this.props.connectionStatus }/>
            </div>
        );
    }
}

export default Summary;
