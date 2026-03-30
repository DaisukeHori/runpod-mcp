/**
 * MCP サーバー初期化
 * 全ツールを一括登録する
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

// Pod 管理
import { registerPodList } from "./tools/pod-list";
import { registerPodGet } from "./tools/pod-get";
import { registerPodCreate } from "./tools/pod-create";
import { registerPodStop } from "./tools/pod-stop";
import { registerPodTerminate } from "./tools/pod-terminate";

// サーバーレス Endpoint 管理
import { registerEndpointList } from "./tools/endpoint-list";
import { registerEndpointGet } from "./tools/endpoint-get";
import { registerEndpointCreate } from "./tools/endpoint-create";
import { registerEndpointUpdate } from "./tools/endpoint-update";

// サーバーレス Job 実行
import { registerJobRun } from "./tools/job-run";
import { registerJobRunSync } from "./tools/job-runsync";
import { registerJobStatus } from "./tools/job-status";
import { registerJobCancel } from "./tools/job-cancel";

// GPU・アカウント情報
import { registerGpuTypes } from "./tools/gpu-types";
import { registerAccountInfo } from "./tools/account-info";

/**
 * MCP サーバーに全ツールを登録する
 */
export function registerAllTools(server: McpServer) {
  // Pod 管理
  registerPodList(server);
  registerPodGet(server);
  registerPodCreate(server);
  registerPodStop(server);
  registerPodTerminate(server);

  // サーバーレス Endpoint 管理
  registerEndpointList(server);
  registerEndpointGet(server);
  registerEndpointCreate(server);
  registerEndpointUpdate(server);

  // サーバーレス Job 実行
  registerJobRun(server);
  registerJobRunSync(server);
  registerJobStatus(server);
  registerJobCancel(server);

  // GPU・アカウント情報
  registerGpuTypes(server);
  registerAccountInfo(server);
}
