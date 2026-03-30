/**
 * pod_create ツール
 * 新しいGPU Podを作成する
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { createPod } from "@/lib/runpod/client";
import { RunPodError } from "@/lib/runpod/errors";

export function registerPodCreate(server: McpServer) {
  server.registerTool(
    "pod_create",
    {
      title: "Pod作成",
      description:
        "新しいGPU Podを作成する。GPU種別、イメージ、ディスクサイズ等を指定する。" +
        "注意: 課金が発生します。",
      inputSchema: {
        name: z.string().describe("Pod名"),
        imageName: z.string().describe("Dockerイメージ名 (例: runpod/pytorch:2.1.0-py3.10-cuda11.8.0-devel-ubuntu22.04)"),
        gpuTypeId: z.string().describe("GPU種別ID (例: NVIDIA RTX A6000)。gpu_types ツールで確認可能"),
        gpuCount: z.number().optional().default(1).describe("GPU数 (デフォルト: 1)"),
        containerDiskInGb: z.number().optional().default(20).describe("コンテナディスクサイズ (GB, デフォルト: 20)"),
        volumeInGb: z.number().optional().default(0).describe("永続ボリュームサイズ (GB, デフォルト: 0)"),
        ports: z.string().optional().describe("公開ポート (例: '8888/http,22/tcp')"),
        startSsh: z.boolean().optional().describe("SSH を有効にするか"),
      },
    },
    async ({ name, imageName, gpuTypeId, gpuCount, containerDiskInGb, volumeInGb, ports, startSsh }) => {
      try {
        const pod = await createPod({
          name,
          imageName,
          gpuTypeId,
          gpuCount,
          containerDiskInGb,
          volumeInGb,
          ports,
          startSsh,
        });

        const text =
          `Pod を作成しました！\n\n` +
          `**${pod.name}** (${pod.id})\n` +
          `GPU: ${pod.gpuDisplayName || pod.gpuTypeId} x${pod.gpuCount}\n` +
          `イメージ: ${pod.imageName}\n` +
          `コスト: $${pod.costPerHr}/hr\n` +
          `ディスク: ${pod.containerDiskInGb}GB | ボリューム: ${pod.volumeInGb}GB`;

        return { content: [{ type: "text" as const, text }] };
      } catch (error) {
        const message =
          error instanceof RunPodError
            ? error.toUserMessage()
            : `予期しないエラー: ${error instanceof Error ? error.message : String(error)}`;
        return {
          content: [{ type: "text" as const, text: `エラー: ${message}` }],
          isError: true,
        };
      }
    }
  );
}
