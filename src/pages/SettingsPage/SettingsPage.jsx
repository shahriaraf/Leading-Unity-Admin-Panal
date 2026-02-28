import React, { useState, useEffect } from "react";
import toast, { Toaster } from "react-hot-toast";
import { api } from "./api";
import ToggleCard from "./ToggleCard";
import ScoringConfig from "./ScoringConfig";
import DataExport from "./DataExport";
import DangerZone from "./DangerZone";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Calendar, Lock, AlertTriangle, Clock, MailOpen } from "lucide-react";

const DEFAULT_CONFIG = {
  criteria1Name: "Defense 1",
  criteria1Max: 30,
  criteria2Name: "Defense 2",
  criteria2Max: 30,
  ownTeamCriteria1Name: "Own 1",
  ownTeamCriteria1Max: 40,
  ownTeamCriteria2Name: "Own 2",
  ownTeamCriteria2Max: 40,
};

const DeadlinePickerStyles = () => (
  <style>{`
    .deadline-picker-wrapper { width: 100%; }
    .deadline-picker-wrapper .react-datepicker-wrapper { width: 100%; }
    .deadline-picker-wrapper .react-datepicker__input-container { width: 100%; }
    .deadline-picker-wrapper .react-datepicker__close-icon { right: 8px; }
    .deadline-picker-wrapper .react-datepicker__close-icon::after {
      background-color: #94a3b8;
      border-radius: 50%;
      font-size: 12px;
      width: 16px;
      height: 16px;
      line-height: 16px;
    }
    .deadline-picker-wrapper .react-datepicker__close-icon:hover::after {
      background-color: #64748b;
    }
    .react-datepicker-popper { z-index: 9999 !important; }
    .react-datepicker {
      font-family: inherit !important;
      border-radius: 16px !important;
      box-shadow: 0 20px 60px rgba(0,0,0,0.15) !important;
      border: 1px solid #e2e8f0 !important;
      overflow: hidden;
      max-width: calc(100vw - 32px) !important;
    }
    .react-datepicker__header {
      background: #f8fafc !important;
      border-bottom: 1px solid #e2e8f0 !important;
      padding-top: 12px !important;
    }
    .react-datepicker__current-month {
      font-size: 13px !important;
      font-weight: 700 !important;
      color: #1e293b !important;
    }
    .react-datepicker__day--selected,
    .react-datepicker__day--keyboard-selected {
      background-color: #6366f1 !important;
      border-radius: 8px !important;
      font-weight: 700 !important;
    }
    .react-datepicker__day:hover {
      background-color: #eef2ff !important;
      border-radius: 8px !important;
      color: #4338ca !important;
    }
    .react-datepicker__time-container {
      border-left: 1px solid #e2e8f0 !important;
    }
    .react-datepicker__time-list-item--selected {
      background-color: #6366f1 !important;
      font-weight: 700 !important;
    }
    .react-datepicker__time-list-item:hover {
      background-color: #eef2ff !important;
      color: #4338ca !important;
    }
    .react-datepicker__navigation-icon::before {
      border-color: #64748b !important;
    }
    /* Stack time panel below calendar on very small screens */
    @media (max-width: 400px) {
      .react-datepicker__time-container {
        width: 100% !important;
        border-left: none !important;
        border-top: 1px solid #e2e8f0 !important;
        float: none !important;
      }
      .react-datepicker {
        display: flex !important;
        flex-direction: column !important;
      }
    }
  `}</style>
);

const SettingsPage = () => {
  const [isRegistrationOpen, setIsRegistrationOpen] = useState(false);
  const [evalConfig, setEvalConfig] = useState(DEFAULT_CONFIG);
  const [courses, setCourses] = useState([]);
  const [savingCriteria, setSavingCriteria] = useState(false);
  const [submissionDeadline, setSubmissionDeadline] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const [settingsRes, coursesRes] = await Promise.all([
          api.get("settings"),
          api.get("courses"),
        ]);
        const s = settingsRes.data;
        setSubmissionDeadline(
          s.submissionDeadline ? new Date(s.submissionDeadline) : null,
        );
        setEvalConfig({
          criteria1Name: s.criteria1Name || DEFAULT_CONFIG.criteria1Name,
          criteria1Max: s.criteria1Max || DEFAULT_CONFIG.criteria1Max,
          criteria2Name: s.criteria2Name || DEFAULT_CONFIG.criteria2Name,
          criteria2Max: s.criteria2Max || DEFAULT_CONFIG.criteria2Max,
          ownTeamCriteria1Name:
            s.ownTeamCriteria1Name || DEFAULT_CONFIG.ownTeamCriteria1Name,
          ownTeamCriteria1Max:
            s.ownTeamCriteria1Max || DEFAULT_CONFIG.ownTeamCriteria1Max,
          ownTeamCriteria2Name:
            s.ownTeamCriteria2Name || DEFAULT_CONFIG.ownTeamCriteria2Name,
          ownTeamCriteria2Max:
            s.ownTeamCriteria2Max || DEFAULT_CONFIG.ownTeamCriteria2Max,
        });
        setCourses(coursesRes.data);
      } catch {
        toast.error("Failed to load settings");
      }
    })();
  }, []);

  const makeToggle =
    (state, setState, endpoint, openMsg, closeMsg) => async () => {
      setState(!state);
      try {
        await api.patch(`settings/${endpoint}`);
        toast.success(!state ? openMsg : closeMsg);
      } catch {
        setState(state);
        toast.error("Failed");
      }
    };

  const handleSaveEvaluation = async () => {
    setSavingCriteria(true);
    try {
      await api.post("settings/evaluation", evalConfig);
      toast.success("Settings saved!");
    } catch {
      toast.error("Save failed");
    } finally {
      setSavingCriteria(false);
    }
  };

  const handleSetDeadline = async (date) => {
    setSubmissionDeadline(date);
    try {
      await api.patch("settings/set-deadline", {
        deadline: date ? date.toISOString() : null,
      });
      toast.success(date ? "Deadline Updated" : "Deadline Cleared");
    } catch {
      toast.error("Failed");
    }
  };

  const formatDeadline = (date) => {
    if (!date) return null;
    return `${date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })} at ${date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  };

  const isDeadlinePast = submissionDeadline && submissionDeadline < new Date();
  const isDeadlineSoon =
    submissionDeadline &&
    !isDeadlinePast &&
    submissionDeadline - new Date() < 24 * 60 * 60 * 1000;

  return (
    <div className="min-h-screen p-4 sm:p-6 md:p-8 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      <DeadlinePickerStyles />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "#1e293b",
            color: "#fff",
            borderRadius: "12px",
            fontSize: "14px",
          },
        }}
      />

      {/* Header */}
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 md:mb-12 gap-3 md:gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
            System Control
          </h1>
          <p className="text-slate-500 mt-1 md:mt-2 text-sm md:text-lg font-medium">
            Configure metrics, access & data.
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-white rounded-full border border-slate-200 shadow-sm text-xs font-bold text-slate-600 self-start sm:self-auto shrink-0">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          SYSTEM ONLINE
        </div>
      </div>

      {/* Main Layout: 2/3 + 1/3 on large screens, stacked on small */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 max-w-7xl mx-auto">

        {/* Left / Main column */}
        <div className="lg:col-span-2 space-y-6 md:space-y-8">

          {/* Toggles + Deadline — single col on mobile, 2-col on sm+ */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
            <ToggleCard
              title="Student Access"
              isOpen={isRegistrationOpen}
              onToggle={makeToggle(
                isRegistrationOpen,
                setIsRegistrationOpen,
                "toggle-registration",
                "Registration Opened",
                "Registration Closed",
              )}
              openLabel="Gateway Open"
              closedLabel="Gateway Locked"
              openBtnLabel="Close Registration"
              closedBtnLabel="Open Registration"
              colorOpen="emerald"
            />

            {/* Deadline Card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 md:p-5 flex flex-col gap-3 md:gap-4">

              {/* Card Header */}
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">
                    Submission Deadline
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Cut-off date &amp; time for proposals
                  </p>
                </div>
                <span
                  className={`mt-0.5 w-2.5 h-2.5 rounded-full shrink-0 transition-colors ${
                    isDeadlinePast
                      ? "bg-rose-400"
                      : isDeadlineSoon
                      ? "bg-amber-400 animate-pulse"
                      : submissionDeadline
                      ? "bg-indigo-400"
                      : "bg-slate-200"
                  }`}
                />
              </div>

              {/* DatePicker Input */}
              <div className="relative deadline-picker-wrapper">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10">
                  <Calendar className="w-4 h-4" />
                </span>
                <DatePicker
                  selected={submissionDeadline}
                  onChange={handleSetDeadline}
                  showTimeSelect
                  dateFormat="MMM d, yyyy • h:mm aa"
                  placeholderText="Set deadline..."
                  isClearable
                  popperPlacement="bottom-start"
                  popperModifiers={[
                    {
                      name: "preventOverflow",
                      options: { boundary: "viewport", padding: 16 },
                    },
                    {
                      name: "flip",
                      options: {
                        fallbackPlacements: [
                          "top-start",
                          "bottom-end",
                          "top-end",
                        ],
                      },
                    },
                  ]}
                  className="w-full pl-9 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all cursor-pointer"
                />
              </div>

              {/* Status Banner */}
              {submissionDeadline ? (
                <div
                  className={`flex items-center gap-2 text-[11px] font-semibold rounded-lg px-3 py-2 border ${
                    isDeadlinePast
                      ? "bg-rose-50 border-rose-100 text-rose-600"
                      : isDeadlineSoon
                      ? "bg-amber-50 border-amber-100 text-amber-600"
                      : "bg-indigo-50 border-indigo-100 text-indigo-600"
                  }`}
                >
                  <span className="shrink-0">
                    {isDeadlinePast ? (
                      <Lock className="w-3.5 h-3.5" />
                    ) : isDeadlineSoon ? (
                      <AlertTriangle className="w-3.5 h-3.5" />
                    ) : (
                      <Clock className="w-3.5 h-3.5" />
                    )}
                  </span>
                  <span className="truncate">
                    {isDeadlinePast
                      ? `Closed · ${formatDeadline(submissionDeadline)}`
                      : isDeadlineSoon
                      ? `Closing soon · ${formatDeadline(submissionDeadline)}`
                      : `Closes · ${formatDeadline(submissionDeadline)}`}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-[11px] font-semibold rounded-lg px-3 py-2 border bg-slate-50 border-slate-100 text-slate-400">
                  <span className="shrink-0">
                    <MailOpen className="w-3.5 h-3.5" />
                  </span>
                  <span>No deadline set — submissions open indefinitely</span>
                </div>
              )}
            </div>
          </div>

          {/* Scoring Config */}
          <ScoringConfig
            evalConfig={evalConfig}
            setEvalConfig={setEvalConfig}
            onSave={handleSaveEvaluation}
            saving={savingCriteria}
          />
        </div>

        {/* Right Column — full width on mobile, sidebar on lg */}
        <div className="space-y-6 md:space-y-8">
          <DataExport courses={courses} evalConfig={evalConfig} />
          <DangerZone />
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;