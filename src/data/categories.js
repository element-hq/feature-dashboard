/*
Copyright 2020 New Vector Ltd

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

export function categorise(props) {
    const { query } = props;
    // Enabled categories and the order they apply can be set via the URL
    // using category=A&category=B etc.
    const enabledCategories = query.categorys || ['story', 'repo'];
    let categories = [];

    // Requirements for new issues to appear in the plan.
    // These are accumulated across categories as we descend.
    let requirements = {
        repo: null,
        labels: [],
    };

    for (const enabledCategory of enabledCategories) {
        if (enabledCategory === 'phase') {
            if (
                [].concat(...props.issues.map(issue => issue.labels))
                    .some(label => label.startsWith('phase:'))
            ) {
                categories.push(issues => {
                    let phases = [...new Set(issues
                        .map(issue => issue.getNumberedLabelValue('phase'))
                        .filter(phase => phase !== null),
                    )].sort();

                    let categorized = [];
                    for (const phase of phases) {
                        categorized.push({
                            type: 'phase',
                            key: phase,
                            data: phase,
                            addRequirements: req => req.labels = [...req.labels, `phase:${phase}`],
                            items: issues.filter(issue => issue.getNumberedLabelValue('phase') === phase)
                        });
                    }

                    const unphased = issues.filter(issue => issue.getNumberedLabelValue('phase') === null);
                    if (unphased.length > 0) {
                        categorized.push({
                            type: 'phase',
                            key: -1,
                            data: null,
                            items: unphased,
                        });
                    }

                    return categorized;
                });
            }
        } else if (enabledCategory === 'story') {
            if (query.epics) {
                categories.push(issues => {
                    let categorized = [];

                    for (const userStory of props.meta.userStories) {
                        categorized.push({
                            type: 'story',
                            key: userStory.number,
                            data: userStory,
                            addRequirements: req => req.labels = [...req.labels, `story:${userStory.number}`],
                            items: issues.filter(issue => issue.story && issue.story.number === userStory.number)
                        });
                    }
                    let unstoried = issues.filter(issue => !issue.story);
                    if (unstoried.length > 0) {
                        categorized.push({
                            type: 'story',
                            key: -1,
                            data: null,
                            items: unstoried
                        });
                    }

                    return categorized;
                });
            }
        } else if (enabledCategory === 'repo') {
            if (query.repos && query.repos.length > 1) {
                categories.push(issues => {
                    let repos = [...new Set(issues.map(issue => `${issue.owner}/${issue.repo}`))]
                        .sort((repoA, repoB) => {
                            return query.repos.indexOf(repoA) - query.repos.indexOf(repoB);
                        });

                    let categorized = [];
                    for (const repo of repos) {
                        categorized.push({
                            type: 'repo',
                            key: repo,
                            data: repo,
                            addRequirements: req => req.repo = repo,
                            items: issues.filter(issue => `${issue.owner}/${issue.repo}` === repo)
                        });
                    }

                    return categorized;
                });
            } else {
                requirements.repo = query.repos[0];
            }
        } else {
            console.warn("Unknown category", enabledCategory);
        }
    }

    return {
        categories,
        requirements,
    };
}
