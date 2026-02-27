import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

export const generateExcelReport = async (proposals, evalConfig, courseFilter = null) => {
  let data = courseFilter ? proposals.filter(p => p.course?._id === courseFilter._id) : proposals;
  if (!data.length) throw new Error('NO_DATA');

  const workbook = new ExcelJS.Workbook();
  const sheetName = courseFilter ? courseFilter.courseCode : 'Master Sheet';
  const worksheet = workbook.addWorksheet(sheetName.substring(0, 30));

  worksheet.columns = [
    { header: '#', key: 'sn', width: 5 },
    { header: 'Course', key: 'c', width: 12 },
    { header: 'Project Title', key: 't', width: 25 },
    { header: 'Defense Schedule', key: 'date', width: 22 },
    { header: 'Status', key: 's', width: 12 },
    { header: 'Team Members', key: 'm', width: 55 },
    { header: 'Assigned Sup.', key: 'a', width: 20 },
    { header: `Sup: ${evalConfig.ownTeamCriteria1Name}`, key: 'o1', width: 15 },
    { header: `Sup: ${evalConfig.ownTeamCriteria2Name}`, key: 'o2', width: 15 },
    { header: 'Sup Total', key: 'ot', width: 10 },
    { header: `Def: ${evalConfig.criteria1Name} (Avg)`, key: 'd1', width: 15 },
    { header: `Def: ${evalConfig.criteria2Name} (Avg)`, key: 'd2', width: 15 },
    { header: 'Def Total (Avg)', key: 'dt', width: 10 },
    { header: 'Grand Total', key: 'g', width: 10 },
  ];

  const headerRow = worksheet.getRow(1);
  headerRow.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
  headerRow.height = 30;

  data.forEach((item, index) => {
    const members = item.teamMembers || [];
    const allMarks = item.marks || [];
    let mStr = '', o1 = '', o2 = '', ot = '', d1 = '', d2 = '', dt = '', gt = '';

    members.forEach((m, idx) => {
      const suffix = idx < members.length - 1 ? '\n' : '';
      mStr += `${m.name} (${m.studentId}) | ${m.cgpa || 'N/A'}${suffix}`;

      const ownMark = allMarks.find(mk => mk.studentId === m.studentId && mk.type === 'own');
      let valO1 = 0, valO2 = 0;
      if (ownMark) {
        if (ownMark.isAbsent) { o1 += `Abs${suffix}`; o2 += `Abs${suffix}`; ot += `0${suffix}`; }
        else { valO1 = ownMark.criteria1; valO2 = ownMark.criteria2; o1 += `${valO1}${suffix}`; o2 += `${valO2}${suffix}`; ot += `${valO1 + valO2}${suffix}`; }
      } else { o1 += `-${suffix}`; o2 += `-${suffix}`; ot += `-${suffix}`; }

      const defMarks = allMarks.filter(mk => mk.studentId === m.studentId && mk.type === 'defense');
      let valDT = 0;
      if (defMarks.length > 0) {
        const present = defMarks.filter(mk => !mk.isAbsent);
        if (present.length > 0) {
          const s1 = present.reduce((acc, c) => acc + c.criteria1, 0) / present.length;
          const s2 = present.reduce((acc, c) => acc + c.criteria2, 0) / present.length;
          valDT = s1 + s2;
          d1 += `${s1.toFixed(1)}${suffix}`; d2 += `${s2.toFixed(1)}${suffix}`; dt += `${valDT.toFixed(1)}${suffix}`;
        } else { d1 += `Abs${suffix}`; d2 += `Abs${suffix}`; dt += `0${suffix}`; }
      } else { d1 += `-${suffix}`; d2 += `-${suffix}`; dt += `-${suffix}`; }

      const grand = (ownMark && !ownMark.isAbsent ? valO1 + valO2 : 0) + valDT;
      gt += `${grand.toFixed(1)}${suffix}`;
    });

    const defenseDateStr = item.defenseDate
      ? new Date(item.defenseDate).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
      : 'Not Scheduled';

    const row = worksheet.addRow([
      index + 1, item.course?.courseCode, item.title, defenseDateStr, item.status,
      mStr, item.assignedSupervisor?.name || 'N/A',
      o1, o2, ot, d1, d2, dt, gt,
    ]);
    row.height = Math.max(25, members.length * 20);
    row.alignment = { vertical: 'top', horizontal: 'left', wrapText: true };
  });

  const centeredCols = [1, 2, 4, 5, 8, 9, 10, 11, 12, 13, 14];
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    row.eachCell((cell, colNumber) => {
      if (centeredCols.includes(colNumber)) cell.alignment = { vertical: 'top', horizontal: 'center', wrapText: true };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFCBD5E1' } }, bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        left: { style: 'thin', color: { argb: 'FFCBD5E1' } }, right: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      };
      if (rowNumber % 2 === 0) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  saveAs(new Blob([buffer]), 'Report.xlsx');
};