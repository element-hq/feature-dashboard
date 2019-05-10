import React, { Component } from 'react';

import dateFormat from 'dateformat';
import { Line } from 'react-chartjs-2';

class Burndown extends Component {

    render() {
        if (this.props.issues.length === 0) {
            return (
                <div className="Burndown">
                    <h3>Loading data...</h3>
                </div>
            );
        }

        let dates = [];
        let issueCounts = {};

        let date = new Date(
            Math.min(
                ...this.props.issues.map(
                    issue => new Date(issue.githubIssue.created_at)
                )
            )
        );
        let today = new Date();
        let tomorrow = new Date().setDate(today.getDate() + 1);
        while (date < tomorrow) {
            let day = dateFormat(date, 'yyyy-mm-dd');
            dates.push(day);
            issueCounts[day] = 0;
            date.setDate(date.getDate() + 1);
        }

        this.props.issues.forEach(issue => {
            let start = dateFormat(issue.githubIssue.created_at, 'yyyy-mm-dd');
            let end = issue.githubIssue.closed_at ? dateFormat(issue.githubIssue.closed_at, 'yyyy-mm-dd') : dates[dates.length - 1];
            for (let n = dates.indexOf(start); n <= dates.indexOf(end); n++) {
                issueCounts[dates[n]] += 1;
            }
        });

        let datasets = [
            {
                label: 'Open issues',
                data: dates.map(date => issueCounts[date]),
                lineTension: 0,
            }
        ];

        let maxDate = Object.keys(issueCounts)
            .reduce((a, b) => {
                if (issueCounts[a] === issueCounts[b]) {
                    return a < b ? a : b;
                }
                else {
                    return issueCounts[a] > issueCounts[b] ? a : b
                }
            });

        let maxIssues = issueCounts[maxDate];
        let todaysIssues = issueCounts[dates[dates.length - 1]];
        let elapsedDays = (dates.length - dates.indexOf(maxDate) - 1);
        let rate = (maxIssues - todaysIssues) / elapsedDays;
        let totalDays = dates.indexOf(maxDate) + 1 + (maxIssues / rate);
        let remainingDays = totalDays - dates.length;

        if (remainingDays !== Infinity) {
            let date = new Date(dates[dates.length - 1]);
            for (let i = 0; i < remainingDays + 1; i++) {
                date.setDate(date.getDate() + 1);
                dates.push(dateFormat(date, 'yyyy-mm-dd'));
            }
            let projection = [];
            for (let i = 0; i < dates.indexOf(maxDate); i++) {
                projection.push(null);
            }
            for (let i = 0; i < elapsedDays + remainingDays; i++) {
                projection.push(maxIssues - (i * rate));
            }
            projection.push(0);
            datasets.push({
                label: 'Projected delivery',
                data: projection,
                lineTension: 0,
                fill: false,
                pointRadius: 0,
                borderColor: '#738d04',
                borderWidth: 1
            });

        }

        let data = {
            labels: dates,
            datasets: datasets
        };
        let options = {
            scales: {
                yAxes: [{
                    ticks: {
                        min: 0
                    }
                }]
            }
        };

        return (
            <div className="Burndown">
                <h3>{ this.props.labels.join(' ') }</h3>
                <Line data={ data } options={ options }/>
            </div>
        );
    }

}

export default Burndown;
