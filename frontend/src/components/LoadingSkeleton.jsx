
const shimmerStyle = `
@keyframes skeleton-shimmer {
  0%   { background-position: -400px 0; }
  100% { background-position: 400px 0; }
}
.sk-bone {
  background: linear-gradient(
    90deg,
    rgba(255,255,255,0.03) 0%,
    rgba(255,255,255,0.06) 40%,
    rgba(255,255,255,0.03) 80%
  );
  background-size: 800px 100%;
  animation: skeleton-shimmer 1.8s ease-in-out infinite;
}
@keyframes sk-fade {
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0); }
}
.sk-wrap {
  animation: sk-fade 0.35s ease-out;
}
`;


function B({ w, h, r = 12, round, delay = 0, className = '', style = {} }) {
  return (
    <div
      className={`sk-bone ${className}`}
      style={{
        width: w,
        height: h,
        borderRadius: round ? 9999 : r,
        animationDelay: `${delay}ms`,
        flexShrink: 0,
        ...style,
      }}
    />
  );
}

// ── Card container ───────────────────────────────────────────
function Card({ children, className = '', style = {} }) {
  return (
    <div
      className={className}
      style={{
        background: 'rgba(28,28,30,0.6)',
        border: '1px solid rgba(255,255,255,0.04)',
        borderRadius: 24,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ── Shared header skeleton ───────────────────────────────────
function HeaderSk({ titleW = 200, subtitleW = 160, btnW = 0, delay = 0, center = false }) {
  return (
    <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 ${center ? 'items-center' : ''}`}>
      <div className={`space-y-2 ${center ? 'flex flex-col items-center' : ''}`}>
        <B w={titleW} h={32} r={14} delay={delay} />
        <B w={subtitleW} h={14} r={8} delay={delay + 60} />
      </div>
      {btnW > 0 && <B w={btnW} h={40} r={20} round delay={delay + 100} />}
    </div>
  );
}

// ── Shared section label ─────────────────────────────────────
function SectionLabel({ delay = 0 }) {
  return (
    <div className="flex items-center justify-between mb-4 px-1">
      <div className="flex items-center gap-2">
        <B w={18} h={18} round delay={delay} />
        <B w={100} h={15} r={8} delay={delay + 20} />
      </div>
      <B w={55} h={13} r={8} delay={delay + 40} />
    </div>
  );
}

// ── List rows ────────────────────────────────────────────────
function ListRows({ count = 5, delay = 0 }) {
  return (
    <div className="space-y-2 px-4 py-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-3 rounded-[14px]">
          <B w={24} h={24} round delay={delay + i * 45} />
          <B w={`${70 - i * 8}%`} h={14} r={8} delay={delay + 20 + i * 45} style={{ minWidth: 60, maxWidth: 260 }} />
        </div>
      ))}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════
// DASHBOARD
// ═════════════════════════════════════════════════════════════
function DashboardSkeleton() {
  return (
    <div className="sk-wrap max-w-6xl mx-auto pb-12 pt-2">
      {/* Greeting */}
      <div className="flex flex-col items-center gap-3 mb-10">
        <B w={220} h={32} r={16} />
      </div>

      {/* Finance section label */}
      <SectionLabel delay={80} />

      {/* 3 stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
        {[0, 1, 2].map(i => (
          <Card key={i} className="p-6 flex flex-col justify-between h-[150px]">
            <B w={90} h={13} r={8} delay={140 + i * 50} />
            <B w={150} h={30} r={10} delay={180 + i * 50} />
          </Card>
        ))}
      </div>

      {/* 2 content cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-10">
        {[0, 1].map(col => (
          <Card key={col} className="flex flex-col min-h-[360px] overflow-hidden">
            <div className="px-6 py-5 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <div className="flex items-center gap-2">
                <B w={18} h={18} round delay={320 + col * 40} />
                <B w={100} h={15} r={8} delay={340 + col * 40} />
              </div>
              <B w={55} h={13} r={8} delay={360 + col * 40} />
            </div>
            <ListRows count={5} delay={380 + col * 80} />
          </Card>
        ))}
      </div>

      {/* Goals section */}
      <SectionLabel delay={700} />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {[0, 1, 2].map(i => (
          <Card key={i} className="p-6 flex flex-col justify-between h-[160px]">
            <div className="space-y-3">
              <B w={70} h={20} r={8} delay={740 + i * 50} />
              <B w={130} h={14} r={8} delay={770 + i * 50} />
            </div>
            <B w={100} h={22} r={10} delay={810 + i * 50} />
          </Card>
        ))}
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════
// FINANCES
// ═════════════════════════════════════════════════════════════
function FinancesSkeleton() {
  return (
    <div className="sk-wrap max-w-6xl mx-auto pb-12">
      {/* Header + filter + button */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-10">
        <div className="space-y-2">
          <B w={180} h={32} r={14} />
          <B w={280} h={14} r={8} delay={40} />
        </div>
        <div className="flex items-center gap-4">
          <B w={220} h={36} r={12} delay={80} />
          <B w={190} h={36} r={12} delay={100} />
        </div>
      </div>

      {/* 3 overview cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        {[0, 1, 2].map(i => (
          <Card key={i} className="p-6 flex flex-col justify-between h-[150px]">
            <B w={120} h={13} r={8} delay={140 + i * 50} />
            <B w={160} h={32} r={10} delay={180 + i * 50} />
          </Card>
        ))}
      </div>

      {/* Charts area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-8">
        {[0, 1].map(i => (
          <Card key={i} className="p-6 h-[280px] flex flex-col justify-between">
            <B w={110} h={15} r={8} delay={320 + i * 60} />
            <div className="flex-1 flex items-end gap-3 pt-6 pb-2">
              {[50, 80, 65, 90, 40].map((h, j) => (
                <B key={j} w="18%" h={`${h}%`} r={8} delay={360 + i * 60 + j * 30} style={{ maxHeight: 180 }} />
              ))}
            </div>
          </Card>
        ))}
      </div>

      {/* Transaction list */}
      <Card className="overflow-hidden">
        <div className="px-6 py-5 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
          <B w={140} h={16} r={8} delay={600} />
          <B w={80} h={13} r={8} delay={620} />
        </div>
        <ListRows count={6} delay={640} />
      </Card>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════
// TASKS
// ═════════════════════════════════════════════════════════════
function TasksSkeleton() {
  return (
    <div className="sk-wrap max-w-6xl mx-auto pb-12">
      {/* Header + filter + button */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8 lg:mb-10">
        <div className="space-y-2">
          <B w={220} h={32} r={14} />
          <B w={260} h={14} r={8} delay={40} />
        </div>
        <div className="flex items-center gap-4">
          <B w={200} h={36} r={12} delay={80} />
          <B w={140} h={36} r={12} delay={100} />
        </div>
      </div>

      {/* 2 stat cards */}
      <div className="grid grid-cols-2 gap-5 mb-8">
        {[0, 1].map(i => (
          <Card key={i} className="p-6 flex flex-col justify-between h-[120px]">
            <B w={80} h={13} r={8} delay={140 + i * 50} />
            <B w={60} h={28} r={10} delay={180 + i * 50} />
          </Card>
        ))}
      </div>

      {/* Task list card */}
      <Card className="flex flex-col min-h-[400px] overflow-hidden">
        <ListRows count={8} delay={280} />
      </Card>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════
// ROUTINES
// ═════════════════════════════════════════════════════════════
function RoutinesSkeleton() {
  return (
    <div className="sk-wrap max-w-4xl mx-auto pb-12">
      <HeaderSk titleW={180} subtitleW={300} btnW={170} />

      {/* Routine cards — accordion style */}
      <div className="space-y-4">
        {[0, 1, 2].map(i => (
          <Card key={i} className="overflow-hidden">
            {/* Routine header */}
            <div className="p-5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <B w={44} h={44} r={14} delay={120 + i * 70} />
                <div className="space-y-2">
                  <B w={140} h={16} r={8} delay={140 + i * 70} />
                  <B w={80} h={12} r={6} delay={160 + i * 70} />
                </div>
              </div>
              <B w={20} h={20} round delay={180 + i * 70} />
            </div>
            {/* Subtasks preview */}
            {i === 0 && (
              <div className="px-5 pb-4 space-y-2" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                {[0, 1, 2, 3].map(j => (
                  <div key={j} className="flex items-center gap-3 py-2">
                    <B w={20} h={20} round delay={220 + j * 40} />
                    <B w={`${60 - j * 8}%`} h={13} r={8} delay={240 + j * 40} style={{ minWidth: 80 }} />
                    <div className="ml-auto">
                      <B w={50} h={12} r={6} delay={260 + j * 40} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════
// GOALS
// ═════════════════════════════════════════════════════════════
function GoalsSkeleton() {
  return (
    <div className="sk-wrap max-w-4xl mx-auto pb-12">
      <HeaderSk titleW={200} subtitleW={320} btnW={160} />

      {/* Goal cards — 2 cols */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[0, 1, 2, 3].map(i => (
          <Card key={i} className="p-6 flex flex-col gap-4" style={{ minHeight: 180 }}>
            <div className="flex items-start gap-3">
              <B w={32} h={32} round delay={100 + i * 60} />
              <div className="space-y-2 flex-1">
                <B w="70%" h={16} r={8} delay={120 + i * 60} />
                <div className="flex items-center gap-2">
                  <B w={80} h={10} r={6} delay={140 + i * 60} />
                  <B w={60} h={10} r={6} delay={155 + i * 60} />
                </div>
              </div>
            </div>
            {/* Progress bar (every other card) */}
            {i % 2 === 0 && (
              <div className="space-y-2 mt-2">
                <div className="flex justify-between">
                  <B w={100} h={12} r={6} delay={170 + i * 60} />
                  <B w={40} h={12} r={6} delay={185 + i * 60} />
                </div>
                <B w="100%" h={10} r={99} delay={200 + i * 60} />
              </div>
            )}
            <B w={140} h={32} r={99} round delay={220 + i * 60} />
          </Card>
        ))}
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════
// PROJECTS
// ═════════════════════════════════════════════════════════════
function ProjectsSkeleton() {
  return (
    <div className="sk-wrap max-w-4xl mx-auto pb-12">
      <HeaderSk titleW={190} subtitleW={330} btnW={170} delay={0} />

      {/* Accordion project cards */}
      <div className="space-y-4">
        {[0, 1, 2].map(i => (
          <Card key={i} className="overflow-hidden">
            <div className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <B w={48} h={48} r={14} delay={80 + i * 80} />
                <div className="space-y-2">
                  <B w={160} h={17} r={8} delay={100 + i * 80} />
                  <B w={100} h={12} r={6} delay={120 + i * 80} />
                </div>
              </div>
              <B w={20} h={20} round delay={140 + i * 80} />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════
// TEAMS
// ═════════════════════════════════════════════════════════════
function TeamsSkeleton() {
  return (
    <div className="sk-wrap max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div className="flex items-end justify-between mb-8">
        <div className="space-y-2">
          <B w={200} h={30} r={14} />
          <B w={220} h={14} r={8} delay={40} />
        </div>
        <div className="flex items-center gap-3">
          <B w={60} h={28} r={99} round delay={60} />
          <B w={120} h={40} r={12} delay={80} />
        </div>
      </div>

      {/* Tab bar */}
      <div className="mb-6">
        <B w={320} h={48} r={24} delay={100} />
      </div>

      {/* Team list cards */}
      <div className="space-y-3">
        {[0, 1, 2].map(i => (
          <Card key={i} className="p-5 flex items-center gap-4" style={{ borderRadius: 24 }}>
            <B w={48} h={48} r={16} delay={150 + i * 60} />
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <B w={130} h={16} r={8} delay={170 + i * 60} />
                <B w={50} h={16} r={6} delay={185 + i * 60} />
              </div>
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  {[0, 1, 2].map(j => (
                    <B key={j} w={24} h={24} round delay={200 + i * 60 + j * 15} />
                  ))}
                </div>
                <B w={70} h={12} r={6} delay={250 + i * 60} />
              </div>
            </div>
            <B w={32} h={32} round delay={270 + i * 60} />
          </Card>
        ))}
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════
// SETTINGS
// ═════════════════════════════════════════════════════════════
function SettingsSkeleton() {
  return (
    <div className="sk-wrap max-w-4xl mx-auto px-4 py-8 md:py-12">
      {/* Header */}
      <div className="mb-12 space-y-3">
        <div className="flex items-center gap-3">
          <B w={36} h={36} r={12} />
          <B w={100} h={13} r={8} delay={30} />
        </div>
        <B w={250} h={38} r={14} delay={50} />
        <B w={340} h={16} r={8} delay={70} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left column */}
        <div className="lg:col-span-8 space-y-8">
          {/* Profile section */}
          <Card className="p-8" style={{ borderRadius: 32 }}>
            <div className="flex items-center gap-4 mb-8">
              <B w={96} h={96} r={24} delay={100} />
              <div className="space-y-2">
                <B w={150} h={18} r={8} delay={130} />
                <B w={180} h={14} r={8} delay={150} />
              </div>
            </div>
            <div className="space-y-4">
              <B w={120} h={13} r={8} delay={170} />
              <B w="100%" h={52} r={16} delay={190} />
            </div>
            <div className="flex justify-end mt-6">
              <B w={120} h={48} r={16} delay={220} />
            </div>
          </Card>

          {/* Themes section */}
          <Card className="p-8" style={{ borderRadius: 32 }}>
            <div className="flex items-center gap-3 mb-8">
              <B w={36} h={36} r={12} delay={260} />
              <div className="space-y-1">
                <B w={100} h={18} r={8} delay={280} />
                <B w={180} h={12} r={6} delay={295} />
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[0, 1, 2, 3].map(i => (
                <B key={i} w="100%" h={90} r={24} delay={310 + i * 35} />
              ))}
            </div>
          </Card>
        </div>

        {/* Right column */}
        <div className="lg:col-span-4 space-y-8">
          <B w="100%" h={220} r={32} delay={450} />
          <Card className="p-8 space-y-4" style={{ borderRadius: 32 }}>
            <B w={100} h={14} r={8} delay={500} />
            <B w="100%" h={52} r={16} delay={520} />
            <B w="100%" h={52} r={16} delay={540} />
          </Card>
        </div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════
// ACHIEVEMENTS
// ═════════════════════════════════════════════════════════════
function AchievementsSkeleton() {
  return (
    <div className="sk-wrap max-w-6xl mx-auto pb-12 px-4 md:px-6">
      {/* Header */}
      <div className="pt-8 pb-6 flex items-center justify-between">
        <div className="space-y-2">
          <B w={200} h={40} r={14} />
          <B w={280} h={14} r={8} delay={40} />
        </div>
        <B w={100} h={36} r={12} delay={60} />
      </div>

      {/* Stats hero */}
      <Card className="p-8 sm:p-12 mb-10" style={{ borderRadius: 40 }}>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-8 mb-10">
          <div className="space-y-2">
            <B w={160} h={60} r={14} delay={80} />
            <B w={180} h={12} r={8} delay={110} />
          </div>
          <div className="flex-1 max-w-[320px] space-y-3">
            <div className="flex justify-between">
              <B w={100} h={10} r={6} delay={130} />
              <B w={40} h={16} r={8} delay={140} />
            </div>
            <B w="100%" h={8} r={99} delay={150} />
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map(i => (
            <B key={i} w="100%" h={110} r={22} delay={180 + i * 40} />
          ))}
        </div>
      </Card>

      {/* Filter tabs */}
      <div className="mb-8">
        <B w={500} h={48} r={24} delay={360} style={{ maxWidth: '100%' }} />
      </div>

      {/* Achievement cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {[0, 1, 2, 3, 4, 5].map(i => (
          <Card key={i} className="p-4 sm:p-5 flex gap-4" style={{ borderRadius: 22, minHeight: 100 }}>
            <B w={64} h={64} r={18} delay={400 + i * 40} />
            <div className="flex-1 space-y-2 py-1">
              <B w="80%" h={14} r={8} delay={420 + i * 40} />
              <B w="60%" h={11} r={6} delay={440 + i * 40} />
              <div className="flex gap-2 pt-1">
                <B w={45} h={16} r={99} round delay={460 + i * 40} />
                <B w={55} h={16} r={99} round delay={475 + i * 40} />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════
// LEADERBOARD
// ═════════════════════════════════════════════════════════════
function LeaderboardSkeleton() {
  return (
    <div className="sk-wrap max-w-2xl mx-auto pb-12 px-4 md:px-6">
      {/* Header */}
      <div className="pt-10 pb-8 space-y-4">
        <div className="flex items-center gap-2">
          <B w={32} h={32} r={10} />
          <B w={90} h={14} r={8} delay={20} />
        </div>
        <B w={200} h={36} r={14} delay={40} />
        <B w={260} h={14} r={8} delay={60} />
      </div>

      {/* Podium */}
      <div className="flex items-end justify-center gap-4 mb-10">
        <div className="flex flex-col items-center gap-2" style={{ flex: '0 0 27%' }}>
          <B w={52} h={52} round delay={100} />
          <B w="100%" h={96} r={18} delay={130} />
        </div>
        <div className="flex flex-col items-center gap-2" style={{ flex: '0 0 40%' }}>
          <B w={68} h={68} round delay={80} />
          <B w="100%" h={128} r={18} delay={110} />
        </div>
        <div className="flex flex-col items-center gap-2" style={{ flex: '0 0 27%' }}>
          <B w={52} h={52} round delay={120} />
          <B w="100%" h={80} r={18} delay={150} />
        </div>
      </div>

      {}
      <div className="space-y-2">
        <B w={50} h={10} r={6} delay={200} className="mb-3" />
        {[0, 1, 2, 3, 4].map(i => (
          <Card key={i} className="px-4 py-3.5 flex items-center gap-4" style={{ borderRadius: 16 }}>
            <B w={20} h={20} round delay={230 + i * 40} />
            <B w={40} h={40} round delay={245 + i * 40} />
            <div className="flex-1 space-y-1.5">
              <B w={100} h={13} r={8} delay={260 + i * 40} />
              <div className="flex gap-1">
                {[0, 1, 2].map(j => (
                  <B key={j} w={28} h={14} r={6} delay={275 + i * 40 + j * 10} />
                ))}
              </div>
            </div>
            <B w={30} h={14} r={8} delay={310 + i * 40} />
          </Card>
        ))}
      </div>
    </div>
  );
}




function GenericSkeleton() {
  return (
    <div className="sk-wrap max-w-4xl mx-auto pb-12">
      <HeaderSk titleW={200} subtitleW={260} btnW={140} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {[0, 1, 2, 3].map(i => (
          <Card key={i} className="p-6 flex flex-col gap-4" style={{ minHeight: 140 }}>
            <B w="60%" h={16} r={8} delay={100 + i * 50} />
            <B w="40%" h={13} r={8} delay={130 + i * 50} />
            <B w="80%" h={10} r={99} delay={160 + i * 50} />
          </Card>
        ))}
      </div>
    </div>
  );
}




const VARIANTS = {
  dashboard:    DashboardSkeleton,
  finances:     FinancesSkeleton,
  tasks:        TasksSkeleton,
  routines:     RoutinesSkeleton,
  goals:        GoalsSkeleton,
  projects:     ProjectsSkeleton,
  teams:        TeamsSkeleton,
  settings:     SettingsSkeleton,
  achievements: AchievementsSkeleton,
  leaderboard:  LeaderboardSkeleton,
};




export default function LoadingSkeleton({ variant }) {
  const Comp = VARIANTS[variant] || GenericSkeleton;
  return (
    <>
      <style>{shimmerStyle}</style>
      <Comp />
    </>
  );
}
