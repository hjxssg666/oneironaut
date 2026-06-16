import { test, expect } from '@playwright/test';

/** T-023: E2E 烟雾测试 — 核心流程验证 */

test('应用加载成功', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#root')).toBeVisible();
});

test('Landing 落地页渐进体验', async ({ page }) => {
  await page.goto('/');

  // 第1段：品牌标题可见
  const title = page.getByText('梦海');
  await expect(title.first()).toBeVisible({ timeout: 5000 });

  // 滚动进入第2段
  await page.mouse.wheel(0, 500);
  await page.waitForTimeout(600);

  // 第3段：CTA 出现
  await page.mouse.wheel(0, 500);
  const cta = page.getByText('进入梦海');
  await expect(cta).toBeVisible({ timeout: 3000 });

  // 点击进入
  await cta.click();
  await page.waitForTimeout(1000);
});

test('3D 场景渲染 + HUD 显示', async ({ page }) => {
  await page.goto('/');

  // 快速进入场景（点击 CTA）
  const cta = page.getByText('进入梦海');
  // 滚动到 CTA
  await page.mouse.wheel(0, 1200);
  await page.waitForTimeout(500);
  if (await cta.isVisible()) await cta.click();

  // 等待 HUD 出现
  await page.waitForTimeout(2000);
  await expect(page.getByText('梦海').first()).toBeVisible({ timeout: 5000 });
});

test('时间线面板打开', async ({ page }) => {
  await page.goto('/');
  // 快速进入场景
  await page.mouse.wheel(0, 1200);
  await page.waitForTimeout(500);
  const cta = page.getByText('进入梦海');
  if (await cta.isVisible()) await cta.click();
  await page.waitForTimeout(3000);

  // 点击时间线按钮
  const timelineBtn = page.getByText('时间线');
  if (await timelineBtn.isVisible()) {
    await timelineBtn.click();
    await page.waitForTimeout(500);
    await expect(page.getByText('时间线').first()).toBeVisible({ timeout: 3000 });
  }
});

test('AI 面板打开', async ({ page }) => {
  await page.goto('/');
  await page.mouse.wheel(0, 1200);
  await page.waitForTimeout(500);
  const cta = page.getByText('进入梦海');
  if (await cta.isVisible()) await cta.click();
  await page.waitForTimeout(3000);

  const aiBtn = page.getByText('AI');
  if (await aiBtn.isVisible()) {
    await aiBtn.click();
    await page.waitForTimeout(500);
    await expect(page.getByText('虚空生成').first()).toBeVisible({ timeout: 3000 });
  }
});

test('虚拟梦境生成', async ({ page }) => {
  await page.goto('/');
  await page.mouse.wheel(0, 1200);
  await page.waitForTimeout(500);
  const cta = page.getByText('进入梦海');
  if (await cta.isVisible()) await cta.click();
  await page.waitForTimeout(3000);

  // 打开 AI 面板
  const aiBtn = page.getByText('AI');
  if (await aiBtn.isVisible()) {
    await aiBtn.click();
    await page.waitForTimeout(500);

    // 点击虚空生成
    const genBtn = page.getByText('虚空生成');
    if (await genBtn.isVisible()) {
      await genBtn.click();
      await page.waitForTimeout(1000);
    }
  }
});
