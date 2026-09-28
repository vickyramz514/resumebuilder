export const SITE_ORIGIN = 'https://careerresume.in';

export type SeoSection = { heading: string; paragraphs: string[]; bullets?: string[] };
export type SeoBody = { intro: string; sections: SeoSection[]; related: string[] };

export type SeoSeed = {
  slug: string;
  title: string;
  metaDescription: string;
  h1: string;
  keywords: string[];
  body: SeoBody;
};

const page = (seed: SeoSeed): SeoSeed => seed;

export const SEO_LABELS: Record<string, string> = {
  'react-developer': 'React developer',
  'react-native-developer': 'React Native developer',
  'frontend-developer': 'Frontend developer',
  'backend-developer': 'Backend developer',
  'full-stack-developer': 'Full-stack developer',
  'nodejs-developer': 'Node.js developer',
  'javascript-developer': 'JavaScript developer',
  'software-engineer': 'Software engineer',
  'senior-software-engineer': 'Senior software engineer',
  'ats-resume': 'ATS-friendly resume',
  'fresher-resume': 'Fresher resume',
  'product-manager': 'Product manager',
  'data-analyst': 'Data analyst',
  'data-scientist': 'Data scientist',
  'devops-engineer': 'DevOps engineer',
  'qa-engineer': 'QA engineer',
  'ui-ux-designer': 'UI/UX designer'
};

export function relatedLabel(slug: string) {
  return SEO_LABELS[slug] ?? slug.replace(/-/g, ' ');
}

export const SEO_SEEDS: SeoSeed[] = [
  page({
    slug: 'react-developer',
    title: 'React Developer Resume Examples and What to Include',
    metaDescription: 'How to write a React developer resume that shows components, state, and shipped UI, with a layout an applicant tracking system can read.',
    h1: 'React developer resume: show the interface you shipped',
    keywords: ['react developer resume', 'react resume example', 'react.js resume'],
    body: {
      intro: 'A React resume is not a list of hook names. Hiring managers want to see which screens you owned, how data moved through them, and what changed for the people using the product.',
      sections: [
        {
          heading: 'What belongs near the top',
          paragraphs: [
            'Open with the kind of interface you build: customer dashboards, design systems, or internal tools. Name the React version and the surrounding stack only after the outcome.',
            'A useful headline is specific. "React developer who ships accessible dashboards" tells a reader more than "passionate frontend engineer".'
          ]
        },
        {
          heading: 'Experience bullets that hold up',
          paragraphs: ['Write bullets as a change you made and the result someone could check. Avoid "worked on components" unless you say which flow and what got faster or clearer.'],
          bullets: [
            'Rebuilt the billing settings screen so plan changes saved without a full reload.',
            'Split a 2,000-line page into routed sections and cut the time to fix a copy bug.',
            'Added keyboard paths and labels to the main form after a support queue kept flagging it.'
          ]
        },
        {
          heading: 'Skills to list, and skills to leave off',
          paragraphs: ['List React, the language you write it in, and the tools you use to ship: routing, data fetching, tests, and the design system. Leave off every library you only opened once.']
        }
      ],
      related: ['frontend-developer', 'javascript-developer', 'ats-resume']
    }
  }),
  page({
    slug: 'react-native-developer',
    title: 'React Native Developer Resume: Mobile Work That Reads Clearly',
    metaDescription: 'What a React Native resume should cover: screens, native modules, releases, and the bugs that only show up on a device.',
    h1: 'React Native developer resume: write about the app, not only the framework',
    keywords: ['react native resume', 'react native developer resume', 'mobile developer resume'],
    body: {
      intro: 'React Native resumes fail when they read like a web React resume with the word mobile added. Reviewers want the app, the stores you shipped to, and the device problems you actually solved.',
      sections: [
        {
          heading: 'Lead with the product in someone\'s hand',
          paragraphs: [
            'Name the app type and the platforms. A field-service app on iOS and Android is a different job from a content app that is mostly a webview.',
            'If you owned releases, say so. TestFlight, Play Console, and a staged rollout are evidence that the work left your laptop.'
          ]
        },
        {
          heading: 'Bullets that separate you from web-only React',
          paragraphs: ['Mention navigation, offline behavior, permissions, and any native module you touched. One concrete device bug is worth more than a list of UI libraries.'],
          bullets: [
            'Fixed a crash on Android 12 that only appeared after the app returned from the camera.',
            'Kept a draft form on disk so a dropped connection did not wipe a technician\'s notes.',
            'Shipped a staged Play Store rollout and watched the crash-free rate before opening it to everyone.'
          ]
        },
        {
          heading: 'How to treat the shared JavaScript',
          paragraphs: ['If you share types or API clients with a web app, say what you shared and what you refused to share. That judgment is the senior signal in mobile work.']
        }
      ],
      related: ['react-developer', 'frontend-developer', 'software-engineer']
    }
  }),
  page({
    slug: 'frontend-developer',
    title: 'Frontend Developer Resume Guide',
    metaDescription: 'Build a frontend developer resume around pages, accessibility, and performance. Keep the file readable by both a recruiter and an applicant tracking system.',
    h1: 'Frontend developer resume: pages, performance, and the details people feel',
    keywords: ['frontend developer resume', 'front end resume', 'ui developer resume'],
    body: {
      intro: 'Frontend hiring is a skim test. The reader wants to know which surfaces you owned and whether you care about loading, keyboard use, and the states that are not the happy path.',
      sections: [
        {
          heading: 'Structure the page in the order they scan',
          paragraphs: [
            'Put the role line under your name, then a short profile, then experience. Skills can sit beside that story. Do not open with a wall of tool logos.',
            'Use real section headings: Profile, Experience, Projects, Skills, Education. Those words are what a parser and a tired recruiter both look for.'
          ]
        },
        {
          heading: 'Proof that is more than a screenshot',
          paragraphs: ['Describe a page before and after your change. Mention the constraint: a slow dashboard, a form people abandoned, or a layout that broke at a real width.'],
          bullets: [
            'Cut the dashboard\'s first useful paint by removing a render loop on the filter bar.',
            'Rebuilt the empty and error states so a failed request told people what to do next.',
            'Matched the type scale to the design system instead of one-off font sizes on each page.'
          ]
        },
        {
          heading: 'Projects when the job history is short',
          paragraphs: ['A project section earns its place when it shows a complete interface: the data, the states, and how someone would run it. A tutorial clone with no decision in it does not.']
        }
      ],
      related: ['react-developer', 'javascript-developer', 'ats-resume']
    }
  }),
  page({
    slug: 'backend-developer',
    title: 'Backend Developer Resume: APIs, Data, and Reliability',
    metaDescription: 'Write a backend developer resume that shows the APIs you owned, the data you protected, and how you noticed when something failed.',
    h1: 'Backend developer resume: make the system someone else can trust',
    keywords: ['backend developer resume', 'api developer resume', 'server side resume'],
    body: {
      intro: 'Backend resumes get skipped when they list every database you have seen. The useful version says which service you owned, who called it, and what you did when it was wrong.',
      sections: [
        {
          heading: 'Name the boundary you owned',
          paragraphs: [
            'An API for billing, a worker that sends mail, or the schema behind a report are all clearer than "developed microservices".',
            'Say how other teams used it. A contract you kept stable is as important as a feature you added.'
          ]
        },
        {
          heading: 'Bullets a reviewer can believe',
          paragraphs: ['Include the failure mode, not only the happy path. Migrations, idempotency, and a metric you watched are the details that separate operators from tutorial readers.'],
          bullets: [
            'Made checkout retries safe so a double-click could not create two charges.',
            'Moved a nightly report off the request path after it started timing out the admin page.',
            'Added a migration that backfilled a column without locking the table during business hours.'
          ]
        },
        {
          heading: 'Skills line',
          paragraphs: ['Group the language, the datastore, and the way you ship: tests, migrations, and logs. Skip tools you cannot discuss for five minutes.']
        }
      ],
      related: ['nodejs-developer', 'full-stack-developer', 'software-engineer']
    }
  }),
  page({
    slug: 'full-stack-developer',
    title: 'Full-Stack Developer Resume Examples',
    metaDescription: 'A full-stack resume should show both the interface and the service behind it, including the tradeoff you made when they met.',
    h1: 'Full-stack developer resume: one story from the screen to the data',
    keywords: ['full stack developer resume', 'fullstack resume', 'full-stack resume example'],
    body: {
      intro: 'Full-stack does not mean two half resumes stapled together. The strongest pages follow one feature from the control a person used to the record that got stored.',
      sections: [
        {
          heading: 'Pick features, not layers',
          paragraphs: [
            'For each role, choose two features you carried across the stack. Describe the screen, the request, and the rule that had to stay true.',
            'If you were stronger on one side, say so. "Owned the API and paired on the UI" is more credible than claiming equal depth everywhere.'
          ]
        },
        {
          heading: 'A bullet that crosses the boundary',
          paragraphs: ['The best full-stack bullet has a user action and a system consequence.'],
          bullets: [
            'Let support staff edit a subscription in the admin UI without opening a database console.',
            'Returned a clear error when a seat limit was hit, instead of a generic 500 on the invite form.',
            'Kept the preview and the saved document on the same schema so export could not drift from what the editor showed.'
          ]
        },
        {
          heading: 'What to cut',
          paragraphs: ['You do not need every framework on both sides. One frontend stack and one backend stack, plus the database, is enough for a first page.']
        }
      ],
      related: ['frontend-developer', 'backend-developer', 'nodejs-developer']
    }
  }),
  page({
    slug: 'nodejs-developer',
    title: 'Node.js Developer Resume Guide',
    metaDescription: 'How to write a Node.js resume around services you ran in production: APIs, background work, and the errors you handled on purpose.',
    h1: 'Node.js developer resume: services that stayed up after you shipped them',
    keywords: ['node.js resume', 'nodejs developer resume', 'node resume example'],
    body: {
      intro: 'A Node.js resume should read like an operator\'s notes. The runtime is common. What is rare is a clear account of an API or worker you ran, watched, and fixed.',
      sections: [
        {
          heading: 'Say what the process did',
          paragraphs: [
            'HTTP APIs, queue consumers, and CLI jobs are different jobs. Name which one you owned and what called it.',
            'Mention the framework only as a detail. Express or another server library is not the achievement.'
          ]
        },
        {
          heading: 'Production details worth a line',
          paragraphs: ['Timeouts, retries, and graceful shutdown are the Node-specific stories reviewers remember, because they have been paged for the opposite.'],
          bullets: [
            'Stopped a retry storm by making the webhook handler ignore duplicates.',
            'Moved PDF generation off the web process after it stalled other requests.',
            'Logged request ids so a failed checkout could be traced without guessing.'
          ]
        },
        {
          heading: 'Pair it with the data',
          paragraphs: ['Node rarely stands alone on a resume. Name the database and how you changed schema. A migration you wrote is stronger than a logo row.']
        }
      ],
      related: ['backend-developer', 'javascript-developer', 'full-stack-developer']
    }
  }),
  page({
    slug: 'javascript-developer',
    title: 'JavaScript Developer Resume: Language First',
    metaDescription: 'Write a JavaScript developer resume that shows how you use the language in a real product, not a list of every framework released this year.',
    h1: 'JavaScript developer resume: the language, then the product around it',
    keywords: ['javascript developer resume', 'javascript resume', 'js developer resume'],
    body: {
      intro: 'JavaScript on a resume can mean a browser, a server, or both. Pick the place you actually worked and describe the product. A keyword pile of frameworks reads as uncertainty.',
      sections: [
        {
          heading: 'Choose a center of gravity',
          paragraphs: [
            'If most of your work is in the browser, say that and link the story to interfaces. If most of it is on the server, talk about APIs and jobs. If you cross both, follow one feature across.',
            'TypeScript belongs here when you used it to prevent a class of bugs. Say which boundary got types: API payloads, design-system props, or shared models.'
          ]
        },
        {
          heading: 'Bullets that are not framework trivia',
          paragraphs: ['Show a decision about data shape, async work, or a bug that only appeared in production.'],
          bullets: [
            'Normalized form state so a half-saved draft could be restored after a refresh.',
            'Replaced a chain of callbacks in a checkout flow with a sequence people could log.',
            'Caught invalid API data at the edge instead of letting it render as a blank page.'
          ]
        },
        {
          heading: 'Keep the skills list short',
          paragraphs: ['JavaScript, the runtime, one main framework, testing, and the tools you use every week. Anything older than your current job should earn its place with a bullet, not a chip.']
        }
      ],
      related: ['frontend-developer', 'react-developer', 'nodejs-developer']
    }
  }),
  page({
    slug: 'software-engineer',
    title: 'Software Engineer Resume Structure That Stays Readable',
    metaDescription: 'A software engineer resume template for people who build products: what to include, what to cut, and how to keep the file parsable.',
    h1: 'Software engineer resume: a page a hiring manager can finish',
    keywords: ['software engineer resume', 'software engineer resume example', 'swe resume'],
    body: {
      intro: 'Software engineer is a broad title. The resume has to choose a lane in the first two lines, then prove it with work someone else relied on.',
      sections: [
        {
          heading: 'The first screen',
          paragraphs: [
            'Name, a role line, and where you are. Then three or four lines on the kind of system you build. Save the tool list for later.',
            'One page is enough for most early and mid-level searches. A second page is justified when the extra roles are real and recent, not a transcript of every class.'
          ]
        },
        {
          heading: 'Experience, in the order they will check',
          paragraphs: ['Most recent role first. For each role: title, company, dates, then bullets that start with a verb and end with a result.'],
          bullets: [
            'Shipped a change customers noticed, and say how you knew.',
            'Reduced a cost or a delay, with the before and after if you have them.',
            'Left something another engineer could run: a test, a runbook, or a simpler design.'
          ]
        },
        {
          heading: 'Format that survives the upload',
          paragraphs: ['Use ordinary headings and a single reading order. A designed PDF is for a person. When a form scans the file, send a Word document with the same sections.']
        }
      ],
      related: ['senior-software-engineer', 'full-stack-developer', 'ats-resume']
    }
  }),
  page({
    slug: 'senior-software-engineer',
    title: 'Senior Software Engineer Resume: Scope, Not a Longer Junior Page',
    metaDescription: 'What changes on a senior software engineer resume: scope, tradeoffs, and the people who could move faster because of your work.',
    h1: 'Senior software engineer resume: show the scope, not just the tickets',
    keywords: ['senior software engineer resume', 'senior engineer resume', 'staff-ready resume'],
    body: {
      intro: 'A senior resume that is only a junior resume with more bullets will be read as mid-level. Seniors are hired for judgment: what you chose not to build, who you unblocked, and which risk you named early.',
      sections: [
        {
          heading: 'Rewrite the bullets around scope',
          paragraphs: [
            'Replace "implemented" with the decision. Who was affected, what constraint you accepted, and what you refused to take on.',
            'Mentoring counts when it changed someone\'s output. "Reviewed code" is weak. "Paired until a teammate could own the billing service" is a senior line.'
          ]
        },
        {
          heading: 'Examples that signal seniority',
          paragraphs: ['Use a few bullets that could not appear on a new graduate\'s page.'],
          bullets: [
            'Stopped a rewrite and fixed the two paths that caused most of the incidents.',
            'Set the API boundary so a second team could ship without waiting on yours.',
            'Wrote the rollout plan, including how to turn the change off.'
          ]
        },
        {
          heading: 'What not to inflate',
          paragraphs: ['Do not retitle yourself. If your company called you senior, use that. If it did not, show the scope and let the reader conclude. Inflated titles are easy to check and hard to recover from.']
        }
      ],
      related: ['software-engineer', 'full-stack-developer', 'backend-developer']
    }
  }),
  page({
    slug: 'ats-resume',
    title: 'ATS-Friendly Resume: What the Scanner Actually Reads',
    metaDescription: 'How applicant tracking systems read a resume, which layouts survive the scan, and when to send Word instead of a designed PDF.',
    h1: 'ATS-friendly resume: a file a parser and a person can both read',
    keywords: ['ats resume', 'ats friendly resume', 'applicant tracking system resume'],
    body: {
      intro: 'An applicant tracking system reads text in order. It does not admire a sidebar, a skill bar, or a text box that is really a picture. If the words are not in the file as text, they are not in the application.',
      sections: [
        {
          heading: 'What usually gets dropped',
          paragraphs: [
            'Columns, text inside images, and headers that only exist as design are the common failures. Icons next to your email do not help if the address itself is missing.',
            'Unusual section names also hurt. "My journey" is harder for a parser than "Experience". Use Profile, Experience, Education, Skills, Projects, and Certifications.'
          ]
        },
        {
          heading: 'Which file to upload',
          paragraphs: [
            'When the form says it will parse the document, upload a single-column Word file with real headings. Keep the designed PDF for a recruiter who asked to see the page.',
            'Single-column layouts such as Classic, Atlas, and Grove are the safer pages when you know a system will scan the upload.'
          ],
          bullets: [
            'Put your name in the document, not only in the filename.',
            'Spell the job\'s tools the way the posting spells them, when you actually used them.',
            'Do not hide keywords in white text. Parsers and people both notice, and it reads as a trick.'
          ]
        },
        {
          heading: 'After the scan',
          paragraphs: ['Passing the parser only gets you to a person. The same headings that help the scan should also make a ten-second skim possible. Short bullets. Dates on the role. No paragraph that tries to be a biography.']
        }
      ],
      related: ['fresher-resume', 'software-engineer', 'frontend-developer']
    }
  }),
  page({
    slug: 'fresher-resume',
    title: 'Fresher Resume Guide When You Have Projects, Not a Long Job History',
    metaDescription: 'How to write a fresher resume: education, projects, and internships arranged so a reviewer can see proof without pretending you had a senior role.',
    h1: 'Fresher resume: lead with proof, not with adjectives',
    keywords: ['fresher resume', 'entry level resume', 'graduate resume'],
    body: {
      intro: 'A fresher resume is short on job titles and long on the temptation to sound generic. The page works when a reviewer can see something you finished: a project, an internship, or a course where you built a real artifact.',
      sections: [
        {
          heading: 'A honest order of sections',
          paragraphs: [
            'If work experience is an internship or a part-time job, keep Experience first. If you have no job yet, put Projects above a long list of soft skills.',
            'Education stays on the page: school, degree, and dates. A grade helps when it is strong. A list of every subject does not.'
          ]
        },
        {
          heading: 'Projects that count',
          paragraphs: ['Each project needs a name, what it did, the tools you used, and one decision you made. "Todo app in React" is a start. "Todo app that keeps a draft if the tab closes" is a project.'],
          bullets: [
            'Say who would use it, even if the user was you.',
            'Link the repository or the live page when you are proud of the code.',
            'Mention a bug you found after someone else tried it.'
          ]
        },
        {
          heading: 'Lines that weaken a first resume',
          paragraphs: ['Skip "hardworking team player" and "seeking a challenging role". Use the space for a tool you can discuss and a result you can demo. One page is the whole document.']
        }
      ],
      related: ['ats-resume', 'frontend-developer', 'software-engineer']
    }
  }),
  page({
    slug: 'product-manager',
    title: 'Product Manager Resume: Decisions, Not a Feature List',
    metaDescription: 'How to write a product manager resume that shows the problem, the decision, and what changed for customers.',
    h1: 'Product manager resume: show the decision and the result',
    keywords: ['product manager resume', 'pm resume', 'product manager resume example'],
    body: {
      intro: 'A product manager resume fails when it reads like a backlog. Hiring managers want the problem you chose, the constraint you accepted, and the change a customer or the business could see.',
      sections: [
        {
          heading: 'Open with the kind of product',
          paragraphs: [
            'Say whether you owned a growth surface, an internal tool, or a platform other teams shipped on. Those are different jobs.',
            'A headline such as "Product manager for billing and account settings" is more useful than "strategic product thinker".'
          ]
        },
        {
          heading: 'Bullets that survive a skim',
          paragraphs: ['Start from the user or the metric, then the choice you made. Leave the ticket count out.'],
          bullets: [
            'Stopped a rewrite of checkout and fixed the two steps where people abandoned the form.',
            'Wrote the rollout plan, including who would see the change first and how to turn it off.',
            'Cut a weekly stakeholder meeting by replacing it with a one-page decision log.'
          ]
        },
        {
          heading: 'What to leave off',
          paragraphs: ['A list of every framework the engineers used does not make you a stronger product manager. Name the ones you can discuss, and spend the rest of the line on the outcome.']
        }
      ],
      related: ['software-engineer', 'ui-ux-designer', 'ats-resume']
    }
  }),
  page({
    slug: 'data-analyst',
    title: 'Data Analyst Resume Guide',
    metaDescription: 'Write a data analyst resume around the question you answered, the data you trusted, and the decision that followed.',
    h1: 'Data analyst resume: the question, the data, and the decision',
    keywords: ['data analyst resume', 'analytics resume', 'data analyst resume example'],
    body: {
      intro: 'Analyst resumes get skipped when they are a stack of tool names. The useful version names the question, where the data came from, and what someone did differently because of the answer.',
      sections: [
        {
          heading: 'Lead with the decision',
          paragraphs: [
            'A dashboard is not the achievement. The achievement is that a team stopped guessing.',
            'Mention SQL, a warehouse, or a notebook after the outcome, not instead of it.'
          ]
        },
        {
          heading: 'Bullets a reviewer can check',
          paragraphs: ['Include the grain of the data and the mistake you avoided.'],
          bullets: [
            'Reconciled revenue in the warehouse with the billing system before the Monday report went out.',
            'Replaced a spreadsheet that three people edited with a query the team could rerun.',
            'Flagged a tracking change that had been double-counting signups for two weeks.'
          ]
        },
        {
          heading: 'Skills line',
          paragraphs: ['SQL, the warehouse or database, and the way you share results: a sheet, a notebook, or a dashboard. Skip tools you opened once in a course.']
        }
      ],
      related: ['data-scientist', 'product-manager', 'ats-resume']
    }
  }),
  page({
    slug: 'data-scientist',
    title: 'Data Scientist Resume: Models That Someone Used',
    metaDescription: 'A data scientist resume should show the model or analysis that shipped, how you judged it, and what you refused to claim.',
    h1: 'Data scientist resume: a model someone actually used',
    keywords: ['data scientist resume', 'machine learning resume', 'data science resume'],
    body: {
      intro: 'A data scientist resume that lists every algorithm reads like a syllabus. Reviewers want one model or study that left the notebook, how you knew it was good enough, and where it was wrong.',
      sections: [
        {
          heading: 'Name the decision the model served',
          paragraphs: [
            'Ranking, forecasting, or a one-off analysis are different jobs. Say which one you owned.',
            'If the work stayed in a notebook, say what question it answered. Do not imply it was in production.'
          ]
        },
        {
          heading: 'Proof that is more than accuracy',
          paragraphs: ['Accuracy without a baseline is a weak line. A baseline, a failure mode, and a person who used the output are stronger.'],
          bullets: [
            'Beat the existing rules by a margin the support team could feel, then watched the error cases for a month.',
            'Refused to ship a model that looked better only because the test set leaked future data.',
            'Wrote the assumptions next to the chart so a product manager could challenge them.'
          ]
        },
        {
          heading: 'Tools',
          paragraphs: ['Python or R, the data store, and how you evaluated the work. One library list is enough.']
        }
      ],
      related: ['data-analyst', 'software-engineer', 'backend-developer']
    }
  }),
  page({
    slug: 'devops-engineer',
    title: 'DevOps Engineer Resume: What You Kept Running',
    metaDescription: 'Write a DevOps resume about deploys, incidents, and the path from a change to production, not a logo row of cloud products.',
    h1: 'DevOps engineer resume: the path from a change to production',
    keywords: ['devops resume', 'devops engineer resume', 'site reliability resume'],
    body: {
      intro: 'DevOps resumes collapse into tool lists. The page that gets read says how code reached production, what you watched, and what you changed after something broke.',
      sections: [
        {
          heading: 'Describe the path, not the vendor',
          paragraphs: [
            'A pipeline, a cluster, or a set of servers is clearer than "worked on cloud".',
            'Name who used that path. A team that could ship without asking you is a result.'
          ]
        },
        {
          heading: 'Incidents belong on the page',
          paragraphs: ['One incident you handled, including what you changed afterward, is worth more than five product names.'],
          bullets: [
            'Added a rollback to the deploy so a bad release could be undone without a new build.',
            'Moved a nightly job off the database that was already serving traffic.',
            'Wrote the alert that fired before customers wrote in, and the note for what to do next.'
          ]
        },
        {
          heading: 'Keep the skills short',
          paragraphs: ['The cloud you used, the way you deploy, and how you look at logs. Anything you cannot discuss for five minutes should stay off the line.']
        }
      ],
      related: ['backend-developer', 'software-engineer', 'qa-engineer']
    }
  }),
  page({
    slug: 'qa-engineer',
    title: 'QA Engineer Resume: Risk, Not a Test-Case Count',
    metaDescription: 'A QA engineer resume should show which risks you caught, how you tested them, and what shipped because of that work.',
    h1: 'QA engineer resume: the bugs that mattered',
    keywords: ['qa resume', 'qa engineer resume', 'software tester resume'],
    body: {
      intro: 'A QA resume that says "wrote test cases" could describe any job. The stronger page names the risk, how you found it, and what would have happened if it had shipped.',
      sections: [
        {
          heading: 'Say what you were protecting',
          paragraphs: [
            'Payments, permissions, and a mobile release are different risks. Pick the ones you owned.',
            'Automation is a detail. The result is a release that did not repeat a known failure.'
          ]
        },
        {
          heading: 'Bullets with a consequence',
          paragraphs: ['Include the environment and the user, not only the tool.'],
          bullets: [
            'Caught a billing bug that charged a second time when the network dropped mid-checkout.',
            'Kept a regression list for the three flows support saw every week.',
            'Added a check that ran before release so a missing translation could not reach production again.'
          ]
        },
        {
          heading: 'Tools in their place',
          paragraphs: ['Name the runner, the browser or device, and whether you wrote code. A long grid of every testing product is harder to read than one sentence about the suite you maintained.']
        }
      ],
      related: ['software-engineer', 'devops-engineer', 'frontend-developer']
    }
  }),
  page({
    slug: 'ui-ux-designer',
    title: 'UI/UX Designer Resume: The Problem in the Interface',
    metaDescription: 'How to write a UI and UX resume that shows the problem, the constraint, and what people could do after the change.',
    h1: 'UI/UX designer resume: what people could do after the change',
    keywords: ['ui ux resume', 'ux designer resume', 'product designer resume'],
    body: {
      intro: 'A design resume that is only a link to a portfolio still has to survive a skim and a parser. The page should say which problem you took, what you refused to add, and how you knew the new flow was clearer.',
      sections: [
        {
          heading: 'Write the problem before the tool',
          paragraphs: [
            'Figma is assumed. The decision is not. Say what was confusing and for whom.',
            'If you also built the interface, say so. If an engineer built it from your files, say that too.'
          ]
        },
        {
          heading: 'A bullet a hiring manager can picture',
          paragraphs: ['Describe the before and after in one line.'],
          bullets: [
            'Rebuilt the empty and error states so a failed save told people what to do next.',
            'Cut a settings page from four tabs to one, after watching five people miss the same control.',
            'Set type and spacing in a shared file so later screens stopped inventing their own sizes.'
          ]
        },
        {
          heading: 'File format',
          paragraphs: ['Keep this page in one column with ordinary headings when a form will scan it. Put the portfolio link in the contact line, as text, not only as a button in a picture.']
        }
      ],
      related: ['product-manager', 'frontend-developer', 'ats-resume']
    }
  })
];
