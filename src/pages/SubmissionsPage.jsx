/* eslint-disable prettier/prettier */
import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { CalendarCheck } from "lucide-react";

const API_BASE = "https://leading-unity-nest-backend.vercel.app/api";

const getAuthHeader = () => {
  try {
    const userInfo = JSON.parse(localStorage.getItem("userInfo"));
    return { headers: { Authorization: `Bearer ${userInfo?.token}` } };
  } catch {
    return {};
  }
};

const toBDDate = (isoString) => {
  if (!isoString) return null;
  const date = new Date(isoString);
  const diff = (6 * 60 + date.getTimezoneOffset()) * 60 * 1000;
  return new Date(date.getTime() + diff);
};

const fromBDToUTC = (bdDate) => {
  if (!bdDate) return null;
  const diff = (6 * 60 + bdDate.getTimezoneOffset()) * 60 * 1000;
  return new Date(bdDate.getTime() - diff);
};

const sortProposalsByDate = (list) => {
  const now = new Date();
  return [...list].sort((a, b) => {
    const dateA = a.defenseDate ? new Date(a.defenseDate) : null;
    const dateB = b.defenseDate ? new Date(b.defenseDate) : null;
    const isPassedA = dateA && dateA < now;
    const isPassedB = dateB && dateB < now;
    if (isPassedA && !isPassedB) return 1;
    if (!isPassedA && isPassedB) return -1;
    if (dateA && !dateB) return -1;
    if (!dateA && dateB) return 1;
    if (dateA && dateB) {
      const diff = dateA - dateB;
      if (diff !== 0) return diff;
      return (a.serialNumber ?? 999) - (b.serialNumber ?? 999);
    }
    return (a.serialNumber ?? 999) - (b.serialNumber ?? 999);
  });
};

// ── Icons ──────────────────────────────────────────────────────────────────
const SearchIcon = () => (
  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);
const TrashIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);
const TeamIcon = () => (
  <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);
const LinkIcon = () => (
  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
  </svg>
);
const XIcon = () => (
  <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
  </svg>
);
const RestoreIcon = () => (
  <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);
const EmptyStateIcon = () => (
  <svg className="w-16 h-16 text-gray-200 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);
const MergeIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
  </svg>
);
const CheckIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
  </svg>
);
const StarIcon = () => (
  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
);
const BulkCalendarIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

// ── Styles / helpers ────────────────────────────────────────────────────────
const GlobalDatePickerStyles = () => (
  <style>{`
    .react-datepicker-popper { z-index: 9999 !important; }
    .react-datepicker { font-family: inherit; border-radius: 12px; box-shadow: 0 10px 40px rgba(0,0,0,0.12); overflow: hidden; }
    .react-datepicker__header { background: #f8fafc; border-bottom: 1px solid #e5e7eb; padding-top: 10px; }
    .react-datepicker__day--selected { background-color: #6366f1 !important; border-radius: 6px; }
    .defense-datepicker-wrapper { width: 100%; }
    .defense-datepicker-wrapper .react-datepicker-wrapper,
    .defense-datepicker-wrapper .react-datepicker__input-container { width: 100%; }
  `}</style>
);

const DefenseScheduler = ({ proposal, onSave }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(proposal.defenseDate ? toBDDate(proposal.defenseDate) : null);
  const [startTime, setStartTime] = useState(proposal.defenseDate ? toBDDate(proposal.defenseDate) : new Date().setHours(9, 0, 0));
  const [endTime, setEndTime] = useState(proposal.defenseEndDate ? toBDDate(proposal.defenseEndDate) : new Date().setHours(9, 30, 0));

  const handleSave = () => {
    if (!selectedDate) return;
    const buildDateTime = (base, time) => {
      const d = new Date(base);
      const t = new Date(time);
      d.setHours(t.getHours(), t.getMinutes());
      return d;
    };
    onSave(buildDateTime(selectedDate, startTime), buildDateTime(selectedDate, endTime));
    setIsOpen(false);
  };

  const displayString =
    proposal.defenseDate && proposal.defenseEndDate
      ? `${toBDDate(proposal.defenseDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })} • ${toBDDate(proposal.defenseDate).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })} - ${toBDDate(proposal.defenseEndDate).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}`
      : "-- Set Schedule --";

  const timePickerProps = { showTimeSelect: true, showTimeSelectOnly: true, timeIntervals: 15, dateFormat: "h:mm aa", className: "w-full text-xs p-2 border rounded" };

  return (
    <div className="relative w-[220px]">
      <button onClick={() => setIsOpen(!isOpen)} className="flex items-center w-full px-3 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 transition-all text-left">
        <span className="mr-2 text-purple-500"><CalendarCheck className="text-xs" /></span>
        <span className="truncate">{displayString}</span>
      </button>
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 z-50 bg-white border border-gray-200 rounded-xl shadow-xl p-4 w-[280px]">
          <h4 className="text-xs font-bold text-gray-500 uppercase mb-3">Schedule Defense</h4>
          <div className="space-y-3">
            <div>
              <label className="block text-[10px] font-semibold text-gray-400 mb-1">Date</label>
              <DatePicker selected={selectedDate} onChange={setSelectedDate} dateFormat="MMM d, yyyy" className="w-full text-xs p-2 border rounded" />
            </div>
            <div className="flex gap-2">
              <div className="w-1/2">
                <label className="block text-[10px] font-semibold text-gray-400 mb-1">Start</label>
                <DatePicker selected={startTime} onChange={setStartTime} timeCaption="Start" {...timePickerProps} />
              </div>
              <div className="w-1/2">
                <label className="block text-[10px] font-semibold text-gray-400 mb-1">End</label>
                <DatePicker selected={endTime} onChange={setEndTime} timeCaption="End" {...timePickerProps} />
              </div>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button onClick={() => setIsOpen(false)} className="flex-1 py-1.5 text-xs font-semibold text-gray-600 bg-gray-100 rounded hover:bg-gray-200">Cancel</button>
            <button onClick={handleSave} className="flex-1 py-1.5 text-xs font-semibold text-white bg-indigo-600 rounded hover:bg-indigo-700">Save</button>
          </div>
        </div>
      )}
    </div>
  );
};

const STATUS_STYLES = {
  approved: "bg-emerald-100 text-emerald-800 border-emerald-200",
  rejected: "bg-rose-100 text-rose-800 border-rose-200",
  pending: "bg-amber-100 text-amber-800 border-amber-200",
};
const StatusBadge = ({ status }) => (
  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide border ${STATUS_STYLES[status] || STATUS_STYLES.pending}`}>
    {status}
  </span>
);
const ChevronDown = () => (
  <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-gray-400">
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
    </svg>
  </div>
);

// ── Merge Panel ─────────────────────────────────────────────────────────────
// Shows a preview of what the merged team will look like and lets admin
// pick which proposal is "primary" (its title/description survive).
const MergePanel = ({ selectedProposals, onConfirm, onCancel, isMerging }) => {
  const [primaryId, setPrimaryId] = useState(selectedProposals[0]?._id ?? null);

  // Collect all unique members across selected proposals
  const collectMembers = (proposals, primId) => {
    const primary = proposals.find((p) => p._id === primId);
    if (!primary) return [];

    const seen = new Set();
    const members = [];

    // Primary leader
    if (primary.student) {
      seen.add(primary.student.studentId ?? primary.student._id);
      members.push({ name: primary.student.name, studentId: primary.student.studentId, source: "Leader (primary)", isLeader: true });
    }

    // Primary existing members
    for (const m of primary.teamMembers ?? []) {
      if (!seen.has(m.studentId)) {
        seen.add(m.studentId);
        members.push({ ...m, source: "Member (primary)", isLeader: false });
      }
    }

    // Secondary proposals
    for (const sec of proposals.filter((p) => p._id !== primId)) {
      if (sec.student && !seen.has(sec.student.studentId ?? sec.student._id)) {
        seen.add(sec.student.studentId ?? sec.student._id);
        members.push({ name: sec.student.name, studentId: sec.student.studentId, source: `Leader → ${sec.title.slice(0, 20)}…`, isLeader: false });
      }
      for (const m of sec.teamMembers ?? []) {
        if (!seen.has(m.studentId)) {
          seen.add(m.studentId);
          members.push({ ...m, source: `Member → ${sec.title.slice(0, 20)}…`, isLeader: false });
        }
      }
    }
    return members;
  };

  const preview = collectMembers(selectedProposals, primaryId);
  const totalMembers = preview.length;
  const isValid = totalMembers >= 3 && totalMembers <= 4;
  const primary = selectedProposals.find((p) => p._id === primaryId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-5">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <MergeIcon />
            Merge {selectedProposals.length} Teams
          </h2>
          <p className="text-violet-200 text-xs mt-1">
            Choose which proposal to keep as primary. Others will be deleted after merge.
          </p>
        </div>

        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* Primary picker */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
              Primary Proposal (title &amp; link will be kept)
            </label>
            <div className="space-y-2">
              {selectedProposals.map((p) => (
                <button
                  key={p._id}
                  onClick={() => setPrimaryId(p._id)}
                  className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all flex items-start gap-3 ${
                    primaryId === p._id
                      ? "border-indigo-500 bg-indigo-50"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                >
                  <span className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                    primaryId === p._id ? "border-indigo-500 bg-indigo-500 text-white" : "border-gray-300"
                  }`}>
                    {primaryId === p._id && <CheckIcon />}
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-gray-900 truncate">{p.title}</span>
                      {primaryId === p._id && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700">
                          <StarIcon /> Primary
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      Leader: {p.student?.name ?? "—"} ({p.student?.studentId ?? "—"}) •{" "}
                      {(p.teamMembers?.length ?? 0) + 1} member(s)
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                Merged Team Preview
              </label>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                totalMembers > 4
                  ? "bg-red-100 text-red-700"
                  : totalMembers >= 3
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-amber-100 text-amber-700"
              }`}>
                {totalMembers} / 4 members {totalMembers < 3 ? "(min 3)" : ""}
              </span>
            </div>

            {totalMembers > 4 && (
              <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg mb-3">
                <svg className="w-4 h-4 text-red-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.963-.833-2.733 0L3.068 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <p className="text-xs text-red-700 font-medium">
                  Merged team exceeds 4 members. Please deselect a proposal before merging.
                </p>
              </div>
            )}

            {totalMembers < 3 && (
              <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg mb-3">
                <svg className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.963-.833-2.733 0L3.068 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <p className="text-xs text-amber-700 font-medium">
                  Merged team has only {totalMembers} member{totalMembers !== 1 ? "s" : ""}. Select more proposals to reach the minimum of 3.
                </p>
              </div>
            )}

            <div className="rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-gray-500 font-semibold">#</th>
                    <th className="px-4 py-2 text-left text-gray-500 font-semibold">Name</th>
                    <th className="px-4 py-2 text-left text-gray-500 font-semibold">Student ID</th>
                    <th className="px-4 py-2 text-left text-gray-500 font-semibold">Source</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {preview.map((m, i) => (
                    <tr key={i} className={m.isLeader ? "bg-indigo-50/50" : ""}>
                      <td className="px-4 py-2 text-gray-400">{i + 1}</td>
                      <td className="px-4 py-2 font-medium text-gray-800">{m.name}</td>
                      <td className="px-4 py-2 text-gray-600 font-mono">{m.studentId}</td>
                      <td className="px-4 py-2 text-gray-400 italic">{m.source}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {primary && (
              <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Surviving Proposal</p>
                <p className="text-xs font-semibold text-gray-700">{primary.title}</p>
                <a href={primary.description} target="_blank" rel="noreferrer" className="inline-flex items-center text-xs text-indigo-500 mt-1 hover:underline">
                  <LinkIcon /> View proposal link
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex gap-3 justify-end">
          <button
            onClick={onCancel}
            disabled={isMerging}
            className="px-5 py-2 text-sm font-semibold text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(primaryId, selectedProposals.filter((p) => p._id !== primaryId).map((p) => p._id))}
            disabled={!isValid || isMerging}
            className="px-5 py-2 text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 rounded-lg hover:from-violet-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
          >
            {isMerging ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                Merging…
              </>
            ) : (
              <>
                <MergeIcon /> Confirm Merge
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Bulk Schedule Panel ──────────────────────────────────────────────────────
// Admin picks a date, start time, and slot duration.
// Teams are assigned sequential slots in serial-number order.
const BulkSchedulePanel = ({ selectedProposals, onConfirm, onCancel, isSaving }) => {
  const [date, setDate] = useState(null);
  const [startTime, setStartTime] = useState(new Date(new Date().setHours(9, 0, 0, 0)));
  const [slotMinutes, setSlotMinutes] = useState(30);

  // Sort by serial number for preview
  const sorted = [...selectedProposals].sort(
    (a, b) => (a.serialNumber ?? 999) - (b.serialNumber ?? 999)
  );

  // Compute preview schedule
  const previewSlots = sorted.map((p, i) => {
    if (!date || !startTime) return { proposal: p, start: null, end: null };
    const slotStart = new Date(date);
    const t = new Date(startTime);
    slotStart.setHours(t.getHours(), t.getMinutes() + i * slotMinutes, 0, 0);
    const slotEnd = new Date(slotStart.getTime() + slotMinutes * 60 * 1000);
    return { proposal: p, start: slotStart, end: slotEnd };
  });

  const fmt = (d) =>
    d
      ? d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
      : "--:--";

  const canSave = date && startTime && selectedProposals.length > 0;

  const timePickerProps = {
    showTimeSelect: true,
    showTimeSelectOnly: true,
    timeIntervals: 15,
    dateFormat: "h:mm aa",
    className: "w-full text-xs p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-5">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <BulkCalendarIcon />
            Bulk Schedule Defense — {selectedProposals.length} team{selectedProposals.length !== 1 ? "s" : ""}
          </h2>
          <p className="text-indigo-200 text-xs mt-1">
            Teams are scheduled sequentially in serial-number order. Each team gets one time slot.
          </p>
        </div>

        <div className="p-6 space-y-5 max-h-[72vh] overflow-y-auto">
          {/* Controls row */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">Defense Date</label>
              <DatePicker
                selected={date}
                onChange={setDate}
                dateFormat="MMM d, yyyy"
                placeholderText="Pick a date"
                className="w-full text-xs p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">Start Time</label>
              <DatePicker
                selected={startTime}
                onChange={setStartTime}
                timeCaption="Start"
                {...timePickerProps}
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">Slot Duration</label>
              <select
                value={slotMinutes}
                onChange={(e) => setSlotMinutes(Number(e.target.value))}
                className="w-full text-xs p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white"
              >
                {[15, 20, 25, 30, 45, 60].map((m) => (
                  <option key={m} value={m}>{m} minutes</option>
                ))}
              </select>
            </div>
          </div>

          {/* Preview table */}
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2">
              Schedule Preview
            </p>
            <div className="rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-4 py-2.5 text-left text-gray-500 font-semibold w-10">SN</th>
                    <th className="px-4 py-2.5 text-left text-gray-500 font-semibold">Team</th>
                    <th className="px-4 py-2.5 text-left text-gray-500 font-semibold w-28">Start</th>
                    <th className="px-4 py-2.5 text-left text-gray-500 font-semibold w-28">End</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {previewSlots.map(({ proposal, start, end }, i) => (
                    <tr key={proposal._id} className={i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}>
                      <td className="px-4 py-2.5">
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-indigo-50 border border-indigo-200 text-[10px] font-bold text-indigo-700">
                          {proposal.serialNumber ?? "—"}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <p className="font-semibold text-gray-800 truncate max-w-[240px]">{proposal.title}</p>
                        <p className="text-gray-400 text-[10px] mt-0.5">{proposal.course?.courseCode}</p>
                      </td>
                      <td className="px-4 py-2.5 font-mono text-indigo-600 font-semibold">
                        {fmt(start)}
                      </td>
                      <td className="px-4 py-2.5 font-mono text-gray-500">
                        {fmt(end)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {date && (
              <p className="text-[11px] text-gray-400 mt-2 text-right">
                Last slot ends at{" "}
                <span className="font-semibold text-gray-600">
                  {fmt(previewSlots[previewSlots.length - 1]?.end)}
                </span>
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex gap-3 justify-end">
          <button
            onClick={onCancel}
            disabled={isSaving}
            className="px-5 py-2 text-sm font-semibold text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(previewSlots)}
            disabled={!canSave || isSaving}
            className="px-5 py-2 text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                Saving…
              </>
            ) : (
              <>
                <BulkCalendarIcon />
                Save {selectedProposals.length} Schedule{selectedProposals.length !== 1 ? "s" : ""}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Main component ──────────────────────────────────────────────────────────
const SubmissionsPage = () => {
  const [proposals, setProposals] = useState([]);
  const [filteredProposals, setFilteredProposals] = useState([]);
  const [allSupervisors, setAllSupervisors] = useState([]);
  const [coursesList, setCoursesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("official");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [courseFilter, setCourseFilter] = useState("all");

  // Merge state
  const [mergeMode, setMergeMode] = useState(false);
  const [selectedForMerge, setSelectedForMerge] = useState([]);
  const [showMergePanel, setShowMergePanel] = useState(false);
  const [isMerging, setIsMerging] = useState(false);

  // Bulk schedule state
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedForBulk, setSelectedForBulk] = useState([]); // array of proposal objects
  const [showBulkPanel, setShowBulkPanel] = useState(false);
  const [isBulkSaving, setIsBulkSaving] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const config = getAuthHeader();
      const [proposalsRes, usersRes] = await Promise.all([
        axios.get(`${API_BASE}/proposals`, config),
        axios.get(`${API_BASE}/users`, config),
      ]);
      setAllSupervisors(usersRes.data.filter((u) => u.role === "supervisor"));
      const rawData = proposalsRes.data;
      setCoursesList([...new Set(rawData.map((p) => p.course?.courseCode).filter(Boolean))]);
      const sortedData = sortProposalsByDate(rawData);
      setProposals(sortedData);
      setFilteredProposals(sortedData);
    } catch {
      toast.error("Could not load data.");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleDelete = async (id) => {
    const config = getAuthHeader();
    const deletePromise = axios.delete(`${API_BASE}/proposals/${id}`, config);
    toast.promise(deletePromise, {
      loading: "Deleting submission...",
      success: "Submission permanently deleted.",
      error: "Could not delete submission. Please try again.",
    });
    try {
      await deletePromise;
      setProposals((prev) => prev.filter((p) => p._id !== id));
    } catch (error) {
      console.error("Delete error:", error);
      fetchData();
    }
  };

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    let result = [...proposals];
    if (activeTab === "official") {
      result = result.filter((p) => {
        const memberCount = (p.teamMembers ?? []).length;
        return p.serialNumber !== null && memberCount >= 3 && memberCount <= 4;
      });
    } else {
      result = result.filter((p) => p.serialNumber === null);
    }
    if (statusFilter !== "all") result = result.filter((p) => p.status === statusFilter);
    if (courseFilter !== "all") result = result.filter((p) => p.course?.courseCode === courseFilter);
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(lower) ||
          p.course?.courseCode.toLowerCase().includes(lower) ||
          p.student?.name.toLowerCase().includes(lower) ||
          p.student?.studentId.includes(lower)
      );
    }
    setFilteredProposals(sortProposalsByDate(result));
  }, [searchTerm, statusFilter, courseFilter, proposals, activeTab]);

  // Reset merge selection when leaving Team Requests tab
  useEffect(() => {
    if (activeTab !== "requests") {
      setMergeMode(false);
      setSelectedForMerge([]);
    }
    if (activeTab !== "official") {
      setBulkMode(false);
      setSelectedForBulk([]);
    }
  }, [activeTab]);

  const handleDateUpdate = async (start, end, proposalId) => {
    const utcStart = fromBDToUTC(start).toISOString();
    const utcEnd = fromBDToUTC(end).toISOString();
    const updated = sortProposalsByDate(
      proposals.map((p) => p._id === proposalId ? { ...p, defenseDate: utcStart, defenseEndDate: utcEnd } : p)
    );
    setProposals(updated);
    setFilteredProposals(updated);
    try {
      await axios.put(`${API_BASE}/proposals/${proposalId}/defense-date`, { date: utcStart, endDate: utcEnd }, getAuthHeader());
      toast.success("Schedule Updated");
    } catch {
      toast.error("Failed to schedule");
      fetchData();
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    const promise = axios.put(`${API_BASE}/proposals/${id}`, { status: newStatus }, getAuthHeader());
    toast.promise(promise, { loading: "Updating...", success: "Updated!", error: "Failed." });
    try {
      await promise;
      fetchData();
    } catch {
      fetchData();
    }
  };

  const handleAssignSupervisor = async (proposalId, supervisorId) => {
    const supObj = allSupervisors.find((s) => s._id === supervisorId);
    const updated = proposals.map((p) => p._id === proposalId ? { ...p, assignedSupervisor: supObj } : p);
    setProposals(updated);
    try {
      await axios.put(`${API_BASE}/proposals/${proposalId}/assign-supervisor`, { supervisorId }, getAuthHeader());
      toast.success("Assigned!");
    } catch {
      toast.error("Failed");
      fetchData();
    }
  };

  // ── Merge handlers ──────────────────────────────────────────────────────
  const toggleMergeMode = () => {
    setMergeMode((prev) => !prev);
    setSelectedForMerge([]);
  };

  const toggleSelectForMerge = (proposal) => {
    setSelectedForMerge((prev) => {
      const exists = prev.find((p) => p._id === proposal._id);
      if (exists) return prev.filter((p) => p._id !== proposal._id);
      return [...prev, proposal];
    });
  };

  const handleMergeConfirm = async (primaryId, secondaryIds) => {
    setIsMerging(true);
    try {
      await axios.post(`${API_BASE}/proposals/merge`, { primaryId, secondaryIds }, getAuthHeader());
      toast.success("Teams merged successfully!");
      setShowMergePanel(false);
      setMergeMode(false);
      setSelectedForMerge([]);
      fetchData();
    } catch (err) {
      toast.error(err?.response?.data?.message ?? "Merge failed. Please try again.");
    } finally {
      setIsMerging(false);
    }
  };

  // ── Bulk schedule handlers ───────────────────────────────────────────────
  const toggleBulkMode = () => {
    setBulkMode((prev) => !prev);
    setSelectedForBulk([]);
  };

  const toggleSelectForBulk = (proposal) => {
    setSelectedForBulk((prev) => {
      const exists = prev.find((p) => p._id === proposal._id);
      if (exists) return prev.filter((p) => p._id !== proposal._id);
      return [...prev, proposal];
    });
  };

  const selectAllForBulk = () => {
    // Only approved proposals shown in the current filtered view
    const eligible = filteredProposals.filter((p) => p.status === "approved");
    const allSelected = eligible.every((p) => selectedForBulk.some((s) => s._id === p._id));
    if (allSelected) {
      setSelectedForBulk([]);
    } else {
      setSelectedForBulk(eligible);
    }
  };

  const handleBulkScheduleConfirm = async (previewSlots) => {
    setIsBulkSaving(true);
    try {
      const results = await Promise.allSettled(
        previewSlots.map(({ proposal, start, end }) =>
          axios.put(
            `${API_BASE}/proposals/${proposal._id}/defense-date`,
            {
              date:    fromBDToUTC(start)?.toISOString() ?? start.toISOString(),
              endDate: fromBDToUTC(end)?.toISOString()   ?? end.toISOString(),
            },
            getAuthHeader()
          )
        )
      );

      const failed = results.filter((r) => r.status === "rejected").length;
      const succeeded = results.length - failed;

      if (failed === 0) {
        toast.success(`${succeeded} schedule${succeeded !== 1 ? "s" : ""} saved successfully!`);
      } else {
        toast.error(`${succeeded} saved, ${failed} failed. Please retry the failed ones manually.`);
      }

      setShowBulkPanel(false);
      setBulkMode(false);
      setSelectedForBulk([]);
      fetchData();
    } catch {
      toast.error("Bulk schedule failed. Please try again.");
    } finally {
      setIsBulkSaving(false);
    }
  };

  // ── Row components ──────────────────────────────────────────────────────
  const SkeletonRows = () =>
    [...Array(4)].map((_, i) => (
      <tr key={i} className="animate-pulse">
        <td className="px-4 py-4"><div className="w-6 h-6 bg-gray-100 rounded-full mx-auto" /></td>
        <td className="px-6 py-4"><div className="w-32 h-4 bg-gray-100 rounded mb-2" /><div className="w-20 h-3 bg-gray-100 rounded" /></td>
        <td className="px-6 py-4"><div className="w-40 h-4 bg-gray-100 rounded" /></td>
        <td className="px-6 py-4"><div className="w-32 h-8 bg-gray-100 rounded" /></td>
        <td className="px-6 py-4"><div className="w-32 h-8 bg-gray-100 rounded" /></td>
        <td className="px-6 py-4"><div className="w-16 h-6 mx-auto bg-gray-100 rounded-full" /></td>
        <td className="px-6 py-4"><div className="w-8 h-8 ml-auto bg-gray-100 rounded" /></td>
      </tr>
    ));

  const EmptyRow = () => (
    <tr>
      <td colSpan="8" className="px-6 py-20 text-center">
        <div className="flex flex-col items-center justify-center text-gray-400">
          <EmptyStateIcon />
          <p className="text-lg font-medium text-gray-600">No submissions found</p>
        </div>
      </td>
    </tr>
  );

  const ProposalRow = ({ proposal }) => {
    const isSelected = selectedForMerge.some((p) => p._id === proposal._id);
    const isBulkSelected = selectedForBulk.some((p) => p._id === proposal._id);

    // Course lock for merge mode
    const lockedCourseCode = selectedForMerge[0]?.course?.courseCode ?? null;
    const isDifferentCourse =
      mergeMode &&
      lockedCourseCode !== null &&
      !isSelected &&
      proposal.course?.courseCode !== lockedCourseCode;

    // In bulk mode, only approved proposals are selectable
    const isBulkDisabled = bulkMode && proposal.status !== "approved";

    const handleRowClick = () => {
      if (mergeMode && !isDifferentCourse) toggleSelectForMerge(proposal);
      if (bulkMode && !isBulkDisabled) toggleSelectForBulk(proposal);
    };

    return (
      <tr
        className={`group transition-colors duration-150 ${
          isDifferentCourse
            ? "opacity-40 cursor-not-allowed bg-gray-50"
            : isBulkDisabled
            ? "opacity-40 cursor-not-allowed"
            : bulkMode && isBulkSelected
            ? "bg-blue-50 border-l-4 border-blue-500"
            : mergeMode && isSelected
            ? "bg-violet-50 border-l-4 border-violet-500"
            : mergeMode || bulkMode
            ? "hover:bg-gray-50/80 cursor-pointer"
            : "hover:bg-gray-50/80"
        }`}
        onClick={(mergeMode || bulkMode) ? handleRowClick : undefined}
        title={
          isDifferentCourse
            ? `Only ${lockedCourseCode} proposals can be merged together`
            : isBulkDisabled
            ? "Only approved teams can be scheduled"
            : undefined
        }
      >
        {/* Merge checkbox / Bulk checkbox / Serial number */}
        <td className="px-4 py-4 text-center align-top w-10">
          {mergeMode ? (
            <span className={`inline-flex items-center justify-center w-5 h-5 rounded border-2 transition-all ${
              isSelected
                ? "bg-violet-600 border-violet-600 text-white"
                : isDifferentCourse
                ? "border-gray-200 bg-gray-100"
                : "border-gray-300 bg-white"
            }`}>
              {isSelected && <CheckIcon />}
            </span>
          ) : bulkMode ? (
            <span className={`inline-flex items-center justify-center w-5 h-5 rounded border-2 transition-all ${
              isBulkSelected
                ? "bg-blue-600 border-blue-600 text-white"
                : isBulkDisabled
                ? "border-gray-200 bg-gray-100"
                : "border-gray-300 bg-white"
            }`}>
              {isBulkSelected && <CheckIcon />}
            </span>
          ) : proposal.serialNumber != null ? (
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-indigo-50 border border-indigo-200 text-xs font-bold text-indigo-700">
              {proposal.serialNumber}
            </span>
          ) : (
            <span className="text-xs text-gray-300">—</span>
          )}
        </td>

        {/* Project info */}
        <td className="px-6 py-4 align-top max-w-[250px]">
          <div className="flex flex-col gap-1.5">
            <span className="inline-flex self-start px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 font-mono tracking-wide">
              {proposal.course?.courseCode || "N/A"}
            </span>
            <div className="text-sm font-semibold text-gray-900 leading-snug break-words">{proposal.title}</div>
            <a href={proposal.description} target="_blank" rel="noreferrer" onClick={(e) => mergeMode && e.preventDefault()}
              className="inline-flex items-center text-xs font-medium text-gray-500 hover:text-indigo-600 transition-colors mt-1">
              <LinkIcon /> View Proposal
            </a>
          </div>
        </td>

        {/* Team members */}
        <td className="px-6 py-4 align-top">
          {/* Leader row */}
          {proposal.student && (
            <div className="flex items-center gap-2 text-xs text-gray-600 mb-1">
              <svg className="w-3.5 h-3.5 text-indigo-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="font-medium text-indigo-700">
                {proposal.student.name}{" "}
                <span className="text-gray-400 font-normal">({proposal.student.studentId})</span>
              </span>
            </div>
          )}
          {(() => {
            const leaderStudentId = proposal.student?.studentId;
            const filteredMembers = (proposal.teamMembers ?? []).filter(
              (m) => m.studentId !== leaderStudentId
            );
            return filteredMembers.length > 0 ? (
              <div className="space-y-1.5 mt-1">
                {filteredMembers.map((member, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs text-gray-600">
                    <TeamIcon />
                    <span>{member.name} <span className="text-gray-400">({member.studentId})</span></span>
                  </div>
                ))}
              </div>
            ) : null;
          })()}
        </td>

        {/* Defense schedule */}
        <td className="px-6 py-4 align-top">
          {proposal.status === "approved" && !mergeMode ? (
            <DefenseScheduler proposal={proposal} onSave={(s, e) => handleDateUpdate(s, e, proposal._id)} />
          ) : (
            <span className="text-xs text-gray-400 italic">--</span>
          )}
        </td>

        {/* Supervisor */}
        <td className="px-6 py-4 align-top min-w-[160px]">
          {mergeMode ? (
            <span className="text-xs text-gray-400 italic">—</span>
          ) : (
            <select
              className={`block w-full py-2 pl-3 pr-8 text-xs font-medium border rounded-lg shadow-sm ${proposal.assignedSupervisor ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-white border-gray-200 text-gray-500"}`}
              value={proposal.assignedSupervisor?._id || ""}
              onChange={(e) => handleAssignSupervisor(proposal._id, e.target.value)}
              disabled={proposal.status !== "approved"}
              onClick={(e) => e.stopPropagation()}
            >
              <option value="" disabled>Select</option>
              {allSupervisors.map((sup) => (
                <option key={sup._id} value={sup._id}>
                  {sup.abbreviation || sup.name}
                  {proposal.supervisors?.some((s) => s._id === sup._id) ? " (Pref)" : ""}
                </option>
              ))}
            </select>
          )}
        </td>

        <td className="px-6 py-4 text-center align-top">
          <StatusBadge status={proposal.status} />
        </td>

        {/* Actions */}
        <td className="px-6 py-4 text-right align-top whitespace-nowrap">
          {mergeMode ? (
            <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg transition-colors ${
              isSelected
                ? "bg-violet-100 text-violet-700"
                : isDifferentCourse
                ? "text-gray-300"
                : "text-gray-400"
            }`}>
              {isSelected
                ? "Selected"
                : isDifferentCourse
                ? `${lockedCourseCode} only`
                : "Click to select"}
            </span>
          ) : bulkMode ? (
            <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg transition-colors ${
              isBulkSelected
                ? "bg-blue-100 text-blue-700"
                : isBulkDisabled
                ? "text-gray-300"
                : "text-gray-400"
            }`}>
              {isBulkSelected ? "Selected" : isBulkDisabled ? "Not approved" : "Click to select"}
            </span>
          ) : (
            <div className="flex justify-end gap-2">
              {proposal.status !== "rejected" ? (
                <button onClick={(e) => { e.stopPropagation(); handleStatusChange(proposal._id, "rejected"); }}
                  className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors" title="Reject">
                  <XIcon />
                </button>
              ) : (
                <button onClick={(e) => { e.stopPropagation(); handleStatusChange(proposal._id, "approved"); }}
                  className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="Approve">
                  <RestoreIcon />
                </button>
              )}
              <button onClick={(e) => { e.stopPropagation(); handleDelete(proposal._id); }}
                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" title="Delete Permanently">
                <TrashIcon />
              </button>
            </div>
          )}
        </td>
      </tr>
    );
  };

  const teamRequestCount = proposals.filter((p) => p.serialNumber === null).length;

  return (
    <div className="min-h-screen p-6 md:p-2 font-sans">
      <GlobalDatePickerStyles />
      <Toaster position="top-right" />

      {/* Merge Panel Modal */}
      {showMergePanel && (
        <MergePanel
          selectedProposals={selectedForMerge}
          onConfirm={handleMergeConfirm}
          onCancel={() => setShowMergePanel(false)}
          isMerging={isMerging}
        />
      )}

      {/* Bulk Schedule Modal */}
      {showBulkPanel && (
        <BulkSchedulePanel
          selectedProposals={selectedForBulk}
          onConfirm={handleBulkScheduleConfirm}
          onCancel={() => setShowBulkPanel(false)}
          isSaving={isBulkSaving}
        />
      )}

      {/* Header */}
      <div className="flex flex-col mb-8 md:flex-row md:items-center md:justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Submissions</h1>
          <p className="mt-1 text-sm text-gray-500 font-medium">
            Manage project proposals, supervisors, and defense schedules.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          {/* Tabs */}
          <div className="flex bg-gray-200/50 rounded-xl w-fit">
            <button
              onClick={() => setActiveTab("official")}
              className={`px-5 py-1 text-[11px] font-bold rounded-lg transition-all ${activeTab === "official" ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
            >
              Official Teams
            </button>
            <button
              onClick={() => setActiveTab("requests")}
              className={`px-5 py-1 text-[11px] font-bold rounded-lg transition-all ${activeTab === "requests" ? "bg-white text-orange-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
            >
              Team Requests
              <span className="ml-2 px-1.5 py-0.5 text-[10px] bg-orange-100 text-orange-600 rounded-full">
                {teamRequestCount}
              </span>
            </button>
          </div>

          {/* Search */}
          <div className="relative group min-w-[140px]">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400 group-focus-within:text-indigo-500 transition-colors">
              <SearchIcon />
            </div>
            <input
              type="text"
              placeholder="Search..."
              className="block w-full py-2.5 pl-10 pr-4 text-sm bg-white border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder-gray-400 text-gray-700"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Course filter */}
          <div className="relative min-w-[140px]">
            <select
              value={courseFilter}
              onChange={(e) => setCourseFilter(e.target.value)}
              className="block w-full py-2.5 pl-3 pr-8 text-sm bg-white border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer appearance-none text-gray-700 font-medium"
            >
              <option value="all">All Courses</option>
              {coursesList.map((c) => (<option key={c} value={c}>{c}</option>))}
            </select>
            <ChevronDown />
          </div>

          {/* Status filter */}
          <div className="relative min-w-[120px]">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="block w-full py-2.5 pl-3 pr-8 text-sm bg-white border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer appearance-none text-gray-700 font-medium"
            >
              <option value="all">All Status</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
            <ChevronDown />
          </div>
        </div>
      </div>

      {/* Merge mode toolbar — only visible on Team Requests tab */}
      {activeTab === "requests" && (
        <div className={`mb-4 flex items-center gap-3 px-5 py-3 rounded-xl border transition-all ${
          mergeMode ? "bg-violet-50 border-violet-200" : "bg-white border-gray-200"
        }`}>
          <button
            onClick={toggleMergeMode}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all ${
              mergeMode
                ? "bg-violet-600 text-white hover:bg-violet-700"
                : "bg-white border border-gray-300 text-gray-700 hover:border-violet-400 hover:text-violet-700"
            }`}
          >
            <MergeIcon />
            {mergeMode ? "Exit Merge Mode" : "Merge Teams"}
          </button>

          {mergeMode && (
            <>
              <span className="text-xs text-violet-700 font-medium">
                {selectedForMerge.length === 0
                  ? "Click rows to select proposals to merge"
                  : `${selectedForMerge.length} proposal${selectedForMerge.length > 1 ? "s" : ""} selected`}
              </span>

              {selectedForMerge.length > 0 && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-indigo-100 text-indigo-700 border border-indigo-200">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Locked to: {selectedForMerge[0]?.course?.courseCode}
                </span>
              )}

              {selectedForMerge.length >= 2 && (
                <button
                  onClick={() => setShowMergePanel(true)}
                  className="ml-auto flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-violet-600 to-indigo-600 rounded-lg hover:from-violet-700 hover:to-indigo-700 transition-all shadow-sm"
                >
                  <MergeIcon />
                  Preview &amp; Merge ({selectedForMerge.length})
                </button>
              )}
            </>
          )}
        </div>
      )}

      {/* Bulk schedule toolbar — only visible on Official Teams tab */}
      {activeTab === "official" && (
        <div className={`mb-4 flex items-center gap-3 px-5 py-3 rounded-xl border transition-all ${
          bulkMode ? "bg-blue-50 border-blue-200" : "bg-white border-gray-200"
        }`}>
          <button
            onClick={toggleBulkMode}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all ${
              bulkMode
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "bg-white border border-gray-300 text-gray-700 hover:border-blue-400 hover:text-blue-700"
            }`}
          >
            <BulkCalendarIcon />
            {bulkMode ? "Exit Bulk Schedule" : "Bulk Schedule"}
          </button>

          {bulkMode && (
            <>
              <span className="text-xs text-blue-700 font-medium">
                {selectedForBulk.length === 0
                  ? "Click rows or use the header checkbox to select teams"
                  : `${selectedForBulk.length} team${selectedForBulk.length !== 1 ? "s" : ""} selected`}
              </span>

              <button
                onClick={selectAllForBulk}
                className="text-xs font-bold text-blue-600 hover:text-blue-800 underline underline-offset-2"
              >
                {filteredProposals.filter(p => p.status === "approved").every(p => selectedForBulk.some(s => s._id === p._id))
                  ? "Deselect All"
                  : "Select All"}
              </button>

              {selectedForBulk.length >= 1 && (
                <button
                  onClick={() => setShowBulkPanel(true)}
                  className="ml-auto flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-sm"
                >
                  <BulkCalendarIcon />
                  Set Schedule ({selectedForBulk.length})
                </button>
              )}
            </>
          )}
        </div>
      )}

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto min-h-[400px]">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50/50">
              <tr>
                {[
                  { label: mergeMode ? "✓" : bulkMode ? "all" : "SN", align: "text-center", isBulkAll: bulkMode },
                  { label: "Project", align: "text-left" },
                  { label: "Team Members", align: "text-left" },
                  { label: "Defense Schedule", align: "text-left" },
                  { label: "Assign Supervisor", align: "text-left" },
                  { label: "Status", align: "text-center" },
                  { label: "Actions", align: "text-right" },
                ].map(({ label, align, isBulkAll }) => (
                  <th
                    key={label}
                    className={`px-6 py-4 text-xs font-semibold tracking-wide text-gray-500 uppercase ${align}`}
                    onClick={isBulkAll ? selectAllForBulk : undefined}
                    style={isBulkAll ? { cursor: "pointer" } : undefined}
                    title={isBulkAll ? "Select / deselect all approved teams" : undefined}
                  >
                    {isBulkAll ? (
                      <span className={`inline-flex items-center justify-center w-5 h-5 rounded border-2 transition-all ${
                        filteredProposals.filter(p => p.status === "approved").length > 0 &&
                        filteredProposals.filter(p => p.status === "approved").every(p => selectedForBulk.some(s => s._id === p._id))
                          ? "bg-blue-600 border-blue-600 text-white"
                          : "border-gray-400 bg-white"
                      }`}>
                        {filteredProposals.filter(p => p.status === "approved").length > 0 &&
                         filteredProposals.filter(p => p.status === "approved").every(p => selectedForBulk.some(s => s._id === p._id))
                          && <CheckIcon />}
                      </span>
                    ) : label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <SkeletonRows />
              ) : filteredProposals.length === 0 ? (
                <EmptyRow />
              ) : (
                filteredProposals.map((proposal) => (
                  <ProposalRow key={proposal._id} proposal={proposal} />
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="bg-gray-50 border-t border-gray-200 px-6 py-3 text-xs text-gray-500 flex justify-between items-center">
          <span>Showing {filteredProposals.length} submissions</span>
          {mergeMode && selectedForMerge.length > 0 && (
            <span className="font-semibold text-violet-600">
              {selectedForMerge.length} selected for merge
            </span>
          )}
          {bulkMode && selectedForBulk.length > 0 && (
            <span className="font-semibold text-blue-600">
              {selectedForBulk.length} selected for scheduling
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubmissionsPage;