import dns from 'dns';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';
import { TeacherProfile, User } from '../models';

// Configure public DNS fallback for MongoDB Atlas SRV resolution on Windows
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch {
  // Ignore in restricted environments
}

dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

export async function runCollectionMigration(): Promise<{
  migratedTeachersCount: number;
  migratedTeacherNames: string[];
  cleanedStudentsCount: number;
}> {
  const mongoUri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB_NAME || 'thapar_elective_ai';

  if (!mongoUri) {
    throw new Error('MONGODB_URI environment variable is not set.');
  }

  const shouldCloseConnection = mongoose.connection.readyState === 0;
  if (shouldCloseConnection) {
    await mongoose.connect(mongoUri.trim(), {
      dbName,
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
    });
  }

  const db = mongoose.connection.db;
  if (!db) {
    throw new Error('MongoDB database handle is not available.');
  }

  const usersColl = db.collection('users');
  const teacherProfilesColl = db.collection('teacher_profiles');

  // 1. Find all faculty_advisor / dean_admin documents currently stored in `users` (e.g. "sujata kaur")
  const facultyInUsers = await usersColl
    .find({
      role: { $in: ['faculty_advisor', 'dean_admin'] },
    })
    .toArray();

  const migratedTeacherNames: string[] = [];

  for (const rawDoc of facultyInUsers) {
    const cleanEmail = String(rawDoc.email || '').trim().toLowerCase();
    if (!cleanEmail) continue;

    const basketStr = String(rawDoc.primarySpecializationBasket || 'EF_BASKET_05');
    const basketNumMatch = basketStr.match(/\d+/);
    const assignedBasketId =
      typeof rawDoc.assignedBasketId === 'number'
        ? rawDoc.assignedBasketId
        : basketNumMatch
          ? parseInt(basketNumMatch[0], 10)
          : 5;

    const fallbackEmployeeId =
      rawDoc.employeeId && String(rawDoc.employeeId).trim()
        ? String(rawDoc.employeeId).trim()
        : `FAC-CSED-${String(rawDoc._id).slice(-4).toUpperCase()}`;

    const teacherDoc = {
      name: String(rawDoc.name || 'Faculty Advisor').trim(),
      email: cleanEmail,
      passwordHash: String(rawDoc.passwordHash || ''),
      role: (rawDoc.role === 'dean_admin' ? 'dean_admin' : 'faculty_advisor') as
        | 'faculty_advisor'
        | 'dean_admin',
      contactNumber: String(rawDoc.contactNumber || '+91-9876543210').trim(),
      employeeId: fallbackEmployeeId,
      designation:
        rawDoc.designation && rawDoc.designation !== 'Student'
          ? String(rawDoc.designation).trim()
          : 'Associate Professor',
      department: String(rawDoc.department || 'CSED').trim(),
      officeRoom: String(rawDoc.officeRoom || 'CSED Block-B Room 304').trim(),
      primarySpecializationBasket: basketStr,
      assignedBasketId,
      assignedBasketName: String(
        rawDoc.assignedBasketName || 'Artificial Intelligence and Machine Learning (AIML)'
      ).trim(),
      specializationArea: String(
        rawDoc.specializationArea || 'Artificial Intelligence & Machine Learning'
      ).trim(),
      assignedCourses: Array.isArray(rawDoc.assignedCourses) ? rawDoc.assignedCourses : [],
      assignedMentees: Array.isArray(rawDoc.assignedMentees) ? rawDoc.assignedMentees : [],
      ...(rawDoc.personaKey ? { personaKey: String(rawDoc.personaKey) } : {}),
      createdAt: rawDoc.createdAt || new Date(),
      updatedAt: new Date(),
    };

    // Upsert into `teacher_profiles` while preserving _id if possible or matching by email
    await teacherProfilesColl.updateOne(
      { email: cleanEmail },
      {
        $set: teacherDoc,
        $unset: {
          rollNumber: '',
          cgpa: '',
          currentSemester: '',
          batchYear: '',
          coreGrades: '',
          sgpaHistory: '',
          codingProfileScore: '',
          mathAptitudeScore: '',
          rankedBasketPreferences: '',
          rankedGenericPreferences: '',
          preferenceWeights: '',
          allocationStatus: '',
          allocatedBasketId: '',
          allocatedGenericCourseCode: '',
          skillAssessment: '',
          advisorReview: '',
        },
      },
      { upsert: true }
    );

    // Remove the migrated teacher document from `users`
    await usersColl.deleteOne({ _id: rawDoc._id });
    migratedTeacherNames.push(`${teacherDoc.name} (${cleanEmail})`);
  }

  // Also ensure any existing documents in `teacher_profiles` have zero student fields and have required auth fields
  await teacherProfilesColl.updateMany(
    {},
    {
      $unset: {
        rollNumber: '',
        cgpa: '',
        currentSemester: '',
        batchYear: '',
        coreGrades: '',
        sgpaHistory: '',
        codingProfileScore: '',
        mathAptitudeScore: '',
        rankedBasketPreferences: '',
        rankedGenericPreferences: '',
        preferenceWeights: '',
        allocationStatus: '',
        allocatedBasketId: '',
        allocatedGenericCourseCode: '',
        skillAssessment: '',
        advisorReview: '',
      },
    }
  );

  // 2. Clean all student documents in `users` (e.g. "Priyanshu"):
  //    - Set role: "student" and designation: "Student"
  //    - Remove teacher fields: officeRoom, assignedBasketId, assignedBasketName, primarySpecializationBasket, specializationArea, employeeId
  const studentUpdateResult = await usersColl.updateMany(
    { role: { $nin: ['faculty_advisor', 'dean_admin'] } },
    {
      $set: {
        role: 'student',
        designation: 'Student',
      },
      $unset: {
        officeRoom: '',
        assignedBasketId: '',
        assignedBasketName: '',
        primarySpecializationBasket: '',
        specializationArea: '',
        employeeId: '',
      },
    }
  );

  // Sync indexes on both models
  try {
    await User.syncIndexes();
    await TeacherProfile.syncIndexes();
  } catch (idxErr) {
    console.warn('[fixCollections] Index sync warning:', (idxErr as Error).message);
  }

  const result = {
    migratedTeachersCount: migratedTeacherNames.length,
    migratedTeacherNames,
    cleanedStudentsCount: studentUpdateResult.modifiedCount,
  };

  if (shouldCloseConnection) {
    await mongoose.disconnect();
  }

  return result;
}

if (require.main === module) {
  runCollectionMigration()
    .then((res) => {
      console.log('==============================================================');
      console.log('MongoDB Atlas Collection Separation & Cleanup Complete');
      console.log(`- Migrated Teachers to teacher_profiles: ${res.migratedTeachersCount}`);
      if (res.migratedTeacherNames.length > 0) {
        console.log(`  -> ${res.migratedTeacherNames.join(', ')}`);
      }
      console.log(`- Cleaned Student Documents in users:    ${res.cleanedStudentsCount}`);
      console.log('==============================================================');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Migration failed:', err);
      process.exit(1);
    });
}
