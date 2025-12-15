<script setup lang="ts">
/**
 * MCP 管理页面
 * 内置 MCP + 自定义 MCP（SSE/HTTP）
 */
import McpHeader from './components/McpHeader.vue';
import CustomMcpSection from './components/CustomMcpSection.vue';
import McpPlazaSection from './components/McpPlazaSection.vue';
</script>

<template>
  <div class="mcp-manage">
    <!-- 页面头部 -->
    <McpHeader />

    <!-- 自定义 MCP 区域 -->
    <CustomMcpSection />

    <!-- MCP 广场区域 -->
    <McpPlazaSection />
  </div>
</template>
