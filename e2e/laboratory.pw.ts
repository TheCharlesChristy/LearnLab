import { expect, test } from '@playwright/test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
const ROUTE = '/#/laboratory/research-station/close-the-loop';
test.skip(
  process.env.VITE_EXPERIENCE_RUNTIME_V2 !== 'true',
  'Laboratory preview is explicitly disabled in this build.',
);

test('first station episode: mistakes, keyboard repair, help, evidence and resume', async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const start = Date.now();
  await page.goto(ROUTE);
  const supply = page.getByRole('group', { name: 'Supply link' });
  await supply.getByRole('button', { name: 'Closed', exact: true }).click();
  expect(Date.now() - start).toBeLessThan(20000); // Functional first-action hypothesis, not human performance.
  await expect(page.getByRole('status').filter({ hasText: 'Source current' })).toContainText('0 A');
  await page
    .getByRole('group', { name: 'Return link' })
    .getByRole('button', { name: 'Closed', exact: true })
    .press('Enter');
  await expect(page.getByRole('status').filter({ hasText: 'Source current' })).toContainText('1 A');
  await page.getByText('See the path and meter readings', { exact: true }).click();
  await expect(page.getByRole('table')).toBeVisible();
  await page.screenshot({ path: info.outputPath('beacon-desktop.png'), fullPage: true });
  await page.getByRole('button', { name: 'Continue investigation', exact: true }).press('Enter');
  await page
    .getByRole('button', {
      name: 'It keeps flowing near the supply, but not after the gap.',
      exact: true,
    })
    .click();
  await expect(page.getByRole('status').filter({ hasText: 'Try another' })).toBeVisible();
  await page
    .getByRole('button', { name: 'It falls to zero throughout the path.', exact: true })
    .click();
  await page.getByRole('button', { name: 'Continue investigation', exact: true }).click();
  await page
    .getByRole('group', { name: 'Return link' })
    .getByRole('button', { name: 'Open', exact: true })
    .click();
  await page.getByRole('button', { name: 'Continue investigation', exact: true }).click();
  await page.getByRole('button', { name: '0.4 A', exact: true }).click();
  await page.getByRole('button', { name: 'Help', exact: true }).click();
  await page.getByRole('button', { name: 'Show next hint', exact: true }).click();
  await page.getByRole('button', { name: '0 A', exact: true }).click();
  await page.getByRole('button', { name: 'Continue investigation', exact: true }).click();
  await page
    .getByRole('button', {
      name: 'Charge is conserved. The resistor transfers energy; the steady current is the same before and after it.',
      exact: true,
    })
    .click();
  await page.getByRole('button', { name: 'Finish investigation', exact: true }).click();
  await expect(page.getByText('1 of 2 fresh checks', { exact: false })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'The beacon has a story to tell' })).toBeVisible();
  await page.getByText('See each check in your notebook', { exact: true }).click();
  await expect(page.getByText('Fresh independent check', { exact: false })).toHaveCount(1);
  await page.getByText('Notebook tools', { exact: true }).click();
  const exported = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export work', exact: true }).click();
  const download = await exported;
  expect(download.suggestedFilename()).toContain('work.json');
  expect(errors).toEqual([]);
});

test('new investigations: charge windows, source energy and two resistance routes', async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/#/laboratory/research-station/charge-counter');
  await expect(page.getByRole('heading', { name: 'The recorder needs a reading' })).toBeVisible();
  await expect(page.getByRole('status').filter({ hasText: 'Source current' })).toContainText(
    '2 C passes in 2 s',
  );
  await page
    .getByRole('group', { name: 'Observation window' })
    .getByRole('button', { name: '4 s' })
    .press('Enter');
  await expect(page.getByRole('status').filter({ hasText: 'Source current' })).toContainText(
    '4 C passes in 4 s',
  );
  await page.getByRole('button', { name: 'Continue investigation' }).click();
  await page.getByRole('button', { name: '6 C', exact: true }).click();
  await page.getByRole('button', { name: 'Continue investigation' }).click();
  await page.getByRole('button', { name: '6 C', exact: true }).click();
  await page.getByRole('button', { name: 'Continue investigation' }).click();
  await page.getByRole('button', { name: /0.8 A, because charge is conserved/ }).click();
  await page.getByRole('button', { name: 'Finish investigation' }).click();
  await expect(page.getByText('2 of 2 fresh checks', { exact: false })).toBeVisible();

  await page.goto('/#/laboratory/research-station/energy-lift');
  await expect(page.getByRole('heading', { name: 'Set the energy lift' })).toBeVisible();
  await page
    .getByRole('group', { name: 'Ideal supply' })
    .getByRole('button', { name: '6 V' })
    .click();
  await expect(page.getByRole('status').filter({ hasText: 'Source current' })).toContainText(
    '24 J transferred',
  );
  await page
    .getByRole('group', { name: 'Observation window' })
    .getByRole('button', { name: '2 s' })
    .click();
  await expect(page.getByRole('status').filter({ hasText: 'Source current' })).toContainText(
    '12 J transferred',
  );
  await page
    .getByRole('group', { name: 'Observation window' })
    .getByRole('button', { name: '4 s' })
    .click();
  await expect(
    page.getByRole('group', { name: 'Observation window' }).getByRole('button', { name: '4 s' }),
  ).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('status').filter({ hasText: 'Source current' })).toContainText(
    '24 J transferred',
  );
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  );
  await page.screenshot({ path: info.outputPath('station-energy-console.png'), fullPage: true });
  await page.getByRole('button', { name: 'Continue investigation' }).click();
  await expect(page.getByRole('heading', { name: 'Read a different lift' })).toBeVisible();
  await page.getByRole('button', { name: '6 V', exact: true }).click();
  await page.getByRole('button', { name: 'Continue investigation' }).click();
  await page.getByRole('button', { name: '5 V', exact: true }).click();
  await page.getByRole('button', { name: 'Continue investigation' }).click();
  await page
    .getByRole('button', { name: /Both have 1 A, but each coulomb receives more energy/ })
    .click();
  await page.getByRole('button', { name: 'Finish investigation' }).click();
  await expect(page.getByText('2 of 2 fresh checks', { exact: false })).toBeVisible();

  await page.goto('/#/laboratory/research-station/resistance-budget');
  await expect(page.getByRole('heading', { name: 'Keep the heater in range' })).toBeVisible();
  await page
    .getByRole('group', { name: 'Ideal sensor heater' })
    .getByRole('button', { name: '6 Ω' })
    .click();
  await expect(page.getByRole('status').filter({ hasText: 'Source current' })).toContainText(
    'Target reached',
  );
  await page
    .getByRole('group', { name: 'Ideal sensor heater' })
    .getByRole('button', { name: '12 Ω' })
    .click();
  await page
    .getByRole('group', { name: 'Ideal supply' })
    .getByRole('button', { name: '12 V' })
    .click();
  await expect(page.getByRole('status').filter({ hasText: 'Source current' })).toContainText('1 A');
  await page.getByRole('button', { name: 'Continue investigation' }).click();
  await expect(page.getByRole('heading', { name: 'Two ways to one ampere' })).toBeVisible();
  await page.getByRole('button', { name: /Voltage and resistance rise together/ }).click();
  await page.getByRole('button', { name: 'Continue investigation' }).click();
  await page.getByRole('button', { name: '1.5 A', exact: true }).click();
  await page.getByRole('button', { name: 'Continue investigation' }).click();
  await page
    .getByRole('button', { name: /It is true when the potential difference is held fixed/ })
    .click();
  await page.getByRole('button', { name: 'Finish investigation' }).click();
  await expect(page.getByText('2 of 2 fresh checks', { exact: false })).toBeVisible();
  expect(errors).toEqual([]);
});

test('series and parallel investigations: shared current, branch survival and fresh predictions', async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/#/laboratory/research-station/series-path');
  await expect(page.getByRole('heading', { name: 'Tune two loads in one path' })).toBeVisible();
  const firstControl = await page
    .getByRole('group', { name: 'Rear coil' })
    .getByRole('button', { name: '9 Ω' })
    .boundingBox();
  expect(firstControl!.y + firstControl!.height).toBeLessThan(page.viewportSize()!.height);
  await page.getByRole('group', { name: 'Rear coil' }).getByRole('button', { name: '9 Ω' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Source current' })).toContainText('1 A');
  await page.getByRole('group', { name: 'Rear coil' }).getByRole('button', { name: '3 Ω' }).click();
  await page
    .getByRole('group', { name: 'Front coil' })
    .getByRole('button', { name: '9 Ω' })
    .click();
  await expect(page.getByRole('status').filter({ hasText: 'Source current' })).toContainText(
    'Target reached',
  );
  await page
    .getByRole('group', { name: 'Front coil' })
    .getByRole('button', { name: '3 Ω' })
    .click();
  await page.getByRole('group', { name: 'Rear coil' }).getByRole('button', { name: '9 Ω' }).click();
  await page.getByText('See the path and meter readings', { exact: true }).click();
  await expect(page.getByRole('table')).toContainText('9');
  await page.getByRole('button', { name: 'Continue investigation' }).click();
  await page.getByRole('button', { name: /3 V then 9 V/ }).click();
  await page.getByRole('button', { name: 'Continue investigation' }).click();
  await page
    .getByRole('group', { name: 'Front coil' })
    .getByRole('button', { name: '9 Ω' })
    .click();
  await page.getByRole('group', { name: 'Rear coil' }).getByRole('button', { name: '3 Ω' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Source current' })).toContainText(
    'Target reached',
  );
  await page.getByRole('button', { name: 'Continue investigation' }).click();
  await page.getByRole('button', { name: '1 A and 10 V' }).click();
  await page.getByRole('button', { name: 'Continue investigation' }).click();
  await page.getByRole('button', { name: 'Both currents fall to zero' }).click();
  await page.getByRole('button', { name: 'Finish investigation' }).click();
  await expect(page.getByText('2 of 2 fresh checks', { exact: false })).toBeVisible();

  await page.goto('/#/laboratory/research-station/parallel-routes');
  await expect(page.getByRole('heading', { name: 'Bring the backup branch online' })).toBeVisible();
  await expect(page.getByRole('status').filter({ hasText: 'Source current' })).toContainText('1 A');
  await page
    .getByRole('group', { name: 'Backup link' })
    .getByRole('button', { name: 'Closed' })
    .click();
  await expect(page.getByRole('status').filter({ hasText: 'Source current' })).toContainText('2 A');
  await page
    .getByRole('group', { name: 'Backup link' })
    .getByRole('button', { name: 'Open' })
    .click();
  await expect(page.getByRole('status').filter({ hasText: 'Source current' })).toContainText('1 A');
  await page
    .getByRole('group', { name: 'Backup link' })
    .getByRole('button', { name: 'Closed' })
    .click();
  await expect(page.getByRole('status').filter({ hasText: 'Source current' })).toContainText('2 A');
  await expect(
    page.getByRole('group', { name: 'Backup link' }).getByRole('button', { name: 'Closed' }),
  ).toHaveAttribute('aria-pressed', 'true');
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  );
  await page.screenshot({ path: info.outputPath('station-parallel-branches.png'), fullPage: true });
  await page.getByRole('button', { name: 'Continue investigation' }).click();
  await page.getByRole('button', { name: 'Main 1 A; source 1 A' }).click();
  await page.getByRole('button', { name: 'Continue investigation' }).click();
  await page
    .getByRole('group', { name: 'Backup load' })
    .getByRole('button', { name: '12 Ω' })
    .click();
  await expect(page.getByRole('status').filter({ hasText: 'Source current' })).toContainText('3 A');
  await page
    .getByRole('group', { name: 'Backup load' })
    .getByRole('button', { name: '6 Ω' })
    .click();
  await page
    .getByRole('group', { name: 'Main load' })
    .getByRole('button', { name: '12 Ω' })
    .click();
  await expect(page.getByRole('status').filter({ hasText: 'Source current' })).toContainText(
    'Target reached',
  );
  await page.getByRole('button', { name: 'Continue investigation' }).click();
  await page.getByRole('button', { name: '4.5 A' }).click();
  await page.getByRole('button', { name: 'Continue investigation' }).click();
  await page.getByRole('button', { name: /Main stays 2 A; source falls/ }).click();
  await page.getByRole('button', { name: 'Finish investigation' }).click();
  await expect(page.getByText('2 of 2 fresh checks', { exact: false })).toBeVisible();
  expect(errors).toEqual([]);
});

test('meter detective: unhelpful reading, diagnostic evidence, fresh decision and resume', async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/#/laboratory/research-station/meter-detective');
  await expect(page.getByRole('heading', { name: 'The silent backup' })).toBeVisible();
  const meterGroup = page.getByRole('group', { name: 'Choose a meter position' });
  const main = meterGroup.getByRole('button', { name: 'Ammeter · Main rail' });
  const box = await main.boundingBox();
  expect(box!.y + box!.height).toBeLessThan(page.viewportSize()!.height);
  await main.press('Enter');
  await expect(
    page.getByText('Both explanations predict this reading. Try another position.'),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'Continue investigation' })).toBeDisabled();
  const backup = meterGroup.getByRole('button', { name: 'Ammeter · Backup heater' });
  await backup.click();
  await expect(
    page.getByText('These predictions differ. The reading can distinguish the explanations.'),
  ).toBeVisible();
  await expect(backup).toHaveAttribute('aria-pressed', 'true');
  await expect(backup).toHaveCSS('opacity', '1');
  await expect(page.getByText(/Backup branch has an open link: 0 A/)).toBeVisible();
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  );
  await page.screenshot({ path: info.outputPath('station-meter-diagnostic.png'), fullPage: true });
  await page.reload();
  await expect(meterGroup.getByRole('button', { name: 'Ammeter · Backup heater' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await page.getByRole('button', { name: 'Continue investigation' }).click();
  await page.getByText('Earlier field readings', { exact: true }).click();
  await expect(page.getByText('The silent backup: current at Backup heater = 0 A')).toBeVisible();
  await page.getByRole('button', { name: /The backup link is open/ }).click();
  await page.getByRole('button', { name: 'Continue investigation' }).click();
  await page.getByRole('button', { name: /ammeter in the unchanged navigation rail/ }).click();
  await expect(page.getByRole('status').filter({ hasText: 'That rail stays' })).toBeVisible();
  await page.getByRole('button', { name: /ammeter in series with the sensor heater/ }).click();
  await page.getByRole('button', { name: 'Continue investigation' }).click();
  await page
    .getByRole('group', { name: 'Choose a meter position' })
    .getByRole('button', { name: 'Ammeter · Sensor heater' })
    .click();
  await expect(page.getByText(/Sensor heater has drifted to 24 ohms: 0.5 A/)).toBeVisible();
  await page.getByRole('button', { name: 'Continue investigation' }).click();
  await page.getByRole('button', { name: '6 ohms; total resistance is 9 ohms.' }).click();
  await page.getByRole('button', { name: 'Continue investigation' }).click();
  await page.getByRole('button', { name: /Predict each candidate reading first/ }).click();
  await page.getByRole('button', { name: 'Finish investigation' }).click();
  await expect(page.getByText('1 of 2 fresh checks', { exact: false })).toBeVisible();
  expect(errors).toEqual([]);
});

test('meter detective: narrow touch and expanded text keep probes usable', async ({
  browser,
  baseURL,
  browserName,
}, info) => {
  const context = await browser.newContext({
    baseURL,
    viewport: { width: 360, height: 640 },
    hasTouch: true,
    isMobile: browserName !== 'firefox',
    reducedMotion: 'reduce',
  });
  const page = await context.newPage();
  try {
    await page.goto('/#/laboratory/research-station/meter-detective');
    await page.addStyleTag({ content: 'html { font-size: 200% !important; }' });
    await expect(page.getByRole('heading', { name: 'The silent backup' })).toBeVisible();
    const buttons = page
      .getByRole('group', { name: 'Choose a meter position' })
      .getByRole('button');
    const heights = await buttons.evaluateAll((items) =>
      items.map((item) => item.getBoundingClientRect().height),
    );
    expect(heights.every((height) => height >= 44)).toBe(true);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
    await buttons.filter({ hasText: 'Voltmeter · Backup link' }).tap();
    await expect(
      page.getByText('These predictions differ. The reading can distinguish the explanations.'),
    ).toBeVisible();
    await page.screenshot({
      path: info.outputPath('station-meter-phone-expanded.png'),
      fullPage: true,
    });
  } finally {
    await context.close();
  }
});

test('power budget: two equal-power routes, branch budget and fresh energy checks', async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/#/laboratory/research-station/power-budget');
  await expect(page.getByRole('heading', { name: 'Two ways to warm a sensor' })).toBeVisible();
  await expect(page.getByRole('status').filter({ hasText: 'Source power' })).toContainText('3 W');
  const firstControl = await page
    .getByRole('group', { name: 'Shelter heater' })
    .getByRole('button', { name: '3 Ω' })
    .boundingBox();
  expect(firstControl!.y + firstControl!.height).toBeLessThan(page.viewportSize()!.height);
  await page
    .getByRole('group', { name: 'Shelter heater' })
    .getByRole('button', { name: '3 Ω' })
    .click();
  await expect(page.getByRole('status').filter({ hasText: 'Source power' })).toContainText(
    '2 A · Source power: 12 W',
  );
  await page
    .getByRole('group', { name: 'Shelter heater' })
    .getByRole('button', { name: '12 Ω' })
    .click();
  await page
    .getByRole('group', { name: 'Ideal supply' })
    .getByRole('button', { name: '12 V' })
    .click();
  await expect(page.getByRole('status').filter({ hasText: 'Source power' })).toContainText(
    '1 A · Source power: 12 W',
  );
  await page.getByRole('button', { name: 'Continue investigation' }).click();
  await page.getByRole('button', { name: /Both are 12 W and both draw 2 A/ }).click();
  await expect(
    page.getByRole('status').filter({ hasText: 'At 12 V across 12 ohms' }),
  ).toBeVisible();
  await page.getByRole('button', { name: /Both are 12 W, but the 6 V setting draws 2 A/ }).click();
  await page.getByRole('button', { name: 'Continue investigation' }).click();
  await page
    .getByRole('group', { name: 'Ideal supply' })
    .getByRole('button', { name: '12 V' })
    .click();
  await page
    .getByRole('group', { name: 'Sensor heater' })
    .getByRole('button', { name: '24 Ω' })
    .click();
  await page
    .getByRole('group', { name: 'Observation window' })
    .getByRole('button', { name: '10 s' })
    .click();
  await expect(page.getByRole('status').filter({ hasText: 'Source power' })).toContainText(
    'Source power: 18 W',
  );
  await expect(page.getByRole('status').filter({ hasText: 'Source power' })).toContainText(
    '180 J transferred',
  );
  await expect(
    page.getByRole('group', { name: 'Sensor heater' }).getByRole('button', { name: '24 Ω' }),
  ).toHaveAttribute('aria-pressed', 'true');
  await page.getByText('See the path and meter readings', { exact: true }).click();
  await expect(page.getByRole('table')).toContainText('Sensor heater');
  await page.evaluate(() => {
    window.scrollTo(0, 0);
    return new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
    );
  });
  await page.screenshot({ path: info.outputPath('station-power-budget.png'), fullPage: true });
  await page.getByRole('button', { name: 'Continue investigation' }).click();
  await page.getByRole('button', { name: '72 J', exact: true }).click();
  await page.getByRole('button', { name: 'Continue investigation' }).click();
  await page.getByRole('button', { name: 'Both power and energy halve.' }).click();
  await page.getByRole('button', { name: 'Continue investigation' }).click();
  await page.getByRole('button', { name: /Power is the transfer rate in W/ }).click();
  await page.getByRole('button', { name: 'Finish investigation' }).click();
  await expect(page.getByText('2 of 2 fresh checks', { exact: false })).toBeVisible();
  expect(errors).toEqual([]);
});

test('fault board: discriminate, repair and explain an unfamiliar branch', async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/#/laboratory/research-station/fault-board');
  await expect(page.getByRole('heading', { name: 'Two faults, one dim backup' })).toBeVisible();
  const meters = page.getByRole('group', { name: 'Choose a meter position' });
  await meters.getByRole('button', { name: 'Ammeter · Main rail' }).click();
  await expect(
    page.getByText('Both explanations predict this reading. Try another position.'),
  ).toBeVisible();
  await meters.getByRole('button', { name: 'Ammeter · Backup heater' }).click();
  await expect(
    page.getByText(/Backup link is closed; its heater has drifted to 24 ohms: 0.5 A/),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Continue investigation' }).click();
  await page
    .getByRole('button', { name: /backup link is closed, but the heater is 24 ohms/ })
    .click();
  await page.getByRole('button', { name: 'Continue investigation' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Source power' })).toContainText('1.5 A');
  await page
    .getByRole('group', { name: 'Backup link' })
    .getByRole('button', { name: 'Open' })
    .click();
  await expect(page.getByRole('status').filter({ hasText: 'Source power' })).toContainText('1 A');
  await page
    .getByRole('group', { name: 'Backup link' })
    .getByRole('button', { name: 'Closed' })
    .click();
  await page
    .getByRole('group', { name: 'Backup heater' })
    .getByRole('button', { name: '12 Ω' })
    .click();
  await expect(page.getByRole('status').filter({ hasText: 'Source power' })).toContainText(
    '2 A · Source power: 24 W',
  );
  await expect(
    page.getByRole('group', { name: 'Backup heater' }).getByRole('button', { name: '12 Ω' }),
  ).toHaveAttribute('aria-pressed', 'true');
  await page.evaluate(() => {
    window.scrollTo(0, 0);
    return new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
    );
  });
  await page.screenshot({ path: info.outputPath('station-fault-repair.png'), fullPage: true });
  await page.getByRole('button', { name: 'Continue investigation' }).click();
  await page
    .getByRole('button', { name: 'An ammeter in the separate 6 ohm reference branch' })
    .click();
  await expect(page.getByRole('status').filter({ hasText: 'That branch still has' })).toBeVisible();
  await page.getByRole('button', { name: 'An ammeter in the suspect series branch' }).click();
  await page.getByRole('button', { name: 'Continue investigation' }).click();
  await page
    .getByRole('button', { name: /backup link is open; the 5 ohm main alone takes 2 A/ })
    .click();
  await page.getByRole('button', { name: 'Continue investigation' }).click();
  await page
    .getByRole('button', { name: /Compare fault predictions, measure where they differ/ })
    .click();
  await page.getByRole('button', { name: 'Finish investigation' }).click();
  await expect(page.getByText('1 of 2 fresh checks', { exact: false })).toBeVisible();
  expect(errors).toEqual([]);
});

test('power and fault controls remain usable at 200% text on a narrow touch screen', async ({
  browser,
  baseURL,
  browserName,
}, info) => {
  const context = await browser.newContext({
    baseURL,
    viewport: { width: 360, height: 640 },
    hasTouch: true,
    isMobile: browserName !== 'firefox',
    reducedMotion: 'reduce',
  });
  const page = await context.newPage();
  try {
    await page.goto('/#/laboratory/research-station/power-budget');
    await page.addStyleTag({ content: 'html { font-size: 200% !important; }' });
    const heater = page
      .getByRole('group', { name: 'Shelter heater' })
      .getByRole('button', { name: '3 Ω' });
    expect((await heater.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    await heater.tap();
    await expect(page.getByRole('status').filter({ hasText: 'Source power' })).toContainText(
      '12 W',
    );
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
    await page.goto('/#/laboratory/research-station/fault-board');
    await page.addStyleTag({ content: 'html { font-size: 200% !important; }' });
    const probe = page
      .getByRole('group', { name: 'Choose a meter position' })
      .getByRole('button', { name: 'Ammeter · Backup heater' });
    expect((await probe.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    await probe.tap();
    await expect(
      page.getByText('These predictions differ. The reading can distinguish the explanations.'),
    ).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
    await page.screenshot({
      path: info.outputPath('station-fault-phone-expanded.png'),
      fullPage: true,
    });
  } finally {
    await context.close();
  }
});

test('parallel branches remain operable by touch with expanded text', async ({
  browser,
  baseURL,
  browserName,
}, info) => {
  const context = await browser.newContext({
    baseURL,
    viewport: { width: 360, height: 640 },
    hasTouch: true,
    isMobile: browserName !== 'firefox',
    reducedMotion: 'reduce',
  });
  const page = await context.newPage();
  try {
    await page.goto('/#/laboratory/research-station/parallel-routes');
    await page.addStyleTag({ content: 'html { font-size: 200% !important; }' });
    await expect(
      page.getByRole('heading', { name: 'Bring the backup branch online' }),
    ).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
    const targets = await page
      .locator('.lab-control button')
      .evaluateAll((buttons) => buttons.map((button) => button.getBoundingClientRect().height));
    expect(targets.every((height) => height >= 44)).toBe(true);
    await page
      .getByRole('group', { name: 'Backup link' })
      .getByRole('button', { name: 'Closed' })
      .tap();
    await expect(page.getByRole('status').filter({ hasText: 'Source current' })).toContainText(
      '2 A',
    );
    await page.getByText('See the path and meter readings', { exact: true }).click();
    await expect(page.getByRole('table')).toContainText('Backup load');
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
    await page.screenshot({
      path: info.outputPath('station-parallel-phone-expanded.png'),
      fullPage: true,
    });
  } finally {
    await context.close();
  }
});

test('new circuit controls fit a narrow touch layout with expanded text', async ({
  browser,
  baseURL,
  browserName,
}, info) => {
  const context = await browser.newContext({
    baseURL,
    viewport: { width: 360, height: 640 },
    hasTouch: true,
    isMobile: browserName !== 'firefox',
    reducedMotion: 'reduce',
  });
  const page = await context.newPage();
  try {
    await page.goto('/#/laboratory/research-station/energy-lift');
    await page.addStyleTag({ content: 'html { font-size: 200% !important; }' });
    await expect(page.getByRole('heading', { name: 'Set the energy lift' })).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
    const targets = await page
      .locator('.lab-control button')
      .evaluateAll((buttons) => buttons.map((button) => button.getBoundingClientRect().height));
    expect(targets.every((height) => height >= 44)).toBe(true);
    await page
      .getByRole('group', { name: 'Ideal supply' })
      .getByRole('button', { name: '6 V' })
      .tap();
    await expect(page.getByRole('status').filter({ hasText: 'Source current' })).toContainText(
      '24 J transferred',
    );
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
    await page.screenshot({
      path: info.outputPath('station-energy-phone-expanded.png'),
      fullPage: true,
    });
  } finally {
    await context.close();
  }
});

test('narrow touch workspace: both themes, help escape and retained exposure on restart', async ({
  browser,
  baseURL,
  browserName,
}, info) => {
  const context = await browser.newContext({
    baseURL,
    viewport: { width: 360, height: 640 },
    hasTouch: true,
    isMobile: browserName !== 'firefox',
    reducedMotion: 'reduce',
  });
  const page = await context.newPage();
  try {
    await page.goto('/#/settings');
    await page.getByLabel('Light', { exact: true }).check();
    await page.goto(ROUTE);
    await expect(page.getByRole('heading', { name: 'Wake the beacon' })).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
    const firstControl = await page
      .getByRole('group', { name: 'Supply link' })
      .getByRole('button', { name: 'Closed', exact: true })
      .boundingBox();
    expect(firstControl!.y + firstControl!.height).toBeLessThan(640);
    const controls = await page
      .locator('.lab-control button')
      .evaluateAll((buttons) => buttons.map((b) => b.getBoundingClientRect().height));
    expect(controls.every((h) => h >= 44)).toBe(true);
    await page
      .getByRole('group', { name: 'Supply link' })
      .getByRole('button', { name: 'Closed', exact: true })
      .tap();
    await page.screenshot({ path: info.outputPath('beacon-mobile-light.png'), fullPage: true });
    await page.goto('/#/settings');
    await page.getByLabel('Dark', { exact: true }).check();
    await page.goto(ROUTE);
    await expect(
      page
        .getByRole('group', { name: 'Supply link' })
        .getByRole('button', { name: 'Closed', exact: true }),
    ).toHaveAttribute('aria-pressed', 'true');
    for (let i = 0; i < 5; i++) {
      await page.getByRole('button', { name: 'Help', exact: true }).tap();
      await page.getByRole('button', { name: 'Show worked example', exact: true }).tap();
      await page.getByRole('button', { name: 'Continue with help', exact: true }).tap();
    }
    await expect(page.getByText('0 of 2 fresh checks', { exact: false })).toBeVisible();
    await page.getByText('Notebook tools', { exact: true }).click();
    await page.getByRole('button', { name: 'Restart episode', exact: true }).tap();
    await expect(page.getByRole('heading', { name: 'Wake the beacon' })).toBeVisible();
    await page.screenshot({ path: info.outputPath('beacon-mobile-dark.png'), fullPage: true });
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
  } finally {
    await context.close();
  }
});

test('downloaded episode survives browser close and offline reopen with local progress', async ({
  browser,
  baseURL,
  browserName,
}, info) => {
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'learnlab-offline-'));
  let context = await browser.browserType().launchPersistentContext(profile);
  const url = `${baseURL}${ROUTE}`;
  try {
    let page = await context.newPage();
    // Use an app-free same-origin document before installing its service worker.
    const probeUrl = `${baseURL}/__persistent_cache_probe__.html`;
    await page.route(probeUrl, (route) =>
      route.fulfill({
        contentType: 'text/html',
        body: '<!doctype html><title>Isolated cache probe</title>',
      }),
    );
    await page.goto(probeUrl);
    const probe = await page.evaluate(async () => {
      const name = `learnlab-test-cache-probe-${crypto.randomUUID()}`;
      const key = new URL('/__cache_probe__', location.origin).href;
      const cache = await caches.open(name);
      await cache.put(key, new Response('retained'));
      const response = await cache.match(key);
      const body = response ? await response.text() : null;
      const keys = (await cache.keys()).map((request) => request.url);
      const reopened = await (await caches.open(name)).match(key);
      const reopenedBody = reopened ? await reopened.text() : null;
      const names = await caches.keys();
      await caches.delete(name);
      return {
        putResolved: true,
        body,
        reopenedBody,
        keys,
        names,
        name,
        key,
        userAgent: navigator.userAgent,
      };
    });
    await info.attach('persistent-cache-api-probe', {
      body: JSON.stringify({
        browserName,
        version: browser.version(),
        mode: 'persistent',
        ...probe,
      }),
      contentType: 'application/json',
    });
    await page.unroute(probeUrl);
    // The exact resolved-write/unreadable-entry symptom is an unavailable
    // Linux WebKit port capability. Any exception/corruption remains a failure.
    test.skip(
      process.platform === 'linux' &&
        browserName === 'webkit' &&
        probe.body === null &&
        probe.reopenedBody === null &&
        probe.keys.length === 0 &&
        probe.names.includes(probe.name),
      'Linux WebKit persistent Cache.put resolves but discards bytes; close/reopen coverage unavailable. Strict failure recovery is tested separately.',
    );
    expect(probe.body).toBe('retained');
    expect(probe.reopenedBody).toBe('retained');
    expect(probe.keys).toContain(probe.key);
    await page.goto(url);
    await page.waitForFunction(() => !!navigator.serviceWorker.controller);
    await page.getByRole('button', { name: 'Download for offline use', exact: true }).click();
    await expect(page.getByRole('status').filter({ hasText: /^Ready offline ·/ })).toBeVisible({
      timeout: 60000,
    });
    await page
      .getByRole('group', { name: 'Supply link' })
      .getByRole('button', { name: 'Closed', exact: true })
      .click();
    await expect(
      page
        .getByRole('group', { name: 'Supply link' })
        .getByRole('button', { name: 'Closed', exact: true }),
    ).toBeEnabled();
    await page.goto(`${baseURL}/#/laboratory/research-station/meter-detective`);
    await page
      .getByRole('group', { name: 'Choose a meter position' })
      .getByRole('button', { name: 'Ammeter · Main rail' })
      .click();
    await expect(
      page.getByText('Both explanations predict this reading. Try another position.'),
    ).toBeVisible();
    await context.close();
    context = await browser.browserType().launchPersistentContext(profile, { offline: true });
    page = await context.newPage();
    await page.goto(url);
    await expect(page.getByRole('heading', { name: 'Wake the beacon' })).toBeVisible();
    await expect(
      page
        .getByRole('group', { name: 'Supply link' })
        .getByRole('button', { name: 'Closed', exact: true }),
    ).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByRole('status').filter({ hasText: /^Ready offline ·/ })).toBeVisible({
      timeout: 30000,
    });
    await page
      .getByRole('group', { name: 'Return link' })
      .getByRole('button', { name: 'Closed', exact: true })
      .click();
    await expect(page.getByRole('status').filter({ hasText: 'Source current' })).toContainText(
      '1 A',
    );
    await page.getByRole('button', { name: 'Continue investigation', exact: true }).click();
    await expect(
      page.getByRole('heading', { name: 'What if the return link opens?' }),
    ).toBeVisible();
    await page.goto(`${baseURL}/#/laboratory/research-station/charge-counter`);
    await expect(page.getByRole('heading', { name: 'The recorder needs a reading' })).toBeVisible();
    await page
      .getByRole('group', { name: 'Observation window' })
      .getByRole('button', { name: '4 s' })
      .click();
    await expect(page.getByRole('status').filter({ hasText: 'Source current' })).toContainText(
      '4 C passes in 4 s',
    );
    await expect(page.getByRole('status').filter({ hasText: /^Ready offline ·/ })).toBeVisible();
    await page.goto(`${baseURL}/#/laboratory/research-station/meter-detective`);
    await expect(
      page
        .getByRole('group', { name: 'Choose a meter position' })
        .getByRole('button', { name: 'Ammeter · Main rail' }),
    ).toHaveAttribute('aria-pressed', 'true');
    await page
      .getByRole('group', { name: 'Choose a meter position' })
      .getByRole('button', { name: 'Ammeter · Backup heater' })
      .click();
    await expect(
      page.getByText('These predictions differ. The reading can distinguish the explanations.'),
    ).toBeVisible();
    await page.goto(`${baseURL}/#/laboratory/research-station/power-budget`);
    await page
      .getByRole('group', { name: 'Shelter heater' })
      .getByRole('button', { name: '3 Ω' })
      .click();
    await expect(page.getByRole('status').filter({ hasText: 'Source power' })).toContainText(
      '12 W',
    );
    await page.goto(`${baseURL}/#/laboratory/research-station/station-repair`);
    await page
      .getByRole('button', { name: /0.5 A, because the complete navigation branch/ })
      .click();
    await page.getByRole('button', { name: 'Continue investigation' }).click();
    await page.getByRole('button', { name: 'Connect as branches' }).click();
    await page.getByRole('combobox', { name: 'Sensor socket' }).selectOption('sensor-load');
    await expect(
      page.getByRole('status').filter({ hasText: 'Repair target reached' }),
    ).toContainText('1.5 A');
    await expect(page.getByRole('status').filter({ hasText: /^Ready offline ·/ })).toBeVisible();
  } finally {
    await context.close();
    fs.rmSync(profile, { recursive: true, force: true });
  }
});

test('write failure offers an export and keeps the last persisted circuit intact', async ({
  page,
}) => {
  await page.goto(ROUTE);
  await expect(page.getByRole('heading', { name: 'Wake the beacon' })).toBeVisible();
  // Deliberate failure injection in this isolated automated test profile.
  await page.evaluate(() => {
    IDBObjectStore.prototype.put = () => {
      throw new DOMException('Injected storage failure', 'QuotaExceededError');
    };
  });
  await page
    .getByRole('group', { name: 'Supply link' })
    .getByRole('button', { name: 'Closed', exact: true })
    .click();
  await expect(page.getByRole('alert').filter({ hasText: 'saving failed' })).toBeVisible();
  const exported = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export unsaved work', exact: true }).click();
  expect((await exported).suggestedFilename()).toContain('unsaved');
  await expect(
    page
      .getByRole('group', { name: 'Supply link' })
      .getByRole('button', { name: 'Closed', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
  await page.reload();
  await expect(
    page
      .getByRole('group', { name: 'Supply link' })
      .getByRole('button', { name: 'Open', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
});

test('tablet, landscape and expanded text preserve controls and local-only requests', async ({
  page,
}) => {
  const external: string[] = [];
  page.on('request', (request) => {
    const url = new URL(request.url());
    if (url.protocol.startsWith('http') && url.hostname !== 'localhost')
      external.push(request.url());
  });
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  for (const viewport of [
    { width: 820, height: 1180 },
    { width: 740, height: 360 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto(ROUTE);
    await expect(page.getByRole('heading', { name: 'Wake the beacon' })).toBeVisible();
    await page.evaluate(() => {
      document.documentElement.style.fontSize = '200%';
    });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.getByRole('button', { name: 'Help', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Take a different route' })).toBeFocused();
    await page.getByRole('button', { name: 'Show next hint', exact: true }).press('Enter');
    await expect(page.locator('.lab-help')).toContainText('Hint 1:');
    await page.getByRole('button', { name: 'Help', exact: true }).click();
    await page.evaluate(() => {
      document.documentElement.style.fontSize = '';
    });
  }
  expect(external).toEqual([]);
  expect(errors).toEqual([]);
});

test('silently discarded offline writes show recovery and never claim readiness', async ({
  page,
}) => {
  await page.goto(ROUTE);
  await page.waitForFunction(() => !!navigator.serviceWorker.controller);
  await page.evaluate(() => {
    Cache.prototype.put = async () => {};
  });
  await page.getByRole('button', { name: 'Download for offline use', exact: true }).click();
  await expect(
    page.getByRole('status').filter({ hasText: 'Offline storage could not retain' }),
  ).toBeVisible();
  await expect(page.getByRole('status').filter({ hasText: /^Ready offline ·/ })).toHaveCount(0);
  await expect(
    page.getByRole('button', { name: 'Download for offline use', exact: true }),
  ).toBeEnabled();
  await page
    .getByRole('group', { name: 'Supply link' })
    .getByRole('button', { name: 'Closed', exact: true })
    .click();
  await expect(
    page
      .getByRole('group', { name: 'Supply link' })
      .getByRole('button', { name: 'Closed', exact: true }),
  ).toBeEnabled();
  await expect(
    page
      .getByRole('group', { name: 'Supply link' })
      .getByRole('button', { name: 'Closed', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
  await page.reload();
  await expect(
    page
      .getByRole('group', { name: 'Supply link' })
      .getByRole('button', { name: 'Closed', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
});

test('repair bench: inspect, restore both rails and finish fresh checks', async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/#/laboratory/research-station/station-repair');
  await page.getByRole('button', { name: /0.5 A, because the complete navigation branch/ }).click();
  await page.getByRole('button', { name: 'Continue investigation' }).click();
  await expect(page.getByRole('heading', { name: 'Wake the two rails' })).toBeVisible();
  await page.getByRole('button', { name: 'Source ammeter' }).click();
  await expect(page.getByRole('list', { name: 'Meter notebook' })).toContainText('0 A');
  await page.getByRole('button', { name: 'Connect as branches' }).click();
  await page.getByRole('combobox', { name: 'Sensor socket' }).selectOption('sensor-load');
  await expect(page.getByRole('status').filter({ hasText: 'Repair target reached' })).toContainText(
    '1.5 A',
  );
  await page.getByRole('button', { name: 'Continue investigation' }).click();
  await page.getByRole('button', { name: /ideal supply keeps 12 V across each branch/ }).click();
  await page.getByRole('button', { name: 'Continue investigation' }).click();
  await expect(page.getByRole('heading', { name: 'Bring the station back online' })).toBeVisible();
  await page.getByRole('combobox', { name: 'Sensor service socket' }).selectOption('sensor-high');
  await expect(page.getByRole('status').filter({ hasText: 'Repair target reached' })).toContainText(
    '1 A',
  );
  await page.getByRole('button', { name: 'Sensor service socket voltmeter' }).click();
  await expect(page.getByRole('list', { name: 'Meter notebook' })).toContainText('12 V');
  await page.getByRole('button', { name: 'Sensor service socket ammeter' }).click();
  await expect(page.getByRole('list', { name: 'Meter notebook' })).toContainText('0.5 A');
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  );
  await page.screenshot({ path: info.outputPath('station-repair-parallel.png'), fullPage: true });
  await page.getByRole('button', { name: 'Continue investigation' }).click();
  await page.getByRole('button', { name: /1 A. The main branch still draws 1 A/ }).click();
  await page.getByRole('button', { name: 'Continue investigation' }).click();
  await page.getByRole('button', { name: '6 C and 60 J.' }).click();
  await page.getByRole('button', { name: 'Finish investigation' }).click();
  await expect(page.getByText('2 of 2 fresh checks', { exact: false })).toBeVisible();
  expect(errors).toEqual([]);
});

test('repair bench: a different series repair works with keyboard and expanded touch text', async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await page.goto('/#/laboratory/research-station/station-repair');
  await page.getByRole('button', { name: /0.5 A, because the complete navigation branch/ }).click();
  await page.getByRole('button', { name: 'Continue investigation' }).click();
  await page.getByRole('button', { name: 'Connect as branches' }).press('Enter');
  await page.getByRole('combobox', { name: 'Sensor socket' }).selectOption('sensor-load');
  await page.getByRole('button', { name: 'Continue investigation' }).click();
  await page.getByRole('button', { name: /ideal supply keeps 12 V across each branch/ }).click();
  await page.getByRole('button', { name: 'Continue investigation' }).click();
  await page.evaluate(() => {
    document.documentElement.style.fontSize = '200%';
  });
  await page.getByRole('button', { name: 'Connect in one path' }).press('Enter');
  await page.getByRole('combobox', { name: 'Navigation service socket' }).selectOption('nav-low');
  await page.getByRole('combobox', { name: 'Sensor service socket' }).selectOption('sensor-low');
  await expect(page.getByRole('status').filter({ hasText: 'Repair target reached' })).toContainText(
    '1 A',
  );
  await page.getByRole('button', { name: 'Navigation service socket voltmeter' }).click();
  await expect(page.getByRole('list', { name: 'Meter notebook' })).toContainText('6 V');
  await page.getByRole('button', { name: 'Navigation service socket ammeter' }).click();
  await expect(page.getByRole('list', { name: 'Meter notebook' })).toContainText('1 A');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  );
  await page.screenshot({
    path: info.outputPath('station-repair-series-phone.png'),
    fullPage: true,
  });
});
