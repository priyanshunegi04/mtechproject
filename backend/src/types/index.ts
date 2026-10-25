/**
 * Thapar Institute of Engineering & Technology (TIET) — Core Domain Types
 */

export type InstitutionalRole = 'student' | 'faculty_advisor' | 'dean_admin';

export type ThaparGrade = 'A+' | 'A' | 'A-' | 'B' | 'B-' | 'C' | 'C-' | 'E' | 'F';

export const THAPAR_GRADE_POINTS: Record<ThaparGrade, number> = {
  'A+': 10,
  'A': 10,
  'A-': 9,
  'B': 8,
  'B-': 7,
  'C': 6,
  'C-': 5,
  'E': 2,
  'F': 0,
};

export type ElectiveSlotType =
  | 'ELECTIVE_I_SEM5'
  | 'GENERIC_ELECTIVE_SEM5'
  | 'ELECTIVE_II_SEM6'
  | 'ELECTIVE_III_SEM6'
  | 'ELECTIVE_IV_SEM7';

