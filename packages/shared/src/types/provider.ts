import type { PluginManager, RsbuildPluginAPI } from './plugin';
import type { RsbuildContext } from './context';
import type { Compiler, MultiCompiler } from '@rspack/core';
import type { RsbuildMode, CreateRsbuildOptions } from './rsbuild';
import type { StartServerResult, RsbuildDevServer } from './server';
import type { NormalizedConfig } from './config';
import type { WebpackConfig } from './thirdParty';
import type { RspackConfig } from './rspack';

export type Bundler = 'rspack' | 'webpack';

export type CreateCompilerOptions = { watch?: boolean };

export type StartDevServerOptions = {
  compiler?: Compiler | MultiCompiler;
  getPortSilently?: boolean;
};

export type CreateDevServerOptions = StartDevServerOptions & {
  /**
   * Whether to trigger Rsbuild compilation
   *
   * @default true
   */
  runCompile?: boolean;
};

export type PreviewServerOptions = {
  getPortSilently?: boolean;
};

export type BuildOptions = {
  mode?: RsbuildMode;
  watch?: boolean;
  compiler?: Compiler | MultiCompiler;
};

export type InspectConfigOptions = {
  env?: RsbuildMode;
  verbose?: boolean;
  outputPath?: string;
  writeToDisk?: boolean;
};

export type InspectConfigResult<B extends 'rspack' | 'webpack' = 'rspack'> = {
  rsbuildConfig: string;
  bundlerConfigs: string[];
  origin: {
    rsbuildConfig: NormalizedConfig & {
      pluginNames: string[];
    };
    bundlerConfigs: B extends 'rspack' ? RspackConfig[] : WebpackConfig[];
  };
};

export type RsbuildProvider<B extends 'rspack' | 'webpack' = 'rspack'> =
  (options: {
    pluginManager: PluginManager;
    rsbuildOptions: Required<CreateRsbuildOptions>;
  }) => Promise<ProviderInstance<B>>;

export type CreateCompiler =
  // Allow user to manually narrow Compiler type
  <C = Compiler | MultiCompiler>(options?: CreateCompilerOptions) => Promise<C>;

export type ProviderInstance<B extends 'rspack' | 'webpack' = 'rspack'> = {
  readonly bundler: Bundler;

  readonly publicContext: Readonly<RsbuildContext>;

  pluginAPI: RsbuildPluginAPI;

  applyDefaultPlugins: (pluginManager: PluginManager) => Promise<void>;

  createCompiler: CreateCompiler;

  /**
   * It is designed for high-level frameworks that require a custom server
   */
  createDevServer: (
    options?: CreateDevServerOptions,
  ) => Promise<RsbuildDevServer>;

  startDevServer: (
    options?: StartDevServerOptions,
  ) => Promise<StartServerResult>;

  preview: (options?: PreviewServerOptions) => Promise<StartServerResult>;

  build: (options?: BuildOptions) => Promise<void>;

  initConfigs: () => Promise<
    B extends 'rspack' ? RspackConfig[] : WebpackConfig[]
  >;

  inspectConfig: (
    options?: InspectConfigOptions,
  ) => Promise<InspectConfigResult<B>>;
};
