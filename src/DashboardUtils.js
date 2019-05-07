/* Private functions, not exposed */

class DashboardUtils {

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


    static template(labels, repo) {
        return {
            labels: labels,
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


    static async generateSummary(issues, labels, searchRepos) { //octokit, label, searchRepos) {
        const repos = {};
        for (const repo of searchRepos) {
            repos[repo] = this.template(labels, repo);
        }

        for (const issue of issues) {
            const repoName = `${issue.owner}/${issue.repo}`
            const repo = repos[repoName];

            repo[issue.state][issue.type].push(issue);
            if (issue.state !== 'done' && ['issues', 'p1bugs'].includes(issue.type)) {
                repo.deliveryDate = this.establishDeliveryDate(issue, repo.deliveryDate);
            }

        }
        return {
            labels: labels,
            repos: Object.values(repos)
        }
    }

}

export default DashboardUtils;
