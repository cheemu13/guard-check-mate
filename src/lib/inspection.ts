export interface ChecklistSpec {
  item: string;
  pass: string;
  fail: string;
  criticality: "High" | "Medium" | "Minor";
}

/** 13-point checklist from the ICICI security guard uniform standard document. */
export const CHECKLIST_SPECS: ChecklistSpec[] = [
  {
    item: "Blue Cap",
    pass: "Present and worn properly",
    fail: "Missing or not worn properly",
    criticality: "High",
  },
  {
    item: "Blue Shirt Condition",
    pass: "Clean, no stains, no tears, not faded",
    fail: "Torn, faded, stained or damaged",
    criticality: "High",
  },
  {
    item: "Shirt Worn Properly",
    pass: "Properly tucked in and buttoned",
    fail: "Untucked, buttons open or sleeves rolled",
    criticality: "High",
  },
  {
    item: "Collar",
    pass: "Folded properly",
    fail: "Not folded properly",
    criticality: "Medium",
  },
  {
    item: "Chest Badge",
    pass: "Fully visible from the front view",
    fail: "Not visible or missing",
    criticality: "High",
  },
  {
    item: "Side Sleeve Badge",
    pass: "Fully visible on the sleeve",
    fail: "Not visible or missing",
    criticality: "High",
  },
  {
    item: "ID Card Lanyard",
    pass: "Hangs outside the shirt and is readable",
    fail: "Missing, hidden, worn backside or unreadable",
    criticality: "High",
  },
  {
    item: "Blue Epaulette with Button",
    pass: "Visible and present on both shoulders",
    fail: "Missing or damaged",
    criticality: "High",
  },
  {
    item: "Black Belt with Metal Buckle",
    pass: "Correct black belt with metal buckle, fastened",
    fail: "Missing or incorrect belt",
    criticality: "Medium",
  },
  {
    item: "Blue Trouser",
    pass: "No visible stains, holes, fading or wrinkles",
    fail: "Wrong colour or torn",
    criticality: "High",
  },
  {
    item: "Black Shoes",
    pass: "Black, formal and polished",
    fail: "Dirty, not formal, laceless or wrong colour",
    criticality: "High",
  },
  {
    item: "Black Socks",
    pass: "Black and above ankle length",
    fail: "Below ankle length, missing or wrong colour",
    criticality: "Medium",
  },
  {
    item: "Grooming & Accessories",
    pass: "Clean-shaven or neatly trimmed beard, neat hair, no chains or bracelets",
    fail: "Untidy beard, unkempt hair, chain or bracelet visible on neck or wrist",
    criticality: "Minor",
  },
];

export const CHECKLIST_ITEMS = CHECKLIST_SPECS.map((s) => s.item);

/** Any of these conditions forces an overall FAIL regardless of the score. */
export const AUTO_FAIL_RULES = [
  "ID card missing",
  "Shirt torn",
  "Wrong uniform",
  "Chest badge missing",
  "Sleeve badge missing",
  "Shoes not formal",
];

export const CRITICALITY_WEIGHT: Record<ChecklistSpec["criticality"], number> = {
  High: 3,
  Medium: 2,
  Minor: 1,
};

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
  criticality?: ChecklistSpec["criticality"];
}

export interface InspectionResult {
  overall: OverallStatus;
  score: number;
  checklist: ChecklistResult[];
  criticalIssues: string[];
  autoFailReasons?: string[];
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
