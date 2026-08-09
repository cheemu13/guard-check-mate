import { allRecords, getRecord, putRecord, removeRecord } from "./store";

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

/** Severity used to colour the AI annotation overlay. */
export type Severity = "critical" | "medium" | "minor";

export const SEVERITY_META: Record<
  Severity,
  { label: string; color: string; badge: string; ring: string }
> = {
  critical: {
    label: "Critical",
    color: "var(--severity-critical)",
    badge: "bg-severity-critical text-white",
    ring: "border-severity-critical",
  },
  medium: {
    label: "Medium",
    color: "var(--severity-medium)",
    badge: "bg-severity-medium text-white",
    ring: "border-severity-medium",
  },
  minor: {
    label: "Minor",
    color: "var(--severity-minor)",
    badge: "bg-severity-minor text-foreground",
    ring: "border-severity-minor",
  },
};

/** Default severity per checklist item, used when the vision model omits one. */
export const SEVERITY_BY_ITEM: Record<string, Severity> = {
  "Blue Cap": "medium",
  "Blue Shirt Condition": "critical",
  "Shirt Worn Properly": "medium",
  Collar: "minor",
  "Chest Badge": "critical",
  "Side Sleeve Badge": "medium",
  "ID Card Lanyard": "critical",
  "Blue Epaulette with Button": "minor",
  "Black Belt with Metal Buckle": "medium",
  "Blue Trouser": "medium",
  "Black Shoes": "medium",
  "Black Socks": "minor",
  "Grooming & Accessories": "minor",
};

/**
 * Normalised bounding box (0–1) relative to the captured photo, as returned by
 * the vision model. Rendered as percentages so it scales with any photo size.
 */
export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ChecklistResult {
  item: string;
  status: ItemStatus;
  /** Short fix instruction, shown only when the item is not correct. */
  recommendation?: string;
  /** Colour band for the annotation overlay. */
  severity?: Severity;
  /** Why the AI flagged this item, in plain words. */
  reason?: string;
  /** Where on the photo the issue is, normalised 0–1. Absent = no marker. */
  box?: BoundingBox;
}

export interface InspectionResult {
  overall: OverallStatus;
  checklist: ChecklistResult[];
  /** Short list of what to fix, in plain words. */
  recommendations: string[];
}

/** Short marker caption, e.g. "ID Card Missing". */
export function annotationLabel(c: ChecklistResult): string {
  return c.status === "missing" ? `${c.item} Missing` : c.item;
}

/** Issues that carry usable coordinates for the annotation overlay. */
export function annotationsOf(result: InspectionResult): ChecklistResult[] {
  return issuesOf(result).filter(
    (c) =>
      c.box != null &&
      Number.isFinite(c.box.x) &&
      Number.isFinite(c.box.y) &&
      c.box.width > 0 &&
      c.box.height > 0,
  );
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

/** How many inspections are kept on the device; older ones are pruned. */
export const MAX_STORED_INSPECTIONS = 15;

/** Newest first. */
export async function loadInspections(): Promise<InspectionRecord[]> {
  const all = await allRecords<InspectionRecord>();
  return all.sort((a, b) => (a.dateTime < b.dateTime ? 1 : a.dateTime > b.dateTime ? -1 : 0));
}

/** Rejects if the record could not be stored — do not treat this as fire-and-forget. */
export async function saveInspection(record: InspectionRecord): Promise<void> {
  await putRecord(record);
  // Keep the newest MAX_STORED_INSPECTIONS complete records; drop only older ones.
  try {
    const all = await loadInspections();
    for (const old of all.slice(MAX_STORED_INSPECTIONS)) {
      await removeRecord(old.id);
    }
  } catch (err) {
    console.error("Could not prune old inspections", err);
  }
}


export async function getInspection(id: string): Promise<InspectionRecord | undefined> {
  return getRecord<InspectionRecord>(id);
}

export async function deleteInspection(id: string): Promise<void> {
  await removeRecord(id);
}

export function issuesOf(result: InspectionResult): ChecklistResult[] {
  return result.checklist.filter((c) => c.status !== "correct");
}
