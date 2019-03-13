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

async function processIssue(issue) {
    let progress = undefined;
    if (issue.state !== 'closed') {
        progress = 'n/a' /* await getTaskCount(issue); */ // This should be lazy-loaded.
    }

    return {
        url: issue.url,
        labels: issue.labels.map(label => {
            return {
                color: label.color,
                name: label.name
            }
        }),
        progress: progress,
        assignees: issue.assignees
    }
}

/*
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
*/

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

function getState(issue) {
    if (issue.state === 'closed') {
        return 'done';
    }
    else if (issue.state === 'open' && (
            issue.assignees.length === 0 ||
            issue.assignee === undefined)
    ) {
        return 'todo';
    }
    else return 'wip';
}

function getType(issue) {
    let labels = issue.labels.map(label => label.name);
    if (labels.includes('bug')) {
        for (const priority of ['p1', 'p2', 'p3']) {
            if (labels.includes(priority)) {
                return `${priority}bugs`;
            }
        }
    }
    else if (labels.includes('feature')) {
        return 'issues';
    }
    return 'others';
}

function template(label, repo) {
    return {
        label: label,
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

async function getFeature(label, searchRepos) {
    let searchString = searchRepos.map(repo => 'repo:' + repo).join(' ') + ' label:' + label + ' is:issue';
    const options = octokit.search.issuesAndPullRequests.endpoint.merge({
        q: searchString
    });

    const repos = {};
    for (const repo of searchRepos) {
        repos[repo] = template(label, repo);
    }

    return await octokit.paginate(options)
    .then(async(issues) => {
        for (const issue of issues) {
            const project = getGithubProject(issue);
            const repoName = `${project.owner}/${project.repo}`
            const repo = repos[repoName];

            let state = getState(issue);
            let type = getType(issue);

            repo[state][type].push(await processIssue(issue));
            if (state !== 'done') {
                repo.deliveryDate = establishDeliveryDate(issue, repo.deliveryDate);
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
        /* TODO: There's a bug if you search WIP of 0, because it doesn't add any assignees to the filter (and returns
         * > 0 results). We really need a makeWIPLink method that returns no link at all if there are no items in flight.
         * */
        let filter = issues.map(issue => issue.assignees.map(assignee => assignee.login))
            .reduce((a, b) => a.concat(b), [])
            .map(assignee => `assignee:${assignee}`)
            .join('+');
        if (!filter) {
            filter = 'no:assignee';
        }
        return filter;
    }

    render() {
        let repoFeature = this.props.repoFeature;

        let githubSearch = `https://github.com/${repoFeature.repo}/issues?utf8=%E2%9C%93&q=label%3A${repoFeature.label}+is%3Aissue+`
        let githubAdvancedSearch = `https://github.com/search?utf8=%E2%9C%93&q=is%3Aopen+repo%3A${repoFeature.repo}+label%3A${repoFeature.label}+`;
        let githubAdvancedSearchEnd = `&type=Issues&ref=advsearch&l=&l=+`;
        let issueLink = `${githubSearch}is%3Aopen+no%3Aassignee+label%3Afeature`;

        let bugLinks = [1, 2, 3].map(priority =>
            <div key={ priority }><a href={
                `${githubSearch}is%3Aopen+no%3Aassignee+label%3Ap${priority}+label%3Abug`
            } target="_blank" rel="noopener noreferrer">
            { repoFeature.todo[`p${priority}bugs`].length }
            </a></div>
        );

        return (
            <div className="FeatureTag-Row">
                <div>{ repoFeature.repo }</div>
                <div><a href={ issueLink } target="_blank" rel="noopener noreferrer">{ repoFeature.todo.issues.length }</a></div>
                <div><a href={ `${githubAdvancedSearch}label%3Afeature+${this.getAssigneesFilter(repoFeature.wip.issues)}${githubAdvancedSearchEnd}` } target="_blank" rel="noopener noreferrer" >{
                    repoFeature.wip.issues.length 
                }</a></div>
                <div><a href={ `${githubSearch}label%3Afeature+is%3aclosed` } target="_blank" rel="noopener noreferrer">{
                    repoFeature.done.issues.length
                }</a></div>
                { bugLinks }
                <div><a href={ `${githubAdvancedSearch}label%3Abug+${this.getAssigneesFilter(repoFeature.wip.p1bugs.concat(repoFeature.wip.p2bugs).concat(repoFeature.wip.p3bugs))}${githubAdvancedSearchEnd}` } target="_blank" rel="noopener noreferrer" >{
                    repoFeature.wip.p1bugs.length +
                    repoFeature.wip.p2bugs.length +
                    repoFeature.wip.p3bugs.length
                }</a></div>
                <div><a href={ `${githubSearch}label%3Abug+is%3aclosed`} target="_blank" rel="noopener noreferrer">{
                    repoFeature.done.p1bugs.length +
                    repoFeature.done.p2bugs.length +
                    repoFeature.done.p3bugs.length
                }</a></div>
                <div><a href={ `${githubSearch}-label%3Afeature+-label%3Ap1+-label%3Ap2+-label%3Ap3+is%3Aopen` } target="_blank" rel="noopener noreferrer">{
                    repoFeature.todo.others.length +
                    repoFeature.wip.others.length
                }</a></div>
                <div className={ repoFeature.deliveryDate ? "" : "NoDate" }>{ repoFeature.deliveryDate ?
                        dateFormat(repoFeature.deliveryDate, 'yyyy-mm-dd') :
                    'n/a' }</div>
                <div className="Completed">{ this.calculatePercentCompleted(repoFeature) }%</div>
            </div>
        );
    }
}

class FeatureTag extends Component {
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
        let rows = this.props.feature.repos.map(repo => <FeatureTagRow repoFeature={ repo } key={ repo.repo }/>);

        return (
            <div className="FeatureTag">
                <div className="FeatureTag-Header">
                    <div className="Label">{ this.props.feature.label }</div>
                    <div className="PercentComplete">{ this.calculatePercentCompleted(this.props.feature) }%</div>
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
                    <div className="FeatureTag-Column Bugs"></div>
                    <div className="FeatureTag-Column"></div>
                    <div className="FeatureTag-Column"></div>
                    <div className="FeatureTag-Column"></div>
                    <div className="FeatureTag-Row FeatureTag-TableHeader">
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
            </div>
        );
    }
}

class App extends Component {
    constructor(props) {
        super();
        this.state = {
            feature: {
                label: 'Loading...',
                repos: []
            }
        }
    }

    async componentDidMount() {
        if (!Array.isArray(query.repo)) {
            query.repo = [query.repo];
        }
        document.title = query.label;
        let feature = await getFeature(query.label, query.repo);
        this.setState({feature: feature}) 
    }

    render() {
        return (
            <div className="App">
                <FeatureTag feature={ this.state.feature } />
            </div>
        );
    }
}

export default App;
