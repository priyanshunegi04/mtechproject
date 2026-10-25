import bcrypt from 'bcryptjs';
import fs from 'fs';
import mongoose from 'mongoose';
import path from 'path';
import pino from 'pino';
import {
  Basket,
  CounselingRound,
  Course,
  CourseCategoryType,
  IElectiveSequenceMap,
  IndustryPartnerType,
  User,
} from '../models';
import { InstitutionalRole } from '../types';

const logger = pino({ name: 'tiet-seed-service' });

export interface ShowcasePersonaSeed {
  personaKey: string;
  label: string;
  subtitle: string;
  name: string;
  email: string;
  role: InstitutionalRole;
  rollNumber?: string;
  employeeId?: string;
  batchYear: number;
  currentSemester: number;
  cgpa: number;
  sgpaHistory: { semester: number; sgpa: number; credits: number }[];
  coreGrades: Record<string, number>;
  codingProfileScore: number;
  mathAptitudeScore: number;
  skills: string[];
  targetCareerRoles: string[];
  statementOfPurpose: string;
  preferenceWeights: { alpha: number; beta: number; gamma: number; delta: number };
  rankedBasketPreferences: string[];
  rankedGenericPreferences: string[];
}

export const SHOWCASE_PERSONAS: ShowcasePersonaSeed[] = [
  {
    personaKey: 'student_aarav',
    label: 'Aarav Sharma (9.12 CGPA)',
    subtitle: 'Sem IV CSE Topper • AI, Conversational AI & Data Science Aspirant',
    name: 'Aarav Sharma',
    email: 'aarav.sharma@thapar.edu',
    role: 'student',
    rollNumber: '1024030012',
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
    preferenceWeights: { alpha: 0.30, beta: 0.22, gamma: 0.26, delta: 0.22 },
    rankedBasketPreferences: [
      'EF_BASKET_09',
      'EF_BASKET_05',
      'EF_BASKET_10',
      'EF_BASKET_04',
      'EF_BASKET_01',
    ],
    rankedGenericPreferences: ['UMA069', 'UMA070', 'UHU017', 'UHU018', 'UTD004'],
  },
  {
    personaKey: 'student_meera',
    label: 'Meera Kaur (8.45 CGPA)',
    subtitle: 'Sem IV CSE • Full Stack & Xebia Cloud DevOps Specialist',
    name: 'Meera Kaur',
    email: 'meera.kaur@thapar.edu',
    role: 'student',
    rollNumber: '1024030045',
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
    preferenceWeights: { alpha: 0.32, beta: 0.24, gamma: 0.24, delta: 0.20 },
    rankedBasketPreferences: [
      'EF_BASKET_08',
      'EF_BASKET_07',
      'EF_BASKET_01',
      'EF_BASKET_05',
      'EF_BASKET_03',
    ],
    rankedGenericPreferences: ['UTD004', 'UHU018', 'UEN006', 'UHU016', 'UCS002'],
  },
  {
    personaKey: 'student_rohan',
    label: 'Rohan Verma (7.65 CGPA)',
    subtitle: 'Sem IV CSE • Cyber Security, EC-Council Ethical Hacking & Network Defense',
    name: 'Rohan Verma',
    email: 'rohan.verma@thapar.edu',
    role: 'student',
    rollNumber: '1024030118',
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
    preferenceWeights: { alpha: 0.28, beta: 0.22, gamma: 0.30, delta: 0.20 },
    rankedBasketPreferences: [
      'EF_BASKET_11',
      'EF_BASKET_03',
      'EF_BASKET_12',
      'EF_BASKET_07',
      'EF_BASKET_08',
    ],
    rankedGenericPreferences: ['UCS002', 'UTD004', 'UEN006', 'UHU016', 'UMA069'],
  },
  {
    personaKey: 'student_ananya',
    label: 'Ananya Gupta (8.80 CGPA)',
    subtitle: 'Sem IV CSE • Quantitative Finance (Future First) & Math/Computing',
    name: 'Ananya Gupta',
    email: 'ananya.gupta@thapar.edu',
    role: 'student',
    rollNumber: '1024030029',
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
    preferenceWeights: { alpha: 0.26, beta: 0.24, gamma: 0.28, delta: 0.22 },
    rankedBasketPreferences: [
      'EF_BASKET_06',
      'EF_BASKET_04',
      'EF_BASKET_05',
      'EF_BASKET_09',
      'EF_BASKET_01',
    ],
    rankedGenericPreferences: ['UHU018', 'UMA070', 'UMA069', 'UHU017', 'UTD004'],
  },
  {
    personaKey: 'faculty_rajesh',
    label: 'Dr. Rajesh Kumar (CSED Faculty Advisor)',
    subtitle: 'Associate Professor & B.E. CSE Academic Advisor • Prerequisite & Load Review',
    name: 'Dr. Rajesh Kumar',
    email: 'rajesh.kumar@thapar.edu',
    role: 'faculty_advisor',
    employeeId: 'TIET-CSED-FA01',
    batchYear: 2024,
    currentSemester: 4,
    cgpa: 9.5,
    sgpaHistory: [],
    coreGrades: {},
    codingProfileScore: 90,
    mathAptitudeScore: 90,
    skills: ['Curriculum Advisory', 'Machine Learning', 'Algorithms', 'Academic Mentoring'],
    targetCareerRoles: ['CSED Faculty Advisor'],
    statementOfPurpose: 'Faculty Advisor for B.E. CSE Batch 2024–2028 overseeing elective counseling and prerequisite waivers.',
    preferenceWeights: { alpha: 0.25, beta: 0.25, gamma: 0.25, delta: 0.25 },
    rankedBasketPreferences: [],
    rankedGenericPreferences: [],
  },
  {
    personaKey: 'admin_dean',
    label: 'Dean of Academic Affairs / CSED HOD',
    subtitle: 'Prof. (Dr.) Vikramaditya Singh • Seat Matrix, ERP Upload & Merit Allotment Engine',
    name: 'Prof. (Dr.) Vikramaditya Singh',
    email: 'dean.academic@thapar.edu',
    role: 'dean_admin',
    employeeId: 'TIET-DEAN-AA01',
    batchYear: 2024,
    currentSemester: 4,
    cgpa: 9.8,
    sgpaHistory: [],
    coreGrades: {},
    codingProfileScore: 95,
    mathAptitudeScore: 95,
    skills: ['Institutional Governance', 'Seat Matrix Optimization', 'Webkiosk ERP Integration'],
    targetCareerRoles: ['Dean of Academic Affairs & Head CSED'],
    statementOfPurpose: 'Executive oversight of Thapar Institute of Engineering & Technology elective counseling and seat allocation.',
    preferenceWeights: { alpha: 0.25, beta: 0.25, gamma: 0.25, delta: 0.25 },
    rankedBasketPreferences: [],
    rankedGenericPreferences: [],
  },
];

function detectIndustryPartner(collabText: string): IndustryPartnerType {
  const lower = (collabText || '').toLowerCase();
  if (lower.includes('nvidia')) return 'NVIDIA';
  if (lower.includes('xebia')) return 'Xebia';
  if (lower.includes('ec-council')) return 'EC-Council';
  if (lower.includes('future first')) return 'Future First';
  return 'TIET';
}

export function loadLocalCoursesCatalog(): Record<string, unknown> {
  const candidatePaths = [
    path.resolve(__dirname, '../../../ml-service/data/processed/courses_catalog.json'),
    path.resolve(process.cwd(), '../ml-service/data/processed/courses_catalog.json'),
    path.resolve(process.cwd(), 'ml-service/data/processed/courses_catalog.json'),
  ];

  for (const p of candidatePaths) {
    if (fs.existsSync(p)) {
      return JSON.parse(fs.readFileSync(p, 'utf-8')) as Record<string, unknown>;
    }
  }
  return { all_courses: [], elective_focus_baskets: [] };
}

export async function ensureInstitutionalSeedData(): Promise<void> {
  if (mongoose.connection.readyState !== 1) {
    return;
  }

  const catalog = loadLocalCoursesCatalog();
  const rawBaskets = (catalog.elective_focus_baskets as Record<string, unknown>[]) || [];
  const rawCourses = (catalog.all_courses as Record<string, unknown>[]) || [];

  const basketPartnerById: Record<string, IndustryPartnerType> = {};
  const basketLastYearCutoffs: Record<string, number> = {
    EF_BASKET_01: 7.45,
    EF_BASKET_02: 7.15,
    EF_BASKET_03: 7.35,
    EF_BASKET_04: 8.05,
    EF_BASKET_05: 8.25,
    EF_BASKET_06: 7.95,
    EF_BASKET_07: 7.40,
    EF_BASKET_08: 7.85,
    EF_BASKET_09: 8.35,
    EF_BASKET_10: 7.80,
    EF_BASKET_11: 7.30,
    EF_BASKET_12: 6.95,
  };

  if (rawBaskets.length > 0) {
    const basketOps = rawBaskets.map((b) => {
      const bId = String(b.basket_id);
      const partner = detectIndustryPartner(String(b.collaboration || ''));
      basketPartnerById[bId] = partner;
      return {
        updateOne: {
          filter: { basketId: bId },
          update: {
            $setOnInsert: {
              seatCapacity: 120,
              enrolledCount: 0,
              waitlistCount: 0,
              liveCutoffCgpa: null,
            },
            $set: {
              basketId: bId,
              basket_id: bId,
              basketNumber: Number(b.basket_number || 1),
              name: String(b.name || ''),
              collaboration: String(b.collaboration || 'TIET'),
              industryPartner: partner,
              careerTracks: (b.career_tracks as string[]) || [],
              keyPrerequisites: (b.key_prerequisites as string[]) || [],
              electiveSequence: ((b.elective_sequence as unknown) as IElectiveSequenceMap) || {
                'PE-I': [],
                'PE-II': [],
                'PE-III': [],
                'PE-IV': [],
              },
              cutoffCgpaLastYear: basketLastYearCutoffs[bId] || 7.25,
              isActive: true,
            },
          },
          upsert: true,
        },
      };
    });
    await Basket.bulkWrite(basketOps, { ordered: false });
  }

  if (rawCourses.length > 0) {
    const courseOps = rawCourses.map((c) => {
      const cCode = String(c.course_code);
      const bId = String(c.basket_id || 'CORE');
      const partner = basketPartnerById[bId] || 'TIET';
      return {
        updateOne: {
          filter: { courseCode: cCode },
          update: {
            $setOnInsert: {
              seatCapacity: Number(c.seat_capacity || 120),
              enrolledCount: 0,
              waitlistCount: 0,
              liveCutoffCgpa: null,
            },
            $set: {
              courseCode: cCode,
              course_code: cCode,
              title: String(c.title || ''),
              category: String(c.category || 'PROFESSIONAL_ELECTIVE') as CourseCategoryType,
              basketId: bId,
              basket_id: bId,
              electiveSlot: String(c.elective_slot || 'CORE'),
              semester: Number(c.semester || 5),
              ltp: String(c.ltp || '2-0-2'),
              lectureHours: Number(c.lecture_hours ?? 2),
              tutorialHours: Number(c.tutorial_hours ?? 0),
              practicalHours: Number(c.practical_hours ?? 2),
              credits: Number(c.credits ?? 3.0),
              cutoffCgpaLastYear: basketLastYearCutoffs[bId] || 7.1,
              industryPartner: partner,
              evaluationScheme: {
                mstWeight: Number(c.mst_weight ?? 28),
                estWeight: Number(c.est_weight ?? 42),
                sessionalWeight: Number(c.sessional_weight ?? 30),
              },
              prerequisites: (c.prerequisites as string[]) || [],
              labTechStack: (c.lab_tech_stack as string[]) || [],
              syllabusKeywords: (c.syllabus_keywords as string[]) || [],
              clos: (c.clos as string[]) || [],
              difficultyIndex: Number(c.difficulty_index ?? 3.3),
              weeklySelfEffortHours: Number(c.weekly_self_effort_hours ?? 6.0),
              isActive: true,
            },
          },
          upsert: true,
        },
      };
    });
    await Course.bulkWrite(courseOps, { ordered: false });
  }

  // Upsert the 6 Showcase Personas
  const defaultPasswordHash = await bcrypt.hash('Thapar@2026', 10);
  const now = new Date();

  for (const p of SHOWCASE_PERSONAS) {
    await User.updateOne(
      { email: p.email },
      {
        $setOnInsert: {
          passwordHash: defaultPasswordHash,
          allocationStatus: 'pending',
          allocatedBasketId: null,
          allocatedGenericCourseCode: null,
          preferenceLockedAt: p.role === 'student' ? now : null,
        },
        $set: {
          personaKey: p.personaKey,
          name: p.name,
          role: p.role,
          ...(p.rollNumber ? { rollNumber: p.rollNumber } : {}),
          ...(p.employeeId ? { employeeId: p.employeeId } : {}),
          branch: 'B.E. Computer Science & Engineering (COPC)',
          batchYear: p.batchYear,
          currentSemester: p.currentSemester,
          cgpa: p.cgpa,
          sgpaHistory: p.sgpaHistory,
          coreGrades: p.coreGrades,
          codingProfileScore: p.codingProfileScore,
          mathAptitudeScore: p.mathAptitudeScore,
          skills: p.skills,
          targetCareerRoles: p.targetCareerRoles,
          statementOfPurpose: p.statementOfPurpose,
          preferenceWeights: p.preferenceWeights,
          rankedBasketPreferences: p.rankedBasketPreferences,
          rankedGenericPreferences: p.rankedGenericPreferences,
        },
      },
      { upsert: true }
    );
  }

  // Seed 56 additional Sem 4 student cohort profiles if fewer than 20 students exist so Merit Seat Allocation has a realistic batch
  const existingStudentCount = await User.countDocuments({ role: 'student' });
  if (existingStudentCount < 25) {
    const allBasketIds = [
      'EF_BASKET_01',
      'EF_BASKET_02',
      'EF_BASKET_03',
      'EF_BASKET_04',
      'EF_BASKET_05',
      'EF_BASKET_06',
      'EF_BASKET_07',
      'EF_BASKET_08',
      'EF_BASKET_09',
      'EF_BASKET_10',
      'EF_BASKET_11',
      'EF_BASKET_12',
    ];
    const allGeCodes = [
      'UHU016',
      'UHU017',
      'UHU018',
      'UCS002',
      'UPH064',
      'UEN006',
      'UMA069',
      'UBT510',
      'UMA070',
      'UTD004',
    ];
    const firstNames = [
      'Kabir', 'Ishaan', 'Vihaan', 'Aditya', 'Arjun', 'Reyansh', 'Vivaan', 'pranav',
      'Diya', 'Saanvi', 'Aanya', 'Kiara', 'Myra', 'Avni', 'Prisha', 'Riya',
    ];
    const lastNames = [
      'Malhotra', 'Gill', 'Bedi', 'Kapoor', 'Sethi', 'Chawla', 'Bhatia', 'Dhaliwal',
      'Grewal', 'Sandhu', 'Khanna', 'Tandon', 'Arora', 'chopra',
    ];

    const cohortOps = [];
    for (let i = 1; i <= 56; i++) {
      const roll = `10240302${String(i).padStart(2, '0')}`;
      const fname = firstNames[i % firstNames.length];
      const lname = lastNames[(i * 3) % lastNames.length];
      const email = `${fname.toLowerCase()}.${lname.toLowerCase()}${i}@thapar.edu`;
      const cgpaVal = Number((6.2 + ((i * 17) % 36) * 0.1).toFixed(2));
      const baseGp = Math.min(10, Math.max(6, Math.round(cgpaVal)));

      const bStart = i % allBasketIds.length;
      const bPrefs = [
        allBasketIds[bStart],
        allBasketIds[(bStart + 4) % allBasketIds.length],
        allBasketIds[(bStart + 7) % allBasketIds.length],
        allBasketIds[(bStart + 2) % allBasketIds.length],
        allBasketIds[(bStart + 9) % allBasketIds.length],
      ];
      const gStart = i % allGeCodes.length;
      const gPrefs = [
        allGeCodes[gStart],
        allGeCodes[(gStart + 3) % allGeCodes.length],
        allGeCodes[(gStart + 5) % allGeCodes.length],
        allGeCodes[(gStart + 1) % allGeCodes.length],
        allGeCodes[(gStart + 7) % allGeCodes.length],
      ];

      cohortOps.push({
        updateOne: {
          filter: { rollNumber: roll },
          update: {
            $setOnInsert: {
              name: `${fname} ${lname}`,
              email,
              passwordHash: defaultPasswordHash,
              role: 'student' as InstitutionalRole,
              rollNumber: roll,
              branch: 'B.E. Computer Science & Engineering (COPC)',
              batchYear: 2024,
              currentSemester: 4,
              cgpa: cgpaVal,
              sgpaHistory: [
                { semester: 1, sgpa: Number((cgpaVal - 0.15).toFixed(2)), credits: 20.5 },
                { semester: 2, sgpa: Number((cgpaVal - 0.05).toFixed(2)), credits: 21.0 },
                { semester: 3, sgpa: Number((cgpaVal + 0.05).toFixed(2)), credits: 20.5 },
                { semester: 4, sgpa: Number((cgpaVal + 0.15).toFixed(2)), credits: 20.0 },
              ],
              coreGrades: {
                UES103: baseGp,
                UMA022: baseGp,
                UMA023: baseGp,
                UCS301: Math.min(10, baseGp + (i % 2)),
                UCS303: baseGp,
                UTA018: baseGp,
                UCS405: baseGp,
                UMA021: Math.min(10, baseGp + ((i + 1) % 2)),
                UCS415: baseGp,
                UCS310: baseGp,
                UCS414: baseGp,
                UCS321: Math.min(10, baseGp + (i % 2)),
                UMA401: baseGp,
              },
              codingProfileScore: Number((cgpaVal * 9.4).toFixed(1)),
              mathAptitudeScore: Number((cgpaVal * 9.3).toFixed(1)),
              skills: ['Python', 'C++', 'SQL', 'Git'],
              targetCareerRoles: ['Software Development Engineer', 'Data Scientist'],
              statementOfPurpose: 'B.E. CSE student preparing for Semester V Elective Focus Basket counseling.',
              preferenceWeights: { alpha: 0.28, beta: 0.24, gamma: 0.28, delta: 0.20 },
              rankedBasketPreferences: bPrefs,
              rankedGenericPreferences: gPrefs,
              preferenceLockedAt: new Date(now.getTime() - i * 60000),
              allocationStatus: 'pending' as const,
              allocatedBasketId: null,
              allocatedGenericCourseCode: null,
            },
          },
          upsert: true,
        },
      });
    }
    await User.bulkWrite(cohortOps, { ordered: false });
  }

  // Ensure default active CounselingRound exists
  await CounselingRound.updateOne(
    { roundId: 'ROUND_2026_SEM5_R1' },
    {
      $setOnInsert: {
        roundId: 'ROUND_2026_SEM5_R1',
        roundNumber: 1,
        title: 'TIET B.E. CSE 2026 — Semester V Elective Focus Basket & Generic Elective Counseling (Round 1)',
        academicYear: '2026-2027',
        branch: 'B.E. Computer Science & Engineering (COPC)',
        batchYear: 2024,
        targetSemester: 5,
        status: 'open',
        opensAt: new Date(now.getTime() - 3 * 24 * 3600 * 1000),
        closesAt: new Date(now.getTime() + 7 * 24 * 3600 * 1000),
      },
    },
    { upsert: true }
  );

  logger.info('Verified TIET B.E. CSE 2026 courses, 12 EF Baskets, and Showcase Personas in MongoDB Atlas');
}
