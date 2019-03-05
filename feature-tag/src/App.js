import React, { Component } from 'react';
import Octokit from '@octokit/rest';
import queryString from 'query-string';
import './App.css';

const octokit = new Octokit({
    auth: 'token ff79c0f9e2711023f289718198604c6358b2eeab'
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
    comments = comments.join("\n").split(/\r?\n/).map(comment => comment.trim());
    console.log("outstanding", comments);
    let completed = comments.filter(comment => comment.toLowerCase().startsWith('- [x]')).length;
    let outstanding = comments.filter(comment => comment.startsWith('- [ ]')).length;
    return {
        completed: completed,
        outstanding: outstanding
    }
}

async function getTaskClown(issue) {
    return (0, 0);
}

async function getProject(label, repos) {
    let searchString = repos.map(repo => 'repo:' + repo).join(' ') + ' label:' + label + ' is:issue';
    const options = octokit.search.issuesAndPullRequests.endpoint.merge({
        q: searchString
    });

    return await octokit.paginate(options)
    .then(async(issues) => {
        const repos = {};
        await issues.forEach(async(issue) => {
            let githubProject = getGithubProject(issue);

            let tasks = await getTaskCount(issue);
            let completed_tasks = tasks.completed;
            let outstanding_tasks = tasks.completed;
            repos[githubProject.repo] = repos[githubProject.repo] || {
                repo: githubProject.owner + '/' + githubProject.repo,
                todo: 0,
                wip: 0,
                done: 0,
                bugs: {
                    p1: 0,
                    p2: 0,
                    p3: 0
                }
            };
            let labels = issue.labels.map(label => label.name);
            if (labels.indexOf('bug') > -1) {
                if (labels.indexOf('p1') > -1) {
                    repos[githubProject.repo].bugs.p1 += 1;
                }
                else if (labels.indexOf('p2') > -1) {
                    repos[githubProject.repo].bugs.p2 += 1;
                }
                else if (labels.indexOf('p3') > -1) {
                    repos[githubProject.repo].bugs.p3 += 1;
                }
            }
            else {
                if (issue.state === 'closed') {
                    if (completed_tasks || outstanding_tasks) {
                        repos[githubProject.repo].done += completed_tasks;
                    }
                    repos[githubProject.repo].done += 1;
                }
                else if (issue.state === 'open' && issue.assignees.length === 0) {
                    if (completed_tasks || outstanding_tasks) {
                        repos[githubProject.repo].done += completed_tasks;
                        repos[githubProject.repo].todo += outstanding_tasks;
                    }
                    else {
                        repos[githubProject.repo].todo += 1;
                    }
                }
                else if (issue.state === 'open') {
                    if (completed_tasks || outstanding_tasks) {
                        repos[githubProject.repo].done += completed_tasks;
                        repos[githubProject.repo].wip += outstanding_tasks;
                    }
                    else {
                        repos[githubProject.repo].wip += 1;
                    }
                }
            }
        });
        return {
            label: label,
            repos: Object.values(repos)
        }
    })
        .then(x => {
            console.log(x);
        return x;
    });
}

let query = queryString.parse(window.location.search);

class FeatureTagRow extends Component {
    render() {
        return (
            <div className="FeatureTag-Row">
                <div>{ this.props.project.repo }</div>
                <div>{ this.props.project.todo }</div>
                <div>{ this.props.project.wip }</div>
                <div>{ this.props.project.done }</div>
                <div>{ this.props.project.bugs.p1 || 0 }</div>
                <div>{ this.props.project.bugs.p2 || 0 }</div>
                <div>{ this.props.project.bugs.p3 || 0 }</div>
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
                        <div>WIP</div>
                        <div>Done</div>
                        <div>P1</div>
                        <div>P2</div>
                        <div>P3</div>
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
