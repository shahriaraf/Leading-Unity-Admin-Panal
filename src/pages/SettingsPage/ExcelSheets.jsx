import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

// --- Helper: Get Supervisor Abbreviation (Strict) ---
const getSupLabel = (sup, allSupervisors = []) => {
  if (!sup) return 'N/A';
  if (typeof sup === 'object' && sup.name) {
    return sup.abbreviation || sup.name;
  }
  if (allSupervisors.length > 0) {
    const found = allSupervisors.find(s => s._id === sup);
    if (found) return found.abbreviation || found.name;
  }
  return 'Unknown';
};

// --- Helper: Format Time Range ---
const formatTimeRange = (startStr, endStr) => {
  if (!startStr || !endStr) return 'Unscheduled';
  const s = new Date(startStr);
  const e = new Date(endStr);
  const timeOpt = { hour: 'numeric', minute: '2-digit', hour12: true };
  return `${s.toLocaleTimeString('en-US', timeOpt)} - ${e.toLocaleTimeString('en-US', timeOpt)}`;
};

// --- Helper: Format Date Header ---
const formatDateHeader = (isoDate) => {
  const d = new Date(isoDate);
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  return `Defense Schedule: ${d.toLocaleDateString('en-US', options)}`;
};


// =============================================================================
// WEIGHTED AVERAGE FOR DEFENSE BOARD MARKS
// =============================================================================
//
// How it works:
//   1. Each board supervisor submits criteria1 + criteria2 for a student.
//   2. Rank all present supervisors by their total (criteria1 + criteria2),
//      highest first.
//   3. Top 2 supervisors get weight 2; all others get weight 1.
//   4. Weighted avg for each criteria =
//        Σ(criteria_i × weight_i) / Σ(weight_i)
//
// Example — three supervisors give totals: 40, 40, 20
//   Weights assigned:        2,  2,  1   → total weight = 5
//   Weighted sum (criteria): computed per-criteria using same weights
//   Result: pulls final average toward the two highest scorers.
//
const computeWeightedDefenseAvg = (presentMarks) => {
  // presentMarks: array of { criteria1, criteria2 } (absent ones already excluded)
  if (!presentMarks || presentMarks.length === 0) {
    return { weightedC1: 0, weightedC2: 0, weightedTotal: 0, totalWeight: 0 };
  }

  // Step 1: Assign a rank-based weight to each supervisor's mark.
  //         Sort by total descending, top 2 get weight 2, rest get weight 1.
  const withTotals = presentMarks.map((mk, idx) => ({
    ...mk,
    total: mk.criteria1 + mk.criteria2,
    originalIdx: idx,
  }));

  // Sort descending by total to determine rank
  const sorted = [...withTotals].sort((a, b) => b.total - a.total);

  // Assign weights: top 2 → 2, rest → 1
  const weightMap = new Map();
  sorted.forEach((mk, rank) => {
    weightMap.set(mk.originalIdx, rank < 2 ? 2 : 1);
  });

  // Step 2: Compute weighted sums and total weight
  let sumW   = 0;
  let sumC1W = 0;
  let sumC2W = 0;

  withTotals.forEach((mk) => {
    const w = weightMap.get(mk.originalIdx);
    sumW   += w;
    sumC1W += mk.criteria1 * w;
    sumC2W += mk.criteria2 * w;
  });

  const weightedC1    = sumC1W / sumW;
  const weightedC2    = sumC2W / sumW;
  const weightedTotal = weightedC1 + weightedC2;

  return { weightedC1, weightedC2, weightedTotal, totalWeight: sumW };
};


// =============================================================================
// 1. MAIN REPORT (Detailed Marks & Info)
// =============================================================================
export const generateMainReport = async (proposals, evalConfig, allSupervisors, courseFilter = null) => {
  let data = proposals.filter(p => {
    const memberCount = (p.teamMembers || []).length;
    const matchesCourse = courseFilter ? p.course?._id === courseFilter._id : true;
    const isOfficialTeam = memberCount >= 3 && memberCount <= 4;
    return matchesCourse && isOfficialTeam;
  });

  data.sort((a, b) => (a.serialNumber ?? 0) - (b.serialNumber ?? 0));
  if (!data.length) throw new Error('NO_DATA');

  const workbook = new ExcelJS.Workbook();
  const sheetName = courseFilter ? courseFilter.courseCode : 'Master Sheet';
  const worksheet = workbook.addWorksheet(sheetName.substring(0, 30));

  worksheet.columns = [
    { header: 'ID',                                          key: 'sn',    width: 6  },
    { header: 'Course',                                      key: 'c',     width: 12 },
    { header: 'Title',                                       key: 'title', width: 35 },
    { header: 'Team Members',                                key: 'count', width: 15 },
    { header: 'Name',                                        key: 'name',  width: 25 },
    { header: 'Student ID',                                  key: 'sid',   width: 18 },
    { header: 'Supervisor',                                  key: 'sup',   width: 15 },
    { header: 'CGPA',                                        key: 'cgpa',  width: 10 },
    { header: 'Email',                                       key: 'email', width: 30 },
    { header: 'Phone',                                       key: 'phone', width: 15 },
    { header: 'Proposal Drive Link',                         key: 'link',  width: 40 },
    { header: `Sup: ${evalConfig.ownTeamCriteria1Name}`,     key: 'o1',    width: 12 },
    { header: `Sup: ${evalConfig.ownTeamCriteria2Name}`,     key: 'o2',    width: 12 },
    { header: 'Sup Total',                                   key: 'ot',    width: 10 },
    { header: 'Board Scores (each supervisor)',               key: 'indiv', width: 26 },
    { header: `Def: ${evalConfig.criteria1Name} (W.Avg)`,    key: 'd1',    width: 14 },
    { header: `Def: ${evalConfig.criteria2Name} (W.Avg)`,    key: 'd2',    width: 14 },
    { header: 'Def Total (W.Avg)',                           key: 'dt',    width: 14 },
    { header: 'Grand Total',                                 key: 'gt',    width: 12 },
  ];

  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } };

  let currentRow = 2;

  data.forEach((item) => {
    const team = item.teamMembers || [];
    const startRow = currentRow;
    const supStr = getSupLabel(item.assignedSupervisor, allSupervisors);
    const allMarks = item.marks || [];

    team.forEach((m) => {
      const ownMark  = allMarks.find(mk => mk.studentId === m.studentId && mk.type === 'own');
      const defMarks = allMarks.filter(mk => mk.studentId === m.studentId && mk.type === 'defense');

      let o1 = '-', o2 = '-', ot = '-';
      let d1 = '-', d2 = '-', dt = '-', gt = '-', indiv = '-';
      let valO1 = 0, valO2 = 0;

      // ── Supervisor (own-team) marks — unchanged ─────────────────────────
      if (ownMark) {
        if (ownMark.isAbsent) {
          o1 = 'Abs'; o2 = 'Abs'; ot = '0';
        } else {
          valO1 = ownMark.criteria1;
          valO2 = ownMark.criteria2;
          o1 = valO1; o2 = valO2; ot = valO1 + valO2;
        }
      }

      // ── Defense board marks — NOW USES WEIGHTED AVERAGE ────────────────
      if (defMarks.length > 0) {
        // Build the "individual scores" summary string (unchanged display)
        indiv = defMarks
          .map(mk => mk.isAbsent ? 'Abs' : (mk.criteria1 + mk.criteria2))
          .join(', ');

        const presentDefMarks = defMarks.filter(mk => !mk.isAbsent);

        if (presentDefMarks.length > 0) {
          // 🟢 WEIGHTED AVERAGE (replaces simple average)
          const { weightedC1, weightedC2, weightedTotal } =
            computeWeightedDefenseAvg(presentDefMarks);

          d1 = weightedC1.toFixed(1);
          d2 = weightedC2.toFixed(1);
          dt = weightedTotal.toFixed(1);
        } else {
          // All board supervisors marked this student absent
          d1 = 'Abs'; d2 = 'Abs'; dt = '0';
        }
      }

      // ── Grand Total ─────────────────────────────────────────────────────
      const ownTotal = (ownMark && !ownMark.isAbsent) ? (valO1 + valO2) : 0;
      const defTotal = dt !== '-' && dt !== '0' && d1 !== 'Abs'
        ? parseFloat(dt)
        : (dt === '0' ? 0 : 0);
      gt = (ownTotal + defTotal).toFixed(1);

      const row = worksheet.getRow(currentRow);
      row.values = {
        sn:    item.serialNumber ?? '—',
        c:     item.course?.courseCode || 'N/A',
        title: item.title,
        count: team.length,
        name:  m.name,
        sid:   m.studentId,
        sup:   supStr,
        cgpa:  m.cgpa || '-',
        email: m.email || '-',
        phone: m.mobile || '-',
        link:  item.description || 'N/A',
        o1, o2, ot, indiv, d1, d2, dt, gt,
      };

      // Clickable hyperlink for proposal link
      if (item.description && item.description.startsWith('http')) {
        const linkCell = row.getCell('link');
        linkCell.value = {
          text: 'View Proposal',
          hyperlink: item.description,
          tooltip: 'Click to open drive link',
        };
        linkCell.font = { color: { argb: 'FF0000FF' }, underline: true };
      }

      // Cell styling
      row.eachCell({ includeEmpty: true }, (cell) => {
        cell.border = {
          top:    { style: 'thin' },
          left:   { style: 'thin' },
          bottom: { style: 'thin' },
          right:  { style: 'thin' },
        };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      });
      ['title', 'name', 'email', 'link'].forEach(
        k => (row.getCell(k).alignment.horizontal = 'left')
      );

      currentRow++;
    });

    const endRow = currentRow - 1;
    if (startRow <= endRow) {
      ['A', 'B', 'C', 'D', 'G', 'K'].forEach(col =>
        worksheet.mergeCells(`${col}${startRow}:${col}${endRow}`)
      );
    }
  });

  const buffer = await workbook.xlsx.writeBuffer();
  saveAs(new Blob([buffer]), `Full_Report_${sheetName}.xlsx`);
};


// =============================================================================
// 2. DEFENSE SCHEDULE REPORT (Printable) — unchanged
// =============================================================================
export const generateDefenseSchedule = async (proposals, allSupervisors, courseFilter = null) => {
  let data = courseFilter
    ? proposals.filter(p => p.course?._id === courseFilter._id)
    : proposals;

  data = data
    .filter(p => p.defenseDate)
    .sort((a, b) => new Date(a.defenseDate) - new Date(b.defenseDate));

  if (!data.length) throw new Error('NO_DATA');

  const workbook  = new ExcelJS.Workbook();
  const sheetName = courseFilter ? `${courseFilter.courseCode} Schedule` : 'Schedule';
  const worksheet = workbook.addWorksheet(sheetName.substring(0, 30));

  worksheet.columns = [
    { header: 'SL',           key: 'sn',    width: 5  },
    { header: 'Schedule',     key: 'time',  width: 25 },
    { header: 'Student ID',   key: 'id',    width: 18 },
    { header: 'Name',         key: 'name',  width: 25 },
    { header: 'Project Title',key: 'title', width: 35 },
    { header: 'Supervisor',   key: 'sup',   width: 15 },
    { header: 'Signature',    key: 'sign',  width: 20 },
  ];

  const headerRow = worksheet.getRow(1);
  headerRow.font = { name: 'Calibri', size: 11, bold: true };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
  headerRow.eachCell((cell) => {
    cell.fill   = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF99F6C9' } };
    cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
  });

  let currentRow  = 2;
  let lastDateStr = '';

  data.forEach((item) => {
    const team = item.teamMembers || [];
    if (team.length === 0) return;

    const thisDateStr = new Date(item.defenseDate).toDateString();

    if (thisDateStr !== lastDateStr) {
      const dateRow = worksheet.getRow(currentRow);
      dateRow.values = [formatDateHeader(item.defenseDate)];
      worksheet.mergeCells(`A${currentRow}:G${currentRow}`);
      dateRow.getCell(1).fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFC7CE' } };
      dateRow.getCell(1).font      = { name: 'Calibri', size: 12, bold: true };
      dateRow.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };
      dateRow.getCell(1).border    = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
      currentRow++;
      lastDateStr = thisDateStr;
    }

    const startRow = currentRow;
    const timeStr  = formatTimeRange(item.defenseDate, item.defenseEndDate);
    const supStr   = getSupLabel(item.assignedSupervisor, allSupervisors);

    team.forEach((m) => {
      const row = worksheet.getRow(currentRow);
      row.values = {
        sn:    item.serialNumber ?? '—',
        time:  timeStr,
        id:    m.studentId,
        name:  m.name,
        title: item.title,
        sup:   supStr,
        sign:  '',
      };
      row.getCell('id').alignment   = { vertical: 'middle', horizontal: 'center' };
      row.getCell('name').alignment = { vertical: 'middle', horizontal: 'left' };
      row.eachCell({ includeEmpty: true }, (cell) => {
        cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
      });
      currentRow++;
    });

    const endRow = currentRow - 1;
    if (startRow <= endRow) {
      worksheet.mergeCells(`A${startRow}:A${endRow}`);
      worksheet.getCell(`A${startRow}`).alignment = { vertical: 'middle', horizontal: 'center' };

      worksheet.mergeCells(`B${startRow}:B${endRow}`);
      worksheet.getCell(`B${startRow}`).alignment = { vertical: 'middle', horizontal: 'center' };

      worksheet.mergeCells(`E${startRow}:E${endRow}`);
      worksheet.getCell(`E${startRow}`).alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };

      worksheet.mergeCells(`F${startRow}:F${endRow}`);
      worksheet.getCell(`F${startRow}`).alignment = { vertical: 'middle', horizontal: 'center' };

      worksheet.mergeCells(`G${startRow}:G${endRow}`);
    }
  });

  const buffer = await workbook.xlsx.writeBuffer();
  saveAs(new Blob([buffer]), `Defense_Schedule_${sheetName}.xlsx`);
};


// =============================================================================
// 3. TEAM REQUESTS REPORT — unchanged
// =============================================================================
export const generateRequestsReport = async (proposals, courseFilter = null) => {
  let data = proposals.filter(p => p.serialNumber === null);
  if (courseFilter) data = data.filter(p => p.course?._id === courseFilter._id);
  if (!data.length) throw new Error('NO_DATA');

  const workbook  = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Team Requests');

  worksheet.columns = [
    { header: 'Course',        key: 'course', width: 12 },
    { header: 'Project Title', key: 'title',  width: 40 },
    { header: 'Role',          key: 'role',   width: 12 },
    { header: 'Student Name',  key: 'name',   width: 25 },
    { header: 'Student ID',    key: 'sid',    width: 18 },
    { header: 'Email',         key: 'email',  width: 30 },
    { header: 'Phone',         key: 'phone',  width: 15 },
  ];

  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE67E22' } };

  let currentRow = 2;

  data.forEach((item) => {
    const members  = item.teamMembers || [];
    const startRow = currentRow;

    members.forEach(m => {
      worksheet.addRow({
        course: item.course?.courseCode || 'N/A',
        title:  item.title,
        role:   'MEMBER',
        name:   m.name,
        sid:    m.studentId,
        email:  m.email  || 'N/A',
        phone:  m.mobile || 'N/A',
      });
      currentRow++;
    });

    const endRow = currentRow - 1;
    if (startRow < endRow) {
      worksheet.mergeCells(`A${startRow}:A${endRow}`);
      worksheet.mergeCells(`B${startRow}:B${endRow}`);
    }
  });

  const buffer = await workbook.xlsx.writeBuffer();
  saveAs(new Blob([buffer]), `Team_Requests_Report.xlsx`);
};