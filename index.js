const clipboardy = require('clipboardy');
const commandLineArgs = require('command-line-args')
const commandLineUsage = require('command-line-usage');
const moment = require('moment');
const nunjucks = require('nunjucks');
const Octokit = require('@octokit/rest')

const optionDefinitions = [
  {name: 'language', alias: 'l', type: String, defaultValue: 'ja', description: 'ja or en are available.'},
  {name: 'from', alias: 'f', type: String, defaultValue: moment().subtract(6, 'days').format('YYYY-MM-DD'), description: 'get data from this date param, format YYYY-MM-DD.'},
  {name: 'until', alias: 'u', type: String, defaultValue: moment().format('YYYY-MM-DD'), description: 'get data until this date param, format YYYY-MM-DD.'},
  {name: 'help', alias: 'h', type: Boolean},
]

const sections = [
  {
    header: 'Github Activity Reporter',
    content: 'github happy activity reporter 🚀'
  },
  {
    header: 'Synopsis',
    content: [
      '$ node index.js <github username> <github personal access token>',
      '$ node index.js <github username> <github personal access token> -l en --from 2019-01-01 --until 2019-02-01'
    ]
  },
  {
    header: 'Options',
    optionList: optionDefinitions
  }
];

const options = commandLineArgs(optionDefinitions, { partial: true })

if (options.help) {
  const usage = commandLineUsage(sections)
  console.log(usage)
  process.exit(0)
}

if (process.argv.length < 4) {
  console.error('This command need args github account name and personal access token.')
  console.error('example command: npm run get -- {username} {token}')
  process.exit(1)
}

const username = process.argv[2]
const token = process.argv[3]

const fromDate = moment(options.from)
const untilDate = moment(options.until)

const octokit = new Octokit({
  auth: `token ${token}`
})

async function getEvents() {
  const per_page = 100
  const page = 1
  const options = octokit.activity.listEventsForUser.endpoint.merge(
    {username, per_page, page}
  )
  return await octokit.paginate(options)
}

function filterEvents(items) {
  return items.filter(item => {
    return moment(item.created_at).isBetween(options.from, options.until, null, '[]')
  })
}

function getOpenedIssue(items) {
  return items.filter(item => item.type === 'IssuesEvent' && item.payload.action === 'opened')
}

function getClosedIssue(items) {
  return items.filter(item => item.type === 'IssuesEvent' && item.payload.action === 'closed')
}

function getOpenedPr(items) {
  return items.filter(item => item.type === 'PullRequestEvent' && item.payload.action === 'opened')
}

function getClosedPr(items) {
  return items.filter(item => item.type === 'PullRequestEvent' && item.payload.action === 'closed' && item.payload.pull_request.merged)
}

function getIssueComment(items) {
  return items.filter(item => item.type === 'IssueCommentEvent' && item.payload.action === 'created')
}

function getReviewComment(items) {
  return items.filter(item => item.type === 'PullRequestReviewCommentEvent' && item.payload.action === 'created')
}

function main() {
  getEvents().then(function(items) {
    items = filterEvents(items)

    if (!items.length) {
      console.error('data not found!!')
      process.exit(1)
    }

    const openedIssues = getOpenedIssue(items)
    const closedIssues = getClosedIssue(items)
    const openedPrs = getOpenedPr(items)
    const closedPrs = getClosedPr(items)
    const issueComments = getIssueComment(items)
    const reviewComments = getReviewComment(items)

    // create other context
    let totalClosedIssueCommentCount = 0
    for (let item of closedIssues) {
      totalClosedIssueCommentCount += item.payload.issue.comments
    }

    let totalClosedPrCommitCount = 0
    let totalClosedPrCommentCount = 0
    let totalClosedPrReviewCommentCount = 0
    let totalClosedPrChangedFileCount = 0
    let totalClosedPrAdditionLineCount = 0
    let totalClosedPrDeletionLineCount = 0
    for (let item of closedPrs) {
      totalClosedPrCommitCount += item.payload.pull_request.commits
      totalClosedPrCommentCount += item.payload.pull_request.comments
      totalClosedPrReviewCommentCount += item.payload.pull_request.review_comments
      totalClosedPrChangedFileCount += item.payload.pull_request.changed_files
      totalClosedPrAdditionLineCount += item.payload.pull_request.additions
      totalClosedPrDeletionLineCount += item.payload.pull_request.deletions
    }

    const otherContext = {
      totalClosedIssueCommentCount,
      totalClosedPrCommitCount,
      totalClosedPrCommentCount,
      totalClosedPrReviewCommentCount,
      totalClosedPrChangedFileCount,
      totalClosedPrAdditionLineCount,
      totalClosedPrDeletionLineCount
    }

    // define context
    const baseContext = {
      from: options.from,
      until: options.until,
      openedIssues,
      closedIssues,
      openedPrs,
      closedPrs,
      issueComments,
      reviewComments
    }
    const context = Object.assign(baseContext, otherContext)

    const result = nunjucks.render(`templates/${options.language}.njk`, context);

    console.log('-------------Export markdown start---------------')
    console.log(result)
    console.log('-------------Export markdown end---------------')
    clipboardy.writeSync(result);
    console.log('Copy complete!! Let\'s paste!!')
    process.exit(0);
  });
}

main()
