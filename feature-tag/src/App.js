import React, { Component } from 'react';
import dateFormat from 'dateformat';
import Octokit from '@octokit/rest';
import queryString from 'query-string';
import './App.css';

const TOKEN = ''; /* Github personal access token goes here (for now) */

let options = {};
if (TOKEN) {
    options = {
        auth: 'token ' + TOKEN
    }
}

const octokit = new Octokit(options);

function getGithubProject(issue) {
    let components = issue.repository_url.split('/');
    let [owner, repo] = components.slice(components.length - 2);
    return {
        owner: owner,
        repo: repo
    }
}

async function getIssue(issue) {
    let progress = undefined;
    if (issue.state !== 'closed') {
        progress = await getTaskCount(issue);
    }

    return {
        url: issue.url,
        labels: issue.labels.map(label => {
            return {
                color: label.color,
                ame: label.name
            }
        }),
        progress: progress
    }
}

async function getTaskCount(issue) {
    let githubProject = getGithubProject(issue);
    let options = octokit.issues.listComments.endpoint.merge({
        owner: githubProject.owner,
        repo: githubProject.repo,
        number: issue.number
    });
    let comments = await octokit.paginate(options);
    comments = comments.map(comment => comment.body);
    comments.unshift(issue.body);
    comments = comments.join("\n").split(/\r?\n/)
    let completed = comments.filter(comment => comment.trim().toLowerCase().startsWith('- [x]')).length;
    let outstanding = comments.filter(comment => comment.trim().startsWith('- [ ]')).length;
    return {
        completed: completed,
        outstanding: outstanding
    }
}

function establishDeliveryDate(issue, deliveryDate) {
    if (deliveryDate === null) {
        console.log('Already seen one issue without a delivery date, so returning null');
        return null;
    }
    else if (issue.milestone && issue.milestone.due_on) {
        if (deliveryDate === undefined) {
            console.log('Seen first delivery date, returning it' + issue.milestone.due_on);
            return new Date(issue.milestone.due_on);
        }
        else {
            console.log('Seen another delivery date, returning it: ' + Math.max(deliveryDate, new Date(issue.milestone.due_on)));
            return Math.max(deliveryDate, new Date(issue.milestone.due_on));
        }
    }
    else {
        console.log('Returning null ' + issue.number);
        return null;
    }
}

async function getProject(label, repos) {
    let searchString = repos.map(repo => 'repo:' + repo).join(' ') + ' label:' + label + ' is:issue';
    const options = octokit.search.issuesAndPullRequests.endpoint.merge({
        q: searchString
    });

    return await octokit.paginate(options)
    .then(async(issues) => {
        const repos = {};
        for (const issue of issues) {
            let githubProject = getGithubProject(issue);

            /* let tasks = await getTaskCount(issue); */
            repos[githubProject.repo] = repos[githubProject.repo] || {
                label: label,
                repo: githubProject.owner + '/' + githubProject.repo,
                deliveryDate: undefined,
                todo: {
                    issues: [],
                    bugs: {
                        p1: [],
                        p2: [],
                        p3: []
                    }
                },
                wip: {
                    issues: []
                },
                done: {
                    issues: [],
                    bugs: {
                        p1: [],
                        p2: [],
                        p3: []
                    }
                }
            };
            const repo = repos[githubProject.repo];

            if (issue.state === 'open' && (
                    issue.assignees.length === 0 ||
                    issue.assignee === undefined)
            ) {
                /* The issue is open and unassigned */
                let labels = issue.labels.map(label => label.name);
                if (labels.indexOf('bug') > -1) {
                    for (const priority of ['p1', 'p2', 'p3']) {
                        if (labels.indexOf(priority) > -1) {
                            repo.todo.bugs[priority].push(await getIssue(issue));
                        }
                    }
                }
                else {
                    repo.todo.issues.push(await getIssue(issue));
                }

                repo.deliveryDate = establishDeliveryDate(issue, repo.deliveryDate);
            }
            else if (issue.state === 'open') {
                /* The issue is open and assigned */
                repo.wip.issues.push(await getIssue(issue));
                repo.deliveryDate = establishDeliveryDate(issue, repo.deliveryDate);
            }
            else if (issue.state === 'closed') {
                /* The issue is closed */
                let labels = issue.labels.map(label => label.name);
                if (labels.indexOf('bug') > -1) {
                    for (const priority of ['p1', 'p2', 'p3']) {
                        if (labels.indexOf(priority) > -1) {
                            repo.done.bugs[priority].push(await getIssue(issue));
                        }
                    }
                }
                else {
                    repo.done.issues.push(await getIssue(issue));
                }
            }
        }
        return {
            label: label,
            repos: Object.values(repos)
        }
    });
}

let query = queryString.parse(window.location.search);



class FeatureTagRow extends Component {
    render() {
        let issueLink = "https://github.com/" + this.props.project.repo +
            "/issues?utf8=%E2%9C%93&q=is%3Aissue+is%3Aopen+no%3Aassignee+-label%3Abug+label%3A" + this.props.project.label;
        let p1Link = "https://github.com/" + this.props.project.repo +
            "/issues?utf8=%E2%9C%93&q=is%3Aissue+is%3Aopen+no%3Aassignee+label%3Ap1+label%3Abug+label%3A" + this.props.project.label;
        let p2Link = "https://github.com/" + this.props.project.repo +
            "/issues?utf8=%E2%9C%93&q=is%3Aissue+is%3Aopen+no%3Aassignee+label%3Ap2+label%3Abug+label%3A" + this.props.project.label;
        let p3Link = "https://github.com/" + this.props.project.repo +
            "/issues?utf8=%E2%9C%93&q=is%3Aissue+is%3Aopen+no%3Aassignee+label%3Ap3+label%3Abug+label%3A" + this.props.project.label;
        return (
            <div className="FeatureTag-Row">
                <div>{ this.props.project.repo }</div>
                <div><a href={ issueLink } target="_blank" rel="noopener noreferrer">{ this.props.project.todo.issues.length }</a></div>
                <div>{ this.props.project.wip.issues.length }</div>
                <div>{ this.props.project.done.issues.length }</div>
                <div><a href={ p1Link } target="_blank" rel="noopener noreferrer">{ this.props.project.todo.bugs.p1.length }</a></div>
                <div><a href={ p2Link } target="_blank" rel="noopener noreferrer">{ this.props.project.todo.bugs.p2.length }</a></div>
                <div><a href={ p3Link } target="_blank" rel="noopener noreferrer">{ this.props.project.todo.bugs.p3.length }</a></div>
                <div>{ this.props.project.done.bugs.p1.length + this.props.project.done.bugs.p2.length + this.props.project.done.bugs.p3.length }</div>
                <div className={ this.props.project.deliveryDate ? "" : "NoDate" }>{ this.props.project.deliveryDate ?
                        dateFormat(this.props.project.deliveryDate, 'yyyy-mm-dd') :
                    'n/a' }</div>
                <div className="Completed">
                        { (this.props.project.done.issues.length /
                            (this.props.project.todo.issues.length +
                             this.props.project.todo.bugs.p1.length +
                             this.props.project.wip.issues.length +
                             this.props.project.done.issues.length) * 100).toFixed(0) }%
                </div>
            </div>
        );
    }
}

class FeatureTag extends Component {
    render() {
        let rows = this.props.project.repos.map(project => <FeatureTagRow project={ project } key={ project.repo }/>);
        let totalItems = this.props.project.repos.map(project =>
            project.todo.issues.length + project.todo.bugs.p1.length + project.todo.bugs.p2.length +
            project.todo.bugs.p3.length + project.wip.issues.length + project.done.issues.length)
                .reduce((a, b) => a + b, 0);
        console.log('totalItems', totalItems);
        let completedItems = this.props.project.repos.map(project =>
            project.done.issues.length)
            .reduce((a, b) => a + b, 0);
        console.log('completedItems', completedItems);
        return (
            <div className="FeatureTag">
                <div className="FeatureTag-Header">
                    <div className="Label">{ this.props.project.label }</div>
                    <div className="PercentComplete">{ totalItems ? (completedItems / totalItems * 100).toFixed(0) : "~"}%</div>
                </div>
                <div className="FeatureTag-Table">
                    <div className="FeatureTag-Column"></div>
                    <div className="FeatureTag-Column Implementation"></div>
                    <div className="FeatureTag-Column Implementation"></div>
                    <div className="FeatureTag-Column Implementation"></div>
                    <div className="FeatureTag-Column Bugs"></div>
                    <div className="FeatureTag-Column Bugs"></div>
                    <div className="FeatureTag-Column Bugs"></div>
                    <div className="FeatureTag-Column Bugs"></div>
                    <div className="FeatureTag-Column"></div>
                    <div className="FeatureTag-Column"></div>
                    <div className="FeatureTag-Row FeatureTag-TableHeader">
                        <div>Repo</div>
                        <div>Todo</div>
                        <div>WIP</div>
                        <div>Done</div>
                        <div>P1</div>
                        <div>P2</div>
                        <div>P3</div>
                        <div>Done</div>
                        <div>Delivery</div>
                        <div></div>
                    </div>
                    { rows }
                </div>
            </div>
        );
    }
}

class App extends Component {
    constructor(props) {
        super();
        this.state = {
            project: {
                label: 'Loading...',
                repos: []
            }
        }
    }

    async componentDidMount() {
        if (!Array.isArray(query.repo)) {
            query.repo = [query.repo];
        }
        let project = await getProject(query.label, query.repo);
        console.log(project);
        this.setState({project: project}) 
    }

    render() {
        return (
            <div className="App">
                <FeatureTag project={ this.state.project } />
            </div>
        );
    }
}

export default App;
