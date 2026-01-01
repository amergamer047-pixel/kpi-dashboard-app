import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

interface Category {
  id: number;
  name: string;
}

interface Indicator {
  id: number;
  categoryId: number;
  name: string;
  unit: string | null;
  requiresPatientInfo: number | null;
}

interface MonthlyData {
  indicatorId: number;
  month: number;
  value: string | null;
}

interface PatientCase {
  id: number;
  indicatorId: number;
  hospitalId: string;
  patientName: string;
  month: number;
  notes: string | null;
}

interface ExcelExportProps {
  departmentName: string;
  year: number;
  quarter: number;
  categories: Category[];
  indicators: Indicator[];
  monthlyData: MonthlyData[];
  patientCases: PatientCase[];
}

const MONTHS = [
  { value: 1, label: "January", short: "Jan" },
  { value: 2, label: "February", short: "Feb" },
  { value: 3, label: "March", short: "Mar" },
  { value: 4, label: "April", short: "Apr" },
  { value: 5, label: "May", short: "May" },
  { value: 6, label: "June", short: "Jun" },
  { value: 7, label: "July", short: "Jul" },
  { value: 8, label: "August", short: "Aug" },
  { value: 9, label: "September", short: "Sep" },
  { value: 10, label: "October", short: "Oct" },
  { value: 11, label: "November", short: "Nov" },
  { value: 12, label: "December", short: "Dec" },
];

const QUARTERS = [
  { value: 1, label: "Q1", months: [1, 2, 3] },
  { value: 2, label: "Q2", months: [4, 5, 6] },
  { value: 3, label: "Q3", months: [7, 8, 9] },
  { value: 4, label: "Q4", months: [10, 11, 12] },
];

export function ExcelExport({
  departmentName,
  year,
  quarter,
  categories,
  indicators,
  monthlyData,
  patientCases,
}: ExcelExportProps) {
  const quarterMonths = QUARTERS.find((q) => q.value === quarter)?.months || [];

  const getCellValue = (indicatorId: number, month: number): number => {
    const indicator = indicators.find((i) => i.id === indicatorId);

    if (indicator?.requiresPatientInfo) {
      return patientCases.filter(
        (c) => c.indicatorId === indicatorId && c.month === month
      ).length;
    }

    const data = monthlyData.find(
      (d) => d.indicatorId === indicatorId && d.month === month
    );
    return parseFloat(data?.value || "0");
  };

  const handleExport = () => {
    const workbook = XLSX.utils.book_new();

    // Sheet 1: KPI Summary
    const summaryData: (string | number)[][] = [];

    // Header row
    const headerRow = [
      "Category",
      "KPI Indicator",
      "Unit",
      ...quarterMonths.map((m) => MONTHS.find((mo) => mo.value === m)?.label || ""),
      "Q" + quarter + " Total",
    ];
    summaryData.push(headerRow);

    // Data rows grouped by category
    categories.forEach((category) => {
      const categoryIndicators = indicators.filter(
        (ind) => ind.categoryId === category.id
      );

      categoryIndicators.forEach((indicator, idx) => {
        const monthValues = quarterMonths.map((month) =>
          getCellValue(indicator.id, month)
        );
        const total = monthValues.reduce((sum, val) => sum + val, 0);

        summaryData.push([
          idx === 0 ? category.name : "",
          indicator.name,
          indicator.unit || "cases",
          ...monthValues,
          total,
        ]);
      });
    });

    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);

    // Set column widths
    summarySheet["!cols"] = [
      { wch: 15 }, // Category
      { wch: 20 }, // KPI Indicator
      { wch: 10 }, // Unit
      { wch: 12 }, // Month 1
      { wch: 12 }, // Month 2
      { wch: 12 }, // Month 3
      { wch: 12 }, // Total
    ];

    XLSX.utils.book_append_sheet(workbook, summarySheet, "KPI Summary");

    // Sheet 2: Patient Cases (if any)
    if (patientCases.length > 0) {
      const patientData: (string | number)[][] = [];

      // Header row
      patientData.push([
        "Category",
        "KPI Indicator",
        "Month",
        "Hospital ID",
        "Patient Name",
        "Notes",
      ]);

      // Data rows
      patientCases.forEach((pc) => {
        const indicator = indicators.find((i) => i.id === pc.indicatorId);
        const category = categories.find(
          (c) => c.id === indicator?.categoryId
        );
        const monthName =
          MONTHS.find((m) => m.value === pc.month)?.label || "";

        patientData.push([
          category?.name || "",
          indicator?.name || "",
          monthName,
          pc.hospitalId,
          pc.patientName,
          pc.notes || "",
        ]);
      });

      const patientSheet = XLSX.utils.aoa_to_sheet(patientData);

      // Set column widths
      patientSheet["!cols"] = [
        { wch: 15 }, // Category
        { wch: 20 }, // KPI Indicator
        { wch: 12 }, // Month
        { wch: 15 }, // Hospital ID
        { wch: 20 }, // Patient Name
        { wch: 30 }, // Notes
      ];

      XLSX.utils.book_append_sheet(workbook, patientSheet, "Patient Cases");
    }

    // Generate file and download
    const fileName = `${departmentName.replace(/\s+/g, "_")}_KPI_${year}_Q${quarter}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  return (
    <Button variant="outline" size="sm" onClick={handleExport}>
      <Download className="h-4 w-4 mr-2" />
      Export Excel
    </Button>
  );
}
