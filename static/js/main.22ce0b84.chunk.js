(window.webpackJsonp=window.webpackJsonp||[]).push([[0],{266:function(e,t,n){},273:function(e,t,n){"use strict";n.r(t);var a=n(0),r=n.n(a),s=n(89),o=n.n(s),l=n(8),i=n.n(l),u=n(18),c=n(1),m=n(4),p=n(6),d=n(3),h=n(5),b=n(60),f=n(16),v=n(59),g=n.n(v),y=n(90),k=n(62),E=n(44),w=n.n(E),j=n(91),O=n.n(j),S=function(){function e(){Object(c.a)(this,e)}return Object(m.a)(e,null,[{key:"getConnection",value:function(){var e=Object(u.a)(i.a.mark(function e(t){var n,a;return i.a.wrap(function(e){for(;;)switch(e.prev=e.next){case 0:if(t){e.next=2;break}return e.abrupt("return",{octokit:new w.a,status:"unauthenticated"});case 2:return n=void 0,a=new w.a({auth:"token ".concat(t)}),e.next=6,a.request("GET /").then(function(e){n={octokit:a,status:"authenticated"}}).catch(function(e){"HttpError"===e.name&&401===e.status&&(n={octokit:new w.a,status:"invalid-credentials"})});case 6:return e.abrupt("return",n);case 7:case"end":return e.stop()}},e)}));return function(t){return e.apply(this,arguments)}}()},{key:"getTaskCount",value:function(){var e=Object(u.a)(i.a.mark(function e(t,n){var a,r,s,o;return i.a.wrap(function(e){for(;;)switch(e.prev=e.next){case 0:return a=t.issues.listComments.endpoint.merge({owner:n.owner,repo:n.repo,number:n.number}),e.next=3,t.paginate(a);case 3:return(r=(r=e.sent).map(function(e){return e.body})).unshift(n.body),r=r.join("\n").split(/\r?\n/),s=r.filter(function(e){return e.trim().toLowerCase().startsWith("- [x]")}).length,o=r.filter(function(e){return e.trim().startsWith("- [ ]")}).length,e.abrupt("return",{completed:s,outstanding:o});case 10:case"end":return e.stop()}},e)}));return function(t,n){return e.apply(this,arguments)}}()},{key:"getFullIssues",value:function(){var e=Object(u.a)(i.a.mark(function e(t,n){var a,r,s,o,l,u,c,m,p,d,h,b;return i.a.wrap(function(e){for(;;)switch(e.prev=e.next){case 0:a="\n            query issueBodiesOverTime($owner: String!, $project: String!, $labels: [String!]!) {\n                repository(owner: $owner, name: $project) {\n                    issues(first: 100, labels: $labels) {\n                        edges {\n                            cursor\n                            node {\n                                number\n                                body\n                                userContentEdits(first: 100) {\n                                    edges {\n                                        node {\n                                            editedAt\n                                            diff\n                                        }\n                                    }\n                                }\n                            }\n                        }\n                    }\n                }\n            }",r=!0,s=!1,o=void 0,e.prev=4,l=n[Symbol.iterator]();case 6:if(r=(u=l.next()).done){e.next=16;break}return c=u.value,m=c.split("/"),p=Object(k.a)(m,2),d=p[0],h=p[1],e.next=11,O()(a,{headers:{authorization:"token f3b7ff551d31170bef759d1a6889ee62ce5b3a83"},owner:d,project:h,labels:t});case 11:b=e.sent,console.log(b);case 13:r=!0,e.next=6;break;case 16:e.next=22;break;case 18:e.prev=18,e.t0=e.catch(4),s=!0,o=e.t0;case 22:e.prev=22,e.prev=23,r||null==l.return||l.return();case 25:if(e.prev=25,!s){e.next=28;break}throw o;case 28:return e.finish(25);case 29:return e.finish(22);case 30:case"end":return e.stop()}},e,null,[[4,18,22,30],[23,,25,29]])}));return function(t,n){return e.apply(this,arguments)}}()},{key:"getIssues",value:function(){var e=Object(u.a)(i.a.mark(function e(t,n,a){var r,s,o;return i.a.wrap(function(e){for(;;)switch(e.prev=e.next){case 0:return r=a.map(function(e){return"repo:"+e}).join(" ")+" "+n.map(function(e){return"label:".concat(e)}).join(" "),s=t.search.issuesAndPullRequests.endpoint.merge({q:r}),e.next=4,t.paginate(s);case 4:return o=e.sent,e.abrupt("return",o.map(function(e){return new C(e)}));case 6:case"end":return e.stop()}},e)}));return function(t,n,a){return e.apply(this,arguments)}}()}]),e}(),C=function(){function e(t){Object(c.a)(this,e),this.githubIssue=t,this.url=t.html_url,this.labels=t.labels.map(function(e){return{color:e.color,name:e.name}}),this.progress=void 0,this.title=t.title,this.number=t.number,this.assignees=t.assignees;var n=t.repository_url.split("/"),a=n.slice(n.length-2),r=Object(k.a)(a,2);this.owner=r[0],this.repo=r[1],this.type=e.getType(t),this.state=e.getState(t)}return Object(m.a)(e,null,[{key:"getType",value:function(e){var t=e.labels.map(function(e){return e.name});if(t.includes("bug")){for(var n=0,a=["p1","p2","p3"];n<a.length;n++){var r=a[n];if(t.includes(r))return"".concat(r,"bugs")}return"p1bugs"}return t.includes("feature")||t.includes("enhancement")?"issues":"others"}},{key:"getState",value:function(e){return"closed"===e.state?"done":"open"!==e.state||0!==e.assignees.length&&void 0!==e.assignee?"wip":"todo"}}]),e}(),x=S,N=function(e){function t(){return Object(c.a)(this,t),Object(p.a)(this,Object(d.a)(t).apply(this,arguments))}return Object(h.a)(t,e),Object(m.a)(t,[{key:"render",value:function(){return r.a.createElement("pre",null,'\n    \u2584\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2584\u2590\u2588\u2584\u2584\u2584\u2584\u2588\u258c\n    \u2588\u2588\u2588\u2588\u2588\u2588\u258c\u2584\u258c\u2584\u2590\u2590\u258c\u2588\u2588\u2588\u258c\u2580\u2580\u2588\u2588\u2580\u2580\n    \u2588\u2588\u2588\u2588\u2584\u2588\u258c\u2584\u258c\u2584\u2590\u2590\u258c\u2580\u2588\u2588\u2588\u2584\u2584\u2588\u258c\n    \u2584\u2584\u2584\u2584\u2584\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\n\n    What is a "',Array.join(this.props.location.pathname.match(/.{1,36}/g),"\n                       "),'"?')}}]),t}(a.Component),I=n(17),D=function(e){function t(){return Object(c.a)(this,t),Object(p.a)(this,Object(d.a)(t).apply(this,arguments))}return Object(h.a)(t,e),Object(m.a)(t,[{key:"handleClick",value:function(e){e.preventDefault();var t=prompt("Personal github token",localStorage.getItem("github_token")||"");null!==t&&(localStorage.setItem("github_token",t),window.location.reload())}},{key:"render",value:function(){return r.a.createElement("div",{className:"TokenInput ".concat(this.props.status),onClick:this.handleClick,title:"unauthenticated"===this.props.status?"Add a personal GitHub token to raise the limit of requests you can make to the API":"invalid-credentials"===this.props.status?"Your github token is invalid (fell back to unauthenticated access)":"Successfully connecting using personal GitHub token"},"unauthenticated"===this.props.status?"Add ":"","Personal GitHub Token")}}]),t}(a.Component),P=function(e){function t(){return Object(c.a)(this,t),Object(p.a)(this,Object(d.a)(t).apply(this,arguments))}return Object(h.a)(t,e),Object(m.a)(t,[{key:"render",value:function(){var e=this,n=this.props.categories,a=this.props.items,s=this.props.renderItem;if(0===n.length)return r.a.createElement("ul",null,a.sort(this.props.sortItems).map(function(e){return s(e)}));var o=n[0],l=o.label,i=o.sort,u=o.unbucketed,c=Object(I.a)(new Set(a.filter(l).map(l))).sort(i),m={};if(c.forEach(function(e){m[e]=a.filter(function(t){return l(t)===e})}),u){var p=a.filter(function(e){return!Object.values(m).reduce(Array.concat,[]).includes(e)});p.length>0&&(m[u]=p)}return Object.keys(m).map(function(a){return m[a].length>0?r.a.createElement("ul",null,r.a.createElement("li",{className:"heading",key:a},a,r.a.createElement(t,{categories:n.slice(1),items:m[a],renderItem:s,sortItems:e.props.sortItems}))):null})}}]),t}(a.Component),T=function(e){function t(){return Object(c.a)(this,t),Object(p.a)(this,Object(d.a)(t).apply(this,arguments))}return Object(h.a)(t,e),Object(m.a)(t,[{key:"render",value:function(){var e=[{label:function(e){var t=e.labels.filter(function(e){return e.name.startsWith("phase:")});return t.length>0?t[0].name:null},sort:function(e,t){return Number(e.split(":")[1])-Number(t.split(":")[1])},unbucketed:"unphased"}];this.props.repos.length>1&&e.push({label:function(e){return e.owner+"/"+e.repo}});return r.a.createElement("div",{className:"Plan raised-box"},r.a.createElement("p",{className:"label"},this.props.labels.join(" ")),r.a.createElement(P,{categories:e,items:this.props.issues,renderItem:function(e){return r.a.createElement("li",{className:"task",key:e.number},r.a.createElement("a",{href:e.url,target:"_blank",rel:"noopener noreferrer"},"".concat(e.number," ").concat(e.title)),r.a.createElement("span",{className:"state "+e.state},"done"===e.state?" (done)":"wip"===e.state?" (in progress)":""))},sortItems:function(e,t){var n=["done","wip","todo"];return e.state!==t.state?n.indexOf(e.state)-n.indexOf(t.state):e.number-t.number}}),r.a.createElement(D,{status:this.props.connectionStatus}))}}]),t}(a.Component),A=n(14),_=n.n(A);function L(e,t){return{labels:e,repo:t,deliveryDate:void 0,todo:{issues:[],p1bugs:[],p2bugs:[],p3bugs:[],others:[]},wip:{issues:[],p1bugs:[],p2bugs:[],p3bugs:[],others:[]},done:{issues:[],p1bugs:[],p2bugs:[],p3bugs:[],others:[]}}}function W(e,t){return null===t?null:e.milestone&&e.milestone.due_on?void 0===t?new Date(e.milestone.due_on):Math.max(t,new Date(e.milestone.due_on)):null}var B=function(e){function t(){return Object(c.a)(this,t),Object(p.a)(this,Object(d.a)(t).apply(this,arguments))}return Object(h.a)(t,e),Object(m.a)(t,[{key:"calculatePercentCompleted",value:function(e){var t=["issues","p1bugs"],n=t.map(function(t){return e.done[t].length}).reduce(function(e,t){return e+t}),a=t.map(function(t){return e.todo[t].length+e.wip[t].length+e.done[t].length}).reduce(function(e,t){return e+t},0);return 0===a?"~":(n/a*100).toFixed(0)}},{key:"getAssigneesFilter",value:function(e){var t=Object(I.a)(new Set(e.map(function(e){return e.assignees.map(function(e){return e.login})}).reduce(function(e,t){return e.concat(t)},[]))).map(function(e){return"assignee:".concat(e)}).join("+");return t||(t="no:assignee"),t}},{key:"makeLink",value:function(e,t,n,a){if(0===a.length)return r.a.createElement("span",null,"0");n||(n=[]);var s=!1;n.includes("assignee:*")&&(n=n.filter(function(e){return"assignee:*"!==e}),s=!0);var o=(n=n.concat(t.map(function(e){return"label:".concat(e)}))).join("+"),l="";if(s){var i=this.getAssigneesFilter(a);l="https://github.com/search?utf8=%E2%9C%93&q=repo%3A".concat(e,"+").concat(o,"+").concat(i,"&type=Issues&ref=advsearch&l=&l=+")}else l="https://github.com/".concat(e,"/issues?utf8=%E2%9C%93&q=").concat(o);var u=a.map(function(e){return"#".concat(e.number," ").concat(e.title)}).reduce(function(e,t){return e.concat(t)},[]);return r.a.createElement("a",{href:l,target:"_blank",rel:"noopener noreferrer",title:u.join("\n")},u.length)}},{key:"render",value:function(){var e=this.props.repoFeature;return r.a.createElement("div",{className:"Summary-Row"},r.a.createElement("div",null,r.a.createElement("a",{href:"https://github.com/".concat(e.repo,"/issues")},e.repo)),r.a.createElement("div",null,this.makeLink(e.repo,e.labels,["is:open","no:assignee","label:feature"],e.todo.issues)),r.a.createElement("div",null,this.makeLink(e.repo,e.labels,["is:open","assignee:*","label:feature"],e.wip.issues)),r.a.createElement("div",null,this.makeLink(e.repo,e.labels,["is:closed","label:feature"],e.done.issues)),r.a.createElement("div",null,this.makeLink(e.repo,e.labels,["is:open","no:assignee","label:bug","-label:p2","-label:p3","-label:p4","-label:p5"],e.todo.p1bugs)),r.a.createElement("div",null,this.makeLink(e.repo,e.labels,["is:open","no:assignee","label:bug","label:p2"],e.todo.p2bugs)),r.a.createElement("div",null,this.makeLink(e.repo,e.labels,["is:open","no:assignee","label:bug","label:p3"],e.todo.p3bugs)),r.a.createElement("div",null,this.makeLink(e.repo,e.labels,["is:open","assignee:*","label:bug"],e.wip.p1bugs.concat(e.wip.p2bugs).concat(e.wip.p3bugs))),r.a.createElement("div",null,this.makeLink(e.repo,e.labels,["is:closed","label:bug"],e.done.p1bugs.concat(e.done.p2bugs).concat(e.done.p3bugs))),r.a.createElement("div",null,this.makeLink(e.repo,e.labels,["is:open"].concat(e.todo.others.concat(e.wip.others).map(function(e){return e.number})),e.todo.others.concat(e.wip.others))),r.a.createElement("div",{className:e.deliveryDate?"":"NoDate"},e.deliveryDate?_()(e.deliveryDate,"yyyy-mm-dd"):"n/a"),r.a.createElement("div",{className:"Completed"},this.calculatePercentCompleted(e),"%"))}}]),t}(a.Component),M=function(e){function t(){return Object(c.a)(this,t),Object(p.a)(this,Object(d.a)(t).apply(this,arguments))}return Object(h.a)(t,e),Object(m.a)(t,[{key:"calculatePercentCompleted",value:function(e){var t=["issues","p1bugs"],n=0,a=0,r=!0,s=!1,o=void 0;try{for(var l,i=function(){var e=l.value;n+=t.map(function(t){return e.done[t].length}).reduce(function(e,t){return e+t}),a+=t.map(function(t){return e.todo[t].length+e.wip[t].length+e.done[t].length}).reduce(function(e,t){return e+t},0)},u=e.repos[Symbol.iterator]();!(r=(l=u.next()).done);r=!0)i()}catch(c){s=!0,o=c}finally{try{r||null==u.return||u.return()}finally{if(s)throw o}}return 0===a?"~":(n/a*100).toFixed(0)}},{key:"render",value:function(){var e=function(e,t,n){var a={},r=!0,s=!1,o=void 0;try{for(var l,i=n[Symbol.iterator]();!(r=(l=i.next()).done);r=!0){var u=l.value;a[u]=L(t,u)}}catch(v){s=!0,o=v}finally{try{r||null==i.return||i.return()}finally{if(s)throw o}}var c=!0,m=!1,p=void 0;try{for(var d,h=e[Symbol.iterator]();!(c=(d=h.next()).done);c=!0){var b=d.value,f=a["".concat(b.owner,"/").concat(b.repo)];f[b.state][b.type].push(b),"done"!==b.state&&["issues","p1bugs"].includes(b.type)&&(f.deliveryDate=W(b,f.deliveryDate))}}catch(v){m=!0,p=v}finally{try{c||null==h.return||h.return()}finally{if(m)throw p}}return{labels:t,repos:Object.values(a)}}(this.props.issues,this.props.labels,this.props.repos),t=e.repos.map(function(e){return r.a.createElement(B,{repoFeature:e,key:e.repo})});return r.a.createElement("div",{className:"Summary raised-box"},r.a.createElement("div",{className:"Summary-Header"},r.a.createElement("div",{className:"Label"},e.labels.join(" ")),r.a.createElement("div",{className:"PercentComplete"},this.calculatePercentCompleted(e),"%")),r.a.createElement("div",{className:"Summary-Table"},r.a.createElement("div",{className:"Summary-Column"}),r.a.createElement("div",{className:"Summary-Column Implementation"}),r.a.createElement("div",{className:"Summary-Column Implementation"}),r.a.createElement("div",{className:"Summary-Column Implementation"}),r.a.createElement("div",{className:"Summary-Column Bugs"}),r.a.createElement("div",{className:"Summary-Column Bugs"}),r.a.createElement("div",{className:"Summary-Column Bugs"}),r.a.createElement("div",{className:"Summary-Column Bugs"}),r.a.createElement("div",{className:"Summary-Column Bugs"}),r.a.createElement("div",{className:"Summary-Column"}),r.a.createElement("div",{className:"Summary-Column"}),r.a.createElement("div",{className:"Summary-Column"}),r.a.createElement("div",{className:"Summary-Row Summary-TableHeader"},r.a.createElement("div",null,"Repo"),r.a.createElement("div",null,r.a.createElement("span",{className:"MetaTitleHolder"},r.a.createElement("span",{className:"MetaTitle"},"Planned Work")),"Todo"),r.a.createElement("div",null,"WIP"),r.a.createElement("div",null,"Done"),r.a.createElement("div",null,r.a.createElement("span",{className:"MetaTitleHolder"},r.a.createElement("span",{className:"MetaTitle"},"Bugs")),"P1"),r.a.createElement("div",null,"P2"),r.a.createElement("div",null,"P3"),r.a.createElement("div",null,"WIP"),r.a.createElement("div",null,"Fixed"),r.a.createElement("div",null,"Other"),r.a.createElement("div",null,"Delivery"),r.a.createElement("div",null)),t),r.a.createElement(D,{status:this.props.connectionStatus}))}}]),t}(a.Component),q=n(94),F=["rgba(0, 40, 0, 0.2)","rgba(40, 0, 0, 0.2)","rgba(0, 0, 40, 0.2)","rgba(40, 40, 0, 0.2)","rgba(0, 40, 40, 0.2)","rgba(40, 0, 40, 0.2)"],H=["rgba(0, 40, 0, 0.5)","rgba(40, 0, 0, 0.5)","rgba(0, 0, 40, 0.5)","rgba(40, 40, 0, 0.5)","rgba(0, 40, 40, 0.5)","rgba(40, 0, 40, 0.5)"],$=function(e){function t(){return Object(c.a)(this,t),Object(p.a)(this,Object(d.a)(t).apply(this,arguments))}return Object(h.a)(t,e),Object(m.a)(t,[{key:"render",value:function(){var e=this.props.issues;if(0===e.length)return r.a.createElement("div",{className:"Burndown raised-box"},r.a.createElement("h3",null,"Loading data..."));for(var t=[],n={},a={},s=new Date,o=(new Date).setDate(s.getDate()+1),l=(new Date).setFullYear(s.getFullYear()-1),i=new Date(Math.max(Math.min.apply(Math,Object(I.a)(e.map(function(e){return new Date(e.githubIssue.created_at)}))),l));i<o;){var u=_()(i,"yyyy-mm-dd");t.push(u),n[u]={},a[u]=0,i.setDate(i.getDate()+1)}var c=function(e){var t=e.labels.filter(function(e){return e.name.startsWith("phase:")});return t.length>0?t[0].name:null},m=Object(I.a)(new Set(e.filter(c).map(c))).sort(function(e,t){return Number(e.split(":")[1])-Number(t.split(":")[1])}),p={};m.length>0?m.forEach(function(t){p[t]=e.filter(function(e){return c(e)===t})}):p.unphased=e;var d=[];Object.keys(p).forEach(function(e,a){Object.keys(n).forEach(function(t){n[t][e]=0}),p[e].forEach(function(a){for(var r=Math.max(0,t.indexOf(_()(a.githubIssue.created_at,"yyyy-mm-dd"))),s=a.githubIssue.closed_at?t.indexOf(_()(a.githubIssue.closed_at,"yyyy-mm-dd")):t.length,o=r;o<s;o++)n[t[o]][e]+=1}),d.push({label:"Open ".concat(e," issues"),data:t.map(function(t){return n[t][e]}),lineTension:0,backgroundColor:F[a]})}),e.forEach(function(e){var t=e.githubIssue.closed_at;if(t){var n=_()(t,"yyyy-mm-dd");a[n]+=1}});for(var h=Math.min(t.length,14),b=0,f=t.length-h;f<t.length;f++)b+=a[t[f]];var v=b/h,g=t[t.length-1],y=t.length,k=0,E=0;Object.keys(p).forEach(function(e,a){var r=n[g][e],s=r/v;if(r>0&&s!==1/0){for(var o=t[t.length-1],l=new Date(o),i=0;i<s+1;i++)t.push(_()(l,"yyyy-mm-dd")),l.setDate(l.getDate()+1);for(var u=[],c=0;c<y;c++)u.push(null);for(var m=0;m<k;m++)u.push(r);for(var p=E;p<s+1;p++)u.push(r-p*v);E=Math.ceil(s)-s,d.push({label:"Projected ".concat(e," delivery"),data:u,lineTension:0,pointRadius:0,borderColor:H[a],borderWidth:2,backgroundColor:F[a]})}k+=s});var w={labels:t,datasets:d};return r.a.createElement("div",{className:"Burndown raised-box"},r.a.createElement("h3",null,this.props.labels.join(" ")),r.a.createElement(q.a,{data:w,options:{scales:{yAxes:[{stacked:!0,ticks:{min:0}}]}}}))}}]),t}(a.Component),R=(n(266),function(e){function t(e){var n;return Object(c.a)(this,t),(n=Object(p.a)(this,Object(d.a)(t).call(this))).state={query:null,issues:[],repos:[],labels:[],connectionStatus:"connecting"},n}return Object(h.a)(t,e),Object(m.a)(t,[{key:"componentDidMount",value:function(){var e=Object(u.a)(i.a.mark(function e(){var t,n,a,r;return i.a.wrap(function(e){for(;;)switch(e.prev=e.next){case 0:if(!window.location.hash.includes("?")){e.next=14;break}return t=g.a.parse(window.location.hash.substring(window.location.hash.indexOf("?"))),Array.isArray(t.repo)||(t.repo=[t.repo]),Array.isArray(t.label)||(t.label=[t.label]),n=localStorage.getItem("github_token"),e.next=7,x.getConnection(n);case 7:return a=e.sent,this.setState({connectionStatus:a.status}),document.title=t.label.join(" "),e.next=12,x.getIssues(a.octokit,t.label,t.repo);case 12:r=e.sent,this.setState({query:t,labels:t.label,repos:t.repo,issues:r});case 14:case"end":return e.stop()}},e,this)}));return function(){return e.apply(this,arguments)}}()},{key:"pathWithQuery",value:function(e){return this.state.query?e+"?"+g.a.stringify(this.state.query):e}},{key:"render",value:function(){var e=this;return r.a.createElement("div",null,r.a.createElement(y.a,{onChange:function(e){window.location.reload()}}),r.a.createElement(b.a,null,r.a.createElement(f.c,null,this.routes.map(function(t){var n=t.path,a=t.component;return r.a.createElement(f.a,{path:n,key:n,render:function(t){return r.a.createElement(a,Object.assign({},t,{repos:e.state.repos,labels:e.state.labels,issues:e.state.issues,connectionStatus:e.state.connectionStatus}))}})}),r.a.createElement(f.a,{exact:!0,path:"/",component:G}),r.a.createElement(f.a,{component:N})),r.a.createElement("nav",{className:"raised-box"},this.routes.map(function(t){var n=t.path,a=t.label;return r.a.createElement(b.b,{key:n,to:e.pathWithQuery(n)},a)}))))}},{key:"routes",get:function(){return[{path:"/summary",label:"Summary",component:M},{path:"/plan",label:"Plan",component:T},{path:"/burndown",label:"Burndown",component:$}]}}]),t}(a.Component)),G=function(e){function t(){return Object(c.a)(this,t),Object(p.a)(this,Object(d.a)(t).apply(this,arguments))}return Object(h.a)(t,e),Object(m.a)(t,[{key:"render",value:function(){return window.location.replace("".concat(window.location.pathname,"#/summary").concat(window.location.search)),r.a.createElement("p",null,"Redirecting...")}}]),t}(a.Component),Y=R;Boolean("localhost"===window.location.hostname||"[::1]"===window.location.hostname||window.location.hostname.match(/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/));o.a.render(r.a.createElement(Y,null),document.getElementById("root")),"serviceWorker"in navigator&&navigator.serviceWorker.ready.then(function(e){e.unregister()})},98:function(e,t,n){e.exports=n(273)}},[[98,1,2]]]);
//# sourceMappingURL=main.22ce0b84.chunk.js.map