import Octokit from '@octokit/rest';

class DashboardUtils {

    static async getConnection() {
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

    static getGithubProject(issue) {
        let components = issue.repository_url.split('/');
        let [owner, repo] = components.slice(components.length - 2);
        return {
            owner: owner,
            repo: repo
        }
    }

    static async processIssue(issue) {
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

    static async getTaskCount(octokit, issue) {
        let githubProject = this.getGithubProject(issue);
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

    static establishDeliveryDate(issue, deliveryDate) {
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

    static getState(issue) {
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

    static getType(issue) {
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

    static template(label, repo) {
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

    static async getFeature(octokit, label, searchRepos) {
        let searchString = searchRepos.map(repo => 'repo:' + repo).join(' ') + ' label:' + label + ' is:issue';
        const options = octokit.search.issuesAndPullRequests.endpoint.merge({
            q: searchString
        });

        const repos = {};
        for (const repo of searchRepos) {
            repos[repo] = this.template(label, repo);
        }

        return await octokit.paginate(options)
        .then(async(issues) => {
            for (const issue of issues) {
                const project = this.getGithubProject(issue);
                const repoName = `${project.owner}/${project.repo}`
                const repo = repos[repoName];

                let state = this.getState(issue);
                let type = this.getType(issue);

                repo[state][type].push(await this.processIssue(issue));
                if (state !== 'done' && ['issues', 'p1bugs'].includes(type)) {
                    repo.deliveryDate = this.establishDeliveryDate(issue, repo.deliveryDate);
                }

            }
            return {
                label: label,
                repos: Object.values(repos)
            }
        });
    }

}

export default DashboardUtils;
