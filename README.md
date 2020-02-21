Summarise the status of a feature that is in development across multiple github projects:
![image](https://user-images.githubusercontent.com/1922197/54301147-4bd31580-45b6-11e9-8c93-558ba4c072c4.png)
https://vector-im.github.io/feature-dashboard/?repo=vector-im/riot-web&repo=vector-im/riot-ios&repo=vector-im/riot-android&label=feature:e2e-sas-verification

## How it works

All the issues across all the projects are tagged with same label. What this label is isn't particularly important; right now we're using `feature:feature-name`.

The statuses roughly translate to the following search criteria:
 - Planned Work
     - Todo: `is:issue is:open label:feature:feature-name no:assignee`
     - WIP: `is:issue is:open label:feature:feature-name` and is assigned to _somebody_
     - Done: `is:issue is:closed label:feature:feature-name`
 - Bugs
     - P1: `is:issue is:open label:feature:feature-name label:bug label:p1 no:assignee`
     - P2: `is:issue is:open label:feature:feature-name label:bug label:p2 no:assignee`
     - P3: `is:issue is:open label:feature:feature-name label:bug label:p3 no:assignee`
     - WIP: `is:issue is:open label:feature:feature-name label:bug` and is assigned to _somebody_
     - Fixed: `is:issue is:closed label:feature:feature-name label:bug`
 - Delivery: If all the issues in `Planned Work -> Todo`, `Planned Work -> WIP`, `Bugs -> P1` and `Bugs -> WIP` are within dated milestones, show the latest delivery date associated with any of those milestones
 - % Complete: (Completed non-bug items + completed p1 bugs) / (Total non-bug items + total p1 bugs)
     
