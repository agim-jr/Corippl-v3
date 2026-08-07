-- ============================================================
-- POOL SEEDING SCRIPT
-- Seeds 100 high-quality links into The Pool
-- ============================================================

BEGIN;

-- ============================================================
-- STEP 1: Create Curator User Accounts
-- ============================================================

-- Create Staff Curator account
INSERT INTO users (username, email, password, is_admin, email_verified, pool_credits_balance)
VALUES (
    'staff_curator',
    'curator@thepool.internal',
    'HASHED_PASSWORD_PLACEHOLDER', -- You'll need to set this properly
    false,
    true,
    1000
) ON CONFLICT (email) DO NOTHING;

-- Create persona accounts for diversity
INSERT INTO users (username, email, password, email_verified, pool_credits_balance)
VALUES
    ('tech_enthusiast', 'tech@thepool.internal', 'HASHED_PASSWORD_PLACEHOLDER', true, 500),
    ('design_maven', 'design@thepool.internal', 'HASHED_PASSWORD_PLACEHOLDER', true, 500),
    ('product_builder', 'product@thepool.internal', 'HASHED_PASSWORD_PLACEHOLDER', true, 500),
    ('content_explorer', 'explorer@thepool.internal', 'HASHED_PASSWORD_PLACEHOLDER', true, 500)
ON CONFLICT (email) DO NOTHING;

-- Get user IDs for later use
CREATE TEMP TABLE curator_ids AS
SELECT id, username FROM users WHERE email IN (
    'curator@thepool.internal',
    'tech@thepool.internal',
    'design@thepool.internal',
    'product@thepool.internal',
    'explorer@thepool.internal'
);

-- ============================================================
-- STEP 2: Insert Pool Submissions (100 Links)
-- ============================================================

-- Tech Articles & Tutorials (25)
INSERT INTO pool_submissions (user_id, title, original_url, category, pitch, status, review_count, average_rating, approved_at)
SELECT
    (SELECT id FROM curator_ids WHERE username = 'staff_curator'),
    'GitHub README Project Guide',
    'https://github.com/readme/guides/angie-jones-readme-project',
    'Tech',
    'Comprehensive guide to creating professional README files. Learn best practices for documenting your projects effectively.',
    'approved',
    3,
    4.3,
    NOW() - INTERVAL '2 days'
WHERE NOT EXISTS (
    SELECT 1 FROM pool_submissions WHERE original_url = 'https://github.com/readme/guides/angie-jones-readme-project'
);

INSERT INTO pool_submissions (user_id, title, original_url, category, pitch, status, review_count, average_rating, approved_at)
SELECT
    (SELECT id FROM curator_ids WHERE username = 'tech_enthusiast'),
    'Complete Guide to Flexbox',
    'https://css-tricks.com/a-complete-guide-to-flexbox/',
    'Tech',
    'The definitive visual guide to CSS Flexbox. Everything you need to know about flex containers and items. Essential bookmark.',
    'approved',
    5,
    4.8,
    NOW() - INTERVAL '2 days'
WHERE NOT EXISTS (SELECT 1 FROM pool_submissions WHERE original_url = 'https://css-tricks.com/a-complete-guide-to-flexbox/');

INSERT INTO pool_submissions (user_id, title, original_url, category, pitch, status, review_count, average_rating, approved_at)
SELECT
    (SELECT id FROM curator_ids WHERE username = 'tech_enthusiast'),
    'Web Vitals - Essential Metrics',
    'https://web.dev/articles/vitals',
    'Tech',
    'Google''s guide to measuring real-world user experience. Learn Core Web Vitals that impact your site''s performance.',
    'approved',
    4,
    4.5,
    NOW() - INTERVAL '1 day'
WHERE NOT EXISTS (SELECT 1 FROM pool_submissions WHERE original_url = 'https://web.dev/articles/vitals');

INSERT INTO pool_submissions (user_id, title, original_url, category, pitch, status, review_count, average_rating, approved_at)
SELECT
    (SELECT id FROM curator_ids WHERE username = 'tech_enthusiast'),
    'Common React Beginner Mistakes',
    'https://www.joshwcomeau.com/react/common-beginner-mistakes/',
    'Tech',
    'Josh Comeau breaks down the most common React mistakes and how to avoid them. Clear explanations with great examples.',
    'approved',
    4,
    4.7,
    NOW() - INTERVAL '1 day'
WHERE NOT EXISTS (SELECT 1 FROM pool_submissions WHERE original_url = 'https://www.joshwcomeau.com/react/common-beginner-mistakes/');

INSERT INTO pool_submissions (user_id, title, original_url, category, pitch, status, review_count, average_rating, approved_at)
SELECT
    (SELECT id FROM curator_ids WHERE username = 'tech_enthusiast'),
    'React Testing Library Best Practices',
    'https://kentcdodds.com/blog/common-mistakes-with-react-testing-library',
    'Tech',
    'Kent C. Dodds shares common testing mistakes and how to write better tests that actually improve confidence.',
    'approved',
    3,
    4.4,
    NOW() - INTERVAL '1 day'
WHERE NOT EXISTS (SELECT 1 FROM pool_submissions WHERE original_url = 'https://kentcdodds.com/blog/common-mistakes-with-react-testing-library');

INSERT INTO pool_submissions (user_id, title, original_url, category, pitch, status, review_count, average_rating, approved_at)
SELECT
    (SELECT id FROM curator_ids WHERE username = 'staff_curator'),
    'Complete Guide to useEffect',
    'https://overreacted.io/a-complete-guide-to-useeffect/',
    'Tech',
    'Dan Abramov''s deep dive into useEffect. The most comprehensive explanation of React hooks you''ll find.',
    'approved',
    5,
    5.0,
    NOW() - INTERVAL '3 days'
WHERE NOT EXISTS (SELECT 1 FROM pool_submissions WHERE original_url = 'https://overreacted.io/a-complete-guide-to-useeffect/');

INSERT INTO pool_submissions (user_id, title, original_url, category, pitch, status, review_count, average_rating, approved_at)
SELECT
    (SELECT id FROM curator_ids WHERE username = 'tech_enthusiast'),
    'Web Rendering Patterns',
    'https://www.patterns.dev/posts/rendering-patterns',
    'Tech',
    'Comprehensive guide to SSR, CSR, SSG, ISR and more. Understand when to use each rendering strategy.',
    'approved',
    3,
    4.2,
    NOW() - INTERVAL '1 day'
WHERE NOT EXISTS (SELECT 1 FROM pool_submissions WHERE original_url = 'https://www.patterns.dev/posts/rendering-patterns');

INSERT INTO pool_submissions (user_id, title, original_url, category, pitch, status, review_count, average_rating, approved_at)
SELECT
    (SELECT id FROM curator_ids WHERE username = 'staff_curator'),
    'Critical Rendering Path',
    'https://developer.mozilla.org/en-US/docs/Web/Performance/Critical_rendering_path',
    'Tech',
    'MDN''s guide to how browsers render pages. Essential knowledge for web performance optimization.',
    'approved',
    4,
    4.6,
    NOW() - INTERVAL '2 days'
WHERE NOT EXISTS (SELECT 1 FROM pool_submissions WHERE original_url = 'https://developer.mozilla.org/en-US/docs/Web/Performance/Critical_rendering_path');

INSERT INTO pool_submissions (user_id, title, original_url, category, pitch, status, review_count, average_rating, approved_at)
SELECT
    (SELECT id FROM curator_ids WHERE username = 'tech_enthusiast'),
    'System Design Primer',
    'https://github.com/donnemartin/system-design-primer',
    'Tech',
    'Learn how to design large-scale systems. Essential GitHub repo with 250k+ stars covering everything from basics to advanced.',
    'approved',
    5,
    4.9,
    NOW() - INTERVAL '3 days'
WHERE NOT EXISTS (SELECT 1 FROM pool_submissions WHERE original_url = 'https://github.com/donnemartin/system-design-primer');

INSERT INTO pool_submissions (user_id, title, original_url, category, pitch, status, review_count, average_rating, approved_at)
SELECT
    (SELECT id FROM curator_ids WHERE username = 'staff_curator'),
    'Microservices Architecture',
    'https://martinfowler.com/articles/microservices.html',
    'Tech',
    'Martin Fowler''s definitive guide to microservices. Understand the architectural style and when to use it.',
    'approved',
    4,
    4.7,
    NOW() - INTERVAL '2 days'
WHERE NOT EXISTS (SELECT 1 FROM pool_submissions WHERE original_url = 'https://martinfowler.com/articles/microservices.html');

INSERT INTO pool_submissions (user_id, title, original_url, category, pitch, status, review_count, average_rating, approved_at)
SELECT
    (SELECT id FROM curator_ids WHERE username = 'tech_enthusiast'),
    'The Twelve-Factor App',
    'https://12factor.net/',
    'Tech',
    'Methodology for building modern cloud-native applications. Industry-standard principles for SaaS apps.',
    'approved',
    3,
    4.5,
    NOW() - INTERVAL '1 day'
WHERE NOT EXISTS (SELECT 1 FROM pool_submissions WHERE original_url = 'https://12factor.net/');

INSERT INTO pool_submissions (user_id, title, original_url, category, pitch, status, review_count, average_rating, approved_at)
SELECT
    (SELECT id FROM curator_ids WHERE username = 'staff_curator'),
    'AWS Well-Architected Framework',
    'https://aws.amazon.com/architecture/well-architected/',
    'Tech',
    'Best practices for designing and operating reliable, secure, efficient systems on AWS. Free comprehensive guide.',
    'approved',
    3,
    4.3,
    NOW() - INTERVAL '1 day'
WHERE NOT EXISTS (SELECT 1 FROM pool_submissions WHERE original_url = 'https://aws.amazon.com/architecture/well-architected/');

INSERT INTO pool_submissions (user_id, title, original_url, category, pitch, status, review_count, average_rating, approved_at)
SELECT
    (SELECT id FROM curator_ids WHERE username = 'tech_enthusiast'),
    'Public APIs Collection',
    'https://github.com/public-apis/public-apis',
    'Tech',
    'Massive list of free APIs for developers. From weather to movies to cryptocurrency - all categorized and documented.',
    'approved',
    4,
    4.6,
    NOW() - INTERVAL '2 days'
WHERE NOT EXISTS (SELECT 1 FROM pool_submissions WHERE original_url = 'https://github.com/public-apis/public-apis');

INSERT INTO pool_submissions (user_id, title, original_url, category, pitch, status, review_count, average_rating, approved_at)
SELECT
    (SELECT id FROM curator_ids WHERE username = 'staff_curator'),
    'RESTful API Design',
    'https://restfulapi.net/',
    'Tech',
    'Complete guide to REST API design principles. Learn best practices for creating clean, maintainable APIs.',
    'approved',
    3,
    4.2,
    NOW() - INTERVAL '1 day'
WHERE NOT EXISTS (SELECT 1 FROM pool_submissions WHERE original_url = 'https://restfulapi.net/');

INSERT INTO pool_submissions (user_id, title, original_url, category, pitch, status, review_count, average_rating, approved_at)
SELECT
    (SELECT id FROM curator_ids WHERE username = 'tech_enthusiast'),
    'API Design Best Practices',
    'https://swagger.io/resources/articles/best-practices-in-api-design/',
    'Tech',
    'Swagger''s guide to designing APIs that developers love. Practical advice on versioning, documentation, and more.',
    'approved',
    3,
    4.4,
    NOW() - INTERVAL '1 day'
WHERE NOT EXISTS (SELECT 1 FROM pool_submissions WHERE original_url = 'https://swagger.io/resources/articles/best-practices-in-api-design/');

INSERT INTO pool_submissions (user_id, title, original_url, category, pitch, status, review_count, average_rating, approved_at)
SELECT
    (SELECT id FROM curator_ids WHERE username = 'staff_curator'),
    'Coding Interview University',
    'https://github.com/jwasham/coding-interview-university',
    'Tech',
    'Multi-month study plan to become a software engineer. Comprehensive guide with 300k+ stars covering CS fundamentals.',
    'approved',
    5,
    4.8,
    NOW() - INTERVAL '3 days'
WHERE NOT EXISTS (SELECT 1 FROM pool_submissions WHERE original_url = 'https://github.com/jwasham/coding-interview-university');

INSERT INTO pool_submissions (user_id, title, original_url, category, pitch, status, review_count, average_rating, approved_at)
SELECT
    (SELECT id FROM curator_ids WHERE username = 'tech_enthusiast'),
    'Developer Roadmaps',
    'https://github.com/kamranahmedse/developer-roadmap',
    'Tech',
    'Interactive roadmaps for frontend, backend, DevOps and more. See exactly what to learn and in what order.',
    'approved',
    5,
    4.7,
    NOW() - INTERVAL '2 days'
WHERE NOT EXISTS (SELECT 1 FROM pool_submissions WHERE original_url = 'https://github.com/kamranahmedse/developer-roadmap');

INSERT INTO pool_submissions (user_id, title, original_url, category, pitch, status, review_count, average_rating, approved_at)
SELECT
    (SELECT id FROM curator_ids WHERE username = 'staff_curator'),
    'Teach Yourself CS',
    'https://teachyourselfcs.com/',
    'Tech',
    'Self-taught computer science curriculum. Covers all essential CS topics with best resources for each.',
    'approved',
    4,
    4.6,
    NOW() - INTERVAL '2 days'
WHERE NOT EXISTS (SELECT 1 FROM pool_submissions WHERE original_url = 'https://teachyourselfcs.com/');

INSERT INTO pool_submissions (user_id, title, original_url, category, pitch, status, review_count, average_rating, approved_at)
SELECT
    (SELECT id FROM curator_ids WHERE username = 'tech_enthusiast'),
    'The Missing Semester of CS',
    'https://missing.csail.mit.edu/',
    'Tech',
    'MIT course on practical computing tools. Learn shell, vim, git, debugging and more that universities don''t teach.',
    'approved',
    4,
    4.8,
    NOW() - INTERVAL '2 days'
WHERE NOT EXISTS (SELECT 1 FROM pool_submissions WHERE original_url = 'https://missing.csail.mit.edu/');

INSERT INTO pool_submissions (user_id, title, original_url, category, pitch, status, review_count, average_rating, approved_at)
SELECT
    (SELECT id FROM curator_ids WHERE username = 'staff_curator'),
    'Free Developer Resources',
    'https://github.com/ripienaar/free-for-dev',
    'Tech',
    'Huge list of free tiers and tools for developers. From hosting to CI/CD to monitoring - all free options listed.',
    'approved',
    4,
    4.5,
    NOW() - INTERVAL '1 day'
WHERE NOT EXISTS (SELECT 1 FROM pool_submissions WHERE original_url = 'https://github.com/ripienaar/free-for-dev');

INSERT INTO pool_submissions (user_id, title, original_url, category, pitch, status, review_count, average_rating, approved_at)
SELECT
    (SELECT id FROM curator_ids WHERE username = 'tech_enthusiast'),
    'Design Resources for Developers',
    'https://github.com/bradtraversy/design-resources-for-developers',
    'Tech',
    'Curated list of design and UI resources. Colors, fonts, icons, illustrations - everything for developers who design.',
    'approved',
    4,
    4.4,
    NOW() - INTERVAL '1 day'
WHERE NOT EXISTS (SELECT 1 FROM pool_submissions WHERE original_url = 'https://github.com/bradtraversy/design-resources-for-developers');

INSERT INTO pool_submissions (user_id, title, original_url, category, pitch, status, review_count, average_rating, approved_at)
SELECT
    (SELECT id FROM curator_ids WHERE username = 'staff_curator'),
    'Awesome Lists',
    'https://github.com/sindresorhus/awesome',
    'Tech',
    'Curated list of awesome lists. Meta-resource covering every tech topic imaginable with quality resources.',
    'approved',
    5,
    4.9,
    NOW() - INTERVAL '3 days'
WHERE NOT EXISTS (SELECT 1 FROM pool_submissions WHERE original_url = 'https://github.com/sindresorhus/awesome');

INSERT INTO pool_submissions (user_id, title, original_url, category, pitch, status, review_count, average_rating, approved_at)
SELECT
    (SELECT id FROM curator_ids WHERE username = 'tech_enthusiast'),
    'Free Programming Books',
    'https://github.com/EbookFoundation/free-programming-books',
    'Tech',
    'Massive collection of free programming books in every language. 300k+ stars, regularly updated with new resources.',
    'approved',
    5,
    4.8,
    NOW() - INTERVAL '2 days'
WHERE NOT EXISTS (SELECT 1 FROM pool_submissions WHERE original_url = 'https://github.com/EbookFoundation/free-programming-books');

INSERT INTO pool_submissions (user_id, title, original_url, category, pitch, status, review_count, average_rating, approved_at)
SELECT
    (SELECT id FROM curator_ids WHERE username = 'staff_curator'),
    'Book of Secret Knowledge',
    'https://github.com/trimstray/the-book-of-secret-knowledge',
    'Tech',
    'Collection of inspiring lists, manuals, cheatsheets, and resources for CLI, DevOps, networking and security.',
    'approved',
    4,
    4.6,
    NOW() - INTERVAL '2 days'
WHERE NOT EXISTS (SELECT 1 FROM pool_submissions WHERE original_url = 'https://github.com/trimstray/the-book-of-secret-knowledge');

-- Business & Startup (15)

INSERT INTO pool_submissions (user_id, title, original_url, category, pitch, status, review_count, average_rating, approved_at)
SELECT
    (SELECT id FROM curator_ids WHERE username = 'product_builder'),
    '10 Years of Product Management Lessons',
    'https://www.indiehackers.com/post/what-i-learned-from-10-years-of-doing-product-management-7e3f0e5b4a',
    'Business',
    'Hard-won lessons from a decade of product management. Real experiences, not theory. Essential reading for PMs.',
    'approved',
    4,
    4.5,
    NOW() - INTERVAL '1 day'
WHERE NOT EXISTS (SELECT 1 FROM pool_submissions WHERE original_url = 'https://www.indiehackers.com/post/what-i-learned-from-10-years-of-doing-product-management-7e3f0e5b4a');

INSERT INTO pool_submissions (user_id, title, original_url, category, pitch, status, review_count, average_rating, approved_at)
SELECT
    (SELECT id FROM curator_ids WHERE username = 'product_builder'),
    'A Smart Bear Blog',
    'https://longform.asmartbear.com/posts/',
    'Business',
    'Jason Cohen''s long-form essays on startups and business. Deep, thoughtful analysis from a successful founder.',
    'approved',
    4,
    4.7,
    NOW() - INTERVAL '2 days'
WHERE NOT EXISTS (SELECT 1 FROM pool_submissions WHERE original_url = 'https://longform.asmartbear.com/posts/');

INSERT INTO pool_submissions (user_id, title, original_url, category, pitch, status, review_count, average_rating, approved_at)
SELECT
    (SELECT id FROM curator_ids WHERE username = 'staff_curator'),
    'Lenny''s Newsletter',
    'https://www.lennysnewsletter.com/',
    'Business',
    'Top product and growth newsletter. Interviews with PMs from Airbnb, Stripe, Netflix and more. Essential weekly reading.',
    'approved',
    5,
    4.8,
    NOW() - INTERVAL '2 days'
WHERE NOT EXISTS (SELECT 1 FROM pool_submissions WHERE original_url = 'https://www.lennysnewsletter.com/');

INSERT INTO pool_submissions (user_id, title, original_url, category, pitch, status, review_count, average_rating, approved_at)
SELECT
    (SELECT id FROM curator_ids WHERE username = 'product_builder'),
    'Y Combinator Library',
    'https://www.ycombinator.com/library',
    'Business',
    'Free startup resources from Y Combinator. Advice from the world''s top accelerator on everything from fundraising to hiring.',
    'approved',
    5,
    4.9,
    NOW() - INTERVAL '3 days'
WHERE NOT EXISTS (SELECT 1 FROM pool_submissions WHERE original_url = 'https://www.ycombinator.com/library');

INSERT INTO pool_submissions (user_id, title, original_url, category, pitch, status, review_count, average_rating, approved_at)
SELECT
    (SELECT id FROM curator_ids WHERE username = 'staff_curator'),
    'SEO Basics Guide',
    'https://blog.ahrefs.com/seo-basics/',
    'Business',
    'Ahrefs comprehensive guide to SEO fundamentals. Learn how search engines work and how to rank higher.',
    'approved',
    4,
    4.4,
    NOW() - INTERVAL '1 day'
WHERE NOT EXISTS (SELECT 1 FROM pool_submissions WHERE original_url = 'https://blog.ahrefs.com/seo-basics/');

INSERT INTO pool_submissions (user_id, title, original_url, category, pitch, status, review_count, average_rating, approved_at)
SELECT
    (SELECT id FROM curator_ids WHERE username = 'product_builder'),
    'Keyword Research Guide',
    'https://backlinko.com/hub/seo/keyword-research',
    'Business',
    'Complete guide to finding keywords that drive traffic. Step-by-step process from Brian Dean at Backlinko.',
    'approved',
    3,
    4.3,
    NOW() - INTERVAL '1 day'
WHERE NOT EXISTS (SELECT 1 FROM pool_submissions WHERE original_url = 'https://backlinko.com/hub/seo/keyword-research');

INSERT INTO pool_submissions (user_id, title, original_url, category, pitch, status, review_count, average_rating, approved_at)
SELECT
    (SELECT id FROM curator_ids WHERE username = 'staff_curator'),
    'Content Marketing Guide',
    'https://neilpatel.com/blog/beginners-guide-to-content-marketing/',
    'Business',
    'Neil Patel''s beginner-friendly guide to content marketing. Learn how to create content that attracts customers.',
    'approved',
    3,
    4.2,
    NOW() - INTERVAL '1 day'
WHERE NOT EXISTS (SELECT 1 FROM pool_submissions WHERE original_url = 'https://neilpatel.com/blog/beginners-guide-to-content-marketing/');

INSERT INTO pool_submissions (user_id, title, original_url, category, pitch, status, review_count, average_rating, approved_at)
SELECT
    (SELECT id FROM curator_ids WHERE username = 'product_builder'),
    'SparkToro Marketing Blog',
    'https://sparktoro.com/blog/',
    'Business',
    'Rand Fishkin''s insights on modern marketing. Data-driven advice on audience research and growth strategies.',
    'approved',
    4,
    4.6,
    NOW() - INTERVAL '2 days'
WHERE NOT EXISTS (SELECT 1 FROM pool_submissions WHERE original_url = 'https://sparktoro.com/blog/');

INSERT INTO pool_submissions (user_id, title, original_url, category, pitch, status, review_count, average_rating, approved_at)
SELECT
    (SELECT id FROM curator_ids WHERE username = 'staff_curator'),
    'Guide to Seed Fundraising',
    'https://www.ycombinator.com/library/4A-a-guide-to-seed-fundraising',
    'Business',
    'Y Combinator''s definitive guide to raising your first round. Everything from pitch decks to term sheets.',
    'approved',
    4,
    4.7,
    NOW() - INTERVAL '2 days'
WHERE NOT EXISTS (SELECT 1 FROM pool_submissions WHERE original_url = 'https://www.ycombinator.com/library/4A-a-guide-to-seed-fundraising');

INSERT INTO pool_submissions (user_id, title, original_url, category, pitch, status, review_count, average_rating, approved_at)
SELECT
    (SELECT id FROM curator_ids WHERE username = 'product_builder'),
    'Writing a Business Plan',
    'https://www.sequoiacap.com/article/writing-a-business-plan/',
    'Business',
    'Sequoia Capital''s framework for business plans. The template used by companies like Apple, Google, and Airbnb.',
    'approved',
    4,
    4.5,
    NOW() - INTERVAL '1 day'
WHERE NOT EXISTS (SELECT 1 FROM pool_submissions WHERE original_url = 'https://www.sequoiacap.com/article/writing-a-business-plan/');

INSERT INTO pool_submissions (user_id, title, original_url, category, pitch, status, review_count, average_rating, approved_at)
SELECT
    (SELECT id FROM curator_ids WHERE username = 'staff_curator'),
    'Stripe Atlas Guides',
    'https://stripe.com/atlas/guides',
    'Business',
    'Free guides on incorporating, fundraising, hiring and scaling. Practical startup advice from Stripe.',
    'approved',
    4,
    4.6,
    NOW() - INTERVAL '2 days'
WHERE NOT EXISTS (SELECT 1 FROM pool_submissions WHERE original_url = 'https://stripe.com/atlas/guides');

INSERT INTO pool_submissions (user_id, title, original_url, category, pitch, status, review_count, average_rating, approved_at)
SELECT
    (SELECT id FROM curator_ids WHERE username = 'product_builder'),
    'Basecamp Communication Guide',
    'https://basecamp.com/guides/how-we-communicate',
    'Business',
    'How Basecamp communicates as a remote team. Real practices from a successful distributed company.',
    'approved',
    4,
    4.4,
    NOW() - INTERVAL '1 day'
WHERE NOT EXISTS (SELECT 1 FROM pool_submissions WHERE original_url = 'https://basecamp.com/guides/how-we-communicate');

INSERT INTO pool_submissions (user_id, title, original_url, category, pitch, status, review_count, average_rating, approved_at)
SELECT
    (SELECT id FROM curator_ids WHERE username = 'staff_curator'),
    'GitLab Remote Work Guide',
    'https://about.gitlab.com/company/culture/all-remote/guide/',
    'Business',
    'Complete guide to remote work from an all-remote company. Over 1,000 pages of practical advice.',
    'approved',
    5,
    4.8,
    NOW() - INTERVAL '2 days'
WHERE NOT EXISTS (SELECT 1 FROM pool_submissions WHERE original_url = 'https://about.gitlab.com/company/culture/all-remote/guide/');

INSERT INTO pool_submissions (user_id, title, original_url, category, pitch, status, review_count, average_rating, approved_at)
SELECT
    (SELECT id FROM curator_ids WHERE username = 'product_builder'),
    'Remote Work Playbook',
    'https://zapier.com/learn/remote-work/',
    'Business',
    'Zapier''s guide to working remotely. Practical tips from a company that''s been remote-first since day one.',
    'approved',
    4,
    4.5,
    NOW() - INTERVAL '1 day'
WHERE NOT EXISTS (SELECT 1 FROM pool_submissions WHERE original_url = 'https://zapier.com/learn/remote-work/');

INSERT INTO pool_submissions (user_id, title, original_url, category, pitch, status, review_count, average_rating, approved_at)
SELECT
    (SELECT id FROM curator_ids WHERE username = 'staff_curator'),
    'Notion for Remote Teams',
    'https://www.notion.so/help/guides/notion-for-remote-teams',
    'Business',
    'How to use Notion for remote collaboration. Templates and best practices for distributed teams.',
    'approved',
    3,
    4.2,
    NOW() - INTERVAL '1 day'
WHERE NOT EXISTS (SELECT 1 FROM pool_submissions WHERE original_url = 'https://www.notion.so/help/guides/notion-for-remote-teams');

-- Design & UX (15)

INSERT INTO pool_submissions (user_id, title, original_url, category, pitch, status, review_count, average_rating, approved_at)
SELECT
    (SELECT id FROM curator_ids WHERE username = 'design_maven'),
    '10 Usability Heuristics',
    'https://www.nngroup.com/articles/ten-usability-heuristics/',
    'Design',
    'Jakob Nielsen''s foundational principles of UI design. The 10 rules every designer should know by heart.',
    'approved',
    5,
    4.9,
    NOW() - INTERVAL '3 days'
WHERE NOT EXISTS (SELECT 1 FROM pool_submissions WHERE original_url = 'https://www.nngroup.com/articles/ten-usability-heuristics/');

INSERT INTO pool_submissions (user_id, title, original_url, category, pitch, status, review_count, average_rating, approved_at)
SELECT
    (SELECT id FROM curator_ids WHERE username = 'design_maven'),
    'Laws of UX',
    'https://lawsofux.com/',
    'Design',
    'Collection of UX principles based on psychology. Beautiful site explaining why interfaces work the way they do.',
    'approved',
    5,
    4.8,
    NOW() - INTERVAL '2 days'
WHERE NOT EXISTS (SELECT 1 FROM pool_submissions WHERE original_url = 'https://lawsofux.com/');

INSERT INTO pool_submissions (user_id, title, original_url, category, pitch, status, review_count, average_rating, approved_at)
SELECT
    (SELECT id FROM curator_ids WHERE username = 'staff_curator'),
    'Refactoring UI',
    'https://www.refactoringui.com/',
    'Design',
    'Practical UI design tactics for developers. Learn to make things look awesome without being a designer.',
    'approved',
    5,
    4.7,
    NOW() - INTERVAL '2 days'
WHERE NOT EXISTS (SELECT 1 FROM pool_submissions WHERE original_url = 'https://www.refactoringui.com/');

INSERT INTO pool_submissions (user_id, title, original_url, category, pitch, status, review_count, average_rating, approved_at)
SELECT
    (SELECT id FROM curator_ids WHERE username = 'design_maven'),
    'Checklist Design',
    'https://www.checklist.design/',
    'Design',
    'Collection of design best practices as checklists. Perfect for ensuring you haven''t missed anything.',
    'approved',
    4,
    4.5,
    NOW() - INTERVAL '1 day'
WHERE NOT EXISTS (SELECT 1 FROM pool_submissions WHERE original_url = 'https://www.checklist.design/');

INSERT INTO pool_submissions (user_id, title, original_url, category, pitch, status, review_count, average_rating, approved_at)
SELECT
    (SELECT id FROM curator_ids WHERE username = 'staff_curator'),
    'Material Design',
    'https://material.io/design',
    'Design',
    'Google''s comprehensive design system. Guidelines, components, and resources for building beautiful apps.',
    'approved',
    5,
    4.6,
    NOW() - INTERVAL '2 days'
WHERE NOT EXISTS (SELECT 1 FROM pool_submissions WHERE original_url = 'https://material.io/design');

INSERT INTO pool_submissions (user_id, title, original_url, category, pitch, status, review_count, average_rating, approved_at)
SELECT
    (SELECT id FROM curator_ids WHERE username = 'design_maven'),
    'Design Systems Repository',
    'https://www.designsystems.com/',
    'Design',
    'Collection of design systems from top companies. Learn from Airbnb, Shopify, IBM and more.',
    'approved',
    4,
    4.4,
    NOW() - INTERVAL '1 day'
WHERE NOT EXISTS (SELECT 1 FROM pool_submissions WHERE original_url = 'https://www.designsystems.com/');

INSERT INTO pool_submissions (user_id, title, original_url, category, pitch, status, review_count, average_rating, approved_at)
SELECT
    (SELECT id FROM curator_ids WHERE username = 'staff_curator'),
    'GitHub Primer Design System',
    'https://primer.style/',
    'Design',
    'GitHub''s design system. Open-source components, guidelines, and tools for building consistent interfaces.',
    'approved',
    4,
    4.3,
    NOW() - INTERVAL '1 day'
WHERE NOT EXISTS (SELECT 1 FROM pool_submissions WHERE original_url = 'https://primer.style/');

INSERT INTO pool_submissions (user_id, title, original_url, category, pitch, status, review_count, average_rating, approved_at)
SELECT
    (SELECT id FROM curator_ids WHERE username = 'design_maven'),
    'Atlassian Design System',
    'https://atlassian.design/',
    'Design',
    'Atlassian''s design resources and guidelines. Comprehensive system from the creators of Jira and Confluence.',
    'approved',
    3,
    4.2,
    NOW() - INTERVAL '1 day'
WHERE NOT EXISTS (SELECT 1 FROM pool_submissions WHERE original_url = 'https://atlassian.design/');

INSERT INTO pool_submissions (user_id, title, original_url, category, pitch, status, review_count, average_rating, approved_at)
SELECT
    (SELECT id FROM curator_ids WHERE username = 'staff_curator'),
    'Dribbble Popular Designs',
    'https://dribbble.com/shots/popular',
    'Design',
    'Top trending designs from the design community. Daily inspiration from world-class designers.',
    'approved',
    4,
    4.5,
    NOW() - INTERVAL '1 day'
WHERE NOT EXISTS (SELECT 1 FROM pool_submissions WHERE original_url = 'https://dribbble.com/shots/popular');

INSERT INTO pool_submissions (user_id, title, original_url, category, pitch, status, review_count, average_rating, approved_at)
SELECT
    (SELECT id FROM curator_ids WHERE username = 'design_maven'),
    'Awwwards',
    'https://www.awwwards.com/',
    'Design',
    'Awards for design, creativity and innovation. See the world''s best-designed websites.',
    'approved',
    5,
    4.7,
    NOW() - INTERVAL '2 days'
WHERE NOT EXISTS (SELECT 1 FROM pool_submissions WHERE original_url = 'https://www.awwwards.com/');

INSERT INTO pool_submissions (user_id, title, original_url, category, pitch, status, review_count, average_rating, approved_at)
SELECT
    (SELECT id FROM curator_ids WHERE username = 'staff_curator'),
    'Site Inspire',
    'https://www.siteinspire.com/',
    'Design',
    'Showcase of the finest web design. Curated collection of beautiful, well-designed websites.',
    'approved',
    4,
    4.4,
    NOW() - INTERVAL '1 day'
WHERE NOT EXISTS (SELECT 1 FROM pool_submissions WHERE original_url = 'https://www.siteinspire.com/');

INSERT INTO pool_submissions (user_id, title, original_url, category, pitch, status, review_count, average_rating, approved_at)
SELECT
    (SELECT id FROM curator_ids WHERE username = 'design_maven'),
    'Behance UI/UX Gallery',
    'https://www.behance.net/galleries/ui-ux',
    'Design',
    'UI and UX design projects from creative professionals. Portfolio inspiration and case studies.',
    'approved',
    4,
    4.3,
    NOW() - INTERVAL '1 day'
WHERE NOT EXISTS (SELECT 1 FROM pool_submissions WHERE original_url = 'https://www.behance.net/galleries/ui-ux');

INSERT INTO pool_submissions (user_id, title, original_url, category, pitch, status, review_count, average_rating, approved_at)
SELECT
    (SELECT id FROM curator_ids WHERE username = 'staff_curator'),
    'Coolors - Color Schemes',
    'https://coolors.co/',
    'Design',
    'Fast color scheme generator. Create perfect palettes in seconds with this intuitive tool.',
    'approved',
    4,
    4.6,
    NOW() - INTERVAL '2 days'
WHERE NOT EXISTS (SELECT 1 FROM pool_submissions WHERE original_url = 'https://coolors.co/');

INSERT INTO pool_submissions (user_id, title, original_url, category, pitch, status, review_count, average_rating, approved_at)
SELECT
    (SELECT id FROM curator_ids WHERE username = 'design_maven'),
    'Happy Hues',
    'https://www.happyhues.co/',
    'Design',
    'Curated color palettes with real UI examples. See how colors look in actual interfaces before choosing.',
    'approved',
    4,
    4.5,
    NOW() - INTERVAL '1 day'
WHERE NOT EXISTS (SELECT 1 FROM pool_submissions WHERE original_url = 'https://www.happyhues.co/');

INSERT INTO pool_submissions (user_id, title, original_url, category, pitch, status, review_count, average_rating, approved_at)
SELECT
    (SELECT id FROM curator_ids WHERE username = 'staff_curator'),
    'Google Fonts',
    'https://fonts.google.com/',
    'Design',
    'Free, open-source fonts. Huge library of typefaces optimized for the web.',
    'approved',
    5,
    4.7,
    NOW() - INTERVAL '2 days'
WHERE NOT EXISTS (SELECT 1 FROM pool_submissions WHERE original_url = 'https://fonts.google.com/');

-- Productivity (15)

INSERT INTO pool_submissions (user_id, title, original_url, category, pitch, status, review_count, average_rating, approved_at)
SELECT
    (SELECT id FROM curator_ids WHERE username = 'content_explorer'),
    'Atomic Habits Principles',
    'https://jamesclear.com/atomic-habits',
    'Productivity',
    'James Clear''s framework for building better habits. The science-backed system from the bestselling book.',
    'approved',
    5,
    4.9,
    NOW() - INTERVAL '3 days'
WHERE NOT EXISTS (SELECT 1 FROM pool_submissions WHERE original_url = 'https://jamesclear.com/atomic-habits');

INSERT INTO pool_submissions (user_id, title, original_url, category, pitch, status, review_count, average_rating, approved_at)
SELECT
    (SELECT id FROM curator_ids WHERE username = 'content_explorer'),
    'Productivity from Arcade Games',
    'https://www.calnewport.com/blog/2016/09/06/a-productivity-lesson-from-a-classic-arcade-game/',
    'Productivity',
    'Cal Newport explains deep work through Tetris. Surprisingly insightful lesson about focus and productivity.',
    'approved',
    3,
    4.3,
    NOW() - INTERVAL '1 day'
WHERE NOT EXISTS (SELECT 1 FROM pool_submissions WHERE original_url = 'https://www.calnewport.com/blog/2016/09/06/a-productivity-lesson-from-a-classic-arcade-game/');

INSERT INTO pool_submissions (user_id, title, original_url, category, pitch, status, review_count, average_rating, approved_at)
SELECT
    (SELECT id FROM curator_ids WHERE username = 'staff_curator'),
    'Getting Things Done Method',
    'https://todoist.com/productivity-methods/getting-things-done',
    'Productivity',
    'Complete guide to David Allen''s GTD system. Learn the productivity method trusted by millions.',
    'approved',
    4,
    4.6,
    NOW() - INTERVAL '2 days'
WHERE NOT EXISTS (SELECT 1 FROM pool_submissions WHERE original_url = 'https://todoist.com/productivity-methods/getting-things-done');

INSERT INTO pool_submissions (user_id, title, original_url, category, pitch, status, review_count, average_rating, approved_at)
SELECT
    (SELECT id FROM curator_ids WHERE username = 'content_explorer'),
    'The Good Life - Harvard Study',
    'https://www.theatlantic.com/magazine/archive/2016/11/the-key-to-a-good-life/501384/',
    'Productivity',
    'Findings from Harvard''s 75-year study on happiness. What actually matters for a fulfilling life.',
    'approved',
    4,
    4.7,
    NOW() - INTERVAL '2 days'
WHERE NOT EXISTS (SELECT 1 FROM pool_submissions WHERE original_url = 'https://www.theatlantic.com/magazine/archive/2016/11/the-key-to-a-good-life/501384/');

INSERT INTO pool_submissions (user_id, title, original_url, category, pitch, status, review_count, average_rating, approved_at)
SELECT
    (SELECT id FROM curator_ids WHERE username = 'staff_curator'),
    'Deep Work Guide',
    'https://blog.doist.com/deep-work/',
    'Productivity',
    'Complete guide to Cal Newport''s deep work philosophy. Learn to focus intensely and produce better work.',
    'approved',
    5,
    4.8,
    NOW() - INTERVAL '2 days'
WHERE NOT EXISTS (SELECT 1 FROM pool_submissions WHERE original_url = 'https://blog.doist.com/deep-work/');

INSERT INTO pool_submissions (user_id, title, original_url, category, pitch, status, review_count, average_rating, approved_at)
SELECT
    (SELECT id FROM curator_ids WHERE username = 'content_explorer'),
    'Why Procrastinators Procrastinate',
    'https://waitbutwhy.com/2013/10/why-procrastinators-procrastinate.html',
    'Productivity',
    'Wait But Why''s hilarious and accurate take on procrastination. Instant monkey and panic monster explained.',
    'approved',
    5,
    4.9,
    NOW() - INTERVAL '3 days'
WHERE NOT EXISTS (SELECT 1 FROM pool_submissions WHERE original_url = 'https://waitbutwhy.com/2013/10/why-procrastinators-procrastinate.html');

INSERT INTO pool_submissions (user_id, title, original_url, category, pitch, status, review_count, average_rating, approved_at)
SELECT
    (SELECT id FROM curator_ids WHERE username = 'staff_curator'),
    'Eisenhower Decision Matrix',
    'https://www.artofmanliness.com/character/behavior/eisenhower-decision-matrix/',
    'Productivity',
    'How to prioritize tasks using urgent vs important. Simple framework for better decision making.',
    'approved',
    4,
    4.5,
    NOW() - INTERVAL '1 day'
WHERE NOT EXISTS (SELECT 1 FROM pool_submissions WHERE original_url = 'https://www.artofmanliness.com/character/behavior/eisenhower-decision-matrix/');

INSERT INTO pool_submissions (user_id, title, original_url, category, pitch, status, review_count, average_rating, approved_at)
SELECT
    (SELECT id FROM curator_ids WHERE username = 'content_explorer'),
    'Spaced Repetition Memory',
    'https://ncase.me/remember/',
    'Productivity',
    'Interactive guide to spaced repetition. Learn how to remember anything with this proven technique.',
    'approved',
    4,
    4.6,
    NOW() - INTERVAL '2 days'
WHERE NOT EXISTS (SELECT 1 FROM pool_submissions WHERE original_url = 'https://ncase.me/remember/');

INSERT INTO pool_submissions (user_id, title, original_url, category, pitch, status, review_count, average_rating, approved_at)
SELECT
    (SELECT id FROM curator_ids WHERE username = 'staff_curator'),
    'Feynman Learning Technique',
    'https://fs.blog/feynman-learning-technique/',
    'Productivity',
    'Learn anything by explaining it simply. The technique used by one of history''s greatest teachers.',
    'approved',
    4,
    4.7,
    NOW() - INTERVAL '2 days'
WHERE NOT EXISTS (SELECT 1 FROM pool_submissions WHERE original_url = 'https://fs.blog/feynman-learning-technique/');

INSERT INTO pool_submissions (user_id, title, original_url, category, pitch, status, review_count, average_rating, approved_at)
SELECT
    (SELECT id FROM curator_ids WHERE username = 'content_explorer'),
    'Spaced Repetition Guide',
    'https://collegeinfogeek.com/spaced-repetition-memory-technique/',
    'Productivity',
    'Complete guide to using spaced repetition for studying. Science-backed method to ace exams and remember more.',
    'approved',
    3,
    4.4,
    NOW() - INTERVAL '1 day'
WHERE NOT EXISTS (SELECT 1 FROM pool_submissions WHERE original_url = 'https://collegeinfogeek.com/spaced-repetition-memory-technique/');

INSERT INTO pool_submissions (user_id, title, original_url, category, pitch, status, review_count, average_rating, approved_at)
SELECT
    (SELECT id FROM curator_ids WHERE username = 'staff_curator'),
    'Julian Shapiro''s Writing Guide',
    'https://www.julian.com/guide/write/intro',
    'Productivity',
    'Comprehensive guide to clear writing. Learn to communicate ideas that people actually want to read.',
    'approved',
    5,
    4.8,
    NOW() - INTERVAL '2 days'
WHERE NOT EXISTS (SELECT 1 FROM pool_submissions WHERE original_url = 'https://www.julian.com/guide/write/intro');

INSERT INTO pool_submissions (user_id, title, original_url, category, pitch, status, review_count, average_rating, approved_at)
SELECT
    (SELECT id FROM curator_ids WHERE username = 'content_explorer'),
    'Paul Graham on Writing',
    'https://paulgraham.com/writing44.html',
    'Productivity',
    'Essays on how to write well from Y Combinator''s founder. Timeless advice on clear thinking and communication.',
    'approved',
    4,
    4.7,
    NOW() - INTERVAL '2 days'
WHERE NOT EXISTS (SELECT 1 FROM pool_submissions WHERE original_url = 'https://paulgraham.com/writing44.html');

INSERT INTO pool_submissions (user_id, title, original_url, category, pitch, status, review_count, average_rating, approved_at)
SELECT
    (SELECT id FROM curator_ids WHERE username = 'staff_curator'),
    'Hemingway Editor',
    'https://hemingwayapp.com/',
    'Productivity',
    'Make your writing bold and clear. Free tool that highlights complex sentences and common errors.',
    'approved',
    4,
    4.5,
    NOW() - INTERVAL '1 day'
WHERE NOT EXISTS (SELECT 1 FROM pool_submissions WHERE original_url = 'https://hemingwayapp.com/');

INSERT INTO pool_submissions (user_id, title, original_url, category, pitch, status, review_count, average_rating, approved_at)
SELECT
    (SELECT id FROM curator_ids WHERE username = 'content_explorer'),
    'Grammarly Writing Tips',
    'https://www.grammarly.com/blog/category/writing-tips/',
    'Productivity',
    'Professional writing tips and grammar lessons. Improve your writing with practical, actionable advice.',
    'approved',
    3,
    4.3,
    NOW() - INTERVAL '1 day'
WHERE NOT EXISTS (SELECT 1 FROM pool_submissions WHERE original_url = 'https://www.grammarly.com/blog/category/writing-tips/');

INSERT INTO pool_submissions (user_id, title, original_url, category, pitch, status, review_count, average_rating, approved_at)
SELECT
    (SELECT id FROM curator_ids WHERE username = 'staff_curator'),
    'How Users Read on the Web',
    'https://www.nngroup.com/articles/how-users-read-on-the-web/',
    'Productivity',
    'Nielsen Norman Group''s research on web reading patterns. Write content that people actually read.',
    'approved',
    4,
    4.6,
    NOW() - INTERVAL '2 days'
WHERE NOT EXISTS (SELECT 1 FROM pool_submissions WHERE original_url = 'https://www.nngroup.com/articles/how-users-read-on-the-web/');

-- Tools (10 more to reach 75 total so far)

INSERT INTO pool_submissions (user_id, title, original_url, category, pitch, status, review_count, average_rating, approved_at)
SELECT
    (SELECT id FROM curator_ids WHERE username = 'tech_enthusiast'),
    'Replit - Online IDE',
    'https://replit.com/',
    'Tools',
    'Code, collaborate, and deploy from your browser. No setup required - just start coding.',
    'approved',
    4,
    4.5,
    NOW() - INTERVAL '1 day'
WHERE NOT EXISTS (SELECT 1 FROM pool_submissions WHERE original_url = 'https://replit.com/');

INSERT INTO pool_submissions (user_id, title, original_url, category, pitch, status, review_count, average_rating, approved_at)
SELECT
    (SELECT id FROM curator_ids WHERE username = 'staff_curator'),
    'CodeSandbox',
    'https://codesandbox.io/',
    'Tools',
    'Online code editor for web development. Instant dev environments with live preview.',
    'approved',
    5,
    4.7,
    NOW() - INTERVAL '2 days'
WHERE NOT EXISTS (SELECT 1 FROM pool_submissions WHERE original_url = 'https://codesandbox.io/');

INSERT INTO pool_submissions (user_id, title, original_url, category, pitch, status, review_count, average_rating, approved_at)
SELECT
    (SELECT id FROM curator_ids WHERE username = 'tech_enthusiast'),
    'StackBlitz',
    'https://stackblitz.com/',
    'Tools',
    'Online IDE for web dev. Lightning-fast development environment that runs entirely in your browser.',
    'approved',
    4,
    4.6,
    NOW() - INTERVAL '1 day'
WHERE NOT EXISTS (SELECT 1 FROM pool_submissions WHERE original_url = 'https://stackblitz.com/');

INSERT INTO pool_submissions (user_id, title, original_url, category, pitch, status, review_count, average_rating, approved_at)
SELECT
    (SELECT id FROM curator_ids WHERE username = 'staff_curator'),
    'Vercel',
    'https://vercel.com/',
    'Tools',
    'Deploy web apps instantly. Zero-config deployment platform for frontend developers.',
    'approved',
    5,
    4.8,
    NOW() - INTERVAL '2 days'
WHERE NOT EXISTS (SELECT 1 FROM pool_submissions WHERE original_url = 'https://vercel.com/');

INSERT INTO pool_submissions (user_id, title, original_url, category, pitch, status, review_count, average_rating, approved_at)
SELECT
    (SELECT id FROM curator_ids WHERE username = 'tech_enthusiast'),
    'Railway',
    'https://railway.app/',
    'Tools',
    'Deploy anything with one click. Modern infrastructure platform that makes deployment effortless.',
    'approved',
    4,
    4.6,
    NOW() - INTERVAL '1 day'
WHERE NOT EXISTS (SELECT 1 FROM pool_submissions WHERE original_url = 'https://railway.app/');

INSERT INTO pool_submissions (user_id, title, original_url, category, pitch, status, review_count, average_rating, approved_at)
SELECT
    (SELECT id FROM curator_ids WHERE username = 'design_maven'),
    'Figma',
    'https://www.figma.com/',
    'Tools',
    'Collaborative design tool. Industry-standard platform for UI/UX design and prototyping.',
    'approved',
    5,
    4.9,
    NOW() - INTERVAL '3 days'
WHERE NOT EXISTS (SELECT 1 FROM pool_submissions WHERE original_url = 'https://www.figma.com/');

INSERT INTO pool_submissions (user_id, title, original_url, category, pitch, status, review_count, average_rating, approved_at)
SELECT
    (SELECT id FROM curator_ids WHERE username = 'staff_curator'),
    'Excalidraw',
    'https://excalidraw.com/',
    'Tools',
    'Virtual whiteboard for sketching diagrams. Simple, beautiful, and perfect for quick ideation.',
    'approved',
    4,
    4.7,
    NOW() - INTERVAL '2 days'
WHERE NOT EXISTS (SELECT 1 FROM pool_submissions WHERE original_url = 'https://excalidraw.com/');

INSERT INTO pool_submissions (user_id, title, original_url, category, pitch, status, review_count, average_rating, approved_at)
SELECT
    (SELECT id FROM curator_ids WHERE username = 'design_maven'),
    'Canva',
    'https://www.canva.com/',
    'Tools',
    'Design anything easily. Templates and tools for graphics, presentations, social media and more.',
    'approved',
    5,
    4.6,
    NOW() - INTERVAL '2 days'
WHERE NOT EXISTS (SELECT 1 FROM pool_submissions WHERE original_url = 'https://www.canva.com/');

INSERT INTO pool_submissions (user_id, title, original_url, category, pitch, status, review_count, average_rating, approved_at)
SELECT
    (SELECT id FROM curator_ids WHERE username = 'staff_curator'),
    'Whimsical',
    'https://whimsical.com/',
    'Tools',
    'Visual workspace for thinking and collaboration. Flowcharts, wireframes, mind maps in one beautiful tool.',
    'approved',
    4,
    4.5,
    NOW() - INTERVAL '1 day'
WHERE NOT EXISTS (SELECT 1 FROM pool_submissions WHERE original_url = 'https://whimsical.com/');

INSERT INTO pool_submissions (user_id, title, original_url, category, pitch, status, review_count, average_rating, approved_at)
SELECT
    (SELECT id FROM curator_ids WHERE username = 'product_builder'),
    'Notion',
    'https://notion.so/',
    'Tools',
    'All-in-one workspace. Notes, docs, wikis, databases - organize everything in one place.',
    'approved',
    5,
    4.8,
    NOW() - INTERVAL '2 days'
WHERE NOT EXISTS (SELECT 1 FROM pool_submissions WHERE original_url = 'https://notion.so/');

-- Continue with remaining 25 submissions...
-- (I'll add the rest in a follow-up message due to length limits)

COMMIT;

-- ============================================================
-- SUCCESS MESSAGE
-- ============================================================
DO $$
BEGIN
    RAISE NOTICE '✅ Pool seeding complete!';
    RAISE NOTICE 'Created 5 curator accounts';
    RAISE NOTICE 'Added 75+ submissions (will add remaining 25 next)';
    RAISE NOTICE 'All submissions marked as approved';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Run part 2 of this script for remaining 25 submissions';
    RAISE NOTICE '2. Generate reviews from different curator accounts';
    RAISE NOTICE '3. Update user passwords for curator accounts';
END $$;
