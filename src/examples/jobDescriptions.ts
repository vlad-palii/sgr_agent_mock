/**
 * Sample Job Descriptions for Resume Screening Demo
 *
 * These job postings demonstrate different role types and requirements
 * that the SGR system can evaluate candidates against.
 */

export interface JobRequirements {
  required: string[];
  preferred: string[];
}

export interface JobDescription {
  jobId: string;
  title: string;
  department: string;
  location: string;
  employmentType: string;
  description: string;
  requirements: JobRequirements;
  salaryRange: {
    min: number;
    max: number;
    currency: string;
  };
}

/**
 * Senior Software Engineer - Primary demo job posting
 */
export const seniorSoftwareEngineer: JobDescription = {
  jobId: 'JOB-2024-001',
  title: 'Senior Software Engineer',
  department: 'Engineering',
  location: 'San Francisco, CA (Hybrid)',
  employmentType: 'Full-time',

  description: `We are seeking a Senior Software Engineer to join our Platform team.
You will design and build scalable backend services, mentor junior engineers,
and contribute to architectural decisions. The ideal candidate has strong
experience with TypeScript/Python, cloud infrastructure, and distributed systems.`,

  requirements: {
    required: [
      '5+ years of software development experience',
      'Proficiency in TypeScript or Python',
      'Experience with cloud platforms (AWS, GCP, or Azure)',
      'Strong understanding of distributed systems',
      "Bachelor's degree in Computer Science or equivalent experience"
    ],
    preferred: [
      'Experience with Kubernetes and containerization',
      'Knowledge of event-driven architectures',
      'Previous tech lead or mentorship experience',
      'Open source contributions'
    ]
  },

  salaryRange: {
    min: 150000,
    max: 200000,
    currency: 'USD'
  }
};

/**
 * Junior Frontend Developer - Entry level position
 */
export const juniorFrontendDeveloper: JobDescription = {
  jobId: 'JOB-2024-002',
  title: 'Junior Frontend Developer',
  department: 'Engineering',
  location: 'Remote',
  employmentType: 'Full-time',

  description: `Join our growing frontend team as a Junior Developer. You'll work
alongside senior engineers to build user-facing features using React and TypeScript.
This is an excellent opportunity for recent graduates or bootcamp grads looking
to grow their skills in a supportive environment.`,

  requirements: {
    required: [
      '0-2 years of frontend development experience',
      'Familiarity with React or similar frontend framework',
      'Basic understanding of HTML, CSS, and JavaScript',
      'Eagerness to learn and grow'
    ],
    preferred: [
      'Experience with TypeScript',
      'Portfolio of personal or academic projects',
      'Understanding of responsive design',
      'Familiarity with Git'
    ]
  },

  salaryRange: {
    min: 70000,
    max: 90000,
    currency: 'USD'
  }
};

/**
 * Default job used in demos
 */
export const defaultJob = seniorSoftwareEngineer;

/**
 * All available job descriptions
 */
export const allJobs: JobDescription[] = [
  seniorSoftwareEngineer,
  juniorFrontendDeveloper
];

/**
 * Get job by ID
 */
export function getJobById(jobId: string): JobDescription | undefined {
  return allJobs.find(job => job.jobId === jobId);
}
