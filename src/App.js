import React, { Component } from 'react';
import { HashRouter as Router, Route, Switch, Link } from "react-router-dom";
import queryString from 'query-string';
import HashChange from 'react-hashchange';

import Github from './Github';
import Fail from './components/Fail';
import Plan from './components/Plan';
import Summary from './components/Summary';
import Burndown from './components/Burndown';

import './feature-dashboard.css';

class App extends Component {

    constructor(props) {
        super();
        this.state = {
            query: null,
            issues: [],
            repos: [],
            labels: [],
            connectionStatus: 'connecting'
        }
    }

    async componentDidMount() {
        /*
         * FIXME: This _looks_ wrong. Why are we fiddling around parsing the location.hash
         * when we've got a perfectly good HashRouter to do that for us?
         */
        if (window.location.hash.includes("?")) {
            let query = queryString.parse(
                window.location.hash.substring(
                    window.location.hash.indexOf("?")
                )
            )
            if (!Array.isArray(query.repo)) {
                query.repo = [query.repo];
            }
            if (!Array.isArray(query.label)) {
                query.label = [query.label];
            }

            let token = localStorage.getItem('github_token');
            let connection = await Github.getConnection(token);
            this.setState({connectionStatus: connection.status });

            document.title = query.label.join(' ');

            let issues = await Github.getIssues(connection.octokit, query.label, query.repo);

            this.setState({
                query,
                labels: query.label,
                repos: query.repo,
                issues: issues
            });

        }
    }

    get routes() {
        return [
            {
                path: "/summary",
                label: "Summary",
                component: Summary,
            },
            {
                path: "/plan",
                label: "Plan",
                component: Plan,
            },
            {
                path: "/burndown",
                label: "Burndown",
                component: Burndown,
            },
        ];
    }

    pathWithQuery(path) {
        if (!this.state.query) {
            return path;
        }
        return path + "?" + queryString.stringify(this.state.query);
    }

    render() {
        return (
            <div>
                <HashChange onChange={hash => {
                    window.location.reload();
                }} />
                <Router>
                    <Switch>
                        {this.routes.map(({ path, component: Component }) => (
                            <Route path={path} key={path}
                                render={props => <Component
                                    {...props}
                                    repos={this.state.repos}
                                    labels={this.state.labels}
                                    issues={this.state.issues}
                                    connectionStatus={this.state.connectionStatus}
                                />}
                            />
                        ))}
                        <Route exact path="/" component= { RedirectLegacy } />
                        <Route component={ Fail } />
                    </Switch>
                    <nav>
                        {this.routes.map(({ path, label }) => (
                            <Link key={path} to={this.pathWithQuery(path)}>
                                {label}
                            </Link>
                        ))}
                    </nav>
                </Router>
            </div>
        );
    }

}

/* 
 * Legacy links to this tool just passed query params to the root:
 *
 * https://host/?repo=example-org/example-repo&...
 *
 * I want to redirect those links to the summary view, but I wasn't able to
 * make ReactRouter execute the redirect without making a mess of the query 
 * params:
 *
 * https://host/?repo=... -> https://host/?repo=...#/summary
 *
 * Crucially, after the ReactRouter redirect, the query params were no longer
 * accessible to `this.props.location.search`. So instead we're taking matters
 * into our own hands and wrestling `window.location.replace` directly,
 * preserving the query params in the destination:
 *
 * https://host/?repo=... -> https://host/#/summary?repo=...
 */
class RedirectLegacy extends Component {

    render() {
        window.location.replace(`${window.location.pathname}#/summary${ window.location.search }`);
        return (
            <p>Redirecting...</p>
        );
    }

}

export default App;
