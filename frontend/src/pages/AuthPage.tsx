import React, { useState } from 'react';
import {
  AlertCircle,
  BookOpen,
  Building2,
  CheckCircle2,
  GraduationCap,
  KeyRound,
  Mail,
  Phone,
  ShieldCheck,
  Sparkles,
  UserCheck,
  UserPlus,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const AuthPage: React.FC<{ isModal?: boolean; onClose?: () => void }> = ({
  isModal = false,
  onClose,
}) => {
  const {
    loginWithCredentials,
    registerNewUser,
    switchPersona,
    personas,
    baskets,
    setShowAuthModal,
  } = useApp();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [role, setRole] = useState<'student' | 'faculty_advisor'>('student');

  // Sign In fields
  const [signInEmail, setSignInEmail] = useState<string>('aarav.sharma_be24@thapar.edu');
  const [signInPassword, setSignInPassword] = useState<string>('Thapar@2026');

  // Sign Up fields
  const [fullName, setFullName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('Thapar@2026');
  const [contactNumber, setContactNumber] = useState<string>('+91-9876543210');

  // Student-specific fields
  const [rollNumber, setRollNumber] = useState<string>('102403188');
  const [batchYear, setBatchYear] = useState<number>(2024);
  const [currentSemester, setCurrentSemester] = useState<number>(4);
  const [cgpa, setCgpa] = useState<number>(8.45);

  // Teacher-specific fields
  const [employeeId, setEmployeeId] = useState<string>('EMP_CSED_212');
  const [department, setDepartment] = useState<string>('CSED');
  const [designation, setDesignation] = useState<string>('Associate Professor');
  const [primarySpecializationBasket, setPrimarySpecializationBasket] =
    useState<string>('EF_BASKET_05');

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!signInEmail.trim().toLowerCase().endsWith('@thapar.edu')) {
      setErrorMsg('Please enter an institutional @thapar.edu email address.');
      return;
    }

    setIsSubmitting(true);
    const res = await loginWithCredentials(signInEmail, signInPassword);
    setIsSubmitting(false);

    if (!res.success) {
      setErrorMsg(res.error || 'Authentication failed.');
    } else {
      setSuccessMsg('Signed in to ThaparElectiveAI Portal!');
      if (onClose) onClose();
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
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

    setIsSubmitting(true);
    const res = await registerNewUser({
      name: fullName.trim(),
      email: email.trim().toLowerCase(),
      password,
      contactNumber: contactNumber.trim() || '+91-9876543210',
      role,
      rollNumber: role === 'student' ? rollNumber.trim() : undefined,
      batchYear: role === 'student' ? batchYear : undefined,
      currentSemester: role === 'student' ? currentSemester : undefined,
      cgpa: role === 'student' ? cgpa : undefined,
      employeeId: role === 'faculty_advisor' ? employeeId.trim() : undefined,
      department: role === 'faculty_advisor' ? department.trim() : 'CSED',
      designation: role === 'faculty_advisor' ? designation.trim() : undefined,
      primarySpecializationBasket:
        role === 'faculty_advisor' ? primarySpecializationBasket : undefined,
    });
    setIsSubmitting(false);

    if (!res.success) {
      setErrorMsg(res.error || 'Registration failed.');
    } else {
      setSuccessMsg('Institutional account created and signed in!');
      if (onClose) onClose();
    }
  };

  const handleInstantDemoLogin = async (personaKey: string) => {
    setErrorMsg(null);
    await switchPersona(personaKey);
    setShowAuthModal(false);
    if (onClose) onClose();
  };

  const cardContent = (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden">
      {/* Institutional Crimson Header */}
      <div className="bg-gradient-to-r from-[#8B1E24] via-[#70161B] to-[#0F172A] text-white p-6 relative">
        {(isModal || onClose) && (
          <button
            onClick={() => {
              setShowAuthModal(false);
              if (onClose) onClose();
            }}
            className="absolute top-4 right-4 p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition"
            aria-label="Close portal dialog"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-white/15 border border-white/25 flex items-center justify-center shadow-md">
            <GraduationCap className="w-7 h-7 text-amber-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold tracking-tight">
                Thapar<span className="text-amber-300">ElectiveAI</span> Institutional Portal
              </h2>
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-white/15 border border-white/20">
                CSED 2026
              </span>
            </div>
            <p className="text-xs text-white/80 mt-0.5">
              Role-Separated Academic Counseling • Student Workspace &amp; Faculty Advisor Portal
            </p>
          </div>
        </div>

        {/* Sign In / Sign Up Mode Tabs */}
        <div className="mt-5 grid grid-cols-2 gap-2 bg-black/25 p-1 rounded-xl border border-white/10">
          <button
            type="button"
            onClick={() => {
              setMode('signin');
              setErrorMsg(null);
            }}
            className={`py-2 px-4 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition ${
              mode === 'signin'
                ? 'bg-white text-[#8B1E24] shadow-sm'
                : 'text-white/80 hover:text-white'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            Sign In to Portal
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setErrorMsg(null);
            }}
            className={`py-2 px-4 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition ${
              mode === 'signup'
                ? 'bg-white text-[#8B1E24] shadow-sm'
                : 'text-white/80 hover:text-white'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            Sign Up (Student / Teacher)
          </button>
        </div>
      </div>

      <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
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

        {mode === 'signin' ? (
          <form onSubmit={handleSignIn} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Institutional Email (@thapar.edu)
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="email"
                  required
                  value={signInEmail}
                  onChange={(e) => setSignInEmail(e.target.value)}
                  placeholder="username@thapar.edu"
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#8B1E24]"
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
                  value={signInPassword}
                  onChange={(e) => setSignInPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#8B1E24]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 rounded-xl bg-[#8B1E24] hover:bg-[#70161B] text-white text-xs font-bold shadow-md transition disabled:opacity-50"
            >
              {isSubmitting ? 'Authenticating...' : 'Sign In to Institutional Workspace'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleSignUp} className="space-y-4">
            {/* Role Picker */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Select Institutional Portal Role
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole('student')}
                  className={`p-3 rounded-xl border text-left transition flex items-start gap-2.5 ${
                    role === 'student'
                      ? 'border-[#8B1E24] bg-[#8B1E24]/10 dark:bg-rose-950/30 text-slate-900 dark:text-white'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <GraduationCap className="w-5 h-5 text-[#8B1E24] dark:text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-bold">Student</div>
                    <div className="text-[11px] opacity-80">
                      AI Basket Studio, Roadmap, Skill Test &amp; Grades
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setRole('faculty_advisor')}
                  className={`p-3 rounded-xl border text-left transition flex items-start gap-2.5 ${
                    role === 'faculty_advisor'
                      ? 'border-[#8B1E24] bg-[#8B1E24]/10 dark:bg-rose-950/30 text-slate-900 dark:text-white'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <BookOpen className="w-5 h-5 text-[#8B1E24] dark:text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-bold">Teacher (Faculty)</div>
                    <div className="text-[11px] opacity-80">
                      Course &amp; Syllabus Editor, Mentee Approvals
                    </div>
                  </div>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder={role === 'student' ? 'e.g. Kabir Gill' : 'e.g. Dr. Simranpreet Kaur'}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Institutional Email (@thapar.edu) *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={
                    role === 'student' ? 'kgill_be24@thapar.edu' : 'simranpreet.kaur@thapar.edu'
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Password (min 8 chars) *
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
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
                    className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {role === 'student' ? (
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                    TIET Roll Number
                  </label>
                  <input
                    type="text"
                    required
                    value={rollNumber}
                    onChange={(e) => setRollNumber(e.target.value)}
                    placeholder="102403188"
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
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                      <option key={sem} value={sem}>
                        Semester {sem}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Current CGPA
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
            ) : (
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Employee ID
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
                    <option value="Senior Faculty Advisor">Senior Faculty Advisor</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Primary Specialization Basket
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
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 rounded-xl bg-[#8B1E24] hover:bg-[#70161B] text-white text-xs font-bold shadow-md transition disabled:opacity-50"
            >
              {isSubmitting
                ? 'Creating Institutional Account...'
                : `Create ${role === 'student' ? 'Student' : 'Faculty Advisor'} Account & Enter Portal`}
            </button>
          </form>
        )}

        {/* 1-Click Instant Demo Login Section */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-2.5">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
              <Sparkles className="w-3.5 h-3.5" />
              1-Click Instant Demo Login (Evaluation Personas)
            </span>
            <span className="text-[10px] text-slate-500">Zero manual entry required</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {personas.slice(0, 6).map((p) => (
              <button
                key={p.personaKey}
                type="button"
                onClick={() => handleInstantDemoLogin(p.personaKey)}
                className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700/80 hover:border-[#8B1E24] dark:hover:border-rose-500 bg-slate-50/70 dark:bg-slate-800/70 hover:bg-[#8B1E24]/5 transition text-left flex flex-col justify-between"
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {p.name}
                  </span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                      p.role === 'student'
                        ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                        : p.role === 'faculty_advisor'
                          ? 'bg-sky-500/15 text-sky-700 dark:text-sky-300'
                          : 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                    }`}
                  >
                    {p.role === 'student'
                      ? 'Student'
                      : p.role === 'faculty_advisor'
                        ? 'Teacher'
                        : 'Dean'}
                  </span>
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 truncate">
                  {p.subtitle}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs">
        {cardContent}
      </div>
    );
  }

  return (
    <div className="min-h-[82vh] flex items-center justify-center p-4">
      {cardContent}
    </div>
  );
};

export default AuthPage;
