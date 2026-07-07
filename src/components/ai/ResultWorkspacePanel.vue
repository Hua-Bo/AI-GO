<script setup lang="ts">
import type { SmsAuditStatus, SmsForm, AiReport } from '@/types/aiTypes'
import SmsGeneratorPanel from './SmsGeneratorPanel.vue'
import ReportPreviewPanel from './ReportPreviewPanel.vue'

const form = defineModel<SmsForm>('form', { required: true })
const content = defineModel<string>('content', { required: true })
const auditStatus = defineModel<SmsAuditStatus>('auditStatus', { required: true })
const report = defineModel<AiReport | null>({ required: true })

defineProps<{
  linkedQuery: string
  resultMode: 'empty' | 'agent' | 'chat'
}>()

const emit = defineEmits<{
  generateSms: []
  regenerateSms: []
}>()

const activeTab = ref('sms')
</script>

<template>
  <div class="result-workspace">
    <div class="workspace-head">
      <h2>结果工作区</h2>
      <p v-if="resultMode === 'agent' && linkedQuery">
        关联问题：<span class="linked">{{ linkedQuery }}</span>
      </p>
      <p v-else-if="resultMode === 'chat' && linkedQuery">
        当前为对话问答，无短信/报告产出。关联问题：<span class="linked">{{ linkedQuery }}</span>
      </p>
      <p v-else>短信草稿与内参报告预览、编辑与导出</p>
    </div>

    <div v-if="resultMode === 'chat'" class="chat-only-hint">
      <p>本次提问属于普通气象问答，结果请查看左侧对话。</p>
      <p>如需生成服务短信或内参报告，可尝试：</p>
      <ul>
        <li>生成无锡强对流服务短信</li>
        <li>查询滨湖区风险提示</li>
      </ul>
    </div>

    <el-tabs v-else v-model="activeTab" class="workspace-tabs">
      <el-tab-pane label="服务短信" name="sms">
        <SmsGeneratorPanel
          v-model:form="form"
          v-model:content="content"
          v-model:audit-status="auditStatus"
          @generate="emit('generateSms')"
          @regenerate="emit('regenerateSms')"
        />
      </el-tab-pane>
      <el-tab-pane label="内参报告" name="report">
        <ReportPreviewPanel v-model="report" />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<style scoped>
.result-workspace {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 16px 18px;
  overflow: hidden;
}

.workspace-head h2 {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: var(--agent-text);
}

.workspace-head p {
  margin: 4px 0 12px;
  font-size: 12px;
  color: var(--agent-text-secondary);
}

.linked {
  color: #93c5fd;
}

.chat-only-hint {
  flex: 1;
  padding: 20px 18px;
  border-radius: var(--agent-radius);
  background: var(--agent-card);
  border: 1px solid var(--agent-border);
  font-size: 13px;
  line-height: 1.7;
  color: var(--agent-text-secondary);
}

.chat-only-hint p {
  margin: 0 0 10px;
}

.chat-only-hint ul {
  margin: 0;
  padding-left: 18px;
}

.workspace-tabs {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.workspace-tabs :deep(.el-tabs__content) {
  flex: 1;
  overflow-y: auto;
  padding-top: 4px;
}

.workspace-tabs :deep(.el-tab-pane) {
  height: 100%;
}
</style>
