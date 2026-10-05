// All static site copy. Projects are NOT here: they come from the database via /api/projects.
export const nav = [
  { href: '#about', label: 'About' },
  { href: '#services', label: 'Services' },
  { href: '#work', label: 'Work' },
  { href: '#technology', label: 'Technology' },
  { href: '#process', label: 'Process' },
];

export const about = [
  'NAWA Technology is a software and AI solutions company focused on building practical digital products for modern businesses.',
  'We combine software engineering, product thinking, and artificial intelligence to create useful digital experiences and business solutions.',
];

export const services = [
  { title: 'Software Development', text: 'Custom web applications and software solutions built around specific business needs.' },
  { title: 'AI Integration', text: 'Practical AI capabilities integrated into digital products and business workflows.' },
  { title: 'E-commerce', text: 'Modern e-commerce platforms designed around product discovery, customer experience, and business requirements.' },
  { title: 'APIs & Backend', text: 'Backend systems, REST APIs, database integration, and application logic for connected digital products.' },
];

export const capabilities = [
  { title: 'AI-Powered Experiences', text: 'Integrating AI into real user-facing digital products.' },
  { title: 'LLM Integration', text: 'Connecting language models with software applications and business workflows.' },
  { title: 'Prompt Engineering', text: 'Designing structured prompts and system instructions for reliable AI interactions.' },
  { title: 'AI Assistants', text: 'Building practical conversational experiences around specific product and user needs.' },
];

export const technology = [
  { group: 'Frontend', items: ['React.js', 'JavaScript', 'HTML', 'CSS'] },
  { group: 'Backend', items: ['Node.js', 'REST APIs'] },
  { group: 'Database', items: ['PostgreSQL'] },
  { group: 'AI', items: ['LLM integrations', 'Prompt engineering', 'AI-powered application features'] },
];

export const process = [
  { title: 'Understand', text: 'Understand the business problem, users, and requirements.' },
  { title: 'Plan', text: 'Define the product structure, technical approach, and priorities.' },
  { title: 'Build', text: 'Design and develop the software, APIs, and required integrations.' },
  { title: 'Test', text: 'Validate functionality, usability, and reliability.' },
  { title: 'Improve', text: 'Iterate based on feedback and evolving business needs.' },
];

// PLACEHOLDER: no verified contact details supplied yet. Set a real value to show it on the page.
export const contactDetails = {
  email: null, // e.g. 'hello@your-domain.com'
  linkedin: null,
};
