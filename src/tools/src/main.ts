#!/usr/bin/env node

/**
 * bdc - Node command line utility for inspecting Bridge Designer files.
 *
 * Node v24+ highly recommended.
 *
 * Simplest build and use:
 * - `cd src/tools`
 * - `npm install` # Get's dependencies, but assumes you have Node.
 * - `npm run build`  # Generates dist/main.cjs with node shebang.
 * - `alias bdc $(pwd)/dist/main.cjs`  # Alias `bdc`. Do this in .bashrc if desired.
 * - `bdc --help analyze --help` # gives most complete analyze help
 * - `bdc --help list --help` # gives most complete list help
 *
 * Example usage:
 *
 *   `bdc -p '{"k":"encryption_key"}' analyze -c -d -o csv MyBridge.bdc`
 *   `bdc --contest-params='{"k":"encryption_key"}' analyze --cost --conditions --format csv MyBridge.bdc`
 *
 * Output is 3 lines: status, conditions code and tag, cost:
 * passes
 * 1082008050 62A
 * 395085.38
 */
import 'reflect-metadata';
import path from 'path';
import { Args, Command, Options } from '@effect/cli';
import { NodeContext, NodeRuntime } from '@effect/platform-node';
import { Console, Effect, Option } from 'effect';
import { Injectable, ReflectiveInjector } from 'injection-js';
import { BridgeService, BridgeServiceSessionStateKey } from '../../app/shared/services/bridge.service';
import { ContestParametersService, SearchStringProvider } from '../../app/shared/services/contest-parameters.service';
import { DesignConditionsService } from '../../app/shared/services/design-conditions.service';
import { EventBrokerService } from '../../app/shared/services/event-broker.service';
import { InventoryService } from '../../app/shared/services/inventory.service';
import { BridgeCostService } from '../../app/shared/services/bridge-cost.service';
import { PersistenceService, SaveSet } from '../../app/shared/services/persistence.service';
import { BridgeSketchService } from '../../app/shared/services/bridge-sketch.service';
import { SessionStateService } from '../../app/features/session-state/session-state.service';
import { AnalysisService, AnalysisStatus } from '../../app/shared/services/analysis.service';
import { readFileSync } from 'fs';
import { Member } from '../../app/shared/classes/member.model';

/** Table of string for analysis status values. */
const ANALYSIS_STATUS_STRING_BY_STATUS = new Map<AnalysisStatus, string>([
  [AnalysisStatus.NONE, '<none>'],
  [AnalysisStatus.FAILS_SLENDERNESS, 'fail-slenderness'],
  [AnalysisStatus.UNSTABLE, 'unstable'],
  [AnalysisStatus.FAILS_LOAD_TEST, 'fail-load'],
  [AnalysisStatus.PASSES, 'pass'],
]);

/** Synopsis of the things the user wants to know about members. */
type MemberSynopsis = {
  number: number;

  tensionStrength: number;
  maxTension: number;
  tensionStatus: string;

  compressionStrength: number;
  maxCompression: number;
  compressionStatus: string;
};

/** Format-independent data for an analysis report on one file. */
type AnalysisReport = {
  fileName: string;
  status: string;
  conditionsTag?: string; // Tag and code are either both or neither present.
  conditionsCode?: number;
  cost?: number;
  members?: MemberSynopsis[];
};

/** Options of the `analyze` subcommand. */
type AnalyzeOptions = {
  withConditions: boolean;
  withTotalCost: boolean;
  withMembers: boolean;
  formatChoice: ReportFormat;
  withFullPaths: boolean;
};

const REPORT_FORMATS = ['raw', 'csv', 'tabs', 'json'] as const;
type ReportFormat = (typeof REPORT_FORMATS)[number];
type ReportFormatters = Record<ReportFormat, (report: AnalysisReport) => string>;
type HeaderFormatters = Record<ReportFormat, (options: AnalyzeOptions) => string>;

const REPORT_FORMATTERS: ReportFormatters = {
  /**
   * Format is one datum per line for easy parsing.
   * `[  ]` means optional depending on args. `{ }` means repeat 0 or more times.
   * ```
   * bridge
   * FILE_NAME
   * STATUS
   * [CONDITIONS_TAG
   * CONDITIONS_CODE]
   * [COST]
   * [MEMBER_COUNT
   * member
   * {NUMBER
   * TENSION_STRENGTH
   * MAX_TENSION
   * TENSION_STATUS
   * COMPRESSION_STRENGTH
   * MAX_COMPRESSION
   * COMPRESSION_STATUS}]
   * ```
   */
  raw: (report: AnalysisReport): string => {
    const chunks: string[] = [`bridge\n${report.fileName}\n${report.status}`];
    if (report.conditionsTag !== undefined) {
      chunks.push(`\n${report.conditionsTag}\n${report.conditionsCode}`);
    }
    if (report.cost !== undefined) {
      chunks.push(`\n${report.cost.toFixed(2)}`);
    }
    if (report.members !== undefined) {
      chunks.push(`\n${report.members.length.toString()}`);
      for (const member of report.members) {
        chunks.push('\nmember');
        for (const key in member) {
          chunks.push(`\n${member[key as keyof MemberSynopsis]}`);
        }
      }
    }
    return chunks.join('');
  },
  csv: (report: AnalysisReport): string => formatAsTable(report, ',', csvEscapeString),
  tabs: (report: AnalysisReport): string => formatAsTable(report, '\t', tabEscapeString),
  json: (report: AnalysisReport): string => JSON.stringify(report, undefined, 2),
};

const HEADER_FORMATTERS: HeaderFormatters = {
  raw: (options: AnalyzeOptions): string => '',
  csv: (options: AnalyzeOptions): string => formatHeaders(options, ','),
  tabs: (options: AnalyzeOptions): string => formatHeaders(options, '\t'),
  json: (options: AnalyzeOptions): string => '',
};

function tabEscapeString(s: string): string {
  return s.replace('\t', '\\t').replace('\n', '\\n').replace('\r', '\\r');
}

function csvEscapeString(s: string): string {
  return /["\n\r,]/.test(s) ? `"${s.replace('"', '""')}"` : s;
}

function formatAsTable(report: AnalysisReport, sep: string, escapeString: (s: string) => string): string {
  const chunks: string[] = [escapeString(report.fileName), report.status];
  if (report.conditionsTag !== undefined) {
    chunks.push(report.conditionsTag, report.conditionsCode!.toString());
  }
  if (report.cost !== undefined) {
    chunks.push(report.cost.toFixed(2));
  }
  return chunks.join(sep);
}

function formatHeaders(options: AnalyzeOptions, sep: string): string {
  const chunks: string[] = ['file_name', 'status'];
  if (options.withConditions) {
    chunks.push('conditions_tag', 'conditions_code');
  }
  if (options.withTotalCost) {
    chunks.push('cost');
  }
  return chunks.join(sep);
}

/** Builds a synopsis of a given member's analysis. */
function buildMemberSynopsis(member: Member): MemberSynopsis {
  return {
    number: member.number,
    maxTension: member.maxTension,
    maxCompression: member.maxCompression,
    tensionStrength: member.tensionStrength,
    compressionStrength: member.compressionStrength,
    compressionStatus: member.compressionStatus,
    tensionStatus: member.tensionStatus,
  };
}

/**
 * Builds an injector of BD entities we need. Most provided values are dummies
 * for dependencies that aren't actually used. Changes to bridge designer service
 * constructors can break this. Compile with --minify removed from scripts: build
 * entry in package.json for useful error messages.
 */
function buildInjector(contestParamsOption: string | null): ReflectiveInjector {
  return ReflectiveInjector.resolveAndCreate([
    AnalysisService,
    BridgeCostService,
    BridgeService,
    { provide: BridgeServiceSessionStateKey, useValue: {} },
    { provide: BridgeSketchService, useValue: {} },
    ContestParametersService,
    DesignConditionsService,
    EventBrokerService,
    InventoryService,
    PersistenceService,
    { provide: SearchStringProvider, useValue: { value: contestParamsOption, verbose: false } },
    { provide: SessionStateService, useValue: { register: () => undefined } },
  ]);
}

/** Container for BD injection dependencies and the subcommands they drive. */
@Injectable()
class Subcommands {
  constructor(
    private readonly analysisService: AnalysisService,
    private readonly bridgeCostService: BridgeCostService,
    private readonly bridgeService: BridgeService,
    private readonly persistenceService: PersistenceService,
  ) {}

  /** Lists bridge file contents with minimal checking. */
  listBridge(fileName: string): Effect.Effect<void> {
    const fileContent = readFileSync(fileName, 'utf8');
    const saveSetText = this.persistenceService.maybeDecrypt(fileContent);
    return Console.log(`${fileName}: ${saveSetText}`);
  }

  /** Reads bridge file, builds a model, analyzes it, and emits a report to stdout. */
  analyzeBridge(
    fullPath: string,
    { withConditions, withTotalCost, withMembers, formatChoice, withFullPaths }: AnalyzeOptions,
  ): Effect.Effect<void> {
    const saveSetText = readFileSync(fullPath, 'utf8');
    const saveSet = this.parseValidSaveSet(saveSetText);
    const fileName = withFullPaths ? fullPath : path.basename(fullPath);
    if (!saveSet) {
      const report = { fileName, status: 'invalid' };
      return Console.log(REPORT_FORMATTERS[formatChoice](report));
    }
    this.bridgeService.setBridge(saveSet.bridge, saveSet.draftingPanelState);
    this.analysisService.analyzeQuietly({ populateBridgeMembers: true });
    const status = ANALYSIS_STATUS_STRING_BY_STATUS.get(this.analysisService.status)!;
    const report: AnalysisReport = { fileName, status };
    if (withConditions) {
      const conditions = this.bridgeService.bridge.designConditions;
      report.conditionsTag = conditions.tag;
      report.conditionsCode = conditions.codeLong;
    }
    if (withTotalCost) {
      const fixedCost = this.bridgeService.designConditions.siteCosts.totalFixedCost;
      const projectCost = fixedCost + this.bridgeCostService.bridgeCostModel.totalCost;
      report.cost = projectCost;
    }
    if (withMembers) {
      report.members = this.bridgeService.bridge.members.map(buildMemberSynopsis);
    }
    return Console.log(REPORT_FORMATTERS[formatChoice](report));
  }

  /** Parses the given save set and validates it, throwing if bad. */
  private parseValidSaveSet(text: string): SaveSet | undefined {
    try {
      // Parsing fails for syntax including decryption w/ bad key.
      const saveSet = this.persistenceService.parseSaveSetText(text);
      // Validation fails when current contest parameters don't match input.
      this.persistenceService.validateSaveSet(saveSet);
      return saveSet;
    } catch {
      return undefined;
    }
  }
}

/** Builds and runs Effect-based CLI command. */
function main(): void {
  // Top level command just accumulates contest parameters.
  const contestParamsOption = Options.text('contest-params').pipe(
    Options.withAlias('p'),
    Options.optional,
    Options.withDescription(
      'JSON contest parameters as in contest URL search string. Optionally URI encoded and/or with prefix ?p= expected in the URL. Overrides file if present.',
    ),
  );
  const contestParamsFile = Options.fileText('contest-params-file').pipe(
    Options.withAlias('f'),
    Options.optional,
    Options.withDescription('File containing JSON contest parameters.'),
  );
  const bdc = Command.make('bdc', { contestParamsOption, contestParamsFile });

  // List subcommand.
  const filenames = Args.file({ name: 'filename', exists: 'yes' }).pipe(Args.repeated);
  const list = Command.make('list', { filenames }, ({ filenames }) => {
    return bdc.pipe(
      Command.withDescription('List bridge file with no validation.'),
      Effect.andThen(({ contestParamsOption, contestParamsFile }) => {
        const fallback = Option.orElse(() => Option.map(contestParamsFile, ([, content]) => content));
        const contestParams = Option.getOrNull(Option.map(contestParamsOption, decodeURI).pipe(fallback));
        const subcommands: Subcommands = buildInjector(contestParams).resolveAndInstantiate(Subcommands);
        return Effect.forEach(filenames, filename => {
          return subcommands.listBridge(filename);
        });
      }),
    );
  });

  // Analyze subcommand.
  const withConditions = Options.boolean('conditions').pipe(
    Options.withAlias('d'),
    Options.withDescription('Include design conditions, both tag and code.'),
  );
  const withTotalCost = Options.boolean('cost').pipe(
    Options.withAlias('c'),
    Options.withDescription('Include total site and bridge cost.'),
  );
  const withMembers = Options.boolean('members').pipe(
    Options.withAlias('m'),
    Options.withDescription('Include member synopses.'),
  );
  const formatChoice = Options.choice('format', REPORT_FORMATS).pipe(
    Options.withAlias('o'),
    Options.withDefault('csv'),
  );
  const withFullPaths = Options.boolean('full-paths').pipe(
    Options.withAlias('a'),
    Options.withDescription('Emit full paths of files.'),
  );
  const analyze = Command.make(
    'analyze',
    { filenames, withConditions, withTotalCost, withMembers, formatChoice, withFullPaths },
    ({ filenames, ...options }) => {
      return bdc.pipe(
        Command.withDescription('Validate then analyze each bridge file.'),
        Effect.andThen(({ contestParamsOption, contestParamsFile }) => {
          const fallback = Option.orElse(() => Option.map(contestParamsFile, ([, content]) => content));
          const contestParams = Option.getOrNull(contestParamsOption.pipe(fallback));
          const subcommands: Subcommands = buildInjector(contestParams).resolveAndInstantiate(Subcommands);
          if (options.withMembers && (options.formatChoice === 'csv' || options.formatChoice === 'tabs')) {
            console.warn(`Members skipped in format ${options.formatChoice}. Use raw or json.`);
          }
          return Console.log(HEADER_FORMATTERS[options.formatChoice](options)).pipe(
            Effect.flatMap(() => Effect.forEach(filenames, filename => subcommands.analyzeBridge(filename, options))),
          );
        }),
      );
    },
  );

  const command = bdc.pipe(Command.withSubcommands([list, analyze]));
  const cli = Command.run(command, {
    name: 'Bridge Design Contest CLI',
    version: 'v1.0.0',
  });

  /// Run the command, trapping and emitting errors.
  Effect.suspend(() => cli(process.argv)).pipe(
    Effect.provide(NodeContext.layer),
    Effect.tapError(Console.error),
    NodeRuntime.runMain,
  );
}

if (require.main === module) {
  main();
}
