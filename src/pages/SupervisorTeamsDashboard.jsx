import React, { useState, useEffect } from "react";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";

const API_BASE = "https://leading-unity-nest-backend.vercel.app/api";

const getAuthHeader = () => {
  try {
    const userInfo = JSON.parse(localStorage.getItem("userInfo"));
    return { headers: { Authorization: `Bearer ${userInfo?.token}` } };
  } catch {
    return {};
  }
};

// ── CGPA helpers ─────────────────────────────────────────────────────────────
const parseCgpa = (val) => {
  const n = parseFloat(val);
  return isNaN(n) ? null : n;
};

const computeAvgCgpa = (proposal) => {
  const values = [];
  const leaderCgpa = parseCgpa(proposal.student?.cgpa);
  if (leaderCgpa !== null) values.push(leaderCgpa);
  for (const m of proposal.teamMembers ?? []) {
    if (m.studentId === proposal.student?.studentId) continue;
    const c = parseCgpa(m.cgpa);
    if (c !== null) values.push(c);
  }
  if (values.length === 0) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
};

const cgpaColor = (avg) => {
  if (avg === null) return { bar: "#e5e7eb", text: "text-gray-400", bg: "bg-gray-100", label: "N/A" };
  if (avg >= 3.75) return { bar: "#10b981", text: "text-emerald-700", bg: "bg-emerald-50", label: "Excellent" };
  if (avg >= 3.5)  return { bar: "#6366f1", text: "text-indigo-700",  bg: "bg-indigo-50",  label: "Very Good" };
  if (avg >= 3.0)  return { bar: "#f59e0b", text: "text-amber-700",   bg: "bg-amber-50",   label: "Good" };
  return              { bar: "#f43f5e", text: "text-rose-700",    bg: "bg-rose-50",    label: "Average" };
};

// ── Skeleton Row ──────────────────────────────────────────────────────────────
const SkeletonRow = () => (
  <tr className="animate-pulse border-b border-gray-100">
    {[...Array(6)].map((_, i) => (
      <td key={i} className="px-4 py-3">
        <div className="h-3.5 bg-gray-100 rounded w-3/4" />
      </td>
    ))}
  </tr>
);

// ── CGPA Badge ────────────────────────────────────────────────────────────────
const CgpaBadge = ({ avg }) => {
  const { text, bg, bar, label } = cgpaColor(avg);
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-bold ${text} ${bg}`}>
      <span
        className="w-1.5 h-1.5 rounded-full shrink-0"
        style={{ backgroundColor: bar }}
      />
      {avg !== null ? avg.toFixed(2) : "—"}
      <span className="font-medium opacity-70">{label}</span>
    </span>
  );
};

// ── Expanded Members Sub-table ─────────────────────────────────────────────────
const MembersSubTable = ({ proposal }) => {
  const leader = proposal.student;
  const others = (proposal.teamMembers ?? []).filter(
    (m) => m.studentId !== leader?.studentId
  );

  return (
    <div className="px-4 pb-3 pt-1">
      <table className="w-full text-xs">
        <thead>
          <tr className="text-gray-400 uppercase tracking-wide">
            <th className="text-left pb-1.5 font-semibold pl-2 w-6"></th>
            <th className="text-left pb-1.5 font-semibold">Name</th>
            <th className="text-left pb-1.5 font-semibold">Student ID</th>
            <th className="text-left pb-1.5 font-semibold">Role</th>
            <th className="text-right pb-1.5 font-semibold pr-2">CGPA</th>
          </tr>
        </thead>
        <tbody>
          {leader && (
            <tr className="border-t border-gray-100">
              <td className="py-1.5 pl-2 text-gray-400">1</td>
              <td className="py-1.5 font-semibold text-indigo-700">{leader.name}</td>
              <td className="py-1.5 font-mono text-gray-600">{leader.studentId}</td>
              <td className="py-1.5">
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-700">
                  Leader
                </span>
              </td>
              <td className="py-1.5 text-right pr-2 font-mono text-gray-700">{leader.cgpa ?? "—"}</td>
            </tr>
          )}
          {others.map((m, idx) => (
            <tr key={idx} className="border-t border-gray-100">
              <td className="py-1.5 pl-2 text-gray-400">{idx + 2}</td>
              <td className="py-1.5 text-gray-700">{m.name}</td>
              <td className="py-1.5 font-mono text-gray-600">{m.studentId}</td>
              <td className="py-1.5">
                <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-500">
                  Member
                </span>
              </td>
              <td className="py-1.5 text-right pr-2 font-mono text-gray-700">{m.cgpa ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// ── Team Row (inside expanded supervisor row) ─────────────────────────────────
const TeamRow = ({ proposal, globalIndex }) => {
  const [open, setOpen] = useState(false);
  const avg = computeAvgCgpa(proposal);
  const memberCount =
    1 +
    (proposal.teamMembers ?? []).filter(
      (m) => m.studentId !== proposal.student?.studentId
    ).length;

  return (
    <>
      <tr
        className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
        onClick={() => setOpen((v) => !v)}
      >
        {/* # */}
        <td className="px-4 py-3 text-xs text-gray-400 font-mono w-10 select-none">
          {globalIndex}
        </td>

        {/* Title */}
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <span
              className={`w-1.5 h-1.5 rounded-full shrink-0`}
              style={{ backgroundColor: cgpaColor(avg).bar }}
            />
            <span className="text-sm font-medium text-gray-800 leading-snug">
              {proposal.title}
            </span>
            {proposal.serialNumber != null && (
              <span className="text-[10px] font-bold text-purple-600 bg-purple-50 border border-purple-100 px-1.5 py-0.5 rounded">
                {proposal.serialNumber}
              </span>
            )}
          </div>
        </td>

        {/* Course */}
        <td className="px-4 py-3">
          <span className="inline-flex px-2 py-0.5 rounded text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 font-mono tracking-wide">
            {proposal.course?.courseCode ?? "N/A"}
          </span>
        </td>

        {/* Leader */}
        <td className="px-4 py-3 text-sm text-gray-700">
          <span className="font-medium">{proposal.student?.name ?? "—"}</span>
          <span className="text-gray-400 text-xs ml-1">
            ({proposal.student?.studentId ?? "—"})
          </span>
        </td>

        {/* Members */}
        <td className="px-4 py-3 text-center text-sm text-gray-600">
          {memberCount}
        </td>

        {/* Avg CGPA */}
        <td className="px-4 py-3">
          <CgpaBadge avg={avg} />
        </td>

        {/* Expand toggle */}
        <td className="px-4 py-3 text-right text-gray-400 select-none">
          <svg
            className={`w-4 h-4 inline transition-transform duration-200 ${open ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </td>
      </tr>

      {/* Expanded members sub-table */}
      {open && (
        <tr className="bg-indigo-50/40 border-b border-indigo-100">
          <td colSpan={7} className="py-0">
            <MembersSubTable proposal={proposal} />
          </td>
        </tr>
      )}
    </>
  );
};

// ── Supervisor Group Header Row ───────────────────────────────────────────────
const SupervisorGroupRow = ({ supervisor, teams, startIndex }) => {
  const [open, setOpen] = useState(true);

  const totalMembers = teams.reduce(
    (acc, p) =>
      acc +
      1 +
      (p.teamMembers ?? []).filter(
        (m) => m.studentId !== p.student?.studentId
      ).length,
    0
  );

  const allAvgs = teams.map(computeAvgCgpa).filter((v) => v !== null);
  const overallAvg =
    allAvgs.length > 0
      ? allAvgs.reduce((a, b) => a + b, 0) / allAvgs.length
      : null;

  const initials = (supervisor.name ?? "?")
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  const { bar } = cgpaColor(overallAvg);

  return (
    <>
      {/* Supervisor header row */}
      <tr
        className="bg-gray-50 border-y border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors select-none"
        onClick={() => setOpen((v) => !v)}
      >
        <td colSpan={7} className="px-4 py-3">
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm"
              style={{ background: `linear-gradient(135deg, ${bar}bb, ${bar})` }}
            >
              {initials}
            </div>

            {/* Name */}
            <span className="text-sm font-bold text-gray-900">{supervisor.name}</span>
            {supervisor.abbreviation && (
              <span className="text-xs text-gray-400 font-mono">{supervisor.abbreviation}</span>
            )}

            {/* Stats */}
            <div className="flex items-center gap-2 ml-2">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                {teams.length} team{teams.length !== 1 ? "s" : ""}
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-600 border border-gray-200">
                {totalMembers} students
              </span>
              {overallAvg !== null && (
                <CgpaBadge avg={overallAvg} />
              )}
            </div>

            {/* Chevron */}
            <svg
              className={`w-4 h-4 ml-auto text-gray-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </td>
      </tr>

      {/* Team rows under this supervisor */}
      {open &&
        teams.map((proposal, idx) => (
          <TeamRow
            key={proposal._id}
            proposal={proposal}
            globalIndex={startIndex + idx + 1}
          />
        ))}
    </>
  );
};

// ── Main Page ─────────────────────────────────────────────────────────────────
const SupervisorTeamsDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [grouped, setGrouped] = useState([]);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("name");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const config = getAuthHeader();
        const res = await axios.get(`${API_BASE}/proposals`, config);
        const relevant = res.data.filter(
          (p) => p.status === "approved" && p.assignedSupervisor
        );
        const map = new Map();
        for (const p of relevant) {
          const sup = p.assignedSupervisor;
          const key = sup._id ?? sup;
          if (!map.has(key)) map.set(key, { supervisor: sup, teams: [] });
          map.get(key).teams.push(p);
        }
        setGrouped([...map.values()]);
      } catch {
        toast.error("Could not load supervisor data.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const displayed = grouped
    .filter(({ supervisor, teams }) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        supervisor.name?.toLowerCase().includes(q) ||
        supervisor.abbreviation?.toLowerCase().includes(q) ||
        teams.some((t) => t.title.toLowerCase().includes(q))
      );
    })
    .sort((a, b) => {
      if (sortBy === "teams") return b.teams.length - a.teams.length;
      if (sortBy === "cgpa") {
        const avg = (g) => {
          const v = g.teams.map(computeAvgCgpa).filter(Boolean);
          return v.length ? v.reduce((x, y) => x + y, 0) / v.length : 0;
        };
        return avg(b) - avg(a);
      }
      return (a.supervisor.name ?? "").localeCompare(b.supervisor.name ?? "");
    });

  const totalSupervisors = grouped.length;
  const totalTeams = grouped.reduce((a, g) => a + g.teams.length, 0);
  const allCgpas = grouped
    .flatMap(({ teams }) => teams.map(computeAvgCgpa).filter((v) => v !== null));
  const overallCgpa =
    allCgpas.length ? allCgpas.reduce((a, b) => a + b, 0) / allCgpas.length : null;

  // Compute start index for each supervisor group
  let runningIndex = 0;
  const groupsWithIndex = displayed.map((g) => {
    const start = runningIndex;
    runningIndex += g.teams.length;
    return { ...g, startIndex: start };
  });

  return (
    <div className="min-h-screen p-6 md:p-2 font-sans">
      <Toaster position="top-right" />

      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
          Supervisor Teams
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Assigned supervisors, their teams, and average CGPA breakdown.
        </p>
      </div>

      {/* Summary Stats */}
      {!loading && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            {
              label: "Supervisors",
              value: totalSupervisors,
              color: "text-indigo-600 bg-indigo-50 border-indigo-100",
              icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                    d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ),
            },
            {
              label: "Total Teams",
              value: totalTeams,
              color: "text-purple-600 bg-purple-50 border-purple-100",
              icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              ),
            },
            {
              label: "Overall Avg. CGPA",
              value: overallCgpa !== null ? overallCgpa.toFixed(2) : "—",
              color: `${cgpaColor(overallCgpa).text} bg-white border-gray-200`,
              icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              ),
            },
          ].map(({ label, value, color, icon }) => (
            <div
              key={label}
              className={`flex items-center gap-4 px-5 py-4 rounded-2xl border ${color} bg-white shadow-sm`}
            >
              <div className={`p-2 rounded-xl border ${color}`}>{icon}</div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{value}</p>
                <p className="text-xs text-gray-500 font-medium mt-0.5">{label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search supervisor or team…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="block w-full py-2.5 pl-10 pr-4 text-sm bg-white border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 placeholder-gray-400 text-gray-700"
          />
        </div>
        <div className="flex bg-gray-100 rounded-xl p-1 w-fit gap-1">
          {[
            { key: "name", label: "Name" },
            { key: "teams", label: "Most Teams" },
            { key: "cgpa", label: "Highest CGPA" },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setSortBy(key)}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
                sortBy === key
                  ? "bg-white text-indigo-600 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wide w-10">SN</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wide">Project Title</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wide">Course</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wide">Team Leader</th>
              <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wide">Members</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wide">Avg. CGPA</th>
              <th className="px-4 py-3 w-8" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(6)].map((_, i) => <SkeletonRow key={i} />)
            ) : groupsWithIndex.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-24 text-center text-gray-400">
                  <svg className="w-14 h-14 mx-auto mb-3 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1"
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <p className="text-base font-medium text-gray-600">No assigned supervisors found</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Approve proposals and assign supervisors to see them here.
                  </p>
                </td>
              </tr>
            ) : (
              groupsWithIndex.map(({ supervisor, teams, startIndex }) => (
                <SupervisorGroupRow
                  key={supervisor._id ?? supervisor}
                  supervisor={supervisor}
                  teams={teams}
                  startIndex={startIndex}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SupervisorTeamsDashboard;