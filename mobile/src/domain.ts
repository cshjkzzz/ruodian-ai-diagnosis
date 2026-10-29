import {
  isDiagnosisReport,
  isRepairConfirmation,
  type DiagnosisReport,
  type RepairConfirmation,
} from "./report";
import demo from "../../shared/demo.json";
export const categories = demo.categories;
export const articles = demo.articles;
export const steps = demo.steps;
export type Category = "camera" | "network" | "access" | "computer";
export type Answer = "pass" | "fail" | "skip";
export type Answers = Partial<Record<string, Answer>>;
export type RepairRecord = {
  id: string;
  title: string;
  category: Category;
  brand: string;
  model: string;
  description: string;
  notes: string;
  status: "pending" | "resolved";
  answers: Answers;
  createdAt: string;
  updatedAt: string;
  report?: DiagnosisReport;
  confirmation?: RepairConfirmation;
};
export const categoryName = (id: string) =>
  categories.find((c) => c.id === id)?.name ?? "其他";
export function filterArticles(query: string, category = "all") {
  const q = query.trim().toLowerCase();
  return articles.filter(
    (a) =>
      (category === "all" || a.category === category) &&
      `${a.title} ${a.summary} ${a.tags.join(" ")} ${a.sections.map((s) => s.body).join(" ")}`
        .toLowerCase()
        .includes(q),
  );
}
export function diagnosisStatus(answers: Answers): RepairRecord["status"] {
  return answers.verify === "pass" ? "resolved" : "pending";
}
export function progress(answers: Answers) {
  return steps.filter((s) => answers[s.id]).length;
}
export function truncateAfter(answers: Answers, index: number): Answers {
  return Object.fromEntries(
    steps
      .slice(0, index + 1)
      .filter((s) => answers[s.id])
      .map((s) => [s.id, answers[s.id]]),
  );
}
export function parseRecords(raw: string | null): RepairRecord[] {
  if (!raw) return [];
  const value: unknown = JSON.parse(raw);
  if (
    !Array.isArray(value) ||
    !value.every(
      (v) =>
        v &&
        typeof v.id === "string" &&
        typeof v.title === "string" &&
        typeof v.description === "string" &&
        typeof v.notes === "string" &&
        typeof v.brand === "string" &&
        typeof v.model === "string" &&
        categories.some((c) => c.id === v.category) &&
        ["pending", "resolved"].includes(v.status) &&
        typeof v.createdAt === "string" &&
        typeof v.updatedAt === "string" &&
        (v.report === undefined || isDiagnosisReport(v.report)) &&
        (v.confirmation === undefined ||
          isRepairConfirmation(v.confirmation)) &&
        v.answers &&
        typeof v.answers === "object" &&
        Object.values(v.answers).every((a) =>
          ["pass", "fail", "skip"].includes(String(a)),
        ),
    )
  )
    throw new Error("本地记录格式无法识别，已保留原始数据，请勿清除应用数据。");
  return value as RepairRecord[];
}
