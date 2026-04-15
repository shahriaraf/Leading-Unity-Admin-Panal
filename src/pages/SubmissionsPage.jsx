import React, { useState, useEffect } from "react";
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

// ... (Timezone helpers remain the same) ...
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

// --- Sort Helper ---
// 1. Sorts by Defense Date (Earliest first)
// 2. Then puts unscheduled items at the bottom
// --- Updated Sort Helper ---
const sortProposalsByDate = (list) => {
  const now = new Date();

  return [...list].sort((a, b) => {
    const dateA = a.defenseDate ? new Date(a.defenseDate) : null;
    const dateB = b.defenseDate ? new Date(b.defenseDate) : null;

    const isPassedA = dateA && dateA < now;
    const isPassedB = dateB && dateB < now;

    // 1. Handle "Passed" status (Move finished defenses to the absolute bottom)
    if (isPassedA && !isPassedB) return 1;
    if (!isPassedA && isPassedB) return -1;

    // 2. Handle "Unscheduled" (Move null dates below upcoming but above passed)
    if (dateA && !dateB) return -1;
    if (!dateA && dateB) return 1;

    // 3. Both have dates (Both Upcoming OR Both Passed)
    if (dateA && dateB) {
      const diff = dateA - dateB;
      if (diff !== 0) return diff; // Earlier dates first
      return (a.serialNumber ?? 999) - (b.serialNumber ?? 999);
    }

    // 4. Both are unscheduled
    return (a.serialNumber ?? 999) - (b.serialNumber ?? 999);
  });
};

// --- Icons ---
// ... (Keep existing icons: SearchIcon, TeamIcon, LinkIcon, XIcon, RestoreIcon, EmptyStateIcon) ...
const SearchIcon = () => (
  <svg
    className="w-4 h-4 text-gray-400"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
    />
  </svg>
);
// Add this icon helper at the top with your other icons
const TrashIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);
const TeamIcon = () => (
  <svg
    className="w-3.5 h-3.5 text-gray-400 shrink-0"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
    />
  </svg>
);
const LinkIcon = () => (
  <svg
    className="w-3 h-3 mr-1"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
    />
  </svg>
);
const XIcon = () => (
  <svg
    className="w-3.5 h-3.5 mr-1"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M6 18L18 6M6 6l12 12"
    />
  </svg>
);
const RestoreIcon = () => (
  <svg
    className="w-3.5 h-3.5 mr-1"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
    />
  </svg>
);
const EmptyStateIcon = () => (
  <svg
    className="w-16 h-16 text-gray-200 mb-4"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1"
      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
    />
  </svg>
);

// ... (GlobalDatePickerStyles same as before) ...
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

// ... (DefenseScheduler same as before) ...
const DefenseScheduler = ({ proposal, onSave }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(
    proposal.defenseDate ? toBDDate(proposal.defenseDate) : null,
  );
  const [startTime, setStartTime] = useState(
    proposal.defenseDate
      ? toBDDate(proposal.defenseDate)
      : new Date().setHours(9, 0, 0),
  );
  const [endTime, setEndTime] = useState(
    proposal.defenseEndDate
      ? toBDDate(proposal.defenseEndDate)
      : new Date().setHours(9, 30, 0),
  );

  const handleSave = () => {
    if (!selectedDate) return;
    const buildDateTime = (base, time) => {
      const d = new Date(base);
      const t = new Date(time);
      d.setHours(t.getHours(), t.getMinutes());
      return d;
    };
    onSave(
      buildDateTime(selectedDate, startTime),
      buildDateTime(selectedDate, endTime),
    );
    setIsOpen(false);
  };

  const displayString =
    proposal.defenseDate && proposal.defenseEndDate
      ? `${toBDDate(proposal.defenseDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })} • ${toBDDate(proposal.defenseDate).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })} - ${toBDDate(proposal.defenseEndDate).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}`
      : "-- Set Schedule --";

  const timePickerProps = {
    showTimeSelect: true,
    showTimeSelectOnly: true,
    timeIntervals: 15,
    dateFormat: "h:mm aa",
    className: "w-full text-xs p-2 border rounded",
  };

  return (
    <div className="relative w-[220px]">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center w-full px-3 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 transition-all text-left"
      >
        <span className="mr-2 text-purple-500">
          <CalendarCheck className="text-xs" />
        </span>
        <span className="truncate">{displayString}</span>
      </button>
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 z-50 bg-white border border-gray-200 rounded-xl shadow-xl p-4 w-[280px]">
          <h4 className="text-xs font-bold text-gray-500 uppercase mb-3">
            Schedule Defense
          </h4>
          <div className="space-y-3">
            <div>
              <label className="block text-[10px] font-semibold text-gray-400 mb-1">
                Date
              </label>
              <DatePicker
                selected={selectedDate}
                onChange={setSelectedDate}
                dateFormat="MMM d, yyyy"
                className="w-full text-xs p-2 border rounded"
              />
            </div>
            <div className="flex gap-2">
              <div className="w-1/2">
                <label className="block text-[10px] font-semibold text-gray-400 mb-1">
                  Start
                </label>
                <DatePicker
                  selected={startTime}
                  onChange={setStartTime}
                  timeCaption="Start"
                  {...timePickerProps}
                />
              </div>
              <div className="w-1/2">
                <label className="block text-[10px] font-semibold text-gray-400 mb-1">
                  End
                </label>
                <DatePicker
                  selected={endTime}
                  onChange={setEndTime}
                  timeCaption="End"
                  {...timePickerProps}
                />
              </div>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => setIsOpen(false)}
              className="flex-1 py-1.5 text-xs font-semibold text-gray-600 bg-gray-100 rounded hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex-1 py-1.5 text-xs font-semibold text-white bg-indigo-600 rounded hover:bg-indigo-700"
            >
              Save
            </button>
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
  <span
    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide border ${STATUS_STYLES[status] || STATUS_STYLES.pending}`}
  >
    {status}
  </span>
);

const ChevronDown = () => (
  <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-gray-400">
    <svg
      className="w-4 h-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M19 9l-7 7-7-7"
      />
    </svg>
  </div>
);

// =========================================================
// MAIN COMPONENT
// =========================================================
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

  const fetchData = async () => {
    try {
      const config = getAuthHeader();
      const [proposalsRes, usersRes] = await Promise.all([
        axios.get(`${API_BASE}/proposals`, config),
        axios.get(`${API_BASE}/users`, config),
      ]);

      setAllSupervisors(usersRes.data.filter((u) => u.role === "supervisor"));

      const rawData = proposalsRes.data;
      // Apply the strict chronological sort immediately
      setCoursesList([
        ...new Set(rawData.map((p) => p.course?.courseCode).filter(Boolean)),
      ]);


      const sortedData = sortProposalsByDate(rawData);
      setProposals(sortedData);
      setFilteredProposals(sortedData);
    } catch {
      toast.error("Could not load data.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    const config = getAuthHeader();

    // 2. Create the promise for the toast
    const deletePromise = axios.delete(`${API_BASE}/proposals/${id}`, config);

    // 3. Fire the toast notification
    toast.promise(deletePromise, {
      loading: 'Deleting submission...',
      success: 'Submission permanently deleted.',
      error: 'Could not delete submission. Please try again.',
    });

    try {
      await deletePromise;
      // 4. Update UI state immediately upon success
      setProposals((prev) => prev.filter((p) => p._id !== id));
    } catch (error) {
      console.error("Delete error:", error);
      // If it fails, fetchData to ensure UI is in sync with DB
      fetchData();
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    let result = [...proposals];

    if (activeTab === "official") {
      // Logic: Must have a serialNumber AND 3-4 members (matches NestJS)
      result = result.filter((p) => {
        const memberCount = (p.teamMembers ?? []).length;
        return p.serialNumber !== null && memberCount >= 3 && memberCount <= 4;
      });
    } else {
      // Logic: Team Requests are those where serialNumber is null (less than 3 members)
      result = result.filter((p) => p.serialNumber === null);
    }

    // Apply Status Filter
    if (statusFilter !== "all") {
      result = result.filter((p) => p.status === statusFilter);
    }

    // Apply Course Filter
    if (courseFilter !== "all") {
      result = result.filter((p) => p.course?.courseCode === courseFilter);
    }

    // Apply Search Term
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

    // Always keep the Defense Date sort order for the schedule view
    setFilteredProposals(sortProposalsByDate(result));
  }, [searchTerm, statusFilter, courseFilter, proposals, activeTab]);

  const handleDateUpdate = async (start, end, proposalId) => {
    const utcStart = fromBDToUTC(start).toISOString();
    const utcEnd = fromBDToUTC(end).toISOString();

    // Map the new date then re-sort the entire list
    const updated = sortProposalsByDate(
      proposals.map((p) =>
        p._id === proposalId
          ? { ...p, defenseDate: utcStart, defenseEndDate: utcEnd }
          : p,
      )
    );
    setProposals(updated);
    setFilteredProposals(updated); // UI re-sorts, but Serial Number stays same

    try {
      await axios.put(
        `${API_BASE}/proposals/${proposalId}/defense-date`,
        { date: utcStart, endDate: utcEnd },
        getAuthHeader(),
      );
      toast.success("Schedule Updated");
    } catch {
      toast.error("Failed to schedule");
      fetchData();
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    const promise = axios.put(
      `${API_BASE}/proposals/${id}`,
      { status: newStatus },
      getAuthHeader(),
    );
    toast.promise(promise, {
      loading: "Updating...",
      success: "Updated!",
      error: "Failed.",
    });
    try {
      await promise;
      fetchData();
    } catch {
      fetchData();
    }
  };

  const handleAssignSupervisor = async (proposalId, supervisorId) => {
    const supObj = allSupervisors.find((s) => s._id === supervisorId);
    // Keep serialNumber when updating state
    const updated = proposals.map((p) =>
      p._id === proposalId ? { ...p, assignedSupervisor: supObj } : p,
    );
    setProposals(updated);

    try {
      await axios.put(
        `${API_BASE}/proposals/${proposalId}/assign-supervisor`,
        { supervisorId },
        getAuthHeader(),
      );
      toast.success("Assigned!");
    } catch {
      toast.error("Failed");
      fetchData();
    }
  };

  // --- Rows ---
  const SkeletonRows = () =>
    [...Array(4)].map((_, i) => (
      <tr key={i} className="animate-pulse">
        <td className="px-4 py-4">
          <div className="w-6 h-6 bg-gray-100 rounded-full mx-auto" />
        </td>
        <td className="px-6 py-4">
          <div className="w-32 h-4 bg-gray-100 rounded mb-2" />
          <div className="w-20 h-3 bg-gray-100 rounded" />
        </td>
        <td className="px-6 py-4">
          <div className="w-40 h-4 bg-gray-100 rounded" />
        </td>
        <td className="px-6 py-4">
          <div className="w-32 h-8 bg-gray-100 rounded" />
        </td>
        <td className="px-6 py-4">
          <div className="w-32 h-8 bg-gray-100 rounded" />
        </td>
        <td className="px-6 py-4">
          <div className="w-16 h-6 mx-auto bg-gray-100 rounded-full" />
        </td>
        <td className="px-6 py-4">
          <div className="w-8 h-8 ml-auto bg-gray-100 rounded" />
        </td>
      </tr>
    ));

  const EmptyRow = () => (
    <tr>
      <td colSpan="8" className="px-6 py-20 text-center">
        <div className="flex flex-col items-center justify-center text-gray-400">
          <EmptyStateIcon />
          <p className="text-lg font-medium text-gray-600">
            No submissions found
          </p>
        </div>
      </td>
    </tr>
  );

  const ProposalRow = ({ proposal }) => (
    <tr className="group hover:bg-gray-50/80 transition-colors duration-150">
      {/* Serial number — stable, assigned at submission */}
      <td className="px-4 py-4 text-center align-top w-10">
        {proposal.serialNumber != null ? (
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
          <div className="text-sm font-semibold text-gray-900 leading-snug break-words">
            {proposal.title}
          </div>
          <a
            href={proposal.description}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center text-xs font-medium text-gray-500 hover:text-indigo-600 transition-colors mt-1"
          >
            <LinkIcon /> View Proposal
          </a>
        </div>
      </td>

      {/* Team members */}
      <td className="px-6 py-4 align-top">
        {proposal.teamMembers?.length > 0 ? (
          <div className="space-y-2">
            {proposal.teamMembers.map((member, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 text-xs text-gray-600"
              >
                <TeamIcon />
                <span>
                  {member.name}{" "}
                  <span className="text-gray-400">({member.studentId})</span>
                </span>
              </div>
            ))}
          </div>
        ) : (
          <span className="text-xs text-gray-400 italic">
            No members listed
          </span>
        )}
      </td>

      {/* Defense schedule */}
      <td className="px-6 py-4 align-top">
        {proposal.status === "approved" ? (
          <DefenseScheduler
            proposal={proposal}
            onSave={(s, e) => handleDateUpdate(s, e, proposal._id)}
          />
        ) : (
          <span className="text-xs text-gray-400 italic">--</span>
        )}
      </td>

      {/* Supervisor */}
      <td className="px-6 py-4 align-top min-w-[160px]">
        <select
          className={`block w-full py-2 pl-3 pr-8 text-xs font-medium border rounded-lg shadow-sm ${proposal.assignedSupervisor ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-white border-gray-200 text-gray-500"}`}
          value={proposal.assignedSupervisor?._id || ""}
          onChange={(e) => handleAssignSupervisor(proposal._id, e.target.value)}
          disabled={proposal.status !== "approved"}
        >
          <option value="" disabled>
            Select
          </option>
          {allSupervisors.map((sup) => (
            <option key={sup._id} value={sup._id}>
              {sup.abbreviation || sup.name}
              {proposal.supervisors?.some((s) => s._id === sup._id)
                ? " (Pref)"
                : ""}
            </option>
          ))}
        </select>
      </td>

      <td className="px-6 py-4 text-center align-top">
        <StatusBadge status={proposal.status} />
      </td>

      {/* Actions */}
      <td className="px-6 py-4 text-right align-top whitespace-nowrap">
        <div className="flex justify-end gap-2">
          {proposal.status !== "rejected" ? (
            <button
              onClick={() => handleStatusChange(proposal._id, "rejected")}
              className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
              title="Reject"
            >
              <XIcon />
            </button>
          ) : (
            <button
              onClick={() => handleStatusChange(proposal._id, "approved")}
              className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
              title="Approve"
            >
              <RestoreIcon />
            </button>
          )}

          {/* New Delete Button */}
          <button
            onClick={() => handleDelete(proposal._id)}
            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
            title="Delete Permanently"
          >
            <TrashIcon /> {/* Use the SVG helper provided in the previous message */}
          </button>
        </div>
      </td>

    </tr>
  );

  return (
    <div className="min-h-screen p-6 md:p-2 font-sans">
      <GlobalDatePickerStyles />
      <Toaster position="top-right" />

      {/* Header */}
      <div className="flex flex-col mb-8 md:flex-row md:items-center md:justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Submissions
          </h1>
          <p className="mt-1 text-sm text-gray-500 font-medium">
            Manage project proposals, supervisors, and defense schedules.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex bg-gray-200/50 rounded-xl w-fit">
            <button
              onClick={() => setActiveTab("official")}
              className={`px-5 py-1 text-[11px] font-bold rounded-lg transition-all ${activeTab === "official"
                ? "bg-white text-indigo-600 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
                }`}
            >
              Official Teams
            </button>
            <button
              onClick={() => setActiveTab("requests")}
              className={`px-5 py-1 text-[11px] font-bold rounded-lg transition-all ${activeTab === "requests"
                ? "bg-white text-orange-600 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
                }`}
            >
              Team Requests
              <span className="ml-2 px-1.5 py-0.5 text-[10px] bg-orange-100 text-orange-600 rounded-full">
                {proposals.filter(p => p.serialNumber === null).length}
              </span>
            </button>
          </div>
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

          <div className="relative min-w-[140px]">
            <select
              value={courseFilter}
              onChange={(e) => setCourseFilter(e.target.value)}
              className="block w-full py-2.5 pl-3 pr-8 text-sm bg-white border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer appearance-none text-gray-700 font-medium"
            >
              <option value="all">All Courses</option>
              {coursesList.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <ChevronDown />
          </div>

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

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto min-h-[400px]">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50/50">
              <tr>
                {[
                  { label: "SN", align: "text-center" },
                  { label: "Project", align: "text-left" },
                  { label: "Team Members", align: "text-left" },
                  { label: "Defense Schedule", align: "text-left" },
                  { label: "Assign Supervisor", align: "text-left" },
                  { label: "Status", align: "text-center" },
                  { label: "Actions", align: "text-right" },
                ].map(({ label, align }) => (
                  <th
                    key={label}
                    className={`px-6 py-4 text-xs font-semibold tracking-wide text-gray-500 uppercase ${align}`}
                  >
                    {label}
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
        </div>
      </div>
    </div>
  );
};

export default SubmissionsPage;
