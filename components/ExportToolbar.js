'use client';
import { getCompany } from '../lib/store';

/**
 * ExportToolbar — reusable CSV + PDF export buttons
 *
 * Props:
 *   title      {string}   — report title, e.g. "Purchase List"
 *   subtitle   {string}   — optional subtitle / date range
 *   filename   {string}   — base filename without extension, e.g. "purchases"
 *   columns    {Array}    — [{ label: 'Date', key: 'date', align: 'right'? }]
 *   data       {Array}    — flat array of row objects matching column keys
 *   summary    {Array?}   — [{ label: 'Total', value: 'Rs. 1,200' }] shown in PDF header
 *   className  {string?}  — extra class on the wrapper div
 */
export default function ExportToolbar({ title, subtitle, filename, columns, data, summary = [], className = '' }) {

  /* ── CSV ─────────────────────────────────────────────────────────── */
  const exportCSV = () => {
    const company = getCompany();
    const generatedAt = new Date().toLocaleString('en-PK');
    const header = columns.map(c => `"${c.label}"`).join(',');
    const rows   = data.map(row =>
      columns.map(c => `"${row[c.key] ?? ''}"`).join(',')
    );
    const meta = [
      `"${title}${subtitle ? ' — ' + subtitle : ''}"`,
      `"Generated: ${generatedAt}","Company: ${company?.businessName || 'PetroStation'}"`,
      '',
    ].join('\n');

    const csv  = meta + [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    const date = new Date().toISOString().slice(0, 10);
    a.href     = url;
    a.download = `${filename}_${date}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  /* ── PDF (pdfmake real download) ────────────────────────────────── */
  const exportPDF = async () => {
    const pdfMake   = (await import('pdfmake/build/pdfmake')).default;
    const pdfFonts  = (await import('pdfmake/build/vfs_fonts')).default;
    pdfMake.vfs = pdfFonts.pdfMake?.vfs ?? pdfFonts.vfs ?? pdfFonts;

    const company     = getCompany();
    const generatedAt = new Date().toLocaleDateString('en-PK', { year: 'numeric', month: 'long', day: 'numeric' });
    const generatedTime = new Date().toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' });

    /* ── colour palette ── */
    const NAVY   = '#0D1B3E';
    const SILVER = '#64748B';
    const LIGHT  = '#F8FAFC';
    const BORDER = '#E2E8F0';
    const WHITE  = '#FFFFFF';

    /* ── company header (2-column layout table) ── */
    const companyLines = [
      { text: company?.businessName || 'PetroStation', style: 'companyName' },
    ];
    if (company?.address) companyLines.push({ text: company.address,            style: 'companyMeta' });
    if (company?.phone)   companyLines.push({ text: `Tel: ${company.phone}`,    style: 'companyMeta' });
    if (company?.pumpCode)companyLines.push({ text: `Pump Code: ${company.pumpCode}`, style: 'companyMeta' });

    const titleLines = [
      { text: title,       style: 'reportTitle' },
      subtitle ? { text: subtitle,                              style: 'companyMeta' } : null,
      { text: `Generated: ${generatedAt} at ${generatedTime}`, style: 'companyMeta' },
    ].filter(Boolean);

    const headerTable = {
      table: {
        widths: ['*', '*'],
        body: [[
          { stack: companyLines, border: [false, false, false, false] },
          { stack: titleLines,   alignment: 'right', border: [false, false, false, false] },
        ]],
      },
      layout: 'noBorders',
      margin: [0, 0, 0, 8],
    };

    /* ── divider ── */
    const divider = { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 760, y2: 0, lineWidth: 1.5, lineColor: NAVY }], margin: [0, 0, 0, 10] };

    /* ── summary strip ── */
    let summaryBlock = null;
    if (summary.length) {
      const summaryBodyCells = summary.map(s => ({
        stack: [
          { text: s.label, style: 'summaryLabel' },
          { text: s.value, style: 'summaryValue' },
        ],
        border: [false, false, false, false],
        fillColor: LIGHT,
        margin: [8, 6, 8, 6],
      }));
      summaryBlock = {
        table: {
          widths: summary.map(() => 'auto'),
          body: [summaryBodyCells],
        },
        layout: {
          hLineWidth: () => 0.5,
          vLineWidth: () => 0.5,
          hLineColor: () => BORDER,
          vLineColor: () => BORDER,
          fillColor: () => LIGHT,
        },
        margin: [0, 0, 0, 10],
      };
    }

    /* ── data table ── */
    const headerRow = columns.map(c => ({
      text: c.label,
      style: 'tableHeader',
      alignment: c.align === 'right' ? 'right' : 'left',
    }));

    const bodyRows = data.length
      ? data.map((row, i) =>
          columns.map(c => ({
            text: String(row[c.key] ?? '—'),
            style: i % 2 === 1 ? 'tableRowAlt' : 'tableRow',
            alignment: c.align === 'right' ? 'right' : 'left',
          }))
        )
      : [[{
          text: 'No records found',
          colSpan: columns.length,
          alignment: 'center',
          style: 'tableRow',
          color: '#94A3B8',
        }, ...Array(columns.length - 1).fill({})],
        ];

    const dataTable = {
      table: {
        headerRows: 1,
        widths: columns.map((_, i) => i === 0 ? 'auto' : '*'),
        body: [headerRow, ...bodyRows],
      },
      layout: {
        hLineWidth: (i) => (i === 0 || i === 1) ? 0 : 0.5,
        vLineWidth: () => 0,
        hLineColor: () => BORDER,
        fillColor: (rowIndex) => {
          if (rowIndex === 0) return NAVY;
          return rowIndex % 2 === 0 ? WHITE : LIGHT;
        },
      },
    };

    /* ── footer ── */
    const footer = (currentPage, pageCount) => ({
      columns: [
        { text: 'Generated by PetroStation Management System', style: 'footer', alignment: 'left' },
        { text: `${generatedAt}  |  Page ${currentPage} of ${pageCount}`, style: 'footer', alignment: 'right' },
      ],
      margin: [40, 0, 40, 0],
    });

    /* ── doc definition ── */
    const docDefinition = {
      pageOrientation: 'landscape',
      pageSize: 'A4',
      pageMargins: [40, 40, 40, 40],

      content: [
        headerTable,
        divider,
        ...(summaryBlock ? [summaryBlock] : []),
        dataTable,
      ],

      footer,

      styles: {
        companyName:  { fontSize: 16, bold: true,  color: NAVY,   characterSpacing: -0.3 },
        companyMeta:  { fontSize:  9, color: SILVER, margin: [0, 1, 0, 0] },
        reportTitle:  { fontSize: 14, bold: true,  color: NAVY,   characterSpacing: 0.5, alignment: 'right' },
        tableHeader:  { fontSize:  9, bold: true,  color: WHITE,  margin: [4, 5, 4, 5], characterSpacing: 0.5 },
        tableRow:     { fontSize: 10, color: '#374151', margin: [4, 4, 4, 4] },
        tableRowAlt:  { fontSize: 10, color: '#374151', margin: [4, 4, 4, 4] },
        summaryLabel: { fontSize:  8, bold: true,  color: '#94A3B8', characterSpacing: 0.5 },
        summaryValue: { fontSize: 11, bold: true,  color: NAVY,   margin: [0, 2, 0, 0] },
        footer:       { fontSize:  8, color: '#94A3B8' },
      },

      defaultStyle: {
        font: 'Roboto',
      },
    };

    const date = new Date().toISOString().slice(0, 10);
    pdfMake.createPdf(docDefinition).download(`${filename}_${date}.pdf`);
  };

  return (
    <div style={{ display: 'flex', gap: '7px' }} className={className}>
      <button onClick={exportCSV} className="btn-ghost btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
        <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="7 10 12 15 17 10"/>
          <line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
        CSV
      </button>
      <button onClick={exportPDF} className="btn-ghost btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
        <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
          <polyline points="6 9 6 2 18 2 18 9"/>
          <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
          <rect x="6" y="14" width="12" height="8"/>
        </svg>
        PDF
      </button>
    </div>
  );
}
