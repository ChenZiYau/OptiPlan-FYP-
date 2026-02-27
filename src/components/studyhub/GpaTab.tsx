import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, Target, Plus, Trash2, AlertTriangle } from 'lucide-react';
import { HoverTip } from '@/components/HoverTip';

// ── Types ────────────────────────────────────────────────────────────────────

interface GpaAssessment {
  id: string;
  name: string;
  weight: number;
  score: number;
}

interface GpaSubject {
  id: string;
  name: string;
  creditHours: number;
  targetGrade: number;
  assessments: GpaAssessment[];
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function calculateRequiredScore(assessments: GpaAssessment[], target: number) {
  const completedWeight = assessments.reduce((s, a) => s + a.weight, 0);
  const earnedPoints = assessments.reduce((s, a) => s + (a.score * a.weight) / 100, 0);
  const remainingWeight = 100 - completedWeight;
  const currentGrade = completedWeight > 0 ? (earnedPoints / completedWeight) * 100 : 0;

  if (remainingWeight <= 0) {
    return { currentGrade, requiredScore: null, remainingWeight: 0, impossible: false };
  }

  const needed = ((target - earnedPoints) / remainingWeight) * 100;
  return { currentGrade, requiredScore: needed, remainingWeight, impossible: needed > 100 };
}

function gradeFromPct(pct: number): string {
  if (pct >= 93) return 'A';
  if (pct >= 90) return 'A-';
  if (pct >= 87) return 'B+';
  if (pct >= 83) return 'B';
  if (pct >= 80) return 'B-';
  if (pct >= 77) return 'C+';
  if (pct >= 73) return 'C';
  if (pct >= 70) return 'C-';
  if (pct >= 67) return 'D+';
  if (pct >= 60) return 'D';
  return 'F';
}

function pctToGpa(pct: number): number {
  if (pct >= 93) return 4.0;
  if (pct >= 90) return 3.7;
  if (pct >= 87) return 3.3;
  if (pct >= 83) return 3.0;
  if (pct >= 80) return 2.7;
  if (pct >= 77) return 2.3;
  if (pct >= 73) return 2.0;
  if (pct >= 70) return 1.7;
  if (pct >= 67) return 1.3;
  if (pct >= 60) return 1.0;
  return 0.0;
}

// ── Component ────────────────────────────────────────────────────────────────

export function GpaTab() {
  const [subjects, setSubjects] = useState<GpaSubject[]>([]);
  const [targetGpa, setTargetGpa] = useState('3.50');
  const [addingAssessmentFor, setAddingAssessmentFor] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [newWeight, setNewWeight] = useState('');
  const [newScore, setNewScore] = useState('');
  const [showAddSubject, setShowAddSubject] = useState(false);
  const [newSubName, setNewSubName] = useState('');
  const [newSubCredits, setNewSubCredits] = useState('3');
  const [newSubTarget, setNewSubTarget] = useState('90');

  const totalCredits = subjects.reduce((s, sub) => s + sub.creditHours, 0);
  const weightedSum = subjects.reduce((s, sub) => {
    const calc = calculateRequiredScore(sub.assessments, sub.targetGrade);
    return s + pctToGpa(calc.currentGrade) * sub.creditHours;
  }, 0);
  const currentGpa = totalCredits > 0 ? weightedSum / totalCredits : 0;

  function addAssessment(subjectId: string) {
    const name = newName.trim();
    const weight = parseFloat(newWeight);
    const score = parseFloat(newScore);
    if (!name || isNaN(weight) || isNaN(score) || weight <= 0 || weight > 100 || score < 0 || score > 100) return;
    setSubjects(prev => prev.map(sub => {
      if (sub.id !== subjectId) return sub;
      return { ...sub, assessments: [...sub.assessments, { id: `a${Date.now()}`, name, weight, score }] };
    }));
    setAddingAssessmentFor(null);
    setNewName('');
    setNewWeight('');
    setNewScore('');
  }

  function removeAssessment(subjectId: string, assessmentId: string) {
    setSubjects(prev => prev.map(sub => {
      if (sub.id !== subjectId) return sub;
      return { ...sub, assessments: sub.assessments.filter(a => a.id !== assessmentId) };
    }));
  }

  function updateTargetGrade(subjectId: string, value: string) {
    const v = parseFloat(value);
    if (isNaN(v)) return;
    setSubjects(prev => prev.map(sub =>
      sub.id === subjectId ? { ...sub, targetGrade: Math.min(100, Math.max(0, v)) } : sub
    ));
  }

  function addSubject() {
    const name = newSubName.trim();
    if (!name) return;
    setSubjects(prev => [...prev, {
      id: `s${Date.now()}`,
      name,
      creditHours: parseInt(newSubCredits) || 3,
      targetGrade: parseInt(newSubTarget) || 90,
      assessments: [],
    }]);
    setNewSubName('');
    setNewSubCredits('3');
    setNewSubTarget('90');
    setShowAddSubject(false);
  }

  return (
    <div className="space-y-6">
      {/* Header with GPA overview */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-white">{currentGpa.toFixed(2)}</span>
              <span className="text-sm text-gray-500">Current GPA</span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">{subjects.length} subjects &middot; {totalCredits} credit hours</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {subjects.length > 0 && (
            <HoverTip label="Add a new subject">
              <button onClick={() => setShowAddSubject(true)} className="flex items-center gap-1 px-3 py-2 rounded-lg bg-purple-500/20 text-purple-300 text-xs font-semibold border border-purple-500/30 hover:bg-purple-500/30 transition-colors">
                <Plus className="w-3.5 h-3.5" /> Add Subject
              </button>
            </HoverTip>
          )}
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/10">
            <Target className="w-4 h-4 text-purple-400" />
            <span className="text-xs text-gray-400">Target GPA</span>
            <input
              type="number"
              step="0.01"
              min="0"
              max="4"
              value={targetGpa}
              onChange={e => setTargetGpa(e.target.value)}
              className="w-16 bg-transparent text-white text-sm font-bold text-right outline-none border-b border-white/20 focus:border-purple-500 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* GPA Progress Bar */}
      <div className="rounded-xl bg-white/[0.03] border border-white/10 p-4">
        <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
          <span>0.00</span>
          <span>GPA Progress</span>
          <span>4.00</span>
        </div>
        <div className="relative h-3 rounded-full bg-white/5 overflow-hidden">
          <motion.div
            className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-purple-500 to-pink-500"
            initial={{ width: 0 }}
            animate={{ width: `${(currentGpa / 4) * 100}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 w-0.5 h-5 bg-amber-400"
            style={{ left: `${(parseFloat(targetGpa || '0') / 4) * 100}%` }}
            title={`Target: ${targetGpa}`}
          />
        </div>
        <div className="flex justify-between mt-2 text-[11px]">
          <span className="text-purple-400 font-semibold">Current: {currentGpa.toFixed(2)}</span>
          <span className={`font-semibold ${currentGpa >= parseFloat(targetGpa || '0') ? 'text-green-400' : 'text-amber-400'}`}>
            {currentGpa >= parseFloat(targetGpa || '0') ? 'On track!' : `Need +${(parseFloat(targetGpa || '0') - currentGpa).toFixed(2)} to reach target`}
          </span>
        </div>
      </div>

      {/* Subject Cards Grid */}
      {subjects.length === 0 ? (
        <div className="rounded-xl bg-[#18162e] border border-white/10 p-16 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-purple-900/20 border border-purple-500/30 flex items-center justify-center mb-5">
            <TrendingUp className="w-8 h-8 text-purple-400" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">No subjects added yet</h3>
          <p className="text-sm text-gray-500 max-w-md leading-relaxed mb-8">Start tracking your grades by adding your first subject!</p>
          <button
            onClick={() => setShowAddSubject(true)}
            className="flex items-center gap-2 px-6 py-3 text-sm font-semibold rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white transition-all"
          >
            <Plus className="w-4 h-4" /> Add Subject
          </button>
        </div>
      ) : (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {subjects.map(sub => {
          const calc = calculateRequiredScore(sub.assessments, sub.targetGrade);
          const completedWeight = sub.assessments.reduce((s, a) => s + a.weight, 0);

          return (
            <motion.div
              key={sub.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl bg-white/[0.03] border border-white/10 overflow-hidden"
            >
              {/* Card Header */}
              <div className="px-5 py-4 border-b border-white/[0.06] flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-white">{sub.name}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{sub.creditHours} credits &middot; {completedWeight}% graded</p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-white">{calc.currentGrade.toFixed(1)}%</div>
                  <div className="text-[11px] text-gray-500">{gradeFromPct(calc.currentGrade)}</div>
                </div>
              </div>

              {/* Weight Progress */}
              <div className="px-5 pt-3">
                <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
                    style={{ width: `${completedWeight}%` }}
                  />
                </div>
                <p className="text-[10px] text-gray-600 mt-1">{completedWeight}% of coursework completed</p>
              </div>

              {/* Assessments */}
              <div className="px-5 py-3 space-y-1.5">
                {sub.assessments.map(a => (
                  <div key={a.id} className="flex items-center justify-between py-1.5 group">
                    <span className="text-xs text-gray-300">
                      {a.name} <span className="text-gray-600">({a.weight}%)</span>
                    </span>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-semibold ${a.score >= 90 ? 'text-green-400' : a.score >= 70 ? 'text-white' : 'text-amber-400'}`}>
                        {a.score}%
                      </span>
                      <HoverTip label="Delete assessment">
                        <button
                          onClick={() => removeAssessment(sub.id, a.id)}
                          className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 transition-all"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </HoverTip>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Assessment */}
              <div className="px-5 pb-3">
                <AnimatePresence>
                  {addingAssessmentFor === sub.id ? (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-2 overflow-hidden"
                    >
                      <input
                        value={newName}
                        onChange={e => setNewName(e.target.value)}
                        placeholder="Assessment name"
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder:text-gray-600 outline-none focus:border-purple-500/50"
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <input
                          value={newWeight}
                          onChange={e => setNewWeight(e.target.value)}
                          placeholder="Weight %"
                          type="number"
                          className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder:text-gray-600 outline-none focus:border-purple-500/50"
                        />
                        <input
                          value={newScore}
                          onChange={e => setNewScore(e.target.value)}
                          placeholder="Score %"
                          type="number"
                          className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder:text-gray-600 outline-none focus:border-purple-500/50"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => addAssessment(sub.id)}
                          className="flex-1 py-2 text-xs font-semibold rounded-lg bg-purple-500 hover:bg-purple-600 text-white transition-colors"
                        >
                          Add
                        </button>
                        <button
                          onClick={() => setAddingAssessmentFor(null)}
                          className="flex-1 py-2 text-xs rounded-lg border border-white/10 text-gray-400 hover:bg-white/5 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </motion.div>
                  ) : (
                    <HoverTip label="Add a new assessment">
                      <button
                        onClick={() => setAddingAssessmentFor(sub.id)}
                        className="flex items-center gap-1.5 text-xs text-purple-400 hover:text-purple-300 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add Assessment
                      </button>
                    </HoverTip>
                  )}
                </AnimatePresence>
              </div>

              {/* Target Grade */}
              <div className="px-5 pb-3 flex items-center gap-2">
                <Target className="w-3.5 h-3.5 text-gray-500" />
                <span className="text-[11px] text-gray-500">Class target:</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={sub.targetGrade}
                  onChange={e => updateTargetGrade(sub.id, e.target.value)}
                  className="w-14 bg-transparent text-xs text-white font-semibold text-center outline-none border-b border-white/20 focus:border-purple-500 transition-colors"
                />
                <span className="text-[11px] text-gray-600">%</span>
              </div>

              {/* "What Do I Need?" Indicator */}
              <div className={`px-5 py-3 border-t ${calc.impossible ? 'border-red-500/20 bg-red-500/5' : 'border-purple-500/20 bg-purple-500/5'}`}>
                {calc.remainingWeight <= 0 ? (
                  <p className={`text-xs font-semibold ${calc.currentGrade >= sub.targetGrade ? 'text-green-400' : 'text-amber-400'}`}>
                    {calc.currentGrade >= sub.targetGrade
                      ? `All graded! Final grade: ${calc.currentGrade.toFixed(1)}% (${gradeFromPct(calc.currentGrade)}) — Target met!`
                      : `All graded. Final grade: ${calc.currentGrade.toFixed(1)}% (${gradeFromPct(calc.currentGrade)}) — Below target of ${sub.targetGrade}%.`}
                  </p>
                ) : calc.impossible ? (
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-300">
                      <span className="font-semibold">Heads up:</span> Reaching {sub.targetGrade}% ({gradeFromPct(sub.targetGrade)}) would require{' '}
                      <span className="font-bold text-red-400">{calc.requiredScore!.toFixed(1)}%</span> on your remaining {calc.remainingWeight}% of coursework,
                      which exceeds 100%. Consider adjusting your target — you're still doing great!
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-purple-300">
                    To get {gradeFromPct(sub.targetGrade)} ({sub.targetGrade}%) in this class, you need at least{' '}
                    <span className="font-bold text-white">{calc.requiredScore!.toFixed(1)}%</span> on your remaining{' '}
                    <span className="font-semibold text-purple-200">{calc.remainingWeight}%</span> of coursework.
                  </p>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
      )}

      <AnimatePresence>
        {showAddSubject && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="rounded-xl bg-[#18162e] border border-white/10 p-5 space-y-3 overflow-hidden">
            <h4 className="text-sm font-semibold text-white">Add New Subject</h4>
            <input value={newSubName} onChange={e => setNewSubName(e.target.value)} placeholder="Subject name" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-600 outline-none focus:border-purple-500/50" autoFocus />
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-xs text-gray-400 mb-1 block">Credit Hours</label>
                <input type="number" value={newSubCredits} onChange={e => setNewSubCredits(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-purple-500/50" />
              </div>
              <div className="flex-1">
                <label className="text-xs text-gray-400 mb-1 block">Target Grade %</label>
                <input type="number" value={newSubTarget} onChange={e => setNewSubTarget(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-purple-500/50" />
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={addSubject} className="flex-1 py-2 text-sm font-semibold rounded-lg bg-purple-500 hover:bg-purple-600 text-white transition-colors">Add</button>
              <button onClick={() => setShowAddSubject(false)} className="flex-1 py-2 text-sm rounded-lg border border-white/10 text-gray-400 hover:bg-white/5 transition-colors">Cancel</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
