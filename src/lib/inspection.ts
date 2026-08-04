export const CHECKLIST_ITEMS = [
  "Cap",
  "Cap Badge",
  "Shirt",
  "Collar",
  "Shoulder Epaulettes",
  "Chest Badge",
  "Name Badge",
  "ID Card",
  "Belt",
  "Trousers",
  "Shoes",
  "Grooming",
  "Uniform Cleanliness",
  "Shirt Tucked In",
] as const;

export type ChecklistItemName = (typeof CHECKLIST_ITEMS)[number];

export type ItemStatus =
  | "correct"
  | "missing"
  | "incorrectly_worn"
  | "damaged"
  | "not_visible";

export const STATUS_META: Record<ItemStatus, { icon: string; label: string; tone: string }> = {
  correct: { icon: "✅", label: "Correct", tone: "text-success" },
  missing: { icon: "❌", label: "Missing", tone: "text-destructive" },
  incorrectly_worn: { icon: "⚠", label: "Incorrectly Worn", tone: "text-warning" },
  damaged: { icon: "⚠", label: "Damaged", tone: "text-warning" },
  not_visible: { icon: "👁", label: "Not Visible", tone: "text-muted-foreground" },
};

export type OverallStatus = "pass" | "needs_attention" | "fail";

export interface ChecklistResult {
  item: string;
  status: ItemStatus;
  note?: string;
}

export interface InspectionResult {
  overall: OverallStatus;
  score: number;
  checklist: ChecklistResult[];
  criticalIssues: string[];
  summary: string;
}

export interface InspectionRecord {
  id: string;
  branchName: string;
  guardName: string;
  guardId: string;
  dateTime: string;
  guardPhoto: string;
  result: InspectionResult;
  comments: string;
  submitted: boolean;
}

const KEY = "icici-inspections";

export function loadInspections(): InspectionRecord[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem(KEY) ?? "[]") as InspectionRecord[];
  } catch {
    return [];
  }
}

export function saveInspection(record: InspectionRecord) {
  const all = loadInspections().filter((r) => r.id !== record.id);
  all.unshift(record);
  window.localStorage.setItem(KEY, JSON.stringify(all));
}

export function getInspection(id: string): InspectionRecord | undefined {
  return loadInspections().find((r) => r.id === id);
}

export function deleteInspection(id: string) {
  window.localStorage.setItem(
    KEY,
    JSON.stringify(loadInspections().filter((r) => r.id !== id)),
  );
}

export const OVERALL_META: Record<OverallStatus, { label: string; className: string }> = {
  pass: { label: "Pass", className: "bg-success text-success-foreground" },
  needs_attention: { label: "Needs Attention", className: "bg-warning text-warning-foreground" },
  fail: { label: "Fail", className: "bg-destructive text-destructive-foreground" },
};
