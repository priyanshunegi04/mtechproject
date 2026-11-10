import React, { useState } from 'react';
import {
  AlertCircle,
  BookOpen,
  Building2,
  CheckCircle2,
  GraduationCap,
  KeyRound,
  Mail,
  Moon,
  Phone,
  ShieldCheck,
  Sun,
  UserPlus,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';

export const LoginPage: React.FC = () => {
  const { darkMode, toggleDarkMode } = useApp();
  const { login } = useAuth();
  const navigate = useNavigate();

  const [roleTab, setRoleTab] = useState<'student' | 'faculty_advisor'>('student');
  const [email, setEmail] = useState<string>('aarav.sharma_be24@thapar.edu');
  const [password, setPassword] = useState<string>('Thapar@2026');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleRoleTabSwitch = (nextRole: 'student' | 'faculty_advisor') => {
    setRoleTab(nextRole);
    setErrorMsg(null);
    if (nextRole === 'student') {
      setEmail('aarav.sharma_be24@thapar.edu');
    } else {
      setEmail('rajesh.kumar@thapar.edu');
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!email.trim()) {
      setErrorMsg('Please enter your institutional email address.');
      return;
    }

    setIsSubmitting(true);
    const res = await login(email, password, roleTab);
    setIsSubmitting(false);

    if (!res.success) {
      setErrorMsg(res.error || 'Authentication failed.');
      return;
    }

    if (res.role === 'faculty_advisor' || res.role === 'dean_admin') {
      navigate('/faculty/dashboard', { replace: true });
    } else {
      navigate('/student/dashboard', { replace: true });
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Top Institutional Banner */}
      <div className="bg-gradient-to-r from-[#8B1E24] via-[#70161B] to-[#0F172A] text-white px-4 lg:px-8 py-2.5 text-xs">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-300" />
            <span className="font-bold tracking-wide uppercase">
              Thapar Institute of Engineering &amp; Technology (TIET) • CSED Portal
            </span>
          </div>
          <button
            onClick={toggleDarkMode}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[11px]"
          >
            {darkMode ? <Sun className="w-3.5 h-3.5 text-amber-300" /> : <Moon className="w-3.5 h-3.5" />}
            <span>{darkMode ? 'Light' : 'Dark'}</span>
          </button>
        </div>
      </div>

      {/* Centered Login Card */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
          <div className="bg-gradient-to-r from-[#8B1E24] via-[#70161B] to-[#0F172A] text-white p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white/15 border border-white/25 flex items-center justify-center shadow-md">
                <GraduationCap className="w-7 h-7 text-amber-300" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight">
                  Thapar<span className="text-amber-300">ElectiveAI</span>
                </h1>
                <p className="text-xs text-white/80">
                  Institutional Authentication • B.E. CSE 2026 Scheme
                </p>
              </div>
            </div>

            {/* Role Selector Tabs: Student Login vs. Faculty / Teacher Login */}
            <div className="mt-5 grid grid-cols-2 gap-2 bg-black/30 p-1 rounded-xl border border-white/10">
              <button
                type="button"
                onClick={() => handleRoleTabSwitch('student')}
                className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                  roleTab === 'student'
                    ? 'bg-white text-[#8B1E24] shadow-sm'
                    : 'text-white/80 hover:text-white'
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5" />
                Student Login
              </button>
              <button
                type="button"
                onClick={() => handleRoleTabSwitch('faculty_advisor')}
                className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                  roleTab === 'faculty_advisor'
                    ? 'bg-white text-[#8B1E24] shadow-sm'
                    : 'text-white/80 hover:text-white'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                Faculty / Teacher Login
              </button>
            </div>
          </div>

          <form onSubmit={handleLoginSubmit} className="p-6 space-y-4">
            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {roleTab === 'student'
                  ? 'Student Email (@thapar.edu) or Roll Number'
                  : 'Faculty Email (@thapar.edu) or Employee ID'}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={
                    roleTab === 'student'
                      ? 'student_be24@thapar.edu or 102403012'
                      : 'faculty@thapar.edu or FAC-CSED-104'
                  }
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#8B1E24]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Password
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#8B1E24]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 rounded-xl bg-[#8B1E24] hover:bg-[#70161B] text-white text-xs font-bold shadow-md transition disabled:opacity-50"
            >
              {isSubmitting
                ? 'Authenticating via JWT...'
                : roleTab === 'student'
                  ? 'Sign In to Student Dashboard'
                  : 'Sign In to Faculty Dashboard'}
            </button>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 text-center text-xs text-slate-600 dark:text-slate-400">
              Don&apos;t have an account?{' '}
              <Link
                to="/signup"
                className="font-bold text-[#8B1E24] dark:text-rose-400 hover:underline"
              >
                Sign up here
              </Link>
            </div>
          </form>
        </div>
      </div>

      <footer className="py-4 text-center text-xs text-slate-500">
        Thapar Institute of Engineering &amp; Technology (TIET) • Computer Science &amp; Engineering Department
      </footer>
    </div>
  );
};

const CORE_SUBJECT_DEFAULTS: { code: string; title: string; defaultGp: number }[] = [
  { code: 'UES103', title: 'Programming for Problem Solving', defaultGp: 9 },
  { code: 'UMA022', title: 'Calculus for Engineers', defaultGp: 9 },
  { code: 'UMA023', title: 'Linear Algebra & Diff Eq', defaultGp: 9 },
  { code: 'UCS301', title: 'Data Structures', defaultGp: 10 },
  { code: 'UCS303', title: 'Operating Systems', defaultGp: 9 },
  { code: 'UTA018', title: 'Object Oriented Programming', defaultGp: 9 },
  { code: 'UCS405', title: 'Discrete Math Structures', defaultGp: 9 },
  { code: 'UMA021', title: 'Numerical Linear Algebra', defaultGp: 10 },
  { code: 'UCS415', title: 'Design & Analysis of Algorithms', defaultGp: 10 },
  { code: 'UCS310', title: 'Database Management Systems', defaultGp: 9 },
  { code: 'UCS414', title: 'Computer Networks', defaultGp: 8 },
  { code: 'UCS321', title: 'AI for Engineers', defaultGp: 10 },
  { code: 'UMA401', title: 'Probability & Statistics', defaultGp: 9 },
];

export const SignupPage: React.FC = () => {
  const { baskets, darkMode, toggleDarkMode } = useApp();
  const { signup } = useAuth();
  const navigate = useNavigate();

  const [role, setRole] = useState<'student' | 'faculty_advisor'>('student');
  const [fullName, setFullName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [contactNumber, setContactNumber] = useState<string>('+91-9876543210');

  // Student fields
  const [rollNumber, setRollNumber] = useState<string>('102403012');
  const [batchYear, setBatchYear] = useState<number>(2024);
  const [currentSemester, setCurrentSemester] = useState<number>(4);
  const [cgpa, setCgpa] = useState<number>(9.12);
  const [coreGrades, setCoreGrades] = useState<Record<string, number>>(() => {
    const map: Record<string, number> = {};
    CORE_SUBJECT_DEFAULTS.forEach((s) => {
      map[s.code] = s.defaultGp;
    });
    return map;
  });

  // Faculty fields
  const [employeeId, setEmployeeId] = useState<string>('FAC-CSED-104');
  const [department, setDepartment] = useState<string>('CSED');
  const [designation, setDesignation] = useState<string>('Associate Professor');
  const [officeRoom, setOfficeRoom] = useState<string>('CSED Block-B Room 304');
  const [specializationArea, setSpecializationArea] = useState<string>(
    'Artificial Intelligence & Machine Learning'
  );
  const [primarySpecializationBasket, setPrimarySpecializationBasket] =
    useState<string>('EF_BASKET_05');

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!fullName.trim() || fullName.trim().length < 2) {
      setErrorMsg('Please enter your full name.');
      return;
    }
    if (!/^[a-zA-Z0-9._%+-]+@thapar\.edu$/i.test(email.trim())) {
      setErrorMsg('Institutional email must belong to the @thapar.edu domain.');
      return;
    }
    if (password.length < 8) {
      setErrorMsg('Password must be at least 8 characters long.');
      return;
    }

    const chosenBasketObj = baskets.find((b) => b.basketId === primarySpecializationBasket);
    const basketNum = chosenBasketObj?.basketNumber || 5;

    setIsSubmitting(true);
    const res = await signup({
      name: fullName.trim(),
      email: email.trim().toLowerCase(),
      password,
      contactNumber: contactNumber.trim() || '+91-9876543210',
      role,
      rollNumber: role === 'student' ? rollNumber.trim() : undefined,
      batchYear: role === 'student' ? batchYear : undefined,
      currentSemester: role === 'student' ? currentSemester : undefined,
      cgpa: role === 'student' ? cgpa : undefined,
      coreGrades: role === 'student' ? coreGrades : undefined,
      employeeId: role === 'faculty_advisor' ? employeeId.trim() : undefined,
      department: role === 'faculty_advisor' ? department.trim() : 'CSED',
      designation: role === 'faculty_advisor' ? designation.trim() : undefined,
      primarySpecializationBasket:
        role === 'faculty_advisor' ? primarySpecializationBasket : undefined,
      assignedBasketId: role === 'faculty_advisor' ? basketNum : undefined,
      assignedBasketName:
        role === 'faculty_advisor' ? chosenBasketObj?.name || 'AIML' : undefined,
      officeRoom: role === 'faculty_advisor' ? officeRoom.trim() : undefined,
      specializationArea: role === 'faculty_advisor' ? specializationArea.trim() : undefined,
    });
    setIsSubmitting(false);

    if (!res.success) {
      setErrorMsg(res.error || 'Registration failed.');
      return;
    }

    setSuccessMsg('Account created! Redirecting to your dashboard...');
    if (role === 'faculty_advisor') {
      navigate('/faculty/dashboard', { replace: true });
    } else {
      navigate('/student/dashboard', { replace: true });
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Top Institutional Banner */}
      <div className="bg-gradient-to-r from-[#8B1E24] via-[#70161B] to-[#0F172A] text-white px-4 lg:px-8 py-2.5 text-xs">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-300" />
            <span className="font-bold tracking-wide uppercase">
              Thapar Institute of Engineering &amp; Technology (TIET) • Institutional Registration
            </span>
          </div>
          <button
            onClick={toggleDarkMode}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[11px]"
          >
            {darkMode ? <Sun className="w-3.5 h-3.5 text-amber-300" /> : <Moon className="w-3.5 h-3.5" />}
            <span>{darkMode ? 'Light' : 'Dark'}</span>
          </button>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-4 py-8">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden">
          <div className="bg-gradient-to-r from-[#8B1E24] via-[#70161B] to-[#0F172A] text-white p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white/15 border border-white/25 flex items-center justify-center shadow-md">
                <UserPlus className="w-6 h-6 text-amber-300" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight">
                  Create Your <span className="text-amber-300">ThaparElectiveAI</span> Account
                </h1>
                <p className="text-xs text-white/80">
                  Register with your @thapar.edu credentials for isolated role-based access
                </p>
              </div>
            </div>

            {/* Role Selector Tabs: Register as Student vs. Register as Faculty / Instructor */}
            <div className="mt-5 grid grid-cols-2 gap-2 bg-black/30 p-1 rounded-xl border border-white/10">
              <button
                type="button"
                onClick={() => {
                  setRole('student');
                  setErrorMsg(null);
                }}
                className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition ${
                  role === 'student'
                    ? 'bg-white text-[#8B1E24] shadow-sm'
                    : 'text-white/80 hover:text-white'
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5" />
                Register as Student
              </button>
              <button
                type="button"
                onClick={() => {
                  setRole('faculty_advisor');
                  setErrorMsg(null);
                }}
                className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition ${
                  role === 'faculty_advisor'
                    ? 'bg-white text-[#8B1E24] shadow-sm'
                    : 'text-white/80 hover:text-white'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                Register as Faculty / Instructor
              </button>
            </div>
          </div>

          <form onSubmit={handleSignupSubmit} className="p-6 space-y-4">
            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder={role === 'student' ? 'e.g. Kabir Gill' : 'e.g. Dr. Simranpreet Kaur'}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {role === 'student'
                    ? 'Thapar Student Email (@thapar.edu) *'
                    : 'Faculty Email (@thapar.edu) *'}
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={
                    role === 'student' ? 'kgill_be24@thapar.edu' : 'simranpreet.kaur@thapar.edu'
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Password (min 8 chars) *
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Contact Number *
                </label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={contactNumber}
                    onChange={(e) => setContactNumber(e.target.value)}
                    placeholder="+91-9876543210"
                    className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono"
                  />
                </div>
              </div>
            </div>

            {role === 'student' ? (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                      Roll Number *
                    </label>
                    <input
                      type="text"
                      required
                      value={rollNumber}
                      onChange={(e) => setRollNumber(e.target.value)}
                      placeholder="102403012"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                      Batch Year
                    </label>
                    <input
                      type="number"
                      min={2020}
                      max={2030}
                      value={batchYear}
                      onChange={(e) => setBatchYear(Number(e.target.value) || 2024)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                      Current Semester
                    </label>
                    <select
                      value={currentSemester}
                      onChange={(e) => setCurrentSemester(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                        <option key={s} value={s}>
                          Semester {s}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                      Initial CGPA
                    </label>
                    <input
                      type="number"
                      step={0.05}
                      min={4.0}
                      max={10.0}
                      value={cgpa}
                      onChange={(e) => setCgpa(parseFloat(e.target.value) || 8.0)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono"
                    />
                  </div>
                </div>

                {/* Initial Core Subject Grade Entry */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Initial Semesters I–IV Core Subject Grades (Editable anytime in Profile)
                    </span>
                    <span className="text-[10px] text-slate-500">10=A/A+, 9=A-, 8=B, 7=B-, 6=C</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-40 overflow-y-auto pr-1">
                    {CORE_SUBJECT_DEFAULTS.map((sub) => (
                      <div
                        key={sub.code}
                        className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-1"
                      >
                        <div className="truncate">
                          <div className="font-mono text-[11px] font-bold text-[#8B1E24] dark:text-rose-400">
                            {sub.code}
                          </div>
                          <div className="text-[10px] text-slate-500 truncate">{sub.title}</div>
                        </div>
                        <select
                          value={coreGrades[sub.code] ?? 8}
                          onChange={(e) =>
                            setCoreGrades((prev) => ({
                              ...prev,
                              [sub.code]: Number(e.target.value),
                            }))
                          }
                          className="px-1.5 py-1 rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[11px] font-mono font-bold"
                        >
                          {[10, 9, 8, 7, 6, 5].map((gp) => (
                            <option key={gp} value={gp}>
                              {gp}
                            </option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Employee ID *
                  </label>
                  <input
                    type="text"
                    required
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                    placeholder="EMP_CSED_212"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Department
                  </label>
                  <div className="relative">
                    <Building2 className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
                    <input
                      type="text"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full pl-8 pr-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Designation
                  </label>
                  <select
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                  >
                    <option value="Assistant Professor">Assistant Professor</option>
                    <option value="Associate Professor">Associate Professor</option>
                    <option value="Professor">Professor</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Primary Specialization Basket (1–12)
                  </label>
                  <select
                    value={primarySpecializationBasket}
                    onChange={(e) => setPrimarySpecializationBasket(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                  >
                    {baskets.map((b) => (
                      <option key={b.basketId} value={b.basketId}>
                        {b.basketId}: {b.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Office Room
                  </label>
                  <input
                    type="text"
                    value={officeRoom}
                    onChange={(e) => setOfficeRoom(e.target.value)}
                    placeholder="CSED Block-B Room 304"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Specialization Area
                  </label>
                  <input
                    type="text"
                    value={specializationArea}
                    onChange={(e) => setSpecializationArea(e.target.value)}
                    placeholder="Artificial Intelligence & Machine Learning"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 rounded-xl bg-[#8B1E24] hover:bg-[#70161B] text-white text-xs font-bold shadow-md transition disabled:opacity-50"
            >
              {isSubmitting
                ? 'Registering in MongoDB Atlas...'
                : role === 'student'
                  ? 'Complete Student Registration & Go to Dashboard'
                  : 'Complete Faculty Registration & Go to Workspace'}
            </button>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 text-center text-xs text-slate-600 dark:text-slate-400">
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-bold text-[#8B1E24] dark:text-rose-400 hover:underline"
              >
                Log in here
              </Link>
            </div>
          </form>
        </div>
      </div>

      <footer className="py-4 text-center text-xs text-slate-500">
        Thapar Institute of Engineering &amp; Technology (TIET) • Computer Science &amp; Engineering Department
      </footer>
    </div>
  );
};

export const AuthPage: React.FC = () => <LoginPage />;
export default AuthPage;
