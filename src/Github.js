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
import Octokit from '@octokit/rest';
import graphql from '@octokit/graphql';

class Github {

    static getOctokit(token) {
        return new Octokit({
            auth: `token ${token}`
        });
    }

    static async getEpics(token, milestones, repos) {
        // Only the first milestone for now
        const milestone = milestones[0];
        const epicMilestone = await this.getMilestone(token, milestone);
        let issues = [];
        let epic = [];
        for (const userStory of epicMilestone) {
            let label = `story:${userStory.number}`;
            epic.push({
                story: userStory,
                relatedIssues: this.getFullIssues(token, [label], repos)
            });
        }
        Promise.all(epic.map(userStory => userStory.issues));

        for (const userStory of epic) {
            userStory.relatedIssues = await userStory.relatedIssues;

            for (const issue of userStory.relatedIssues) {
                issue.story = userStory.story;
            }
            issues = issues.concat(userStory.relatedIssues);

            /* All of this business is in support of a PoC for a special label format,
             * size:<owner>/<repo>:<estimate number of stories>, which allows the planner to set a
             * minimum-expected number of stories to represent on the plan even if those stories
             * aren't planned yet.
             * */
            const minStories = userStory.story.getNumberedLabelValue('size:vector-im/riot-web') || 0;
            if (minStories > userStory.relatedIssues.length) {
                let imaginaryIssue = {
                    owner: 'vector-im',
                    repo: 'riot-web',
                    story: userStory.story,
                    number: -1,
                    state: 'todo',
                    title: 'NOT YET PLANNED',
                    labels: [],
                    type: 'issues',
                    createdAt: userStory.createdAt,
                    origin: 'placeholder'
                }
                for (let i = 0; i < minStories - userStory.relatedIssues.length; i++) {
                    issues.push(imaginaryIssue);
                }
            }
        }
        let milestoneNumber = milestone.split('/').pop();
        let unstoriedIssues = await this.getFullIssues(token, [`epic:${milestoneNumber}`], repos);
        issues = issues.concat(unstoriedIssues);
        return {
            issues: issues,
            meta: {
                userStories: epicMilestone
            }
        }
    }

    static async getMilestone(token, milestone) {
        const query = `
            query milestones($owner: String!, $project: String!, $number: Int!)  {
                repository(owner: $owner, name: $project) {
                    milestone(number: $number) {
                        title
                        issues(first: 100) {
                            edges {
                                cursor
                                node {
                                    number
                                    title
                                    body
                                    url
                                    state
                                    createdAt
                                    closedAt
                                    assignees(first: 100) {
                                        edges {
                                            node {
                                                login
                                            }
                                        }
                                    }
                                    repository {
                                        owner {
                                            login
                                        }
                                        name
                                    }
                                    labels(first: 100) {
                                        edges {
                                            node {
                                                name
                                            }
                                        }
                                    }
                                    userContentEdits(first: 100) {
                                        edges {
                                            node {
                                                editedAt
                                                diff
                                            }
                                        }
                                    }
                                    timelineItems(last: 1, itemTypes: [ASSIGNED_EVENT]) {
                                        edges {
                                            node {
                                                ...on AssignedEvent {
                                                    actor {
                                                        login
                                                    }
                                                    createdAt
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }`
        let [owner, project, _, number] = milestone.split('/');

        let results = await graphql(query, {
            headers: {
                authorization: `token ${token}`
            },
            owner: owner,
            project: project,
            number: parseInt(number, 10)
        });

        const stories = results.repository.milestone.issues.edges.map(result =>
            Issue.fromGraphql(result.node));
        return stories;
    }

    static async getFullIssues(token, labels, searchRepos) {
        const query = `
            query issueBodiesOverTime($owner: String!, $project: String!, $labels: [String!]!) {
                repository(owner: $owner, name: $project) {
                    issues(first: 100, labels: $labels) {
                        edges {
                            cursor
                            node {
                                number
                                title
                                body
                                url
                                state
                                createdAt
                                closedAt
                                assignees(first: 100) {
                                    edges {
                                        node {
                                            login
                                        }
                                    }
                                }
                                repository {
                                    owner {
                                        login
                                    }
                                    name
                                }
                                labels(first: 100) {
                                    edges {
                                        node {
                                            name
                                        }
                                    }
                                }
                                userContentEdits(first: 100) {
                                    edges {
                                        node {
                                            editedAt
                                            diff
                                        }
                                    }
                                }
                                timelineItems(last: 1, itemTypes: [ASSIGNED_EVENT]) {
                                    edges {
                                        node {
                                            ...on AssignedEvent {
                                                actor {
                                                    login
                                                }
                                                createdAt
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                    pullRequests(first: 100, labels: $labels) {
                        edges {
                            cursor
                            node {
                                number
                                title
                                body
                                url
                                state
                                createdAt
                                closedAt
                                assignees(first: 100) {
                                    edges {
                                        node {
                                            name
                                        }
                                    }
                                }
                                repository {
                                    owner {
                                        login
                                    }
                                    name
                                }
                                labels(first: 100) {
                                    edges {
                                        node {
                                            name
                                        }
                                    }
                                }
                                userContentEdits(first: 100) {
                                    edges {
                                        node {
                                            editedAt
                                            diff
                                        }
                                    }
                                }
                                timelineItems(last: 1, itemTypes: [ASSIGNED_EVENT]) {
                                    edges {
                                        node {
                                            ...on AssignedEvent {
                                                actor {
                                                    login
                                                }
                                                createdAt
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }`
        let issues = [];
        // await Promise.all([]);
        let resultSets = searchRepos.map(repo => {
            let [owner, project] = repo.split('/');
            return graphql(query, {
                headers: {
                    authorization: `token ${token}`
                },
                owner: owner,
                project: project,
                labels: labels
            });
        });
        Promise.all(resultSets);
        for (const resultSet of resultSets) {
            let results = await resultSet;
            let resultIssues = results.repository.issues.edges.map(
                issue => Issue.fromGraphql(issue.node));
            let resultPullRequests = results.repository.pullRequests.edges.map(
                pullRequest => Issue.fromGraphql(pullRequest.node));
            issues = issues.concat(resultIssues).concat(resultPullRequests);
        }
        return issues;
    }

    static async getIssues(token, labels, searchRepos) {
        let octokit = this.getOctokit(token);
        let searchString = searchRepos.map(repo => 'repo:' + repo)
            .join(' ') + ' ' + labels.map(label => `label:${label}`).join(' ');

        const options = octokit.search.issuesAndPullRequests.endpoint.merge({
            q: searchString
        });

        let githubIssues = await octokit.paginate(options);

        return {
            issues: githubIssues.map(issue => Issue.fromOctokit(issue)),
            meta: {}
        }
    }

}

class Issue {

    static fromOctokit(octokitIssue) {
        const labels = octokitIssue.labels.map(label => label.name);
        const [owner, repo] = octokitIssue.repository_url.split('/').slice(-2);
        const assigned = octokitIssue.assignees.length > 0 || octokitIssue.assignee;
        const assignees = (octokitIssue.assignees ||
            [octokitIssue.assignee]).map(assignee => assignee.login);

        return {
            origin: 'octokit',
            source: octokitIssue,
            url: octokitIssue.html_url,
            title: octokitIssue.title,
            number: octokitIssue.number,
            type: Issue.getType(labels),
            state: Issue.getState(octokitIssue.state, assigned),
            labels: labels,
            owner: owner,
            repo: repo,
            assigned: assigned,
            assignees: assignees,
            createdAt: octokitIssue.created_at,
            closedAt: octokitIssue.closed_at,
            getNumberedLabelValue: function(labelPrefix) {
                let matches = this.labels.filter(label => label.startsWith(`${labelPrefix}:`));
                if (matches.length > 0) {
                    return Number(matches[0].split(':').pop());
                }
                else return null;
            }
        }
    }

    static fromGraphql(graphqlIssue) {
        const labels = graphqlIssue.labels.edges.map(x => x.node.name);
        const assigned = graphqlIssue.assignees.edges.length > 0;
        const assignees = graphqlIssue.assignees.edges.map(assignee => assignee.node.login);
        const inProgressSince = graphqlIssue.timelineItems.edges.length > 0 ?
            graphqlIssue.timelineItems.edges[0].node.createdAt.slice(0,10) : null;

        const subTasks = graphqlIssue.body.split('\n')
            .map(line => line.trim())
            .filter(line => line.startsWith('- ['));

        const done = subTasks.filter(line => line.toUpperCase().startsWith('- [X] ')).length;
        const pending = subTasks.filter(line => line.toUpperCase().startsWith('- [ ] ')).length;
        return {
            origin: 'graphql',
            source: graphqlIssue,
            url: graphqlIssue.url,
            title: graphqlIssue.title,
            number: graphqlIssue.number,
            type: Issue.getType(labels),
            state: Issue.getState(graphqlIssue.state, assigned),
            labels: labels,
            owner: graphqlIssue.repository.owner.login,
            repo: graphqlIssue.repository.name,
            assigned: assigned,
            assignees: assignees,
            createdAt: graphqlIssue.createdAt,
            closedAt: graphqlIssue.closedAt,
            inProgressSince: inProgressSince,
            progress: pending ? `${done} / ${done + pending}` : null,
            getNumberedLabelValue: function(labelPrefix) {
                let matches = this.labels.filter(label => label.startsWith(`${labelPrefix}:`));
                if (matches.length > 0) {
                    return Number(matches[0].split(':').pop());
                }
                else return null;
            }
        }
    }

    static getType(labels) {
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

    static getState(githubState, assigned) {
        if (['CLOSED', 'MERGED'].includes(githubState.toUpperCase())) {
            return 'done';
        }
        else if (assigned) {
            return 'wip';
        }
        else {
            return 'todo';
        }
    }

}

export default Github;
