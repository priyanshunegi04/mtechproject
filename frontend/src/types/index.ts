export type InstitutionalRole = 'student' | 'faculty_advisor' | 'dean_admin';

export type RecommendationSource = 'ml_service' | 'synthetic_fallback' | 'local_fallback';

export interface MLSourceMetadata {
  source: RecommendationSource;
  model_version: string;
  generated_at: string;
  is_fallback: boolean;
  data_nature?: 'synthetic_development' | 'heuristic_fallback' | 'live_ml_service' | string;
  disclaimer?: string;
}

export type IndustryPartner = 'NVIDIA' | 'Xebia' | 'EC-Council' | 'Future First' | 'TIET';

export interface SgpaEntry {
  semester: number;
  sgpa: number;
  credits: number;
}

export interface PreferenceWeights {
  careerAlignment: number; // delta
  cgpaBoost: number;       // gamma
  syllabusMatch: number;   // alpha
  lowWorkload: number;     // beta / workload balance
}

export interface PrerequisiteOverride {
  targetCode: string;
  approvedByEmail: string;
  approvedByName: string;
  reason: string;
  approvedAt: string;
}

export interface QuizResponseItem {
  questionId: string;
  selectedOption: number;
  isCorrect: boolean;
  domain: string;
}

export interface DomainScoresMap {
  'Data Structures & Algorithms': number;
  'Math & Linear Algebra': number;
  'Systems & OS/Networks': number;
  'AI & Machine Learning': number;
  'Web & Databases': number;
  [key: string]: number;
}

export type SkillLevel = 'Novice' | 'Intermediate' | 'Proficient' | 'Advanced';

export interface SkillAssessmentRecord {
  lastTakenAt?: string | null;
  totalScore: number;
  domainScores: DomainScoresMap;
  evaluatedSkillLevel: SkillLevel;
  quizResponses: QuizResponseItem[];
}

export interface AdvisorMenteeReview {
  status: 'Pending' | 'Approved' | 'Revision Recommended';
  advisorNotes?: string;
  reviewedByEmail?: string;
  reviewedByName?: string;
  reviewedAt?: string | null;
}

export interface DiagnosticQuestionItem {
  index: number;
  id: string;
  domain: string;
  domainLabel: string;
  difficulty: 'Medium' | 'Hard';
  courseRef: string;
  question: string;
  options: string[];
  correctOptionIndex?: number;
  explanation?: string;
}

export interface UserProfile {
  id: string;
  personaKey: string;
  label: string;
  subtitle: string;
  name: string;
  email: string;
  contactNumber?: string;
  department?: string;
  designation?: string;
  primarySpecializationBasket?: string;
  role: InstitutionalRole;
  rollNumber?: string | null;
  employeeId?: string | null;
  branch: string;
  batchYear: number;
  currentSemester: number;
  cgpa: number;
  sgpaHistory: SgpaEntry[];
  coreGrades: Record<string, number>;
  codingProfileScore: number;
  mathAptitudeScore: number;
  skills: string[];
  areasOfInterest?: string[];
  skillAssessment?: SkillAssessmentRecord;
  advisorReview?: AdvisorMenteeReview;
  targetCareerRoles: string[];
  statementOfPurpose: string;
  preferenceWeights: PreferenceWeights;
  rankedBasketPreferences: string[];
  rankedGenericPreferences: string[];
  preferenceLockedAt?: string | null;
  preferenceReceiptHash?: string | null;
  allocatedBasketId?: string | null;
  allocatedGenericCourseCode?: string | null;
  allocationStatus: 'pending' | 'allocated' | 'waitlisted';
  allocatedPreferenceRank?: number | null;
  waitlistRank?: number | null;
  prerequisiteOverrides: PrerequisiteOverride[];
}

export interface RadarSixMetrics {
  mathIntensity: number;         // 0-100
  codingLabLoad: number;         // 0-100
  cgpaScoringEase: number;       // 0-100
  placementDemand: number;       // 0-100
  researchRelevance: number;     // 0-100
  prerequisiteReadiness: number; // 0-100
}

export interface ElectiveCourseCatalogItem {
  courseCode: string;
  title: string;
  category: 'CORE_PREREQUISITE' | 'CORE_SEM5' | 'PROFESSIONAL_ELECTIVE' | 'GENERIC_ELECTIVE';
  basketId: string;
  electiveSlot: 'PE-I' | 'PE-II' | 'PE-III' | 'PE-IV' | 'GE-SEM5' | 'CORE';
  semester: number;
  ltp: string;
  lectureHours: number;
  tutorialHours: number;
  practicalHours: number;
  credits: number;
  seatCapacity: number;
  enrolledCount: number;
  waitlistCount: number;
  cutoffCgpaLastYear: number;
  liveCutoffCgpa?: number | null;
  industryPartner: IndustryPartner;
  prerequisites: string[];
  labTechStack: string[];
  syllabusTopics?: string[];
  syllabusKeywords: string[];
  clos: string[];
  difficultyIndex: number;
  weeklySelfEffortHours: number;
  assignedInstructor?: {
    name: string;
    employeeId: string;
    email?: string;
  };
  evaluationScheme: {
    mstWeight: number;
    estWeight: number;
    sessionalWeight: number;
  };
  historicalGradeDistribution: {
    grade: string;
    percentage: number;
  }[];
}

export interface ElectiveFocusBasketItem {
  basketId: string;
  basketNumber: number;
  name: string;
  collaboration: string;
  industryPartner: IndustryPartner;
  careerTracks: string[];
  keyPrerequisites: string[];
  electiveSequence: {
    'PE-I': string[];
    'PE-II': string[];
    'PE-III': string[];
    'PE-IV': string[];
  };
  seatCapacity: number;
  enrolledCount: number;
  waitlistCount: number;
  firstChoiceApplicants: number;
  topThreeApplicants: number;
  cutoffCgpaLastYear: number;
  liveCutoffCgpa?: number | null;
}

export interface ShapAttributionItem {
  feature: string;
  featureCode: string;
  studentValue: string;
  shapImpact: number;
  direction: 'positive' | 'negative';
  reason: string;
}

export interface TrajectoryCoursePreview {
  courseCode: string;
  title: string;
  semester: number;
  electiveSlot: 'PE-I' | 'PE-II' | 'PE-III' | 'PE-IV';
  ltp: string;
  credits: number;
  expectedGradePoint: number;
  expectedLetterGrade: string;
  predictionInterval90: { lowerGp: number; upperGp: number };
  expectedMarks: {
    mstOut30: number;
    estOut45: number;
    sessionalOut30: number;
    totalOut100: number;
  };
  expectedWeeklyWorkloadHours: number;
}

export interface ScoredBasketRecommendation {
  rank: number;
  basket: ElectiveFocusBasketItem;
  compositeMatchScore: number;
  scoreBreakdown: {
    careerAlignmentScore: number;
    cgpaBoostScore: number;
    syllabusMatchScore: number;
    workloadBalanceScore: number;
  };
  expectedBasketSgpa: number;
  expectedCgpaDelta: number;
  projectedCumulativeCgpa: number;
  avgWeeklyWorkloadHours: number;
  seatCompetition: {
    filledSeats: number;
    seatCapacity: number;
    estimatedCutoffCgpa: number;
    allotmentProbabilityPct: number;
    studentCgpaMargin: number;
    competitionStatus: 'HIGH_PROBABILITY' | 'MODERATE_COMPETITION' | 'WAITLIST_RISK';
  };
  trajectoryCourses: TrajectoryCoursePreview[];
  shapReasons: ShapAttributionItem[];
  radarMetrics: RadarSixMetrics;
  sourceMetadata?: MLSourceMetadata;
}

export interface ScoredCourseRecommendation {
  rank: number;
  course: ElectiveCourseCatalogItem;
  compositeMatchScore: number;
  expectedGradePoint: number;
  expectedLetterGrade: string;
  predictionInterval90: { lowerGp: number; upperGp: number };
  expectedMarks: {
    mstOut30: number;
    estOut45: number;
    sessionalOut30: number;
    totalOut100: number;
  };
  expectedWeeklyWorkloadHours: number;
  allotmentProbabilityPct: number;
  estimatedCutoffCgpa: number;
  shapReasons: ShapAttributionItem[];
  radarMetrics: RadarSixMetrics;
  sourceMetadata?: MLSourceMetadata;
}

export interface PeerSeniorRecord {
  studentId: string;
  rollNo: string;
  batchYear: number;
  similarityScorePct: number;
  cgpaSem4: number;
  avgElectiveSgpa: number;
  cgpaDelta: number;
  chosenBasketId: string;
  chosenBasketName: string;
  chosenGenericElective: string;
  preferredCareerTrack: string;
  placementTier: 'Super-Dream' | 'Dream' | 'Higher-Studies' | 'Core';
}

export interface PeerBasketDistItem {
  basketId: string;
  basketName: string;
  peerCount: number;
  percentage: number;
  avgPeerCgpaSem4: number;
  avgElectiveSgpa: number;
  avgCgpaDelta: number;
  placementOutcomes: Record<string, number>;
}

export interface PeerCohortAnalytics {
  cohortSize: number;
  avgPeerSimilarityPct: number;
  avgCohortCgpaSem4: number;
  avgCohortElectiveSgpa: number;
  avgCohortCgpaDelta: number;
  basketDistribution: PeerBasketDistItem[];
  placementSummary: { tier: string; count: number; percentage: number }[];
  closestSeniors: PeerSeniorRecord[];
  sourceMetadata?: MLSourceMetadata;
}

export interface AllocationRosterRow {
  meritRank: number;
  studentId: string;
  rollNumber: string;
  studentName: string;
  email: string;
  cgpa: number;
  tieBreakerCoreGpa: number;
  allocatedBasketId: string | null;
  allocatedBasketName: string | null;
  basketPreferenceRank: number | null;
  allocatedGenericCourseCode: string | null;
  allocatedGenericTitle: string | null;
  genericPreferenceRank: number | null;
  allocationStatus: 'allocated' | 'waitlisted';
  waitlistRank: number | null;
}

export interface BasketCutoffSummary {
  code: string;
  name: string;
  industryPartner: IndustryPartner;
  seatCapacity: number;
  enrolledCount: number;
  waitlistCount: number;
  openingCgpa: number | null;
  closingCutoffCgpa: number | null;
}

export interface AuditLogEntry {
  id: string;
  actorEmail: string;
  actorRole: InstitutionalRole | 'system';
  action: string;
  ipAddress: string;
  metadata: Record<string, unknown>;
  timestamp: string;
}

export interface CloudHealthStatus {
  atlasConnected: boolean;
  atlasLatencyMs: number;
  mlServiceReady: boolean;
  mlModelVersion: string;
  lastCheckedAt: string;
  mode: 'LIVE_CLOUD_API' | 'CLOUD_REPLICA_SYNC';
}

export interface AdvisorChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  referencedCodes?: string[];
}
