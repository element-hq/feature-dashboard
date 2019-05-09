import Octokit from '@octokit/rest';

class Github {

    static async getConnection(token) {
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

    static async getTaskCount(octokit, issue) {
        let options = octokit.issues.listComments.endpoint.merge({
            owner: issue.owner,
            repo: issue.repo,
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

    static async getIssues(octokit, labels, searchRepos) {
        let searchString = searchRepos.map(repo => 'repo:' + repo)
            .join(' ') + ' ' + labels.map(label => `label:${label}`).join(' ') + ' is:issue';

        const options = octokit.search.issuesAndPullRequests.endpoint.merge({
            q: searchString
        });

        let githubIssues = await octokit.paginate(options);

        return githubIssues.map(issue => new Issue(issue));
    }

}

class Issue {

    constructor(githubIssue) {

        this.githubIssue = githubIssue;
        this.url = githubIssue.html_url;
        this.labels = githubIssue.labels.map(label => {
            return {
                color: label.color,
                name: label.name
            }
        });
        this.progress = undefined;
        this.title = githubIssue.title;
        this.number = githubIssue.number;
        this.assignees = githubIssue.assignees;

        let components = githubIssue.repository_url.split('/');
        [this.owner, this.repo] = components.slice(components.length - 2);

        this.type = Issue.getType(githubIssue);
        this.state = Issue.getState(githubIssue);

    }

    static getType(githubIssue) {
        let labels = githubIssue.labels.map(label => label.name);
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

    static getState(githubIssue) {
        if (githubIssue.state === 'closed') {
            return 'done';
        }
        else if (githubIssue.state === 'open' && (
                githubIssue.assignees.length === 0 ||
                githubIssue.assignee === undefined)
        ) {
            return 'todo';
        }
        else {
            return 'wip';
        }
    }

}

export default Github;
