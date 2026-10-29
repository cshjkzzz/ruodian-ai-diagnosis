import { test, expect, type Page } from "@playwright/test";
import demo from "../../shared/demo.json";
type Choice = "pass" | "fail" | "skip";
async function complete(page: Page, answers: Record<string, Choice>) {
  await page.goto("/diagnose");
  await page
    .getByRole("textbox", { name: "故障描述", exact: true })
    .fill("演示：摄像头能搜索到，录像机添加后离线");
  await page
    .getByRole("textbox", { name: "品牌名称", exact: true })
    .fill("演示品牌");
  await page
    .getByRole("textbox", { name: "设备型号（可选）", exact: true })
    .fill("演示型号");
  await page.getByRole("button", { name: "进入演示排查", exact: true }).click();
  for (const [i, step] of demo.steps.entries()) {
    const answer = answers[step.id] ?? "pass";
    if (answer === "skip") {
      await page.getByRole("button", { name: "跳过本项", exact: true }).click();
      continue;
    }
    await page.getByRole("button", { name: step[answer], exact: true }).click();
    await page
      .getByRole("button", {
        name: i === demo.steps.length - 1 ? "查看排查总结" : "记录结果，下一步",
        exact: true,
      })
      .click();
  }
  await expect(
    page.getByRole("heading", { name: "诊断报告", exact: true }).last(),
  ).toBeVisible();
}
for (const [step, title] of [
  ["power", "供电或物理链路不稳定的可能性"],
  ["address", "地址规划、网段或地址冲突问题的可能性"],
  ["credentials", "认证信息、激活或账号锁定问题的可能性"],
]) {
  test(`${step}分支生成对应原因、证据与报告`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await complete(page, { [step]: "fail", verify: "fail" });
    await expect(
      page.getByText("已定位可能原因", { exact: true }),
    ).toBeVisible();
    await expect(page.getByText(title, { exact: true })).toBeVisible();
    await expect(
      page.getByText(
        `对应证据：“${demo.steps.find((s) => s.id === step)!.title}”中，用户选择“${demo.steps.find((s) => s.id === step)!.fail}”。`,
        { exact: true },
      ),
    ).toBeVisible();
    await expect(
      page.getByText("品牌：演示品牌", { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText("型号：演示型号", { exact: true }),
    ).toBeVisible();
    expect(errors).toEqual([]);
  });
}
test("关键检查跳过明确提示不足，最终验证跳过不会误判修复", async ({ page }) => {
  await complete(page, { power: "fail", address: "skip", verify: "skip" });
  await expect(page.getByText("待进一步检查", { exact: true })).toBeVisible();
  await expect(
    page.getByText("关键检查信息不足，请补查。现有异常仅作为后续线索。", {
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByText("核对 IP、掩码与地址冲突 · 已跳过", { exact: true }),
  ).toBeVisible();
});
test("全部正常但仍离线不强行给出故障原因", async ({ page }) => {
  await complete(page, { verify: "fail" });
  await expect(page.getByText("待进一步检查", { exact: true })).toBeVisible();
  await expect(
    page.getByText("没有足够证据提出具体原因，不强行推断故障根因。", {
      exact: true,
    }),
  ).toBeVisible();
});
test("报告保存、重开、人工确认编辑与快照保留", async ({ page }) => {
  await complete(page, { address: "fail", verify: "fail" });
  await page.getByRole("button", { name: "保存维修记录", exact: true }).click();
  await page
    .getByRole("button", { name: "查看已保存记录", exact: true })
    .click();
  await expect(page).toHaveURL(/\/record\/local-/);
  const recordUrl = page.url();
  await page
    .getByRole("textbox", { name: "实际维修措施", exact: true })
    .fill("演示：按规划修改冲突地址并验证录像");
  await page
    .getByRole("textbox", { name: "最终故障原因（人工确认）", exact: true })
    .fill("演示人工确认：地址冲突");
  await page
    .getByRole("textbox", { name: "故障描述", exact: true })
    .fill("修改后的记录描述");
  await page.getByRole("button", { name: "已修复", exact: true }).click();
  await page.getByRole("button", { name: "保存修改", exact: true }).click();
  await expect(
    page.getByText("修改已保存到本机。", { exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("textbox", { name: "实际维修措施", exact: true }),
  ).toHaveValue("演示：按规划修改冲突地址并验证录像");
  await page
    .getByRole("button", { name: "查看历史诊断报告", exact: true })
    .click();
  await expect(
    page.getByText("已由用户确认修复", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("地址规划、网段或地址冲突问题的可能性", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("最终故障原因：演示人工确认：地址冲突", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("演示：摄像头能搜索到，录像机添加后离线", { exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByText("已由用户确认修复", { exact: true }),
  ).toBeVisible();
  await page.goto(recordUrl);
  await page.getByRole("button", { name: "尚未修复", exact: true }).click();
  await page.getByRole("button", { name: "保存修改", exact: true }).click();
  await expect(
    page.getByText("修改已保存到本机。", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "查看历史诊断报告", exact: true })
    .click();
  await expect(page.getByText("已定位可能原因", { exact: true })).toBeVisible();
});
test("旧版记录仍能打开并按当前规则补充报告", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() =>
    localStorage.setItem(
      "ruodian.records.v1",
      JSON.stringify([
        {
          id: "legacy-report",
          title: "旧版本维修记录",
          description: "旧版本摄像头离线",
          brand: "",
          model: "",
          category: "camera",
          notes: "旧备注",
          answers: { scope: "pass", power: "fail" },
          status: "pending",
          createdAt: "2026-10-28T00:00:00Z",
          updatedAt: "2026-10-28T00:00:00Z",
        },
      ]),
    ),
  );
  await page.goto("/record/legacy-report");
  await expect(
    page.getByRole("textbox", { name: "处理备注", exact: true }),
  ).toHaveValue("旧备注");
  await page
    .getByRole("button", { name: "查看历史诊断报告", exact: true })
    .click();
  await expect(
    page.getByText(
      "旧记录未保存原始报告；以下按当前 v0.2 演示规则补充生成，保存后可保留此快照。",
      { exact: true },
    ),
  ).toBeVisible();
  await page.getByRole("button", { name: "保存维修记录", exact: true }).click();
  await page.reload();
  await expect(
    page.getByText(
      "旧记录未保存原始报告；以下按当前 v0.2 演示规则补充生成，保存后可保留此快照。",
      { exact: true },
    ),
  ).toHaveCount(0);
});
