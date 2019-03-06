import React, { Component } from 'react';
import dateFormat from 'dateformat';
import Octokit from '@octokit/rest';
import queryString from 'query-string';
import './App.css';

const octokit = new Octokit({
    auth: 'token 9c2e4c4078790064318da8756b19bdfd9f25bc2b'
});

function getGithubProject(issue) {
    let components = issue.repository_url.split('/');
    let [owner, repo] = components.slice(components.length - 2);
    return {
        owner: owner,
        repo: repo
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
                repo: githubProject.owner + '/' + githubProject.repo,
                deliveryDate: undefined,
                todo: {
                    issues: 0,
                    bugs: {
                        p1: 0,
                        p2: 0,
                        p3: 0
                    }
                },
                wip: {
                    issues: 0
                },
                done: {
                    issues: 0
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
                            repo.todo.bugs[priority] += 1;
                        }
                    }
                }
                else {
                    repo.todo.issues += 1;
                }
                if (issue.milestone != null &&
                    issue.milestone.due_on) {
                }

                repo.deliveryDate = establishDeliveryDate(issue, repo.deliveryDate);
            }
            else if (issue.state === 'open') {
                /* The issue is open and assigned */
                repo.wip.issues += 1;
                repo.deliveryDate = establishDeliveryDate(issue, repo.deliveryDate);
            }
            else if (issue.state === 'closed') {
                /* The issue is closed */
                repo.done.issues += 1;
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
        return (
            <div className="FeatureTag-Row">
                <div>{ this.props.project.repo }</div>
                <div>{ this.props.project.todo.issues }</div>
                <div>{ this.props.project.todo.bugs.p1 }</div>
                <div>{ this.props.project.todo.bugs.p2 }</div>
                <div>{ this.props.project.todo.bugs.p3 }</div>
                <div>{ this.props.project.wip.issues }</div>
                <div>{ this.props.project.done.issues }</div>
                <div>{ this.props.project.deliveryDate ?
                        dateFormat(this.props.project.deliveryDate, 'yyyy-mm-dd') :
                        'None' }</div>
            </div>
        );
    }
}

class FeatureTag extends Component {
    render() {
        let rows = this.props.project.repos.map(repo => <FeatureTagRow project={ repo } key={ repo.repo }/>);
        return (
            <div className="FeatureTag">
                <h1>{ this.props.project.label }</h1>
                <div className="FeatureTag-Rows">
                    <div className="FeatureTag-Row">
                        <div>Repo</div>
                        <div>Todo</div>
                        <div>P1</div>
                        <div>P2</div>
                        <div>P3</div>
                        <div>WIP</div>
                        <div>Done</div>
                        <div>Delivery</div>
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
