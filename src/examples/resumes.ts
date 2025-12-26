/**
 * Sample Resumes for Resume Screening Demo
 *
 * Three candidate profiles demonstrating different fit levels:
 * - Strong Match: Exceeds requirements
 * - Potential Fit: Career changer with transferable skills
 * - Not Qualified: Does not meet minimum requirements
 */

export interface WorkExperience {
  company: string;
  title: string;
  duration: string;
  achievements: string[];
}

export interface Education {
  institution: string;
  degree: string;
  year: number;
  gpa?: number;
}

export interface Project {
  name: string;
  description: string;
  url?: string;
}

export interface Resume {
  candidateId: string;
  name: string;
  email: string;
  phone?: string;
  summary: string;
  experience: WorkExperience[];
  education: Education[];
  skills: string[];
  certifications?: string[];
  projects?: Project[];
}

// ============================================================================
// Strong Match Candidate - Alex Chen
// ============================================================================

export const strongMatchCandidate: Resume = {
  candidateId: 'CAND-001',
  name: 'Alex Chen',
  email: 'alex.chen@email.com',
  phone: '555-0101',

  summary: `Senior Software Engineer with 7 years of experience building
distributed systems at scale. Led a team of 5 engineers at TechCorp.
Passionate about clean architecture and developer experience. Strong
background in TypeScript, Python, and cloud-native development.`,

  experience: [
    {
      company: 'TechCorp Inc.',
      title: 'Senior Software Engineer',
      duration: 'Jan 2021 - Present (3 years)',
      achievements: [
        'Led migration of monolith to microservices architecture serving 2M+ users',
        'Reduced API latency by 40% through caching and query optimization',
        'Mentored 3 junior engineers, all promoted within 18 months',
        'Designed event-driven architecture handling 500K events/day'
      ]
    },
    {
      company: 'StartupXYZ',
      title: 'Software Engineer',
      duration: 'Jun 2018 - Dec 2020 (2.5 years)',
      achievements: [
        'Built real-time notification system handling 1M+ daily events',
        'Implemented CI/CD pipeline reducing deployment time by 60%',
        'Developed Python data pipeline processing 10TB monthly'
      ]
    },
    {
      company: 'DataSystems LLC',
      title: 'Junior Developer',
      duration: 'Aug 2016 - May 2018 (1.5 years)',
      achievements: [
        'Developed REST APIs for customer-facing applications',
        'Contributed to open-source data processing library (500+ GitHub stars)',
        'Wrote comprehensive unit tests achieving 85% code coverage'
      ]
    }
  ],

  education: [
    {
      institution: 'University of California, Berkeley',
      degree: 'B.S. Computer Science',
      year: 2016,
      gpa: 3.7
    }
  ],

  skills: [
    'TypeScript', 'Python', 'Go', 'AWS', 'Kubernetes',
    'PostgreSQL', 'Redis', 'Kafka', 'Docker', 'Terraform',
    'React', 'Node.js', 'GraphQL', 'gRPC'
  ],

  certifications: [
    'AWS Solutions Architect Professional',
    'Certified Kubernetes Administrator (CKA)'
  ]
};

// ============================================================================
// Potential Fit Candidate - Jordan Martinez (Career Changer)
// ============================================================================

export const potentialFitCandidate: Resume = {
  candidateId: 'CAND-002',
  name: 'Jordan Martinez',
  email: 'jordan.m@email.com',
  phone: '555-0102',

  summary: `Former data analyst transitioning to software engineering.
Completed intensive full-stack bootcamp and built several production-quality
projects. Strong analytical background with 4 years in data-driven roles.
Eager to apply problem-solving skills in a software engineering context.`,

  experience: [
    {
      company: 'Analytics Co.',
      title: 'Senior Data Analyst',
      duration: 'Mar 2020 - Present (3.5 years)',
      achievements: [
        'Built Python automation scripts saving 20 hours/week of manual work',
        'Created SQL-based reporting dashboards used by 50+ stakeholders',
        'Led data quality initiative improving accuracy by 35%',
        'Collaborated with engineering team to define data requirements'
      ]
    },
    {
      company: 'Retail Corp',
      title: 'Business Analyst',
      duration: 'Jul 2018 - Feb 2020 (1.5 years)',
      achievements: [
        'Developed Excel VBA tools for inventory management',
        'Translated business requirements into technical specifications',
        'Managed relationships with technical vendors'
      ]
    }
  ],

  education: [
    {
      institution: 'State University',
      degree: 'B.A. Economics',
      year: 2018
    },
    {
      institution: 'CodeCamp Bootcamp',
      degree: 'Full Stack Web Development Certificate',
      year: 2023
    }
  ],

  skills: [
    'Python', 'JavaScript', 'TypeScript', 'React', 'Node.js',
    'SQL', 'PostgreSQL', 'Git', 'HTML/CSS', 'REST APIs'
  ],

  projects: [
    {
      name: 'E-commerce Platform',
      description: 'Full-stack e-commerce app with React, Node.js, PostgreSQL. Includes auth, cart, payments.',
      url: 'github.com/jordanm/ecommerce'
    },
    {
      name: 'Task Management API',
      description: 'RESTful API built with Express and TypeScript, with JWT authentication.',
      url: 'github.com/jordanm/task-api'
    }
  ]
};

// ============================================================================
// Not Qualified Candidate - Taylor Smith
// ============================================================================

export const notQualifiedCandidate: Resume = {
  candidateId: 'CAND-003',
  name: 'Taylor Smith',
  email: 'taylor.s@email.com',
  phone: '555-0103',

  summary: `Recent graduate eager to start career in tech.
Quick learner with passion for coding and problem-solving.`,

  experience: [
    {
      company: 'Campus IT Help Desk',
      title: 'Student Worker',
      duration: 'Sep 2022 - May 2023 (9 months)',
      achievements: [
        'Provided technical support to students and faculty',
        'Reset passwords and troubleshot basic connectivity issues',
        'Documented common issues in knowledge base'
      ]
    },
    {
      company: 'Local Restaurant',
      title: 'Server',
      duration: 'Summers 2020-2022',
      achievements: [
        'Provided excellent customer service in fast-paced environment',
        'Trained new team members on POS system',
        'Handled cash and credit transactions accurately'
      ]
    }
  ],

  education: [
    {
      institution: 'Community College',
      degree: 'A.S. General Studies',
      year: 2023
    }
  ],

  skills: [
    'HTML', 'CSS', 'Basic JavaScript', 'Microsoft Office', 'Customer Service'
  ],

  projects: [
    {
      name: 'Personal Portfolio',
      description: 'Static HTML/CSS website showcasing class projects'
    }
  ]
};

// ============================================================================
// Exports
// ============================================================================

/**
 * All sample resumes by fit category
 */
export const sampleResumes = {
  strongMatch: strongMatchCandidate,
  potentialFit: potentialFitCandidate,
  notQualified: notQualifiedCandidate
};

/**
 * Get candidate by ID
 */
export function getCandidateById(candidateId: string): Resume | undefined {
  return Object.values(sampleResumes).find(r => r.candidateId === candidateId);
}

/**
 * Format resume as text for LLM input
 */
export function formatResumeAsText(resume: Resume): string {
  const sections: string[] = [];

  sections.push(`# ${resume.name}`);
  sections.push(`Email: ${resume.email}`);
  if (resume.phone) sections.push(`Phone: ${resume.phone}`);
  sections.push('');
  sections.push(`## Summary\n${resume.summary}`);
  sections.push('');

  sections.push('## Experience');
  for (const exp of resume.experience) {
    sections.push(`### ${exp.title} at ${exp.company}`);
    sections.push(`${exp.duration}`);
    for (const achievement of exp.achievements) {
      sections.push(`- ${achievement}`);
    }
    sections.push('');
  }

  sections.push('## Education');
  for (const edu of resume.education) {
    const gpaStr = edu.gpa ? ` (GPA: ${edu.gpa})` : '';
    sections.push(`- ${edu.degree}, ${edu.institution}, ${edu.year}${gpaStr}`);
  }
  sections.push('');

  sections.push('## Skills');
  sections.push(resume.skills.join(', '));
  sections.push('');

  if (resume.certifications?.length) {
    sections.push('## Certifications');
    for (const cert of resume.certifications) {
      sections.push(`- ${cert}`);
    }
    sections.push('');
  }

  if (resume.projects?.length) {
    sections.push('## Projects');
    for (const proj of resume.projects) {
      const urlStr = proj.url ? ` (${proj.url})` : '';
      sections.push(`- **${proj.name}**: ${proj.description}${urlStr}`);
    }
  }

  return sections.join('\n');
}
