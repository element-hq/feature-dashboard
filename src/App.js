import React, { Component } from 'react';
import { HashRouter as Router, Route, Switch } from "react-router-dom";
import dateFormat from 'dateformat';
import Octokit from '@octokit/rest';
import queryString from 'query-string';
import './App.css';

async function getConnection() {
    let token = localStorage.getItem('github_token');

    if (!token) {
        return {
            octokit: new Octokit(),
            status: 'unauthenticated'
        }
    }

    let connection = undefined;

    let octokit = new Octokit({
        auth: `token ${token}`
    });
    await octokit.request('GET /')
        .then(_ => {
            connection = {
                octokit: octokit,
                status: 'authenticated'
            }
        })
        .catch(e => {
            if (e.name === 'HttpError' && e.status === 401) {
                connection = {
                    octokit: new Octokit(),
                    status: 'invalid-credentials'
                }
            }
        });

    return connection;
}

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
        number: issue.number,
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
        return `p1bugs`; // If the bug isn't prioritised, counting it as P1 will encourage
                         // prioritisation.
    }
    else if (labels.includes('feature') || labels.includes('enhancement')) {
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

async function getFeature(octokit, label, searchRepos) {
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
            if (state !== 'done' && ['issues', 'p1bugs'].includes(type)) {
                repo.deliveryDate = establishDeliveryDate(issue, repo.deliveryDate);
            }

        }
        return {
            label: label,
            repos: Object.values(repos)
        }
    });
}

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
        let filter = [...new Set(issues.map(issue => issue.assignees.map(assignee => assignee.login))
            .reduce((a, b) => a.concat(b), []))]
            .map(assignee => `assignee:${assignee}`)
            .join('+');
        if (!filter) {
            filter = 'no:assignee';
        }
        return filter;
    }

    makeLink(repo, label, q, issues) {
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
        q.push(`label:${label}`);

        let queryString = q.join('+');

        let searchUrl = "";
        if (advanced) {
            let assigneesFilter = this.getAssigneesFilter(issues);
            searchUrl = `https://github.com/search?utf8=%E2%9C%93&q=repo%3A${repo}+${queryString}+${assigneesFilter}&type=Issues&ref=advsearch&l=&l=+`;
        }
        else {
            searchUrl = `https://github.com/${repo}/issues?utf8=%E2%9C%93&q=${queryString}`;
        }

        let issueNumbers = issues.map(x => `#${x.number}`).reduce((a, b) => a.concat(b), []);
        return (
            <a href={ searchUrl } target="_blank" rel="noopener noreferrer" title={ issueNumbers.join("\n") }>
                { issueNumbers.length }
            </a>
        );
    }

    render() {
        let repoFeature = this.props.repoFeature;

        return (
            <div className="FeatureTag-Row">
                <div><a href={ `https://github.com/${ repoFeature.repo }/issues` }>{ repoFeature.repo }</a></div>
                <div>{
                    this.makeLink(
                        repoFeature.repo,
                        repoFeature.label,
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
                        repoFeature.label,
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
                        repoFeature.label,
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
                        repoFeature.label,
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
                        repoFeature.label,
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
                        repoFeature.label,
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
                        repoFeature.label,
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
                        repoFeature.label,
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
                        repoFeature.label,
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

class TokenInput extends Component {

    handleClick(e) {
        e.preventDefault();
        let token = prompt('Personal github token', localStorage.getItem('github_token') || '');
        if (token !== null) {
            localStorage.setItem('github_token', token);
            window.location.reload();
        }
    }

    render() {
        return (
            <div className={ `TokenInput ${this.props.status}` } 
                onClick={ this.handleClick }
                title={
                    this.props.status === 'unauthenticated' ? 'Add a personal GitHub token to raise the limit of requests you can make to the API' :
                    this.props.status === 'invalid-credentials' ? 'Your github token is invalid (fell back to unauthenticated access)' : ''
                }>
                { this.props.status === 'unauthenticated' ? 'Add ' : '' }Personal GitHub Token
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
        let rows = this.props.feature.repos.map(repo => <FeatureTagRow repoFeature={ repo }
            key={ repo.repo } />
        );

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
                <TokenInput status={ this.props.connection.status }/>
            </div>
        );
    }
}

class Summary extends Component {
    constructor(props) {
        super();
        this.state = {
            feature: {
                label: 'Loading...',
                repos: []
            },
            connection: {
                octokit: undefined,
                status: 'connecting'
            }
        }
    }

    async componentDidMount() {
        let query = queryString.parse(this.props.location.search);
        let connection = await getConnection();
        this.setState({connection: connection });
        if (!Array.isArray(query.repo)) {
            query.repo = [query.repo];
        }
        document.title = query.label;
        let feature = await getFeature(connection.octokit, query.label, query.repo);
        this.setState({feature: feature}) 
    }

    render() {
        return (
            <div className="App">
                <FeatureTag feature={ this.state.feature } connection={ this.state.connection }/>
            </div>
        );
    }
}

class Plan extends Component {

    render() {
        return (
            <div>I'm... a detailed plan.</div>
        );
    }

}

class FailWhale extends Component {

    render() {
        return (
            <pre>
                {`
    ▄██████████████▄▐█▄▄▄▄█▌
    ██████▌▄▌▄▐▐▌███▌▀▀██▀▀
    ████▄█▌▄▌▄▐▐▌▀███▄▄█▌
    ▄▄▄▄▄██████████████

    Please what means "`}
            { Array.join(
                this.props.location.pathname.match(/.{1,36}/g),
                '\n                       ')
            }"?
            </pre>
        );
    }
}

/* 
 * Legacy links to this tool just passed query params to the root:
 *
 * http://host/?repo=example-org/example-repo&...
 *
 * I want to redirect those links to the summary view, but I wasn't able to
 * make ReactRouter execute the redirect without making a mess of the query 
 * params:
 *
 * http://host/?repo=... -> http://host/?repo=...#/summary
 *
 * Crucially, after the ReactRouter redirect, the query params were no longer
 * accessible to `this.props.location.search`. So instead we're taking matters
 * into our own hands and wrestling `window.location.replace` directly,
 * preserving the query params in the destination:
 *
 * http://host/?repo=... -> https://host/#/summary?repo=...
 */
class RedirectLegacy extends Component {

    render() {
        window.location.replace(`${window.location.pathname}#/summary${ window.location.search }`);
        return (
            <p>Redirecting...</p>
        );
    }

}

class App extends Component {

    render() {
        return (
            <Router>
                <Switch>
                    <Route path="/summary" component={ Summary } />
                    <Route path="/plan" component={ Plan } />
                    <Route exact path="/" component= { RedirectLegacy } />
                    <Route component={ FailWhale } />
                </Switch>
            </Router>
        );
    }

}

export default App;
