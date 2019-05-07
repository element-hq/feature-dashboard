import React, { Component } from 'react';
import { HashRouter as Router, Route, Switch } from "react-router-dom";
import queryString from 'query-string';
import HashChange from 'react-hashchange';

import DashboardUtils from './DashboardUtils';
import Summary from './components/Summary';
import Github from './Github';
import Plan from './components/Plan';
import Fail from './components/Fail';
import './feature-dashboard.css';

class App extends Component {

    constructor(props) {
        super();
        this.state = {
            feature: {
                labels: ['Loading...'],
                repos: []
            },
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

            let connection = await Github.getConnection();
            this.setState({connectionStatus: connection.status });

            document.title = query.label.join(' ');

            let feature = await DashboardUtils.generateSummary(
                await Github.getIssues(connection.octokit, query.label, query.repo),
                query.label, query.repo
            );
            this.setState({feature: feature})
        }
    }

    render() {
        return (
            <div>
                <HashChange onChange={hash => {
                    window.location.reload();
                }} />
                <Router>
                    <Switch>
                        <Route path="/summary"
                            render={ props => <Summary 
                                { ...props }
                                feature={ this.state.feature }
                                connectionStatus={ this.state.connectionStatus }
                            /> }
                        />
                        <Route path="/plan" 
                            render={ props => <Plan 
                                { ...props }
                                feature={ this.state.feature }
                                connectionStatus={ this.state.connectionStatus }
                            /> }
                        />
                        <Route exact path="/" component= { RedirectLegacy } />
                        <Route component={ Fail } />
                    </Switch>
                </Router>
            </div>
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

export default App;
