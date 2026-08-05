export interface ChecklistSpec {
  item: string;
  pass: string;
  fail: string;
  /** Short fix shown to the guard when the item is not correct. */
  recommendation: string;
}

/** 13-point checklist from the ICICI security guard uniform standard document. */
export const CHECKLIST_SPECS: ChecklistSpec[] = [
  {
    item: "Blue Cap",
    pass: "Present and worn properly",
    fail: "Missing or not worn properly",
    recommendation: "Wear your blue cap straight on your head",
  },
  {
    item: "Blue Shirt Condition",
    pass: "Clean, no stains, no tears, not faded",
    fail: "Torn, faded, stained or damaged",
    recommendation: "Change into a clean, undamaged blue shirt",
  },
  {
    item: "Shirt Worn Properly",
    pass: "Properly tucked in and buttoned",
    fail: "Untucked, buttons open or sleeves rolled",
    recommendation: "Tuck in your shirt and button it fully",
  },
  {
    item: "Collar",
    pass: "Folded properly",
    fail: "Not folded properly",
    recommendation: "Fold your collar down neatly",
  },
  {
    item: "Chest Badge",
    pass: "Fully visible from the front view",
    fail: "Not visible or missing",
    recommendation: "Pin your name badge on the chest",
  },
  {
    item: "Side Sleeve Badge",
    pass: "Fully visible on the sleeve",
    fail: "Not visible or missing",
    recommendation: "Attach the sleeve badge on your arm",
  },
  {
    item: "ID Card Lanyard",
    pass: "Hangs outside the shirt and is readable",
    fail: "Missing, hidden, worn backside or unreadable",
    recommendation: "Wear your ID card outside, facing front",
  },
  {
    item: "Blue Epaulette with Button",
    pass: "Visible and present on both shoulders",
    fail: "Missing or damaged",
    recommendation: "Fix the epaulettes on both shoulders",
  },
  {
    item: "Black Belt with Metal Buckle",
    pass: "Correct black belt with metal buckle, fastened",
    fail: "Missing or incorrect belt",
    recommendation: "Wear the black belt with metal buckle",
  },
  {
    item: "Blue Trouser",
    pass: "No visible stains, holes, fading or wrinkles",
    fail: "Wrong colour or torn",
    recommendation: "Wear clean, undamaged blue trousers",
  },
  {
    item: "Black Shoes",
    pass: "Black, formal and polished",
    fail: "Dirty, not formal, laceless or wrong colour",
    recommendation: "Wear polished black formal shoes",
  },
  {
    item: "Black Socks",
    pass: "Black and above ankle length",
    fail: "Below ankle length, missing or wrong colour",
    recommendation: "Wear black socks above the ankle",
  },
  {
    item: "Grooming & Accessories",
    pass: "Clean-shaven or neatly trimmed beard, neat hair, no chains or bracelets",
    fail: "Untidy beard, unkempt hair, chain or bracelet visible",
    recommendation: "Tidy your hair/beard and remove chains or bracelets",
  },
];

export const CHECKLIST_ITEMS = CHECKLIST_SPECS.map((s) => s.item);

export const RECOMMENDATION_BY_ITEM: Record<string, string> = Object.fromEntries(
  CHECKLIST_SPECS.map((s) => [s.item, s.recommendation]),
);

/** Only three simple statuses — no scores, marks or ratings. */
export type ItemStatus = "correct" | "needs_correction" | "missing";

export const STATUS_META: Record<ItemStatus, { icon: string; label: string; tone: string }> = {
  correct: { icon: "✅", label: "Correct", tone: "text-success" },
  needs_correction: { icon: "⚠️", label: "Needs Correction", tone: "text-warning" },
  missing: { icon: "❌", label: "Missing", tone: "text-destructive" },
};

export type OverallStatus = "all_correct" | "action_needed";

export const OVERALL_META: Record<OverallStatus, { label: string; className: string }> = {
  all_correct: { label: "All Correct", className: "bg-success text-success-foreground" },
  action_needed: {
    label: "Corrections Needed",
    className: "bg-warning text-warning-foreground",
  },
};

export interface ChecklistResult {
  item: string;
  status: ItemStatus;
  /** Short fix instruction, shown only when the item is not correct. */
  recommendation?: string;
}

export interface InspectionResult {
  overall: OverallStatus;
  checklist: ChecklistResult[];
  /** Short list of what to fix, in plain words. */
  recommendations: string[];
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

export function issuesOf(result: InspectionResult): ChecklistResult[] {
  return result.checklist.filter((c) => c.status !== "correct");
}
