import { expect, test } from '@playwright/test';
import { dev, gotoPage, proxyConsole } from '@e2e/helper';
import { pluginReact } from '@rsbuild/plugin-react';
import { pluginAssetsRetry } from '@rsbuild/plugin-assets-retry';
import type { PluginAssetsRetryOptions } from '@rsbuild/plugin-assets-retry';
import type { RequestHandler } from '@rsbuild/shared';

function count404Response(logs: string[]) {
  let count = 0;
  for (const log of logs) {
    if (log.includes('404')) {
      count++;
    }
  }
  return count;
}

function createBlockMiddleware({
  urlPrefix,
  blockNum,
}: {
  urlPrefix: string;
  blockNum: number;
}): RequestHandler {
  let counter = 0;
  return (req, res, next) => {
    if (req.url?.startsWith(urlPrefix)) {
      counter++;
      // if blockNum is 3, 1 2 3 would be blocked, 4 would be passed
      if (counter % (blockNum + 1) !== 0) {
        res.statusCode = 404;
      }
      res.setHeader('block-async', counter);
    }
    next();
  };
}

async function createRsbuildWithMiddleware(
  middleware: RequestHandler,
  options: PluginAssetsRetryOptions,
) {
  const rsbuild = await dev({
    cwd: __dirname,
    rsbuildConfig: {
      plugins: [pluginReact(), pluginAssetsRetry(options)],
      dev: {
        hmr: false,
        liveReload: false,
        setupMiddlewares: [
          (middlewares, _server) => {
            middlewares.unshift(middleware);
          },
        ],
      },
    },
  });
  return rsbuild;
}

test('@rsbuild/plugin-assets-retry should work when blocking initial chunk index.js`', async ({
  page,
}) => {
  process.env.DEBUG = 'rsbuild';
  const { logs, restore } = proxyConsole();
  const blockedMiddleware = createBlockMiddleware({
    blockNum: 3,
    urlPrefix: '/static/js/index.js',
  });
  const rsbuild = await createRsbuildWithMiddleware(blockedMiddleware, {});

  await gotoPage(page, rsbuild);
  const compTestElement = page.locator('#comp-test');
  await expect(compTestElement).toHaveText('Hello CompTest');
  const blockedResponseCount = count404Response(logs);
  expect(blockedResponseCount).toBe(3);
  await rsbuild.close();
  restore();
  delete process.env.DEBUG;
});

test('@rsbuild/plugin-assets-retry should work with minified runtime code when blocking initial chunk index.js`', async ({
  page,
}) => {
  process.env.DEBUG = 'rsbuild';
  const { logs, restore } = proxyConsole();
  const blockedMiddleware = createBlockMiddleware({
    blockNum: 3,
    urlPrefix: '/static/js/index.js',
  });
  const rsbuild = await createRsbuildWithMiddleware(blockedMiddleware, {
    minify: true,
  });

  await gotoPage(page, rsbuild);
  const compTestElement = page.locator('#comp-test');
  await expect(compTestElement).toHaveText('Hello CompTest');
  const blockedResponseCount = count404Response(logs);
  expect(blockedResponseCount).toBe(3);
  await rsbuild.close();
  restore();
  delete process.env.DEBUG;
});
