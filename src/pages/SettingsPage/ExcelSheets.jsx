import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

// --- Helper: Safe teamMembers accessor ---
// Always returns a real array, even if teamMembers is null, undefined, or a non-array object.
const safeMembers = (teamMembers) =>
  Array.isArray(teamMembers) ? teamMembers : [];

// --- Helper: Get Supervisor Abbreviation ---
const getSupLabel = (sup, allSupervisors = []) => {
  if (!sup) return 'N/A';
  if (typeof sup === 'object' && sup.name) return sup.abbreviation || sup.name;
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

// --- Helper: Sum a criteria[] array safely ---
const sumCriteria = (mark) => {
  if (!mark) return 0;
  if (Array.isArray(mark.criteria) && mark.criteria.length > 0) {
    return mark.criteria.reduce((s, v) => s + (Number(v) || 0), 0);
  }
  return (Number(mark.criteria1) || 0) + (Number(mark.criteria2) || 0);
};

const getCriterionValue = (mark, index) => {
  if (!mark) return 0;
  if (Array.isArray(mark.criteria) && mark.criteria.length > index) {
    return Number(mark.criteria[index]) || 0;
  }
  if (index === 0) return Number(mark.criteria1) || 0;
  if (index === 1) return Number(mark.criteria2) || 0;
  return 0;
};

// Leader CGPA lives inside teamMembers under their own studentId.
// proposal.student is a populated User doc — it has no cgpa field on the schema.
const getLeaderCgpa = (proposal) => {
  const leaderStudentId = proposal.student?.studentId;
  if (!leaderStudentId) return null;
  const leaderEntry = safeMembers(proposal.teamMembers).find(
    (m) => String(m.studentId) === String(leaderStudentId)
  );
  return leaderEntry?.cgpa ?? null;
};

// =============================================================================
// WEIGHTED AVERAGE FOR DEFENSE BOARD MARKS
// =============================================================================
const computeWeightedDefenseAvg = (presentMarks) => {
  if (!presentMarks || presentMarks.length === 0) {
    return { weightedTotal: 0, totalWeight: 0 };
  }

  const withTotals = presentMarks.map((mk, idx) => ({
    ...mk,
    total: sumCriteria(mk),
    originalIdx: idx,
  }));

  const sorted = [...withTotals].sort((a, b) => b.total - a.total);
  const weightMap = new Map();
  sorted.forEach((mk, rank) => weightMap.set(mk.originalIdx, rank < 2 ? 2 : 1));

  let sumW = 0;
  let sumTotalW = 0;
  withTotals.forEach((mk) => {
    const w = weightMap.get(mk.originalIdx);
    sumW      += w;
    sumTotalW += mk.total * w;
  });

  return {
    weightedTotal: sumTotalW / sumW,
    totalWeight: sumW,
  };
};

// =============================================================================
// REGULAR (SIMPLE) AVERAGE FOR DEFENSE BOARD MARKS
// =============================================================================
const computeRegularDefenseAvg = (presentMarks) => {
  if (!presentMarks || presentMarks.length === 0) return { avgTotal: 0 };
  const n = presentMarks.length;
  const sumTotal = presentMarks.reduce((s, mk) => s + sumCriteria(mk), 0);
  return { avgTotal: sumTotal / n };
};

// =============================================================================
// 1. MAIN REPORT
// =============================================================================
export const generateMainReport = async (proposals, evalConfig, allSupervisors, courseFilter = null) => {
  let data = proposals.filter(p => {
    const matchesCourse = courseFilter ? p.course?._id === courseFilter._id : true;
    // Only exclude proposals that are still pending requests (no serial number
    // assigned yet) — those belong in the "Team Requests" report instead.
    // Team size is NOT a valid reason to drop a submission from the full report.
    const isScheduled = p.serialNumber !== null && p.serialNumber !== undefined;
    return matchesCourse && isScheduled;
  });

  data.sort((a, b) => (a.serialNumber ?? 0) - (b.serialNumber ?? 0));
  if (!data.length) throw new Error('NO_DATA');

  const ownCriteria = Array.isArray(evalConfig.ownTeamCriteria) && evalConfig.ownTeamCriteria.length > 0
    ? evalConfig.ownTeamCriteria
    : [
        { name: evalConfig.ownTeamCriteria1Name || 'Sup C1' },
        { name: evalConfig.ownTeamCriteria2Name || 'Sup C2' },
      ];

  const defCriteria = Array.isArray(evalConfig.defenseCriteria) && evalConfig.defenseCriteria.length > 0
    ? evalConfig.defenseCriteria
    : [
        { name: evalConfig.criteria1Name || 'Def C1' },
        { name: evalConfig.criteria2Name || 'Def C2' },
      ];

  const workbook  = new ExcelJS.Workbook();
  const sheetName = courseFilter ? courseFilter.courseCode : 'Master Sheet';
  const worksheet = workbook.addWorksheet(sheetName.substring(0, 30));

  const fixedLeft = [
    { header: 'ID',                    key: 'sn',    width: 6  },
    { header: 'Course',                key: 'c',     width: 12 },
    { header: 'Title',                 key: 'title', width: 35 },
    { header: 'Team Members',          key: 'count', width: 15 },
    { header: 'Name',                  key: 'name',  width: 25 },
    { header: 'Student ID',            key: 'sid',   width: 18 },
    { header: 'Supervisor',            key: 'sup',   width: 15 },
    { header: 'Pref Supervisors',      key: 'prefSup', width: 22 },
    { header: 'CGPA',                  key: 'cgpa',  width: 10 },
    { header: 'Email',                 key: 'email', width: 30 },
    { header: 'Phone',                 key: 'phone', width: 15 },
    { header: 'Proposal Drive Link',   key: 'link',  width: 40 },
  ];

  const ownCols = ownCriteria.map((c, i) => ({
    header: `Sup: ${c.name}`,
    key:    `o${i}`,
    width:  13,
  }));
  const ownTotalCol = { header: 'Sup Total', key: 'ot', width: 10 };

  const indivCol = { header: 'Board Scores (each supervisor)', key: 'indiv', width: 26 };

  const defWAvgCols = defCriteria.map((c, i) => ({
    header: `Def: ${c.name} (W.Avg)`,
    key:    `dw${i}`,
    width:  15,
  }));
  const defWAvgTotalCol = { header: 'Def Total (W.Avg)', key: 'dwt', width: 15 };

  const defAvgCols = defCriteria.map((c, i) => ({
    header: `Def: ${c.name} (Avg)`,
    key:    `da${i}`,
    width:  15,
  }));
  const defAvgTotalCol = { header: 'Def Total (Avg)', key: 'dat', width: 15 };

  const gtWAvgCol = { header: 'Grand Total (W.Avg)', key: 'gt',  width: 18 };
  const gtAvgCol  = { header: 'Grand Total (Avg)',   key: 'gta', width: 18 };

  worksheet.columns = [
    ...fixedLeft,
    ...ownCols, ownTotalCol,
    indivCol,
    ...defWAvgCols, defWAvgTotalCol,
    ...defAvgCols,  defAvgTotalCol,
    gtWAvgCol, gtAvgCol,
  ];

  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } };

  let currentRow = 2;

  data.forEach((item) => {
    const leaderStudentId = item.student?.studentId;
    const leaderCgpa      = getLeaderCgpa(item);
    const itemMembers     = safeMembers(item.teamMembers);

    // Leader row — CGPA and mobile come from teamMembers entry, not the User doc
    const leaderRow = item.student ? [{
      name:      item.student.name,
      studentId: item.student.studentId,
      cgpa:      leaderCgpa,
      email:     item.student.email,
      mobile:    itemMembers.find(
                   m => String(m.studentId) === String(leaderStudentId)
                 )?.mobile ?? null,
      _isLeader: true,
    }] : [];

    // Non-leader members (exclude leader's own entry from teamMembers)
    const nonLeaderMembers = itemMembers.filter(
      m => String(m.studentId) !== String(leaderStudentId)
    );

    // Full team: leader first, then the rest
    const team    = [...leaderRow, ...nonLeaderMembers];
    const startRow = currentRow;
    const supStr   = getSupLabel(item.assignedSupervisor, allSupervisors);
    const prefSupStr = Array.isArray(item.supervisors) && item.supervisors.length > 0
      ? item.supervisors.map(s => getSupLabel(s, allSupervisors)).join(', ')
      : 'N/A';
    const allMarks = Array.isArray(item.marks) ? item.marks : [];

    team.forEach((m) => {
      const ownMark  = allMarks.find(mk => mk.studentId === m.studentId && mk.type === 'own');
      const defMarks = allMarks.filter(mk => mk.studentId === m.studentId && mk.type === 'defense');

      const ownVals  = ownCriteria.map((_, i) => ownMark && !ownMark.isAbsent ? getCriterionValue(ownMark, i) : null);
      const ownTotal = ownMark
        ? (ownMark.isAbsent ? 0 : sumCriteria(ownMark))
        : null;

      const ownCellVals = {};
      ownCriteria.forEach((_, i) => {
        ownCellVals[`o${i}`] = ownMark
          ? (ownMark.isAbsent ? 'Abs' : ownVals[i])
          : '-';
      });
      const otCell = ownMark ? (ownMark.isAbsent ? '0' : ownTotal) : '-';

      let indiv = '-';
      const defWAvgCellVals = {};
      const defAvgCellVals  = {};
      let dwtCell = '-', datCell = '-';

      defCriteria.forEach((_, i) => {
        defWAvgCellVals[`dw${i}`] = '-';
        defAvgCellVals[`da${i}`]  = '-';
      });

      if (defMarks.length > 0) {
        indiv = defMarks
          .map(mk => mk.isAbsent ? 'Abs' : sumCriteria(mk))
          .join(', ');

        const presentDefMarks = defMarks.filter(mk => !mk.isAbsent);

        if (presentDefMarks.length > 0) {
          const n = presentDefMarks.length;

          defCriteria.forEach((_, i) => {
            const withTotals = presentDefMarks.map((mk, idx) => ({
              val: getCriterionValue(mk, i),
              total: sumCriteria(mk),
              originalIdx: idx,
            }));
            const sorted = [...withTotals].sort((a, b) => b.total - a.total);
            const weightMap = new Map();
            sorted.forEach((mk, rank) => weightMap.set(mk.originalIdx, rank < 2 ? 2 : 1));
            let sumW = 0, sumVW = 0;
            withTotals.forEach(mk => {
              const w = weightMap.get(mk.originalIdx);
              sumW  += w;
              sumVW += mk.val * w;
            });
            defWAvgCellVals[`dw${i}`] = (sumVW / sumW).toFixed(1);

            const sumV = presentDefMarks.reduce((s, mk) => s + getCriterionValue(mk, i), 0);
            defAvgCellVals[`da${i}`] = (sumV / n).toFixed(1);
          });

          const { weightedTotal } = computeWeightedDefenseAvg(presentDefMarks);
          const { avgTotal }      = computeRegularDefenseAvg(presentDefMarks);

          dwtCell = weightedTotal.toFixed(1);
          datCell = avgTotal.toFixed(1);
        } else {
          defCriteria.forEach((_, i) => {
            defWAvgCellVals[`dw${i}`] = 'Abs';
            defAvgCellVals[`da${i}`]  = 'Abs';
          });
          dwtCell = '0';
          datCell = '0';
        }
      }

      const numOwnTotal = (ownMark && !ownMark.isAbsent) ? ownTotal : 0;
      const numDefWAvg  = dwtCell !== '-' ? parseFloat(dwtCell)  : 0;
      const numDefAvg   = datCell !== '-' ? parseFloat(datCell)   : 0;

      const gtWAvg = (numOwnTotal + numDefWAvg).toFixed(1);
      const gtAvg  = (numOwnTotal + numDefAvg).toFixed(1);

      const row = worksheet.getRow(currentRow);
      row.values = {
        sn:    item.serialNumber ?? '—',
        c:     item.course?.courseCode || 'N/A',
        title: item.title,
        count: team.length,
        name:  m.name,
        sid:   m.studentId,
        sup:   supStr,
        prefSup: prefSupStr,
        cgpa:  m.cgpa  || '-',
        email: m.email || '-',
        phone: m.mobile || '-',
        link:  item.description || 'N/A',
        ...ownCellVals,
        ot: otCell,
        indiv,
        ...defWAvgCellVals,
        dwt: dwtCell,
        ...defAvgCellVals,
        dat: datCell,
        gt:  gtWAvg,
        gta: gtAvg,
      };

      if (item.description && item.description.startsWith('http')) {
        const linkCell = row.getCell('link');
        linkCell.value = {
          text:     'View Proposal',
          hyperlink: item.description,
          tooltip:  'Click to open drive link',
        };
        linkCell.font = { color: { argb: 'FF0000FF' }, underline: true };
      }

      row.getCell('gt').fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDDEBF7' } };
      row.getCell('gt').font  = { bold: true };
      row.getCell('gta').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2EFDA' } };
      row.getCell('gta').font = { bold: true };

      row.eachCell({ includeEmpty: true }, (cell) => {
        cell.border = {
          top:    { style: 'thin' },
          left:   { style: 'thin' },
          bottom: { style: 'thin' },
          right:  { style: 'thin' },
        };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      });
      ['title', 'name', 'email', 'link', 'prefSup'].forEach(
        k => (row.getCell(k).alignment.horizontal = 'left')
      );

      currentRow++;
    });

    const endRow = currentRow - 1;
    if (startRow <= endRow) {
      ['A', 'B', 'C', 'D', 'G', 'H', 'L'].forEach(col =>
        worksheet.mergeCells(`${col}${startRow}:${col}${endRow}`)
      );
    }
  });

  const buffer = await workbook.xlsx.writeBuffer();
  saveAs(new Blob([buffer]), `Full_Report_${sheetName}.xlsx`);
};


// =============================================================================
// 2. DEFENSE SCHEDULE REPORT
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
    { header: 'SL',            key: 'sn',    width: 5  },
    { header: 'Schedule',      key: 'time',  width: 25 },
    { header: 'Student ID',    key: 'id',    width: 18 },
    { header: 'Name',          key: 'name',  width: 25 },
    { header: 'Project Title', key: 'title', width: 35 },
    { header: 'Supervisor',    key: 'sup',   width: 15 },
    { header: 'Room',          key: 'room',  width: 15 },
    { header: 'Signature',     key: 'sign',  width: 20 },
  ];

  const headerRow = worksheet.getRow(1);
  headerRow.font      = { name: 'Calibri', size: 11, bold: true };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
  headerRow.eachCell((cell) => {
    cell.fill   = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF99F6C9' } };
    cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
  });

  let currentRow  = 2;
  let lastDateStr = '';

  data.forEach((item) => {
    const leaderStudentId  = item.student?.studentId;
    const itemMembers      = safeMembers(item.teamMembers);

    const leaderEntry = item.student ? [{
      name:      item.student.name,
      studentId: item.student.studentId,
    }] : [];

    const nonLeaderMembers = itemMembers.filter(
      m => String(m.studentId) !== String(leaderStudentId)
    );

    const team = [...leaderEntry, ...nonLeaderMembers];
    if (team.length === 0) return;

    const thisDateStr = new Date(item.defenseDate).toDateString();
    if (thisDateStr !== lastDateStr) {
      const dateRow = worksheet.getRow(currentRow);
      dateRow.values = [formatDateHeader(item.defenseDate)];
      worksheet.mergeCells(`A${currentRow}:H${currentRow}`);
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
        room:  item.room ?? '',
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
      worksheet.getCell(`G${startRow}`).alignment = { vertical: 'middle', horizontal: 'center' };
      worksheet.mergeCells(`H${startRow}:H${endRow}`);
    }
  });

  const buffer = await workbook.xlsx.writeBuffer();
  saveAs(new Blob([buffer]), `Defense_Schedule_${sheetName}.xlsx`);
};


// =============================================================================
// 3. TEAM REQUESTS REPORT
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
    { header: 'CGPA',          key: 'cgpa',   width: 10 },
    { header: 'Email',         key: 'email',  width: 30 },
    { header: 'Phone',         key: 'phone',  width: 15 },
  ];

  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE67E22' } };

  let currentRow = 2;

  data.forEach((item) => {
    const members  = safeMembers(item.teamMembers);
    const startRow = currentRow;

    members.forEach(m => {
      worksheet.addRow({
        course: item.course?.courseCode || 'N/A',
        title:  item.title,
        role:   'MEMBER',
        name:   m.name,
        sid:    m.studentId,
        cgpa:   m.cgpa || 'N/A',
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
