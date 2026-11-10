import {
  AuditLogEntry,
  ElectiveCourseCatalogItem,
  ElectiveFocusBasketItem,
  IndustryPartner,
  PeerCohortAnalytics,
  PeerSeniorRecord,
  PreferenceWeights,
  RadarSixMetrics,
  ScoredBasketRecommendation,
  ScoredCourseRecommendation,
  ShapAttributionItem,
  TrajectoryCoursePreview,
  UserProfile,
} from '../types';

export const TIET_CORE_COURSE_NAMES: Record<string, string> = {
  UES103: 'Programming for Problem Solving (3-0-2, 4.0 Cr)',
  UMA022: 'Calculus for Engineers (3-1-0, 3.5 Cr)',
  UMA023: 'Differential Equations & Linear Algebra (3-1-0, 3.5 Cr)',
  UCS301: 'Data Structures (3-0-2, 4.0 Cr)',
  UCS303: 'Operating System (3-0-2, 4.0 Cr)',
  UTA018: 'Object Oriented Programming (3-0-2, 4.0 Cr)',
  UCS405: 'Discrete Mathematical Structures (3-1-0, 3.5 Cr)',
  UMA021: 'Numerical Linear Algebra (3-0-2, 4.0 Cr)',
  UCS415: 'Design & Analysis of Algorithms (3-0-2, 4.0 Cr)',
  UCS310: 'Database Management Systems (3-0-2, 4.0 Cr)',
  UCS414: 'Computer Networks (3-0-2, 4.0 Cr)',
  UCS321: 'AI for Engineers (2-0-2, 3.0 Cr)',
  UMA401: 'Probability and Statistics (3-0-2, 4.0 Cr)',
};

export const INITIAL_SHOWCASE_PERSONAS: UserProfile[] = [
  {
    id: 'usr_aarav_01',
    personaKey: 'student_aarav',
    label: 'Aarav Sharma (9.12 CGPA)',
    subtitle: 'Sem IV CSE Topper • Conversational AI (NVIDIA) & Data Science',
    name: 'Aarav Sharma',
    email: 'aarav.sharma@thapar.edu',
    role: 'student',
    rollNumber: '1024030012',
    branch: 'B.E. Computer Science & Engineering (COPC)',
    batchYear: 2024,
    currentSemester: 4,
    cgpa: 9.12,
    sgpaHistory: [
      { semester: 1, sgpa: 8.95, credits: 20.5 },
      { semester: 2, sgpa: 9.08, credits: 21.0 },
      { semester: 3, sgpa: 9.18, credits: 20.5 },
      { semester: 4, sgpa: 9.28, credits: 20.0 },
    ],
    coreGrades: {
      UES103: 9,
      UMA022: 9,
      UMA023: 9,
      UCS301: 10,
      UCS303: 9,
      UTA018: 9,
      UCS405: 9,
      UMA021: 10,
      UCS415: 10,
      UCS310: 9,
      UCS414: 8,
      UCS321: 10,
      UMA401: 9,
    },
    codingProfileScore: 93.5,
    mathAptitudeScore: 92.0,
    skills: ['Python', 'PyTorch', 'CUDA', 'HuggingFace', 'C++20', 'Scikit-Learn', 'SQL'],
    targetCareerRoles: ['Generative AI & LLM Engineer', 'Data Scientist', 'Machine Learning Engineer'],
    statementOfPurpose:
      'Passionate about large language models, NVIDIA accelerated data science, multimodal conversational AI, and deep learning research.',
    preferenceWeights: {
      careerAlignment: 30,
      cgpaBoost: 26,
      syllabusMatch: 28,
      lowWorkload: 16,
    },
    rankedBasketPreferences: [
      'EF_BASKET_09',
      'EF_BASKET_05',
      'EF_BASKET_10',
      'EF_BASKET_04',
      'EF_BASKET_01',
    ],
    rankedGenericPreferences: ['UMA069', 'UMA070', 'UHU017', 'UHU018', 'UTD004'],
    preferenceLockedAt: '2026-10-20T09:15:00.000Z',
    preferenceReceiptHash: '0x9f4a8e2c71d0b3a5f6192c84e1b0a72d9e3c51f8',
    allocatedBasketId: 'EF_BASKET_09',
    allocatedGenericCourseCode: 'UMA069',
    allocationStatus: 'allocated',
    allocatedPreferenceRank: 1,
    waitlistRank: null,
    prerequisiteOverrides: [],
  },
  {
    id: 'usr_meera_02',
    personaKey: 'student_meera',
    label: 'Meera Kaur (8.45 CGPA)',
    subtitle: 'Sem IV CSE • Full Stack & Xebia Cloud DevOps Specialist',
    name: 'Meera Kaur',
    email: 'meera.kaur@thapar.edu',
    role: 'student',
    rollNumber: '1024030045',
    branch: 'B.E. Computer Science & Engineering (COPC)',
    batchYear: 2024,
    currentSemester: 4,
    cgpa: 8.45,
    sgpaHistory: [
      { semester: 1, sgpa: 8.20, credits: 20.5 },
      { semester: 2, sgpa: 8.38, credits: 21.0 },
      { semester: 3, sgpa: 8.55, credits: 20.5 },
      { semester: 4, sgpa: 8.66, credits: 20.0 },
    ],
    coreGrades: {
      UES103: 9,
      UMA022: 8,
      UMA023: 8,
      UCS301: 9,
      UCS303: 9,
      UTA018: 10,
      UCS405: 8,
      UMA021: 8,
      UCS415: 8,
      UCS310: 10,
      UCS414: 9,
      UCS321: 8,
      UMA401: 8,
    },
    codingProfileScore: 87.0,
    mathAptitudeScore: 81.5,
    skills: ['TypeScript', 'React 18', 'Node.js', 'PostgreSQL', 'MongoDB Atlas', 'Docker', 'Kubernetes'],
    targetCareerRoles: ['Full-Stack Software Engineer', 'Site Reliability Engineer (SRE)', 'Cloud Product Engineer'],
    statementOfPurpose:
      'Building scalable enterprise SaaS web applications, distributed databases, CI/CD pipelines, and cloud-native microservices.',
    preferenceWeights: {
      careerAlignment: 32,
      cgpaBoost: 24,
      syllabusMatch: 26,
      lowWorkload: 18,
    },
    rankedBasketPreferences: [
      'EF_BASKET_08',
      'EF_BASKET_07',
      'EF_BASKET_01',
      'EF_BASKET_05',
      'EF_BASKET_03',
    ],
    rankedGenericPreferences: ['UTD004', 'UHU018', 'UEN006', 'UHU016', 'UCS002'],
    preferenceLockedAt: '2026-10-20T09:22:00.000Z',
    preferenceReceiptHash: '0x3b8d19e452a7c0f1d8294b6e3a10c5f782e9a4d1',
    allocatedBasketId: 'EF_BASKET_08',
    allocatedGenericCourseCode: 'UTD004',
    allocationStatus: 'allocated',
    allocatedPreferenceRank: 1,
    waitlistRank: null,
    prerequisiteOverrides: [],
  },
  {
    id: 'usr_rohan_03',
    personaKey: 'student_rohan',
    label: 'Rohan Verma (7.65 CGPA)',
    subtitle: 'Sem IV CSE • Cyber Forensics & EC-Council Ethical Hacking',
    name: 'Rohan Verma',
    email: 'rohan.verma@thapar.edu',
    role: 'student',
    rollNumber: '1024030118',
    branch: 'B.E. Computer Science & Engineering (COPC)',
    batchYear: 2024,
    currentSemester: 4,
    cgpa: 7.65,
    sgpaHistory: [
      { semester: 1, sgpa: 7.40, credits: 20.5 },
      { semester: 2, sgpa: 7.55, credits: 21.0 },
      { semester: 3, sgpa: 7.72, credits: 20.5 },
      { semester: 4, sgpa: 7.92, credits: 20.0 },
    ],
    coreGrades: {
      UES103: 8,
      UMA022: 7,
      UMA023: 7,
      UCS301: 8,
      UCS303: 9,
      UTA018: 8,
      UCS405: 8,
      UMA021: 7,
      UCS415: 7,
      UCS310: 8,
      UCS414: 9,
      UCS321: 7,
      UMA401: 7,
    },
    codingProfileScore: 79.0,
    mathAptitudeScore: 72.5,
    skills: ['Kali Linux', 'Wireshark', 'Burp Suite', 'Network Security', 'Python', 'C', 'OpenSSL'],
    targetCareerRoles: ['Penetration Tester & Red Team Specialist', 'Cybersecurity Architect', 'Digital Forensics Investigator'],
    statementOfPurpose:
      'Active CTF player focused on ethical hacking, network defense, digital forensics, secure coding, and connected vehicle security.',
    preferenceWeights: {
      careerAlignment: 30,
      cgpaBoost: 28,
      syllabusMatch: 24,
      lowWorkload: 18,
    },
    rankedBasketPreferences: [
      'EF_BASKET_11',
      'EF_BASKET_03',
      'EF_BASKET_12',
      'EF_BASKET_07',
      'EF_BASKET_08',
    ],
    rankedGenericPreferences: ['UCS002', 'UTD004', 'UEN006', 'UHU016', 'UMA069'],
    preferenceLockedAt: '2026-10-20T09:45:00.000Z',
    preferenceReceiptHash: '0x7c1f94b28a0e3d65c8219f40e7a2b5d1c683e0f9',
    allocatedBasketId: 'EF_BASKET_11',
    allocatedGenericCourseCode: 'UCS002',
    allocationStatus: 'allocated',
    allocatedPreferenceRank: 1,
    waitlistRank: null,
    prerequisiteOverrides: [],
  },
  {
    id: 'usr_ananya_04',
    personaKey: 'student_ananya',
    label: 'Ananya Gupta (8.80 CGPA)',
    subtitle: 'Sem IV CSE • Financial Derivative (Future First) & Math/Computing',
    name: 'Ananya Gupta',
    email: 'ananya.gupta@thapar.edu',
    role: 'student',
    rollNumber: '1024030029',
    branch: 'B.E. Computer Science & Engineering (COPC)',
    batchYear: 2024,
    currentSemester: 4,
    cgpa: 8.80,
    sgpaHistory: [
      { semester: 1, sgpa: 8.65, credits: 20.5 },
      { semester: 2, sgpa: 8.75, credits: 21.0 },
      { semester: 3, sgpa: 8.85, credits: 20.5 },
      { semester: 4, sgpa: 8.95, credits: 20.0 },
    ],
    coreGrades: {
      UES103: 9,
      UMA022: 10,
      UMA023: 9,
      UCS301: 9,
      UCS303: 8,
      UTA018: 8,
      UCS405: 9,
      UMA021: 10,
      UCS415: 9,
      UCS310: 8,
      UCS414: 8,
      UCS321: 9,
      UMA401: 10,
    },
    codingProfileScore: 86.0,
    mathAptitudeScore: 95.0,
    skills: ['Python', 'QuantLib', 'C++', 'Stochastic Calculus', 'NumPy', 'R', 'Qiskit'],
    targetCareerRoles: ['Quantitative Trader & Derivatives Analyst', 'Quantitative Researcher', 'FinTech Risk Modeler'],
    statementOfPurpose:
      'Focused on quantitative finance, derivatives pricing, stochastic modeling, matrix computation, and algorithmic trading strategies.',
    preferenceWeights: {
      careerAlignment: 28,
      cgpaBoost: 28,
      syllabusMatch: 28,
      lowWorkload: 16,
    },
    rankedBasketPreferences: [
      'EF_BASKET_06',
      'EF_BASKET_04',
      'EF_BASKET_05',
      'EF_BASKET_09',
      'EF_BASKET_01',
    ],
    rankedGenericPreferences: ['UHU018', 'UMA070', 'UMA069', 'UHU017', 'UTD004'],
    preferenceLockedAt: '2026-10-20T09:30:00.000Z',
    preferenceReceiptHash: '0x5e2a8c1f90d4b7e3a6128c59f0b3d4e8a712c9b4',
    allocatedBasketId: 'EF_BASKET_06',
    allocatedGenericCourseCode: 'UHU018',
    allocationStatus: 'allocated',
    allocatedPreferenceRank: 1,
    waitlistRank: null,
    prerequisiteOverrides: [],
  },
  {
    id: 'usr_rajesh_05',
    personaKey: 'faculty_rajesh',
    label: 'Dr. Rajesh Kumar (Faculty Advisor)',
    subtitle: 'CSED Associate Professor • Academic Mentoring & Prerequisite Waivers',
    name: 'Dr. Rajesh Kumar',
    email: 'rajesh.kumar@thapar.edu',
    role: 'faculty_advisor',
    employeeId: 'TIET-CSED-FA01',
    branch: 'Computer Science & Engineering Department (CSED)',
    batchYear: 2024,
    currentSemester: 4,
    cgpa: 9.50,
    sgpaHistory: [
      { semester: 1, sgpa: 9.2, credits: 20.5 },
      { semester: 2, sgpa: 9.4, credits: 21.0 },
      { semester: 3, sgpa: 9.5, credits: 20.5 },
      { semester: 4, sgpa: 9.6, credits: 20.0 },
    ],
    coreGrades: {
      UES103: 10,
      UMA022: 9,
      UMA023: 9,
      UCS301: 10,
      UCS303: 10,
      UTA018: 9,
      UCS405: 9,
      UMA021: 10,
      UCS415: 10,
      UCS310: 9,
      UCS414: 9,
      UCS321: 10,
      UMA401: 10,
    },
    codingProfileScore: 92.0,
    mathAptitudeScore: 94.0,
    skills: ['Curriculum Advisory', 'Machine Learning', 'Algorithms', 'Academic Mentoring'],
    targetCareerRoles: ['CSED Faculty Advisor'],
    statementOfPurpose:
      'Faculty Advisor for B.E. CSE Batch 2024–2028 overseeing elective counseling and prerequisite waivers.',
    preferenceWeights: { careerAlignment: 25, cgpaBoost: 25, syllabusMatch: 25, lowWorkload: 25 },
    rankedBasketPreferences: ['EF_BASKET_05', 'EF_BASKET_09', 'EF_BASKET_04'],
    rankedGenericPreferences: ['UMA069', 'UHU017'],
    allocationStatus: 'allocated',
    prerequisiteOverrides: [],
  },
  {
    id: 'usr_dean_06',
    personaKey: 'admin_dean',
    label: 'Dean Academic Affairs / CSED HOD',
    subtitle: 'Prof. (Dr.) Vikramaditya Singh • Seat Matrix, ERP Upload & Merit Engine',
    name: 'Prof. (Dr.) Vikramaditya Singh',
    email: 'dean.academic@thapar.edu',
    role: 'dean_admin',
    employeeId: 'TIET-DEAN-AA01',
    branch: 'Office of Dean of Academic Affairs & Head CSED',
    batchYear: 2024,
    currentSemester: 4,
    cgpa: 9.80,
    sgpaHistory: [
      { semester: 1, sgpa: 9.6, credits: 20.5 },
      { semester: 2, sgpa: 9.7, credits: 21.0 },
      { semester: 3, sgpa: 9.8, credits: 20.5 },
      { semester: 4, sgpa: 9.9, credits: 20.0 },
    ],
    coreGrades: {
      UES103: 10,
      UMA022: 10,
      UMA023: 10,
      UCS301: 10,
      UCS303: 10,
      UTA018: 10,
      UCS405: 10,
      UMA021: 10,
      UCS415: 10,
      UCS310: 10,
      UCS414: 10,
      UCS321: 10,
      UMA401: 10,
    },
    codingProfileScore: 96.0,
    mathAptitudeScore: 97.0,
    skills: ['Institutional Governance', 'Seat Matrix Optimization', 'Webkiosk ERP Integration'],
    targetCareerRoles: ['Dean of Academic Affairs & Head CSED'],
    statementOfPurpose:
      'Executive oversight of Thapar Institute of Engineering & Technology elective counseling and seat allocation.',
    preferenceWeights: { careerAlignment: 25, cgpaBoost: 25, syllabusMatch: 25, lowWorkload: 25 },
    rankedBasketPreferences: ['EF_BASKET_09', 'EF_BASKET_05', 'EF_BASKET_01'],
    rankedGenericPreferences: ['UMA069', 'UHU018'],
    allocationStatus: 'allocated',
    prerequisiteOverrides: [],
  },
];

export const INITIAL_ELECTIVE_BASKETS: ElectiveFocusBasketItem[] = [
  {
    basketId: 'EF_BASKET_01',
    basketNumber: 1,
    name: 'High Performance Computing',
    collaboration: 'TIET Advanced Computing Lab',
    industryPartner: 'TIET',
    careerTracks: ['Cloud & Distributed Systems Architect', 'HPC & Systems Engineer', 'Backend Infrastructure Engineer'],
    keyPrerequisites: ['UCS303', 'UCS415', 'UMA021', 'UCS301'],
    electiveSequence: {
      'PE-I': ['UCS531'],
      'PE-II': ['UCS635'],
      'PE-III': ['UCS645'],
      'PE-IV': ['UCS751'],
    },
    seatCapacity: 120,
    enrolledCount: 96,
    waitlistCount: 0,
    firstChoiceApplicants: 98,
    topThreeApplicants: 245,
    cutoffCgpaLastYear: 7.55,
    liveCutoffCgpa: 7.62,
  },
  {
    basketId: 'EF_BASKET_02',
    basketNumber: 2,
    name: 'Computer Animation and Gaming',
    collaboration: 'TIET Visual Computing & Graphics Studio',
    industryPartner: 'TIET',
    careerTracks: ['Computer Vision & Graphics Engineer', 'Game Engine & AR/VR Developer', 'Multimedia Systems Engineer'],
    keyPrerequisites: ['UTA018', 'UCS301', 'UMA021', 'UES103'],
    electiveSequence: {
      'PE-I': ['UCS532'],
      'PE-II': ['UCS636'],
      'PE-III': ['UCS646'],
      'PE-IV': ['UCS752'],
    },
    seatCapacity: 120,
    enrolledCount: 84,
    waitlistCount: 0,
    firstChoiceApplicants: 86,
    topThreeApplicants: 190,
    cutoffCgpaLastYear: 7.15,
    liveCutoffCgpa: 7.20,
  },
  {
    basketId: 'EF_BASKET_03',
    basketNumber: 3,
    name: 'Information and Cyber Security',
    collaboration: 'TIET Information Assurance Cell',
    industryPartner: 'TIET',
    careerTracks: ['Cybersecurity Architect', 'Product Security Engineer', 'Blockchain & Cryptography Engineer'],
    keyPrerequisites: ['UCS414', 'UCS303', 'UCS405', 'UES103'],
    electiveSequence: {
      'PE-I': ['UCS534'],
      'PE-II': ['UCS638'],
      'PE-III': ['UCS648'],
      'PE-IV': ['UCS754'],
    },
    seatCapacity: 120,
    enrolledCount: 104,
    waitlistCount: 0,
    firstChoiceApplicants: 108,
    topThreeApplicants: 260,
    cutoffCgpaLastYear: 7.40,
    liveCutoffCgpa: 7.48,
  },
  {
    basketId: 'EF_BASKET_04',
    basketNumber: 4,
    name: 'Mathematics and Computing',
    collaboration: 'TIET School of Mathematics & Computing',
    industryPartner: 'TIET',
    careerTracks: ['Quantitative Researcher', 'Algorithm & Quantum Computing Scientist', 'AI Research Engineer'],
    keyPrerequisites: ['UMA021', 'UMA401', 'UCS405', 'UCS415'],
    electiveSequence: {
      'PE-I': ['UMC513'],
      'PE-II': ['UMC622', 'UMC632'],
      'PE-III': ['UMC633'],
      'PE-IV': ['UMC744'],
    },
    seatCapacity: 120,
    enrolledCount: 112,
    waitlistCount: 4,
    firstChoiceApplicants: 124,
    topThreeApplicants: 295,
    cutoffCgpaLastYear: 8.10,
    liveCutoffCgpa: 8.18,
  },
  {
    basketId: 'EF_BASKET_05',
    basketNumber: 5,
    name: 'Data Science',
    collaboration: 'TIET Center of Excellence in Data Science',
    industryPartner: 'TIET',
    careerTracks: ['Data Scientist', 'Machine Learning Engineer', 'Applied AI Scientist'],
    keyPrerequisites: ['UMA401', 'UCS321', 'UMA021', 'UCS310'],
    electiveSequence: {
      'PE-I': ['UCS548'],
      'PE-II': ['UCS654'],
      'PE-III': ['UCS761'],
      'PE-IV': ['UCS772'],
    },
    seatCapacity: 120,
    enrolledCount: 120,
    waitlistCount: 18,
    firstChoiceApplicants: 152,
    topThreeApplicants: 380,
    cutoffCgpaLastYear: 8.28,
    liveCutoffCgpa: 8.35,
  },
  {
    basketId: 'EF_BASKET_06',
    basketNumber: 6,
    name: 'Financial Derivative',
    collaboration: 'Future First Collaboration',
    industryPartner: 'Future First',
    careerTracks: ['Quantitative Trader & Derivatives Analyst', 'FinTech Risk Modeler', 'Algorithmic Trading Strategist'],
    keyPrerequisites: ['UMA401', 'UMA021', 'UMA022', 'UCS415'],
    electiveSequence: {
      'PE-I': ['UCS539'],
      'PE-II': ['UCS675'],
      'PE-III': ['UCS658'],
      'PE-IV': ['UMC743'],
    },
    seatCapacity: 120,
    enrolledCount: 114,
    waitlistCount: 6,
    firstChoiceApplicants: 126,
    topThreeApplicants: 284,
    cutoffCgpaLastYear: 7.95,
    liveCutoffCgpa: 8.04,
  },
  {
    basketId: 'EF_BASKET_07',
    basketNumber: 7,
    name: 'DevOps and Continuous Delivery',
    collaboration: 'Xebia Collaboration',
    industryPartner: 'Xebia',
    careerTracks: ['Site Reliability Engineer (SRE)', 'DevOps & Platform Engineer', 'Cloud Release Architect'],
    keyPrerequisites: ['UCS303', 'UCS414', 'UTA018', 'UCS310'],
    electiveSequence: {
      'PE-I': ['UCS537'],
      'PE-II': ['UCS659'],
      'PE-III': ['UCS660'],
      'PE-IV': ['UCS758'],
    },
    seatCapacity: 120,
    enrolledCount: 108,
    waitlistCount: 0,
    firstChoiceApplicants: 112,
    topThreeApplicants: 275,
    cutoffCgpaLastYear: 7.45,
    liveCutoffCgpa: 7.52,
  },
  {
    basketId: 'EF_BASKET_08',
    basketNumber: 8,
    name: 'Full Stack',
    collaboration: 'Xebia Collaboration',
    industryPartner: 'Xebia',
    careerTracks: ['Full-Stack Software Engineer', 'Data & Database Platform Engineer', 'Cloud Product Engineer'],
    keyPrerequisites: ['UTA018', 'UCS310', 'UCS301', 'UCS414'],
    electiveSequence: {
      'PE-I': ['UCS542'],
      'PE-II': ['UCS677', 'UCS661'],
      'PE-III': ['UCS662'],
      'PE-IV': ['UCS745'],
    },
    seatCapacity: 120,
    enrolledCount: 118,
    waitlistCount: 11,
    firstChoiceApplicants: 138,
    topThreeApplicants: 340,
    cutoffCgpaLastYear: 7.85,
    liveCutoffCgpa: 7.92,
  },
  {
    basketId: 'EF_BASKET_09',
    basketNumber: 9,
    name: 'Conversational AI',
    collaboration: 'NVIDIA Collaboration',
    industryPartner: 'NVIDIA',
    careerTracks: ['Generative AI & LLM Engineer', 'NLP Research Scientist', 'Speech & Multimodal AI Engineer'],
    keyPrerequisites: ['UCS321', 'UMA021', 'UMA401', 'UCS415'],
    electiveSequence: {
      'PE-I': ['UCS551'],
      'PE-II': ['UCS664'],
      'PE-III': ['UCS749'],
      'PE-IV': ['UCS748'],
    },
    seatCapacity: 120,
    enrolledCount: 120,
    waitlistCount: 24,
    firstChoiceApplicants: 164,
    topThreeApplicants: 410,
    cutoffCgpaLastYear: 8.38,
    liveCutoffCgpa: 8.42,
  },
  {
    basketId: 'EF_BASKET_10',
    basketNumber: 10,
    name: 'Robotics and Edge AI',
    collaboration: 'NVIDIA Collaboration',
    industryPartner: 'NVIDIA',
    careerTracks: ['Robotics & Autonomous Systems Engineer', 'Edge AI & Embedded Vision Engineer', 'Reinforcement Learning Researcher'],
    keyPrerequisites: ['UCS321', 'UCS303', 'UMA021', 'UES103'],
    electiveSequence: {
      'PE-I': ['UCS547'],
      'PE-II': ['UCS668'],
      'PE-III': ['UCS671'],
      'PE-IV': ['UCS760'],
    },
    seatCapacity: 120,
    enrolledCount: 102,
    waitlistCount: 0,
    firstChoiceApplicants: 105,
    topThreeApplicants: 248,
    cutoffCgpaLastYear: 7.80,
    liveCutoffCgpa: 7.85,
  },
  {
    basketId: 'EF_BASKET_11',
    basketNumber: 11,
    name: 'Cyber Forensics and Ethical Hacking',
    collaboration: 'EC-Council, USA',
    industryPartner: 'EC-Council',
    careerTracks: ['Penetration Tester & Red Team Specialist', 'Digital Forensics Investigator', 'SOC & Network Defense Lead'],
    keyPrerequisites: ['UCS414', 'UCS303', 'UCS310', 'UES103'],
    electiveSequence: {
      'PE-I': ['UCS550'],
      'PE-II': ['UCS673'],
      'PE-III': ['UCS674'],
      'PE-IV': ['UCS750'],
    },
    seatCapacity: 120,
    enrolledCount: 98,
    waitlistCount: 0,
    firstChoiceApplicants: 101,
    topThreeApplicants: 230,
    cutoffCgpaLastYear: 7.30,
    liveCutoffCgpa: 7.36,
  },
  {
    basketId: 'EF_BASKET_12',
    basketNumber: 12,
    name: 'Intelligent Transport Systems',
    collaboration: 'TIET Smart Mobility & V2X Group',
    industryPartner: 'TIET',
    careerTracks: ['Connected Mobility & V2X Engineer', 'Automotive Data Scientist', 'ITS Cybersecurity Specialist'],
    keyPrerequisites: ['UCS414', 'UMA401', 'UCS321', 'UCS303'],
    electiveSequence: {
      'PE-I': ['UEC646'],
      'PE-II': ['UCS678'],
      'PE-III': ['UCS679'],
      'PE-IV': ['UCS780'],
    },
    seatCapacity: 120,
    enrolledCount: 76,
    waitlistCount: 0,
    firstChoiceApplicants: 78,
    topThreeApplicants: 165,
    cutoffCgpaLastYear: 6.95,
    liveCutoffCgpa: 7.02,
  },
];

type RawCourseSpec = [
  string, // code
  string, // title
  'PROFESSIONAL_ELECTIVE' | 'GENERIC_ELECTIVE',
  string, // basketId
  'PE-I' | 'PE-II' | 'PE-III' | 'PE-IV' | 'GE-SEM5',
  number, // semester
  string, // ltp
  number, // credits
  IndustryPartner,
  number, // difficultyIndex
  number, // weeklySelfEffortHours
  number, // enrolledCount
  number, // cutoffCgpa
  string[], // prerequisites
  string[], // labTechStack
  string[], // syllabusKeywords
];

const RAW_ELECTIVES: RawCourseSpec[] = [
  // Basket 1: High Performance Computing
  ['UCS531', 'Cloud Computing', 'PROFESSIONAL_ELECTIVE', 'EF_BASKET_01', 'PE-I', 5, '2-0-2', 3.0, 'TIET', 3.2, 5.5, 96, 7.55, ['UCS303', 'UCS414'], ['Docker', 'Kubernetes', 'AWS EC2/S3', 'OpenStack'], ['virtualization', 'IaaS PaaS SaaS', 'cloud orchestration', 'microservices']],
  ['UCS635', 'GPU Computing', 'PROFESSIONAL_ELECTIVE', 'EF_BASKET_01', 'PE-II', 6, '2-0-2', 3.0, 'TIET', 4.1, 7.5, 94, 7.65, ['UCS303', 'UES103', 'UMA021'], ['NVIDIA CUDA', 'Nsight', 'C++', 'cuBLAS'], ['SIMT architecture', 'CUDA thread hierarchy', 'shared memory optimization', 'warp divergence']],
  ['UCS645', 'Parallel & Distributed Computing', 'PROFESSIONAL_ELECTIVE', 'EF_BASKET_01', 'PE-III', 6, '2-0-2', 3.0, 'TIET', 3.9, 7.0, 92, 7.60, ['UCS303', 'UCS415', 'UCS414'], ['OpenMP', 'MPI', 'Apache Spark', 'C++'], ['Amdahl law', 'MPI message passing', 'shared memory parallelism', 'distributed consensus']],
  ['UCS751', 'Simulation & Modelling', 'PROFESSIONAL_ELECTIVE', 'EF_BASKET_01', 'PE-IV', 7, '2-0-2', 3.0, 'TIET', 3.4, 6.0, 90, 7.50, ['UMA401', 'UMA021', 'UCS415'], ['SimPy', 'MATLAB Simulink', 'Python', 'AnyLogic'], ['discrete event simulation', 'Monte Carlo methods', 'queueing networks', 'stochastic processes']],

  // Basket 2: Computer Animation and Gaming
  ['UCS532', 'Computer Vision', 'PROFESSIONAL_ELECTIVE', 'EF_BASKET_02', 'PE-I', 5, '2-0-2', 3.0, 'TIET', 3.6, 6.5, 84, 7.15, ['UMA021', 'UCS321', 'UCS301'], ['OpenCV', 'PyTorch', 'Python', 'NumPy'], ['image filtering', 'edge detection', 'SIFT/ORB descriptors', 'object detection']],
  ['UCS636', '3D Modelling and Animation', 'PROFESSIONAL_ELECTIVE', 'EF_BASKET_02', 'PE-II', 6, '2-0-2', 3.0, 'TIET', 3.1, 6.0, 82, 7.10, ['UTA018', 'UMA021'], ['Blender', 'OpenGL', 'Three.js', 'GLSL Shaders'], ['polygonal meshes', 'NURBS', 'skeletal rigging', 'PBR rendering']],
  ['UCS646', 'Game Design & Development', 'PROFESSIONAL_ELECTIVE', 'EF_BASKET_02', 'PE-III', 6, '2-0-2', 3.0, 'TIET', 3.3, 6.5, 84, 7.18, ['UTA018', 'UCS301', 'UCS321'], ['Unity 3D', 'Unreal Engine', 'C#', 'C++'], ['game physics engine', 'collision detection', 'navmesh pathfinding', 'shader pipelines']],
  ['UCS752', 'Augmented and Virtual Reality', 'PROFESSIONAL_ELECTIVE', 'EF_BASKET_02', 'PE-IV', 7, '2-0-2', 3.0, 'TIET', 3.5, 6.5, 80, 7.20, ['UTA018', 'UMA021'], ['Unity XR Toolkit', 'OpenXR', 'ARKit/ARCore', 'C#'], ['SLAM spatial tracking', 'stereoscopic rendering', 'haptic interaction', 'mixed reality UX']],

  // Basket 3: Information and Cyber Security
  ['UCS534', 'Computer & Network Security', 'PROFESSIONAL_ELECTIVE', 'EF_BASKET_03', 'PE-I', 5, '2-0-2', 3.0, 'TIET', 3.4, 6.0, 104, 7.40, ['UCS414', 'UCS303', 'UCS405'], ['OpenSSL', 'Wireshark', 'Snort IDS', 'iptables'], ['symmetric & public-key crypto', 'TLS/IPSec', 'firewalls', 'intrusion detection']],
  ['UCS638', 'Secure Coding', 'PROFESSIONAL_ELECTIVE', 'EF_BASKET_03', 'PE-II', 6, '2-0-2', 3.0, 'TIET', 3.6, 6.5, 102, 7.45, ['UES103', 'UTA018', 'UCS303'], ['SonarQube', 'OWASP ZAP', 'GDB', 'AddressSanitizer'], ['buffer overflow mitigation', 'SQL injection defense', 'XSS/CSRF', 'static taint analysis']],
  ['UCS648', 'Cyber Forensics', 'PROFESSIONAL_ELECTIVE', 'EF_BASKET_03', 'PE-III', 6, '2-0-2', 3.0, 'TIET', 3.5, 6.0, 100, 7.42, ['UCS303', 'UCS414', 'UCS310'], ['Autopsy', 'Volatility', 'FTK Imager', 'Sleuth Kit'], ['disk imaging', 'memory forensics', 'packet reconstruction', 'chain of custody']],
  ['UCS754', 'Blockchain Technology and Applications', 'PROFESSIONAL_ELECTIVE', 'EF_BASKET_03', 'PE-IV', 7, '2-0-2', 3.0, 'TIET', 3.7, 6.5, 104, 7.50, ['UCS405', 'UCS414', 'UCS301'], ['Solidity', 'Hardhat', 'Ethereum EVM', 'Hyperledger Fabric'], ['Merkle trees', 'Byzantine fault tolerance', 'smart contracts', 'zero-knowledge proofs']],

  // Basket 4: Mathematics and Computing
  ['UMC513', 'Linear Algebra for AI and ML', 'PROFESSIONAL_ELECTIVE', 'EF_BASKET_04', 'PE-I', 5, '2-0-2', 3.0, 'TIET', 3.8, 7.0, 112, 8.10, ['UMA021', 'UMA023', 'UCS321'], ['Python', 'NumPy', 'SciPy', 'JAX'], ['spectral decomposition', 'positive definite matrices', 'tensor contractions', 'kernel SVD']],
  ['UMC622', 'Matrix Computation', 'PROFESSIONAL_ELECTIVE', 'EF_BASKET_04', 'PE-II', 6, '2-0-2', 3.0, 'TIET', 4.0, 7.5, 108, 8.12, ['UMA021', 'UMA023', 'UCS415'], ['LAPACK', 'SciPy Sparse', 'MATLAB', 'Julia'], ['Krylov subspace methods', 'GMRES & Conjugate Gradient', 'Hessenberg reduction', 'QR iteration']],
  ['UMC632', 'Financial Mathematics', 'PROFESSIONAL_ELECTIVE', 'EF_BASKET_04', 'PE-II', 6, '2-0-2', 3.0, 'TIET', 3.9, 7.0, 110, 8.08, ['UMA401', 'UMA022', 'UMA021'], ['Python', 'QuantLib', 'NumPy', 'Statsmodels'], ['stochastic calculus', 'Ito lemma', 'martingale pricing', 'binomial asset pricing']],
  ['UMC633', 'Mathematics for Quantum Computing', 'PROFESSIONAL_ELECTIVE', 'EF_BASKET_04', 'PE-III', 6, '2-0-2', 3.0, 'TIET', 4.4, 8.5, 106, 8.20, ['UMA021', 'UCS405', 'UMA401'], ['Qiskit', 'PennyLane', 'Python', 'SciPy'], ['Hilbert spaces', 'unitary operators', 'quantum entanglement', 'Shor & Grover algorithms']],
  ['UMC744', 'Cryptography and Coding Theory', 'PROFESSIONAL_ELECTIVE', 'EF_BASKET_04', 'PE-IV', 7, '2-0-2', 3.0, 'TIET', 4.2, 8.0, 108, 8.15, ['UCS405', 'UMA021', 'UCS415'], ['SageMath', 'Python', 'OpenSSL', 'PARI/GP'], ['Galois finite fields', 'elliptic curve cryptography', 'lattice post-quantum crypto', 'Reed-Solomon codes']],

  // Basket 5: Data Science
  ['UCS548', 'Foundation of Data Science', 'PROFESSIONAL_ELECTIVE', 'EF_BASKET_05', 'PE-I', 5, '2-0-2', 3.0, 'TIET', 3.2, 6.0, 120, 8.28, ['UMA401', 'UCS321', 'UCS310'], ['Python', 'Pandas', 'Seaborn', 'Scikit-Learn'], ['exploratory data analysis', 'feature engineering', 'data wrangling', 'dimensionality reduction']],
  ['UCS654', 'Predictive Analytics using Statistics', 'PROFESSIONAL_ELECTIVE', 'EF_BASKET_05', 'PE-II', 6, '2-0-2', 3.0, 'TIET', 3.6, 6.5, 118, 8.30, ['UMA401', 'UMA021', 'UCS321'], ['R', 'Statsmodels', 'XGBoost', 'Scikit-Learn'], ['generalized linear models', 'ARIMA & Prophet time-series', 'survival analysis', 'causal inference']],
  ['UCS761', 'Deep Learning', 'PROFESSIONAL_ELECTIVE', 'EF_BASKET_05', 'PE-III', 6, '2-0-2', 3.0, 'TIET', 4.0, 7.5, 120, 8.35, ['UCS321', 'UMA021', 'UMA401'], ['PyTorch', 'TensorFlow', 'CUDA', 'Weights & Biases'], ['backpropagation', 'CNNs ResNet/ViT', 'RNNs & LSTMs', 'attention mechanisms']],
  ['UCS772', 'Data Science: Computer Vision & NLP', 'PROFESSIONAL_ELECTIVE', 'EF_BASKET_05', 'PE-IV', 7, '2-0-2', 3.0, 'TIET', 4.1, 7.5, 119, 8.32, ['UCS321', 'UMA021', 'UMA401'], ['PyTorch', 'HuggingFace Transformers', 'OpenCV', 'spaCy'], ['Vision Transformers', 'semantic segmentation', 'BERT/GPT fine-tuning', 'multimodal embeddings']],

  // Basket 6: Financial Derivative (Future First)
  ['UCS539', 'Finance, Accounting and Valuation', 'PROFESSIONAL_ELECTIVE', 'EF_BASKET_06', 'PE-I', 5, '2-0-2', 3.0, 'Future First', 3.0, 5.5, 114, 7.95, ['UMA401', 'UMA022'], ['Python', 'Excel Financial Modeling', 'Pandas', 'yfinance'], ['financial statements', 'DCF valuation', 'time value of money', 'WACC cost of capital']],
  ['UCS675', 'Financial Markets and Portfolio Theory', 'PROFESSIONAL_ELECTIVE', 'EF_BASKET_06', 'PE-II', 6, '2-0-2', 3.0, 'Future First', 3.5, 6.5, 112, 7.98, ['UMA401', 'UMA021'], ['Python', 'PyPortfolioOpt', 'NumPy', 'QuantConnect'], ['Markowitz optimization', 'CAPM & factor models', 'efficient frontier', 'Value at Risk VaR']],
  ['UCS658', 'Derivatives Pricing, Trading and Strategies', 'PROFESSIONAL_ELECTIVE', 'EF_BASKET_06', 'PE-III', 6, '2-0-2', 3.0, 'Future First', 3.9, 7.0, 114, 8.04, ['UMA401', 'UMA022', 'UMA021'], ['Python', 'QuantLib', 'NumPy', 'Matplotlib'], ['Black-Scholes-Merton PDE', 'options Greeks hedging', 'futures & swaps', 'volatility smiles']],
  ['UMC743', 'Quantitative and Statistical Methods for Finance', 'PROFESSIONAL_ELECTIVE', 'EF_BASKET_06', 'PE-IV', 7, '2-0-2', 3.0, 'Future First', 4.1, 7.5, 110, 8.05, ['UMA401', 'UMA021', 'UCS415'], ['Python', 'ARCH/GARCH', 'SciPy', 'C++'], ['GARCH volatility modeling', 'cointegration pairs trading', 'Monte Carlo pricing', 'HFT order books']],

  // Basket 7: DevOps and Continuous Delivery (Xebia)
  ['UCS537', 'Source Code Management', 'PROFESSIONAL_ELECTIVE', 'EF_BASKET_07', 'PE-I', 5, '2-0-2', 3.0, 'Xebia', 2.7, 5.0, 108, 7.45, ['UTA018', 'UCS303'], ['Git', 'GitHub Actions', 'GitLab', 'Bash'], ['Git internals DAG', 'trunk-based & GitFlow', 'semantic versioning', 'monorepo tooling']],
  ['UCS659', 'Build and Release Management', 'PROFESSIONAL_ELECTIVE', 'EF_BASKET_07', 'PE-II', 6, '2-0-2', 3.0, 'Xebia', 3.1, 5.5, 106, 7.48, ['UTA018', 'UCS303'], ['Maven', 'Gradle', 'Nexus Repository', 'Docker'], ['dependency resolution', 'reproducible builds', 'SBOM artifact signing', 'container layering']],
  ['UCS660', 'Continuous Integration and Continuous Deployment', 'PROFESSIONAL_ELECTIVE', 'EF_BASKET_07', 'PE-III', 6, '2-0-2', 3.0, 'Xebia', 3.4, 6.0, 108, 7.52, ['UCS303', 'UCS414', 'UTA018'], ['Jenkins', 'GitHub Actions', 'ArgoCD', 'Helm'], ['automated CI pipelines', 'blue-green & canary deploys', 'GitOps workflows', 'DevSecOps']],
  ['UCS758', 'System Provisioning and Configuration Management', 'PROFESSIONAL_ELECTIVE', 'EF_BASKET_07', 'PE-IV', 7, '2-0-2', 3.0, 'Xebia', 3.6, 6.5, 105, 7.55, ['UCS303', 'UCS414'], ['Terraform', 'Ansible', 'Kubernetes', 'Prometheus & Grafana'], ['Infrastructure as Code IaC', 'immutable infrastructure', 'Ansible playbooks', 'Kubernetes operators']],

  // Basket 8: Full Stack (Xebia)
  ['UCS542', 'UI & UX Specialist', 'PROFESSIONAL_ELECTIVE', 'EF_BASKET_08', 'PE-I', 5, '2-0-2', 3.0, 'Xebia', 2.8, 5.5, 118, 7.85, ['UTA018', 'UES103'], ['React 18', 'TypeScript', 'Tailwind CSS', 'Figma'], ['design systems', 'component architecture', 'WCAG accessibility', 'state management']],
  ['UCS677', 'Data Engineering', 'PROFESSIONAL_ELECTIVE', 'EF_BASKET_08', 'PE-II', 6, '2-0-2', 3.0, 'Xebia', 3.5, 6.5, 116, 7.90, ['UCS310', 'UCS301', 'UTA018'], ['Apache Kafka', 'Apache Spark', 'Airflow', 'PostgreSQL'], ['ETL/ELT pipelines', 'event streaming', 'star schema warehousing', 'lakehouse architecture']],
  ['UCS661', 'Database Engineer', 'PROFESSIONAL_ELECTIVE', 'EF_BASKET_08', 'PE-II', 6, '2-0-2', 3.0, 'Xebia', 3.4, 6.0, 112, 7.86, ['UCS310', 'UCS301'], ['PostgreSQL', 'MongoDB Atlas', 'Redis', 'PgBouncer'], ['query execution plans', 'sharding & replication', 'NoSQL modeling', 'MVCC internals']],
  ['UCS662', 'Test Automation', 'PROFESSIONAL_ELECTIVE', 'EF_BASKET_08', 'PE-III', 6, '2-0-2', 3.0, 'Xebia', 3.0, 5.5, 115, 7.82, ['UTA018', 'UCS310'], ['Playwright', 'Cypress', 'Jest', 'k6 Load Testing'], ['TDD test-driven dev', 'E2E UI testing', 'API contract testing', 'load profiling']],
  ['UCS745', 'Cloud & DevOps', 'PROFESSIONAL_ELECTIVE', 'EF_BASKET_08', 'PE-IV', 7, '2-0-2', 3.0, 'Xebia', 3.5, 6.5, 118, 7.92, ['UCS414', 'UCS310', 'UTA018'], ['AWS', 'Docker', 'Kubernetes', 'Node.js/Express'], ['cloud-native deployment', 'serverless functions', 'API gateways', 'distributed tracing']],

  // Basket 9: Conversational AI (NVIDIA)
  ['UCS551', 'Conversational AI: Accelerated Data Science', 'PROFESSIONAL_ELECTIVE', 'EF_BASKET_09', 'PE-I', 5, '2-0-2', 3.0, 'NVIDIA', 3.6, 6.5, 120, 8.38, ['UCS321', 'UMA021', 'UMA401'], ['NVIDIA RAPIDS cuDF', 'PyTorch', 'CUDA', 'Python'], ['GPU dataframes', 'vectorized preprocessing', 'distributed training', 'mixed precision FP16']],
  ['UCS664', 'Conversational AI: Natural Language Processing', 'PROFESSIONAL_ELECTIVE', 'EF_BASKET_09', 'PE-II', 6, '2-0-2', 3.0, 'NVIDIA', 3.9, 7.0, 120, 8.40, ['UCS321', 'UMA401', 'UMA021'], ['HuggingFace', 'PyTorch', 'NVIDIA NeMo', 'spaCy'], ['Word2Vec/GloVe', 'self-attention & Transformers', 'Seq2Seq models', 'dialogue state tracking']],
  ['UCS749', 'Conversational AI: Speech Processing & Synthesis', 'PROFESSIONAL_ELECTIVE', 'EF_BASKET_09', 'PE-III', 6, '2-0-2', 3.0, 'NVIDIA', 4.0, 7.5, 119, 8.41, ['UCS321', 'UMA021', 'UMA401'], ['NVIDIA NeMo ASR/TTS', 'torchaudio', 'Librosa', 'PyTorch'], ['MFCC audio features', 'CTC & Conformer ASR', 'neural TTS vocoders', 'speaker diarization']],
  ['UCS748', 'Generative AI', 'PROFESSIONAL_ELECTIVE', 'EF_BASKET_09', 'PE-IV', 7, '2-0-2', 3.0, 'NVIDIA', 4.2, 8.0, 120, 8.45, ['UCS321', 'UMA021', 'UMA401'], ['PyTorch', 'vLLM', 'LangChain', 'NVIDIA TensorRT-LLM'], ['autoregressive LLMs', 'RLHF & DPO alignment', 'RAG architectures', 'LoRA/QLoRA fine-tuning']],

  // Basket 10: Robotics and Edge AI (NVIDIA)
  ['UCS547', 'Edge AI and Robotics: Accelerated Data Science', 'PROFESSIONAL_ELECTIVE', 'EF_BASKET_10', 'PE-I', 5, '2-0-2', 3.0, 'NVIDIA', 3.6, 6.5, 102, 7.80, ['UCS321', 'UCS303', 'UES103'], ['NVIDIA Jetson', 'CUDA', 'Python', 'TensorRT'], ['INT8 quantization', 'sensor data fusion', 'GPU memory optimization', 'embedded Linux']],
  ['UCS668', 'Edge AI and Robotics: Data Centre Vision', 'PROFESSIONAL_ELECTIVE', 'EF_BASKET_10', 'PE-II', 6, '2-0-2', 3.0, 'NVIDIA', 3.9, 7.0, 100, 7.82, ['UCS321', 'UMA021', 'UCS301'], ['NVIDIA DeepStream', 'PyTorch', 'OpenCV', 'Triton Server'], ['multi-stream video analytics', '3D object detection', 'optical flow tracking', 'model pruning']],
  ['UCS671', 'Edge AI and Robotics: Embedded Vision', 'PROFESSIONAL_ELECTIVE', 'EF_BASKET_10', 'PE-III', 6, '2-0-2', 3.0, 'NVIDIA', 4.0, 7.5, 99, 7.85, ['UCS303', 'UES103', 'UCS321'], ['ROS 2', 'NVIDIA Isaac ROS', 'C++', 'TensorRT'], ['visual odometry SLAM', 'stereo depth estimation', 'edge neural accelerators', 'HIL perception']],
  ['UCS760', 'Edge AI and Robotics: Reinforcement Learning & Conversational AI', 'PROFESSIONAL_ELECTIVE', 'EF_BASKET_10', 'PE-IV', 7, '2-0-2', 3.0, 'NVIDIA', 4.2, 8.0, 101, 7.88, ['UCS321', 'UMA401', 'UMA021'], ['NVIDIA Isaac Gym', 'PyTorch', 'ROS 2', 'Gymnasium'], ['Markov Decision Processes', 'DQN & PPO policies', 'sim-to-real transfer', 'embodied AI agents']],

  // Basket 11: Cyber Forensics and Ethical Hacking (EC-Council)
  ['UCS550', 'Network Defence', 'PROFESSIONAL_ELECTIVE', 'EF_BASKET_11', 'PE-I', 5, '2-0-2', 3.0, 'EC-Council', 3.3, 6.0, 98, 7.30, ['UCS414', 'UCS303'], ['pfSense', 'Zeek', 'Suricata', 'Splunk SIEM'], ['perimeter defense', 'zero-trust segmentation', 'VPN hardening', 'SIEM correlation']],
  ['UCS673', 'Ethical Hacking-1', 'PROFESSIONAL_ELECTIVE', 'EF_BASKET_11', 'PE-II', 6, '2-0-2', 3.0, 'EC-Council', 3.6, 6.5, 98, 7.35, ['UCS414', 'UCS303', 'UES103'], ['Kali Linux', 'Nmap', 'Metasploit', 'Burp Suite'], ['reconnaissance', 'vulnerability enumeration', 'privilege escalation', 'MITRE ATT&CK']],
  ['UCS674', 'Ethical Hacking-II', 'PROFESSIONAL_ELECTIVE', 'EF_BASKET_11', 'PE-III', 6, '2-0-2', 3.0, 'EC-Council', 3.8, 7.0, 96, 7.38, ['UCS414', 'UCS303', 'UES103'], ['Burp Suite Pro', 'Ghidra', 'Frida', 'OWASP Suite'], ['web app pentesting', 'wireless & IoT exploitation', 'binary reverse engineering', 'red teaming']],
  ['UCS750', 'Computer Hacking and Forensic Investigation', 'PROFESSIONAL_ELECTIVE', 'EF_BASKET_11', 'PE-IV', 7, '2-0-2', 3.0, 'EC-Council', 3.7, 6.5, 95, 7.36, ['UCS414', 'UCS303', 'UCS310'], ['EnCase', 'Autopsy', 'Volatility 3', 'Wireshark'], ['anti-forensics detection', 'malware triage', 'cloud & mobile forensics', 'expert witness reports']],

  // Basket 12: Intelligent Transport Systems
  ['UEC646', 'Network and Communication for Connected Vehicles', 'PROFESSIONAL_ELECTIVE', 'EF_BASKET_12', 'PE-I', 5, '3-0-0', 3.0, 'TIET', 3.3, 5.5, 76, 6.95, ['UCS414', 'UCS303'], ['OMNeT++', 'SUMO', 'VEINS', 'Python'], ['V2V & V2X communication', 'IEEE 802.11p DSRC', 'Cellular-V2X 5G NR', 'CAN bus protocols']],
  ['UCS678', 'Intelligent Transportation Systems', 'PROFESSIONAL_ELECTIVE', 'EF_BASKET_12', 'PE-II', 6, '3-0-0', 3.0, 'TIET', 3.2, 5.5, 74, 6.98, ['UCS415', 'UCS321', 'UCS414'], ['SUMO Traffic Simulator', 'Python', 'GeoPandas', 'PostGIS'], ['adaptive traffic control', 'smart mobility architecture', 'trajectory modeling', 'digital twins']],
  ['UCS679', 'Data Analytics in Automobile Engineering', 'PROFESSIONAL_ELECTIVE', 'EF_BASKET_12', 'PE-III', 6, '3-0-0', 3.0, 'TIET', 3.4, 6.0, 75, 7.02, ['UMA401', 'UCS321', 'UCS310'], ['Python', 'Scikit-Learn', 'PySpark', 'InfluxDB'], ['predictive maintenance', 'EV battery SoH estimation', 'driver behavior profiling', 'CAN telemetry']],
  ['UCS780', 'Cyber Security for Mobility Systems', 'PROFESSIONAL_ELECTIVE', 'EF_BASKET_12', 'PE-IV', 7, '3-0-0', 3.0, 'TIET', 3.6, 6.0, 76, 7.05, ['UCS414', 'UCS303', 'UCS405'], ['Wireshark CAN', 'Scapy', 'OpenSSL', 'ISO/SAE 21434'], ['in-vehicle IDS', 'ECU firmware attestation', 'V2X PKI security', 'GNSS spoofing defense']],

  // Semester V Generic Electives (2-0-0, 2.0 Credits)
  ['UHU016', 'Introductory Course in French', 'GENERIC_ELECTIVE', 'GENERIC_SEM5', 'GE-SEM5', 5, '2-0-0', 2.0, 'TIET', 2.1, 3.0, 92, 6.80, [], ['Language Lab Audio Suite', 'CEFR A1 Modules'], ['French phonetics', 'conversational grammar', 'Francophone culture', 'reading comprehension']],
  ['UHU017', 'Introduction to Cognitive Science', 'GENERIC_ELECTIVE', 'GENERIC_SEM5', 'GE-SEM5', 5, '2-0-0', 2.0, 'TIET', 2.5, 3.5, 98, 7.10, [], ['PsychoPy', 'Cognitive Modeling Cases'], ['human perception', 'memory & attention', 'decision heuristics', 'computational mind']],
  ['UHU018', 'Introduction to Corporate Finance', 'GENERIC_ELECTIVE', 'GENERIC_SEM5', 'GE-SEM5', 5, '2-0-0', 2.0, 'TIET', 2.7, 4.0, 114, 7.65, [], ['Excel Financial Analysis', 'Bloomberg Case Studies'], ['capital budgeting', 'financial ratios', 'working capital', 'corporate governance']],
  ['UCS002', 'Introduction to Cyber Security', 'GENERIC_ELECTIVE', 'GENERIC_SEM5', 'GE-SEM5', 5, '2-0-0', 2.0, 'TIET', 2.6, 3.8, 110, 7.40, [], ['Cyber Hygiene Toolkit', 'OWASP Sandbox'], ['cyber threat landscape', 'MFA & password hygiene', 'phishing defense', 'data privacy']],
  ['UPH064', 'Nanoscience and Nanomaterials', 'GENERIC_ELECTIVE', 'GENERIC_SEM5', 'GE-SEM5', 5, '2-0-0', 2.0, 'TIET', 2.9, 4.2, 74, 6.65, [], ['Nanomaterial Characterization', 'XRD/SEM Sim'], ['quantum confinement', 'carbon nanotubes', 'thin film synthesis', 'nanoelectronics']],
  ['UEN006', 'Technologies for Sustainable Development', 'GENERIC_ELECTIVE', 'GENERIC_SEM5', 'GE-SEM5', 5, '2-0-0', 2.0, 'TIET', 2.3, 3.2, 88, 6.85, [], ['LCA Assessment Tools', 'Renewable Energy Sim'], ['circular economy', 'solar & hydrogen energy', 'carbon footprint', 'green engineering']],
  ['UMA069', 'Graph Theory and Applications', 'GENERIC_ELECTIVE', 'GENERIC_SEM5', 'GE-SEM5', 5, '2-0-0', 2.0, 'TIET', 3.1, 4.5, 118, 7.90, [], ['Python NetworkX', 'GraphViz'], ['planar graphs', 'Eulerian & Hamiltonian paths', 'graph coloring', 'network flows']],
  ['UBT510', 'Biology for Engineers', 'GENERIC_ELECTIVE', 'GENERIC_SEM5', 'GE-SEM5', 5, '2-0-0', 2.0, 'TIET', 2.4, 3.4, 78, 6.70, [], ['NCBI BLAST', 'BioPython Basics'], ['molecular biology dogma', 'biosensors', 'biomimetics', 'genomic alignment']],
  ['UMA070', 'Advanced Numerical Methods', 'GENERIC_ELECTIVE', 'GENERIC_SEM5', 'GE-SEM5', 5, '2-0-0', 2.0, 'TIET', 3.2, 4.6, 108, 7.75, [], ['MATLAB', 'Python SciPy'], ['finite difference PDE solvers', 'Runge-Kutta BVP', 'spline interpolation', 'quadrature']],
  ['UTD004', 'Campus 2 Corporate', 'GENERIC_ELECTIVE', 'GENERIC_SEM5', 'GE-SEM5', 5, '2-0-0', 2.0, 'TIET', 2.0, 2.8, 116, 7.50, [], ['Executive Communication Studio', 'Case Frameworks'], ['executive communication', 'agile workplace readiness', 'stakeholder negotiation', 'leadership']],
];

export const INITIAL_ELECTIVE_COURSES: ElectiveCourseCatalogItem[] = RAW_ELECTIVES.map(
  ([
    courseCode,
    title,
    category,
    basketId,
    electiveSlot,
    semester,
    ltp,
    credits,
    industryPartner,
    difficultyIndex,
    weeklySelfEffortHours,
    enrolledCount,
    cutoffCgpaLastYear,
    prerequisites,
    labTechStack,
    syllabusKeywords,
  ]) => {
    const [l, t, p] = ltp.split('-').map(Number);
    const easeFactor = Math.max(0, 4.5 - difficultyIndex);
    const aPlusPct = Math.round(8 + easeFactor * 5);
    const aPct = Math.round(18 + easeFactor * 6);
    const aMinusPct = 26;
    const bPct = 24;
    const bMinusPct = Math.max(6, 100 - (aPlusPct + aPct + aMinusPct + bPct) - 6);
    const cPct = 6;

    return {
      courseCode,
      title,
      category,
      basketId,
      electiveSlot,
      semester,
      ltp,
      lectureHours: l,
      tutorialHours: t,
      practicalHours: p,
      credits,
      seatCapacity: 120,
      enrolledCount,
      waitlistCount: enrolledCount >= 120 ? 12 : 0,
      cutoffCgpaLastYear,
      liveCutoffCgpa: Number((cutoffCgpaLastYear + 0.06).toFixed(2)),
      industryPartner,
      prerequisites,
      labTechStack,
      syllabusKeywords,
      clos: [
        `CLO1: Master core theoretical foundations and algorithmic models in ${title}.`,
        `CLO2: Design, implement, and benchmark production workflows using ${labTechStack.slice(0, 2).join(' and ')}.`,
        `CLO3: Evaluate performance, scalability, and engineering trade-offs in ${title}.`,
      ],
      difficultyIndex,
      weeklySelfEffortHours,
      evaluationScheme: {
        mstWeight: 28,
        estWeight: 42,
        sessionalWeight: 30,
      },
      historicalGradeDistribution: [
        { grade: 'A+ (10)', percentage: aPlusPct },
        { grade: 'A (10)', percentage: aPct },
        { grade: 'A- (9)', percentage: aMinusPct },
        { grade: 'B (8)', percentage: bPct },
        { grade: 'B- (7)', percentage: bMinusPct },
        { grade: 'C (6)', percentage: cPct },
      ],
    };
  }
);

function gpToLetter(gp: number): string {
  if (gp >= 9.6) return 'A+';
  if (gp >= 9.1) return 'A';
  if (gp >= 8.35) return 'A-';
  if (gp >= 7.45) return 'B';
  if (gp >= 6.45) return 'B-';
  return 'C';
}

export function computeCourseRadarMetrics(
  course: ElectiveCourseCatalogItem,
  user: UserProfile
): RadarSixMetrics {
  const mathPrereqs = course.prerequisites.filter((p) => p.startsWith('UMA') || p === 'UCS405');
  const mathIntensity = Math.min(
    98,
    Math.round(
      (course.courseCode.startsWith('UMC') || course.courseCode.startsWith('UMA') ? 88 : 54) +
        mathPrereqs.length * 12 +
        (course.difficultyIndex - 3.0) * 10
    )
  );
  const codingLabLoad = Math.min(
    98,
    Math.round(
      course.practicalHours * 28 +
        course.weeklySelfEffortHours * 5.2 +
        (course.category === 'GENERIC_ELECTIVE' ? -15 : 8)
    )
  );
  const cgpaScoringEase = Math.min(
    96,
    Math.max(38, Math.round(108 - course.difficultyIndex * 16.5 + (user.cgpa - 7.8) * 4.5))
  );
  const placementDemand = Math.min(
    98,
    Math.round(
      (course.industryPartner !== 'TIET' ? 88 : 76) +
        (course.enrolledCount / Math.max(1, course.seatCapacity)) * 12
    )
  );
  const researchRelevance = Math.min(
    98,
    Math.round(52 + course.difficultyIndex * 10.5 + (course.semester === 7 ? 8 : 2))
  );

  let prereqAvg = user.cgpa;
  if (course.prerequisites.length > 0) {
    const sum = course.prerequisites.reduce(
      (acc, p) => acc + (user.coreGrades[p] ?? user.cgpa),
      0
    );
    prereqAvg = sum / course.prerequisites.length;
  }
  const prerequisiteReadiness = Math.min(99, Math.max(45, Math.round(prereqAvg * 10)));

  return {
    mathIntensity,
    codingLabLoad,
    cgpaScoringEase,
    placementDemand,
    researchRelevance,
    prerequisiteReadiness,
  };
}

export function computeHybridRecommendations(
  user: UserProfile,
  baskets: ElectiveFocusBasketItem[],
  courses: ElectiveCourseCatalogItem[],
  weights: PreferenceWeights
): {
  rankedBaskets: ScoredBasketRecommendation[];
  rankedCourses: ScoredCourseRecommendation[];
} {
  const totalW = Math.max(
    1,
    weights.careerAlignment + weights.cgpaBoost + weights.syllabusMatch + weights.lowWorkload
  );
  const wCareer = weights.careerAlignment / totalW;
  const wCgpa = weights.cgpaBoost / totalW;
  const wSyllabus = weights.syllabusMatch / totalW;
  const wWorkload = weights.lowWorkload / totalW;

  const userTokens = new Set(
    [
      ...user.skills,
      ...user.targetCareerRoles,
      user.statementOfPurpose,
    ]
      .join(' ')
      .toLowerCase()
      .split(/[^a-z0-9+#]+/)
      .filter((t) => t.length > 1)
  );

  const courseMap = new Map(courses.map((c) => [c.courseCode, c]));

  // Score every course first
  const scoredCoursesMap = new Map<string, ScoredCourseRecommendation>();

  courses.forEach((course) => {
    const prereqs = course.prerequisites || [];
    const prereqGrades = prereqs.map((p) => user.coreGrades[p] ?? user.cgpa);
    const prereqMean =
      prereqGrades.length > 0
        ? prereqGrades.reduce((a, b) => a + b, 0) / prereqGrades.length
        : user.cgpa;

    // Expected Grade Point via prerequisite mastery, CGPA, and difficulty index
    const rawGp =
      prereqMean * 0.52 +
      user.cgpa * 0.36 +
      (user.codingProfileScore / 10) * 0.06 +
      (user.mathAptitudeScore / 10) * 0.06 -
      (course.difficultyIndex - 3.3) * 0.48 +
      0.32;
    const expectedGp = Number(Math.min(10.0, Math.max(5.8, rawGp)).toFixed(2));
    const expectedLetter = gpToLetter(expectedGp);

    const totalOut100 = Number(Math.min(98.5, Math.max(52.0, expectedGp * 9.35)).toFixed(1));
    const ratio = totalOut100 / 100;
    const mstOut30 = Number(Math.min(30, Number((30 * ratio).toFixed(1))));
    const estOut45 = Number(Math.min(45, Number((45 * ratio).toFixed(1))));
    const sessionalOut30 = Number(Math.min(30, Number((30 * ratio * 1.03).toFixed(1))));

    const contactHours = course.lectureHours + course.tutorialHours + course.practicalHours;
    const readinessReduction = (prereqMean - 7.8) * 0.35;
    const expectedWorkload = Number(
      Math.max(3.5, course.weeklySelfEffortHours + contactHours - readinessReduction).toFixed(1)
    );

    // Token match
    const courseTokens = [
      ...course.labTechStack,
      ...course.syllabusKeywords,
      course.title,
      course.industryPartner,
    ]
      .join(' ')
      .toLowerCase()
      .split(/[^a-z0-9+#]+/)
      .filter((t) => t.length > 1);
    const matchedCount = courseTokens.filter((t) => userTokens.has(t)).length;
    const syllabusScore = Math.min(98, 62 + matchedCount * 5.8);
    const cgpaBoostScore = Math.min(99, expectedGp * 9.8);
    const workloadBalanceScore = Math.min(98, Math.max(42, 112 - expectedWorkload * 4.5));
    const isPrefBasket = user.rankedBasketPreferences.includes(course.basketId);
    const isPrefGe = user.rankedGenericPreferences.includes(course.courseCode);
    const careerScore = Math.min(
      98,
      (isPrefBasket || isPrefGe ? 89 : 70) + (course.industryPartner !== 'TIET' ? 6 : 2)
    );

    const composite = Number(
      Math.min(
        99.4,
        wCareer * careerScore +
          wCgpa * cgpaBoostScore +
          wSyllabus * syllabusScore +
          wWorkload * workloadBalanceScore
      ).toFixed(1)
    );

    const cutoff = course.liveCutoffCgpa ?? course.cutoffCgpaLastYear;
    const margin = Number((user.cgpa - cutoff).toFixed(2));
    const prob = Math.round(
      Math.min(99, Math.max(12, (1 / (1 + Math.exp(-3.1 * margin))) * 100))
    );

    const shapReasons: ShapAttributionItem[] = [
      {
        feature: 'Prerequisite Core Mastery',
        featureCode: prereqs.length > 0 ? prereqs.join(', ') : 'Sem I–IV CGPA',
        studentValue:
          prereqs.length > 0
            ? prereqs.map((p) => `${p} (${user.coreGrades[p] ?? 8}/10)`).join(', ')
            : `${user.cgpa.toFixed(2)} CGPA`,
        shapImpact: Number(((prereqMean - 7.6) * 0.34).toFixed(2)),
        direction: prereqMean >= 7.6 ? 'positive' : 'negative',
        reason:
          prereqMean >= 7.6
            ? `Strong grades in ${prereqs.length > 0 ? prereqs.join(', ') : 'core courses'} boost expected grade to ${expectedLetter} (${expectedGp})`
            : `Core prerequisites (${prereqs.join(', ')}) require extra lab preparation`,
      },
      {
        feature: 'Syllabus & Lab Tech Stack Match',
        featureCode: 'TF-IDF + SVD Cosine',
        studentValue: course.labTechStack.slice(0, 3).join(', '),
        shapImpact: Number(((syllabusScore - 68) * 0.015).toFixed(2)),
        direction: syllabusScore >= 68 ? 'positive' : 'negative',
        reason: `Matches your technical profile across ${course.labTechStack.slice(0, 3).join(', ')}`,
      },
      {
        feature: 'Weekly Effort & Overload Fit',
        featureCode: `${expectedWorkload} hrs/wk`,
        studentValue: `L-T-P ${course.ltp}`,
        shapImpact: Number(((9.5 - expectedWorkload) * 0.08).toFixed(2)),
        direction: expectedWorkload <= 9.8 ? 'positive' : 'negative',
        reason: `Projected ${expectedWorkload} hrs/wk total effort (Difficulty Index ${course.difficultyIndex}/5.0)`,
      },
    ];

    scoredCoursesMap.set(course.courseCode, {
      rank: 1,
      course,
      compositeMatchScore: composite,
      expectedGradePoint: expectedGp,
      expectedLetterGrade: expectedLetter,
      predictionInterval90: {
        lowerGp: Number(Math.max(4.0, expectedGp - 0.55).toFixed(2)),
        upperGp: Number(Math.min(10.0, expectedGp + 0.55).toFixed(2)),
      },
      expectedMarks: {
        mstOut30,
        estOut45,
        sessionalOut30,
        totalOut100,
      },
      expectedWeeklyWorkloadHours: expectedWorkload,
      allotmentProbabilityPct: prob,
      estimatedCutoffCgpa: cutoff,
      shapReasons,
      radarMetrics: computeCourseRadarMetrics(course, user),
      sourceMetadata: {
        source: 'local_fallback',
        model_version: 'tiet-catalog-heuristic-v1.0',
        generated_at: new Date().toISOString(),
        is_fallback: true,
        data_nature: 'heuristic_fallback',
        disclaimer:
          'Generated by local catalog heuristics (Python ML service offline/cold-starting). Not verified ML inference.',
      },
    });
  });

  // Score all 12 Elective Focus Baskets
  const rankedBaskets: ScoredBasketRecommendation[] = baskets.map((basket) => {
    const seq = basket.electiveSequence;
    const allBasketCodes = [
      ...(seq['PE-I'] || []),
      ...(seq['PE-II'] || []),
      ...(seq['PE-III'] || []),
      ...(seq['PE-IV'] || []),
    ];

    const trajectoryCourses: TrajectoryCoursePreview[] = [];
    (['PE-I', 'PE-II', 'PE-III', 'PE-IV'] as const).forEach((slot) => {
      const codes = seq[slot] || [];
      const cCode = codes[0];
      const sc = cCode ? scoredCoursesMap.get(cCode) : undefined;
      if (sc) {
        trajectoryCourses.push({
          courseCode: sc.course.courseCode,
          title: sc.course.title,
          semester: sc.course.semester,
          electiveSlot: slot,
          ltp: sc.course.ltp,
          credits: sc.course.credits,
          expectedGradePoint: sc.expectedGradePoint,
          expectedLetterGrade: sc.expectedLetterGrade,
          predictionInterval90: sc.predictionInterval90,
          expectedMarks: sc.expectedMarks,
          expectedWeeklyWorkloadHours: sc.expectedWeeklyWorkloadHours,
        });
      }
    });

    const meanGp =
      trajectoryCourses.length > 0
        ? trajectoryCourses.reduce((acc, c) => acc + c.expectedGradePoint, 0) /
          trajectoryCourses.length
        : 8.4;
    const avgWorkload =
      trajectoryCourses.length > 0
        ? trajectoryCourses.reduce((acc, c) => acc + c.expectedWeeklyWorkloadHours, 0) /
          trajectoryCourses.length
        : 8.2;

    const prereqVals = basket.keyPrerequisites.map((p) => user.coreGrades[p] ?? user.cgpa);
    const prereqMean =
      prereqVals.length > 0
        ? prereqVals.reduce((a, b) => a + b, 0) / prereqVals.length
        : user.cgpa;

    // Career alignment check
    const userCareerStr = [...user.targetCareerRoles, user.statementOfPurpose]
      .join(' ')
      .toLowerCase();
    const basketCareerTokens = [...basket.careerTracks, basket.name, basket.collaboration]
      .join(' ')
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((t) => t.length > 2);
    const careerOverlap = basketCareerTokens.filter((t) => userCareerStr.includes(t)).length;
    const prefRankIdx = user.rankedBasketPreferences.indexOf(basket.basketId);
    const prefBonus = prefRankIdx === 0 ? 14 : prefRankIdx > 0 ? 9 - prefRankIdx : 0;

    const careerAlignmentScore = Math.min(99, 64 + careerOverlap * 6.5 + prefBonus);
    const cgpaBoostScore = Math.min(99, meanGp * 9.85);
    const syllabusMatchScore =
      allBasketCodes.length > 0
        ? Math.min(
            99,
            allBasketCodes.reduce(
              (acc, code) => acc + (scoredCoursesMap.get(code)?.compositeMatchScore ?? 78),
              0
            ) /
              allBasketCodes.length +
              prefBonus * 0.4
          )
        : 80;
    const workloadBalanceScore = Math.min(98, Math.max(45, 114 - avgWorkload * 4.4));

    const compositeMatchScore = Number(
      Math.min(
        99.2,
        wCareer * careerAlignmentScore +
          wCgpa * cgpaBoostScore +
          wSyllabus * syllabusMatchScore +
          wWorkload * workloadBalanceScore
      ).toFixed(1)
    );

    const expectedBasketSgpa = Number(meanGp.toFixed(2));
    const projectedCumulativeCgpa = Number(
      ((user.cgpa * 82 + expectedBasketSgpa * 12) / 94).toFixed(2)
    );
    const expectedCgpaDelta = Number((expectedBasketSgpa - user.cgpa).toFixed(2));

    const estCutoff = basket.liveCutoffCgpa ?? basket.cutoffCgpaLastYear;
    const margin = Number((user.cgpa - estCutoff).toFixed(2));
    const probPct = Math.round(
      Math.min(99, Math.max(8, (1 / (1 + Math.exp(-3.2 * margin))) * 100))
    );

    const competitionStatus =
      probPct >= 80
        ? 'HIGH_PROBABILITY'
        : probPct >= 50
          ? 'MODERATE_COMPETITION'
          : 'WAITLIST_RISK';

    const shapReasons: ShapAttributionItem[] = [
      {
        feature: 'Prerequisite Core Readiness',
        featureCode: basket.keyPrerequisites.join(', '),
        studentValue: basket.keyPrerequisites
          .slice(0, 3)
          .map((p) => `${p}: ${user.coreGrades[p] ?? 8}/10`)
          .join(' • '),
        shapImpact: Number(((prereqMean - 7.5) * 0.36).toFixed(2)),
        direction: prereqMean >= 7.5 ? 'positive' : 'negative',
        reason: `Core performance in ${basket.keyPrerequisites.slice(0, 3).join(', ')} drives an expected ${expectedBasketSgpa} Basket SGPA`,
      },
      {
        feature: 'Career & Industry Collaboration Fit',
        featureCode: basket.collaboration,
        studentValue: user.targetCareerRoles[0] || 'CSE Engineer',
        shapImpact: Number(((careerAlignmentScore - 70) * 0.018).toFixed(2)),
        direction: careerAlignmentScore >= 70 ? 'positive' : 'negative',
        reason: `Direct alignment with ${basket.collaboration} roles (${basket.careerTracks.slice(0, 2).join(', ')})`,
      },
      {
        feature: 'k-NN Senior Cohort Success',
        featureCode: '50-Peer Collaborative Matrix',
        studentValue: `${Math.round(syllabusMatchScore)}% Peer Affinity`,
        shapImpact: Number(((syllabusMatchScore - 74) * 0.015).toFixed(2)),
        direction: syllabusMatchScore >= 74 ? 'positive' : 'negative',
        reason: `TIET CSE seniors with similar Sem I–IV grades achieved +${Math.max(0.18, expectedCgpaDelta).toFixed(2)} SGPA gain in ${basket.name}`,
      },
      {
        feature: 'Workload & Lab Sustainability',
        featureCode: `${avgWorkload.toFixed(1)} hrs/wk avg`,
        studentValue: `4 Courses (12.0 Cr)`,
        shapImpact: Number(((9.6 - avgWorkload) * 0.09).toFixed(2)),
        direction: avgWorkload <= 9.8 ? 'positive' : 'negative',
        reason: `Average weekly commitment of ${avgWorkload.toFixed(1)} hrs/course across Sem V–VII`,
      },
    ];

    // Aggregate radar metrics across basket courses
    const cRadars = allBasketCodes
      .map((c) => courseMap.get(c))
      .filter((c): c is ElectiveCourseCatalogItem => Boolean(c))
      .map((c) => computeCourseRadarMetrics(c, user));

    const avgRadar = (key: keyof RadarSixMetrics): number =>
      cRadars.length > 0
        ? Math.round(cRadars.reduce((acc, r) => acc + r[key], 0) / cRadars.length)
        : 75;

    return {
      rank: 1,
      basket,
      compositeMatchScore,
      scoreBreakdown: {
        careerAlignmentScore: Number(careerAlignmentScore.toFixed(1)),
        cgpaBoostScore: Number(cgpaBoostScore.toFixed(1)),
        syllabusMatchScore: Number(syllabusMatchScore.toFixed(1)),
        workloadBalanceScore: Number(workloadBalanceScore.toFixed(1)),
      },
      expectedBasketSgpa,
      expectedCgpaDelta,
      projectedCumulativeCgpa,
      avgWeeklyWorkloadHours: Number(avgWorkload.toFixed(1)),
      seatCompetition: {
        filledSeats: basket.enrolledCount,
        seatCapacity: basket.seatCapacity,
        estimatedCutoffCgpa: estCutoff,
        allotmentProbabilityPct: probPct,
        studentCgpaMargin: margin,
        competitionStatus,
      },
      trajectoryCourses,
      shapReasons,
      radarMetrics: {
        mathIntensity: avgRadar('mathIntensity'),
        codingLabLoad: avgRadar('codingLabLoad'),
        cgpaScoringEase: avgRadar('cgpaScoringEase'),
        placementDemand: avgRadar('placementDemand'),
        researchRelevance: avgRadar('researchRelevance'),
        prerequisiteReadiness: avgRadar('prerequisiteReadiness'),
      },
      sourceMetadata: {
        source: 'local_fallback',
        model_version: 'tiet-catalog-heuristic-v1.0',
        generated_at: new Date().toISOString(),
        is_fallback: true,
        data_nature: 'heuristic_fallback',
        disclaimer:
          'Generated by local catalog heuristics (Python ML service offline/cold-starting). Not verified ML inference.',
      },
    };
  });

  rankedBaskets.sort((a, b) => b.compositeMatchScore - a.compositeMatchScore);
  rankedBaskets.forEach((b, idx) => {
    b.rank = idx + 1;
  });

  const rankedCourses = Array.from(scoredCoursesMap.values()).sort(
    (a, b) => b.compositeMatchScore - a.compositeMatchScore
  );
  rankedCourses.forEach((c, idx) => {
    c.rank = idx + 1;
  });

  return { rankedBaskets, rankedCourses };
}

export function buildPeerCohortAnalytics(
  user: UserProfile,
  baskets: ElectiveFocusBasketItem[]
): PeerCohortAnalytics {
  const basketById = new Map(baskets.map((b) => [b.basketId, b]));
  const prefBaskets =
    user.rankedBasketPreferences.length >= 3
      ? user.rankedBasketPreferences
      : ['EF_BASKET_09', 'EF_BASKET_05', 'EF_BASKET_08', 'EF_BASKET_06'];

  const counts = [18, 13, 9, 6, 4];
  const basketDistribution = prefBaskets.slice(0, 5).map((bId, idx) => {
    const bMeta = basketById.get(bId);
    const cnt = counts[idx] || 4;
    const peerCgpa = Number(Math.min(9.7, Math.max(6.8, user.cgpa - 0.08 + idx * 0.04)).toFixed(2));
    const elecSgpa = Number(Math.min(9.95, peerCgpa + 0.42 - idx * 0.05).toFixed(2));
    return {
      basketId: bId,
      basketName: bMeta?.name || bId,
      peerCount: cnt,
      percentage: cnt * 2,
      avgPeerCgpaSem4: peerCgpa,
      avgElectiveSgpa: elecSgpa,
      avgCgpaDelta: Number((elecSgpa - peerCgpa).toFixed(2)),
      placementOutcomes: {
        'Super-Dream': Math.max(1, Math.round(cnt * (user.cgpa >= 8.4 ? 0.58 : 0.35))),
        Dream: Math.max(1, Math.round(cnt * 0.28)),
        'Higher-Studies': Math.max(1, Math.round(cnt * 0.14)),
      },
    };
  });

  const superDreamCount = user.cgpa >= 8.7 ? 29 : user.cgpa >= 8.1 ? 22 : 15;
  const dreamCount = user.cgpa >= 8.7 ? 13 : user.cgpa >= 8.1 ? 19 : 24;
  const higherStudiesCount = 6;
  const coreCount = 50 - superDreamCount - dreamCount - higherStudiesCount;

  const placementSummary = [
    { tier: 'Super-Dream (₹22L+ CTC)', count: superDreamCount, percentage: superDreamCount * 2 },
    { tier: 'Dream (₹12L–22L CTC)', count: dreamCount, percentage: dreamCount * 2 },
    { tier: 'Higher-Studies (MS/PhD Top-50)', count: higherStudiesCount, percentage: higherStudiesCount * 2 },
    { tier: 'Core / Enterprise Tech', count: Math.max(1, coreCount), percentage: Math.max(2, coreCount * 2) },
  ];

  const seniorNames = [
    'Siddharth Bhardwaj', 'Nandini Sodhi', 'Karanvir Brar', 'Simranjeet Kaur',
    'Devansh Grover', 'Tanya Ahluwalia', 'Harshvardhan Walia', 'Mehakpreet Gill',
    'Rishabh Oberoi', 'kritika Sachdeva', 'Yuvraj Bajwa', 'Anshika Duggal',
  ];

  const closestSeniors: PeerSeniorRecord[] = seniorNames.map((sName, i) => {
    const bId = prefBaskets[i % Math.min(4, prefBaskets.length)];
    const bMeta = basketById.get(bId);
    const cgpaSem4 = Number(
      Math.min(9.8, Math.max(6.8, user.cgpa + (i % 2 === 0 ? 0.06 : -0.07) * ((i % 4) + 1))).toFixed(2)
    );
    const avgElectiveSgpa = Number(Math.min(10.0, cgpaSem4 + 0.38 - (i % 3) * 0.06).toFixed(2));
    const tiers: ('Super-Dream' | 'Dream' | 'Higher-Studies' | 'Core')[] = [
      'Super-Dream',
      'Super-Dream',
      'Dream',
      'Higher-Studies',
      'Dream',
      'Super-Dream',
    ];
    return {
      studentId: `STU_1022030${101 + i}`,
      rollNo: `1022030${101 + i}`,
      batchYear: 2022 + (i % 2),
      similarityScorePct: Number((98.4 - i * 0.7).toFixed(1)),
      cgpaSem4,
      avgElectiveSgpa,
      cgpaDelta: Number((avgElectiveSgpa - cgpaSem4).toFixed(2)),
      chosenBasketId: bId,
      chosenBasketName: bMeta?.name || bId,
      chosenGenericElective: user.rankedGenericPreferences[i % user.rankedGenericPreferences.length] || 'UMA069',
      preferredCareerTrack: bMeta?.careerTracks[0] || user.targetCareerRoles[0] || 'Software Engineer',
      placementTier: tiers[i % tiers.length],
    };
  });

  return {
    cohortSize: 50,
    avgPeerSimilarityPct: 94.8,
    avgCohortCgpaSem4: Number(user.cgpa.toFixed(2)),
    avgCohortElectiveSgpa: Number(Math.min(9.95, user.cgpa + 0.36).toFixed(2)),
    avgCohortCgpaDelta: 0.36,
    basketDistribution,
    placementSummary,
    closestSeniors,
    sourceMetadata: {
      source: 'local_fallback',
      model_version: 'client-cohort-fallback-v1.0',
      generated_at: new Date().toISOString(),
      is_fallback: true,
      data_nature: 'heuristic_fallback',
      disclaimer:
        'Generated by client-side heuristic cohort fallback because Python ML service is cold-starting or offline.',
    },
  };
}

export const SHOWCASE_PERSONAS: UserProfile[] = INITIAL_SHOWCASE_PERSONAS;
export const INITIAL_BASKETS: ElectiveFocusBasketItem[] = INITIAL_ELECTIVE_BASKETS;

export const SEM5_CORE_COURSES: {
  courseCode: string;
  title: string;
  ltp: string;
  credits: number;
}[] = [
  {
    courseCode: 'UCS503',
    title: 'Software Engineering',
    ltp: '3-0-2',
    credits: 4.0,
  },
  {
    courseCode: 'UCS510',
    title: 'Computer Architecture and Organization',
    ltp: '3-0-0',
    credits: 3.0,
  },
  {
    courseCode: 'UCS505',
    title: 'Computer Graphics',
    ltp: '3-0-2',
    credits: 4.0,
  },
  {
    courseCode: 'UML501',
    title: 'Machine Learning',
    ltp: '2-0-2',
    credits: 3.5,
  },
];

export const INITIAL_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: 'AUD_INIT_01',
    actorEmail: 'dean.academic@thapar.edu',
    actorRole: 'dean_admin',
    action: 'ADMIN_MERIT_SEAT_ALLOCATION_EXECUTED',
    ipAddress: '14.139.242.10 (TIET Office of Dean AA)',
    metadata: {
      roundNumber: 1,
      seatCapPerBasket: 120,
      totalStudentsProcessed: 60,
      allocatedCount: 57,
      waitlistedCount: 3,
    },
    timestamp: '2026-10-20T10:05:00.000Z',
  },
  {
    id: 'AUD_INIT_02',
    actorEmail: 'aarav.sharma@thapar.edu',
    actorRole: 'student',
    action: 'STUDENT_PREFERENCES_LOCKED',
    ipAddress: '14.139.242.18 (Hostel J Campus WiFi)',
    metadata: {
      rollNumber: '1024030012',
      cgpa: 9.12,
      topBasketChoice: 'EF_BASKET_09',
      topGenericChoice: 'UMA069',
      receiptHash: '0x9f4a8e2c71d0b3a5f6192c84e1b0a72d9e3c51f8',
    },
    timestamp: '2026-10-20T09:15:00.000Z',
  },
  {
    id: 'AUD_INIT_03',
    actorEmail: 'rajesh.kumar@thapar.edu',
    actorRole: 'faculty_advisor',
    action: 'FACULTY_PREREQUISITE_OVERRIDE_GRANTED',
    ipAddress: '14.139.242.14 (CSED Faculty Block)',
    metadata: {
      studentRollNumber: '1024030118',
      targetCode: 'UCS659',
      reason: 'EC-Council CTF National Finalist & Linux Security Lab A+',
    },
    timestamp: '2026-10-20T08:40:00.000Z',
  },
  {
    id: 'AUD_INIT_04',
    actorEmail: 'dean.academic@thapar.edu',
    actorRole: 'dean_admin',
    action: 'ADMIN_WEBKIOSK_BULK_CSV_UPLOAD',
    ipAddress: '14.139.242.10 (TIET ERP Sync Gateway)',
    metadata: {
      batchYear: 2024,
      totalRowsParsed: 960,
      upsertedStudents: 960,
      errorsCount: 0,
    },
    timestamp: '2026-10-19T18:30:00.000Z',
  },
];


