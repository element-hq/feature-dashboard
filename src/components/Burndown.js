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

import dateFormat from 'dateformat';
import { Line } from 'react-chartjs-2';

const FILL_COLORS = [
    'rgba(0, 40, 0, 0.2)',
    'rgba(40, 0, 0, 0.2)',
    'rgba(0, 0, 40, 0.2)',
    'rgba(40, 40, 0, 0.2)',
    'rgba(0, 40, 40, 0.2)',
    'rgba(40, 0, 40, 0.2)',
];

const LINE_COLORS = [
    'rgba(0, 40, 0, 0.5)',
    'rgba(40, 0, 0, 0.5)',
    'rgba(0, 0, 40, 0.5)',
    'rgba(40, 40, 0, 0.5)',
    'rgba(0, 40, 40, 0.5)',
    'rgba(40, 0, 40, 0.5)',
];

class Burndown extends Component {

    render() {
        let { issues } = this.props;

        if (issues.length === 0) {
            return (
                <div className="Burndown raised-box">
                    <h3>Loading data...</h3>
                </div>
            );
        }

        let dates = [];
        let openIssueCounts = {};
        let closedIssueDeltas = {};

        // Initialise dates array and issue count per day for all relevant dates
        let date = new Date(
            Math.min(
                ...issues.map(issue => new Date(issue.githubIssue.created_at))
            )
        );
        let today = new Date();
        let tomorrow = new Date().setDate(today.getDate() + 1);
        while (date < tomorrow) {
            let day = dateFormat(date, 'yyyy-mm-dd');
            dates.push(day);
            openIssueCounts[day] = {};
            closedIssueDeltas[day] = 0;
            date.setDate(date.getDate() + 1);
        }

        // Attempt to bucket issues by phase
        // TODO: Extract this out as a generic issue categoriser
        let label = issue => {
            let phases = issue.labels.filter(label => label.name.startsWith('phase:'));
            if (phases.length > 0) {
                return phases[0].name;
            }
            return null;
        };
        let sort = (a, b) => {
            return Number(a.split(":")[1]) - Number(b.split(":")[1]);
        };
        // TODO: Do we wanted unbucketed for this view?
        // let unbucketed = 'unphased';
        let unbucketed;

        let headings = [...new Set(issues.filter(label).map(label))].sort(sort);
        let buckets = {};
        headings.forEach(heading => {
            buckets[heading] = issues.filter(item => label(item) === heading);
        });

        // If we're interested in issues that weren't matched by the filter,
        // throw them into an 'unbucketed' category.
        if (unbucketed) {
            let unbucketedItems = issues.filter(item =>
                !Object.values(buckets).reduce(Array.concat, []).includes(item));

            if (unbucketedItems.length > 0) {
                buckets[unbucketed] = unbucketedItems;
            }
        }

        let datasets = [];

        // Create a dataset for each bucket
        Object.keys(buckets).forEach((bucket, index) => {
            // Initialise counts to 0 for this bucket for all dates
            Object.keys(openIssueCounts).forEach(date => {
                openIssueCounts[date][bucket] = 0;
            });

            buckets[bucket].forEach(issue => {
                let start = dates.indexOf(dateFormat(issue.githubIssue.created_at, 'yyyy-mm-dd'));
                let end = issue.githubIssue.closed_at ? dates.indexOf(dateFormat(issue.githubIssue.closed_at, 'yyyy-mm-dd')) : dates.length;
                for (let n = start; n < end; n++) {
                    openIssueCounts[dates[n]][bucket] += 1;
                }
            });
            datasets.push({
                label: `Open ${bucket} issues`,
                data: dates.map(date => openIssueCounts[date][bucket]),
                lineTension: 0,
                backgroundColor: FILL_COLORS[index],
            });
        });

        // Count closed issue deltas for entire project
        issues.forEach(issue => {
            let { closed_at } = issue.githubIssue;
            if (!closed_at) {
                return;
            }
            let closedDate = dateFormat(closed_at, 'yyyy-mm-dd');
            closedIssueDeltas[closedDate] += 1;
        });

        // Look back up to 2 weeks to compute average rate per day
        let rateSamplingDays = Math.min(dates.length, 14);
        let closedIssuesOverSamplingDays = 0;
        for (let i = dates.length - rateSamplingDays; i < dates.length; i++) {
            closedIssuesOverSamplingDays += closedIssueDeltas[dates[i]];
        }
        let closeRate = closedIssuesOverSamplingDays / rateSamplingDays;

        // Attempt to project a delivery date for each bucket
        let todaysDate = dates[dates.length - 1];
        Object.keys(buckets).forEach((bucket, index) => {
            let todaysIssues = openIssueCounts[todaysDate][bucket];
            let elapsedDays = dates.length;
            let remainingDays = todaysIssues / closeRate;

            if (todaysIssues > 0 && remainingDays !== Infinity) {
                let date = new Date(todaysDate);
                for (let i = 0; i < remainingDays + 1; i++) {
                    let day = dateFormat(date, 'yyyy-mm-dd');
                    dates.push(day);
                    openIssueCounts[day] = {};
                    date.setDate(date.getDate() + 1);
                }
                let projection = [];
                for (let i = 0; i < elapsedDays; i++) {
                    projection.push(null);
                }
                for (let i = 0; i < remainingDays; i++) {
                    projection.push(todaysIssues - (i * closeRate));
                }
                projection.push(0);
                datasets.push({
                    label: `Projected ${bucket} delivery`,
                    data: projection,
                    lineTension: 0,
                    pointRadius: 0,
                    borderColor: LINE_COLORS[index],
                    borderWidth: 2,
                    backgroundColor: FILL_COLORS[index],
                });
            }
        });

        let data = {
            labels: dates,
            datasets: datasets
        };
        let options = {
            scales: {
                yAxes: [{
                    stacked: true,
                    ticks: {
                        min: 0
                    }
                }]
            }
        };

        return (
            <div className="Burndown raised-box">
                <h3>{ this.props.labels.join(' ') }</h3>
                <Line data={ data } options={ options }/>
            </div>
        );
    }

}

export default Burndown;
