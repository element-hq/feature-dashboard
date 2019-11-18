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
import { HashRouter as Router, Route, Switch, Link } from "react-router-dom";
import queryString from 'query-string';
import HashChange from 'react-hashchange';

import Github from './Github';

import Fail from './components/Fail';
import Plan from './components/Plan';
import Summary from './components/Summary';
import Burndown from './components/Burndown';

import './feature-dashboard.css';

function getToken() {
    const GITHUB_TOKEN = 'github_token';
    var cookies = document.cookie.match('(^|[^;]+)\\s*' + GITHUB_TOKEN + '\\s*=\\s*([^;]+)');
    if (cookies) {
        return cookies.pop();
    }
    else {
        window.location = '/_auth/login?target_url=' + encodeURIComponent(window.location);
    }
}

class FeatureDashboard {
    static async getIssues(token, query) {
        if(query.epics) {
            return await Github.getEpics(
                token,
                query.epics,
                query.repos
            );
        }
        else {
            return await Github.getIssues(
                token,
                query.labels,
                query.repos
            );
        }
    }
}

class App extends Component {

    constructor(props) {
        super();

        this.state = {
            query: {
                repos: [],
                labels: []
            },
            issues: []
        }
    }

    async componentDidMount() {
        let query = this.parseQueryFromHash(window.location.hash);
        this.setState({
            query: this.parseQueryFromHash(window.location.hash),
            issues: await FeatureDashboard.getIssues(getToken(), query)
        });
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
            }
        ];
    }

    pathWithQuery(path) {
        if (!this.state.query) {
            return path;
        }
        return path + "?" +
            queryString.stringify(this.state.query)
            .replace(/s=/g, '=') // Undo the pluralization fudge
            .replace(/%3A/g, ':') // Maintain human-readable colons...
            .replace(/%2F/g, '/'); // ...and slashes.
    }

    parseQueryFromHash(hash) {
        const query = queryString.parse(hash.substring(hash.indexOf("?")));
        // Homogenise values from the query params so that we're always dealing with
        // arrays.
        let parsed = {};
        for (const [key, value] of Object.entries(query)) {
            let plural_key = `${key}s`;
            if (!Array.isArray(value)) {
                parsed[plural_key] = [value];
            }
            else {
                parsed[plural_key] = value;
            }
        }
        return parsed;
    }

    onHashChange = ({ hash }) => {
        const { query: previousQuery } = this.state;
        // If the query param potions match, we don't need to reload, as this
        // can be handled by switching components.
        if (!hash.includes("?") && previousQuery === null) {
            return;
        }
        if (hash.includes("?")) {
            const query = this.parseQueryFromHash(hash);
            if (JSON.stringify(previousQuery) === JSON.stringify(query)) {
                return;
            }
        }
        // Query components differ, so for now we require a reload to update.
        window.location.reload();
    }

    render() {
        return (
            <div>
                <HashChange onChange={this.onHashChange} />
                <Router>
                    <Switch>
                        {this.routes.map(({ path, component: Component }) => (
                            <Route path={path} key={path}
                                render={props => <Component
                                    {...props}
                                    query={this.state.query}
                                    issues={this.state.issues}
                                />}
                            />
                        ))}
                        <Route exact path="/" component= { RedirectLegacy } />
                        <Route component={ Fail } />
                    </Switch>
                    <nav className="raised-box">
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
