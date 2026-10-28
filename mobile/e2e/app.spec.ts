import { test, expect } from "@playwright/test";

test("首页分类、知识库搜索、文章详情和空状态", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(page.getByText("把复杂故障，一步步理清。")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "监控故障诊断" }),
  ).toBeVisible();
  await page
    .getByRole("textbox", { name: "搜索故障、设备或关键词" })
    .fill("不存在的故障");
  await expect(page.getByText("暂未找到相关内容")).toBeVisible();
  await page.goto("/knowledge");
  await page
    .getByRole("textbox", { name: "搜索故障、设备或关键词" })
    .fill("Wi-Fi");
  await page
    .getByRole("button", { name: "阅读：能连上 Wi-Fi，但无法访问网络" })
    .click();
  await expect(page.getByText("判断影响范围", { exact: true })).toBeVisible();
  await expect(
    page.getByText(
      "资料来源：项目内人工编写的演示示例。未经厂商审核，不是官方技术文档。",
    ),
  ).toBeVisible();
  expect(errors).toEqual([]);
});

test("完整排障、返回修改、跳过、保存、编辑、刷新持久化与删除", async ({
  page,
}) => {
  await page.goto("/diagnose");
  await page.getByRole("button", { name: "进入演示排查", exact: true }).click();
  await expect(
    page.getByText("请先描述故障，或使用下方现场示例。"),
  ).toBeVisible();
  await page.getByRole("button", { name: "使用此现场示例" }).click();
  await expect(
    page.getByText("确认现象与现场安全", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "现象一致，可以继续", exact: true })
    .click();
  await page.getByRole("button", { name: "记录结果，下一步" }).click();
  await page
    .getByRole("button", { name: "稳定，未发现异常", exact: true })
    .click();
  await page.getByRole("button", { name: "记录结果，下一步" }).click();
  await page.getByRole("button", { name: "上一步", exact: true }).click();
  await expect(
    page.getByText("检查供电与物理链路", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "异常或反复掉线", exact: true })
    .click();
  await expect(
    page.getByText(
      "优先处理供电或网线问题，再重新验证在线状态。不要在链路不稳时反复更改密码。",
    ),
  ).toBeVisible();
  await page.getByRole("button", { name: "记录结果，下一步" }).click();
  await page.getByRole("button", { name: "跳过本项", exact: true }).click();
  await page.getByRole("button", { name: "已确认正常", exact: true }).click();
  await page.getByRole("button", { name: "记录结果，下一步" }).click();
  await page
    .getByRole("button", { name: "一致，配置已确认", exact: true })
    .click();
  await page.getByRole("button", { name: "记录结果，下一步" }).click();
  await page
    .getByRole("button", { name: "已恢复，验证通过", exact: true })
    .click();
  await page.getByRole("button", { name: "查看排查总结" }).click();
  await expect(
    page.getByText("已由用户确认修复", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("textbox", { name: "现场备注" })
    .fill("演示：检查链路后恢复，需持续观察。");
  await page.getByRole("button", { name: "保存维修记录", exact: true }).click();
  await expect(
    page.getByText("已保存到本地维修记录，再次保存会更新同一条记录。"),
  ).toBeVisible();
  await page.getByRole("button", { name: "查看已保存记录" }).click();
  await expect(page.getByRole("textbox", { name: "处理备注" })).toHaveValue(
    "演示：检查链路后恢复，需持续观察。",
  );
  await page
    .getByRole("textbox", { name: "记录标题" })
    .fill("现场演示记录 · 已复核");
  await page.getByRole("button", { name: "保存修改", exact: true }).click();
  await expect(page.getByText("修改已保存到本机。")).toBeVisible();
  await page.reload();
  await expect(page.getByRole("textbox", { name: "记录标题" })).toHaveValue(
    "现场演示记录 · 已复核",
  );
  await page.getByRole("button", { name: "删除这条记录" }).click();
  await page.getByRole("button", { name: "确认删除", exact: true }).click();
  await expect(page.getByText("还没有维修记录", { exact: true })).toBeVisible();
});

test("资料保存、会员占位和未配置后端提示", async ({ page }) => {
  await page.goto("/profile");
  await page.getByRole("textbox", { name: "怎么称呼你" }).fill("演示工程师");
  await page.getByRole("button", { name: "保存资料", exact: true }).click();
  await expect(
    page.getByText("资料已保存到本机，不代表已注册或登录。"),
  ).toBeVisible();
  await page.reload();
  await expect(page.getByRole("textbox", { name: "怎么称呼你" })).toHaveValue(
    "演示工程师",
  );
  await page.goto("/membership");
  await expect(
    page.getByText(
      "本版本无订阅、无价格、无支付入口，也不会扣费。正式上线前将另行公布服务条款与会员权益。",
    ),
  ).toBeVisible();
  await page.goto("/settings");
  await page.getByRole("button", { name: "检查后端连接" }).click();
  await expect(
    page.getByText("未配置后端地址；本地演示功能可正常使用。"),
  ).toBeVisible();
});
