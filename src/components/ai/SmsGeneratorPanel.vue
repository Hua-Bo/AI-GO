<script setup lang="ts">
import type { SmsAuditStatus, SmsForm } from '@/types/aiTypes'
import { computed } from 'vue'
import { copyText } from '@/utils/exportReport'

const form = defineModel<SmsForm>('form', { required: true })
const content = defineModel<string>('content', { required: true })
const auditStatus = defineModel<SmsAuditStatus>('auditStatus', { required: true })

const emit = defineEmits<{
  generate: []
  regenerate: []
}>()

const charCount = computed(() => content.value.length)

const statusLabel: Record<SmsAuditStatus, string> = {
  empty: '未生成',
  pending: '待审核',
  modified: '已修改',
  confirmed: '已确认',
}

const auditTagType = computed(() => {
  const map: Record<SmsAuditStatus, string> = {
    empty: 'info',
    pending: 'warning',
    modified: '',
    confirmed: 'success',
  }
  return map[auditStatus.value]
})

function onContentInput() {
  if (auditStatus.value === 'pending' || auditStatus.value === 'confirmed') {
    auditStatus.value = 'modified'
  }
}

async function onCopy() {
  if (!content.value) return
  await copyText(content.value)
}
</script>

<template>
  <div class="sms-panel">
    <div class="form-card">
      <div class="card-title">短信参数</div>
      <el-form label-position="top" size="small">
        <div class="form-grid">
          <el-form-item label="区域">
            <el-input v-model="form.region" />
          </el-form-item>
          <el-form-item label="服务对象">
            <el-select v-model="form.target" style="width: 100%">
              <el-option label="行业用户" value="行业用户" />
              <el-option label="政府决策用户" value="政府决策用户" />
              <el-option label="公众用户" value="公众用户" />
            </el-select>
          </el-form-item>
          <el-form-item label="天气类型">
            <el-input v-model="form.weatherType" />
          </el-form-item>
          <el-form-item label="影响时间">
            <el-input v-model="form.timeRange" />
          </el-form-item>
          <el-form-item label="风险等级">
            <el-select v-model="form.riskLevel" style="width: 100%">
              <el-option label="红色" value="红色" />
              <el-option label="橙色" value="橙色" />
              <el-option label="黄色" value="黄色" />
              <el-option label="蓝色" value="蓝色" />
            </el-select>
          </el-form-item>
          <el-form-item label="备注" class="span-2">
            <el-input v-model="form.remark" type="textarea" :rows="2" />
          </el-form-item>
        </div>
      </el-form>
      <div class="form-actions">
        <el-button type="primary" size="small" @click="emit('generate')">AI 生成短信</el-button>
        <el-button size="small" @click="emit('regenerate')">重新生成</el-button>
        <el-button size="small" :disabled="!content" @click="onCopy">复制短信</el-button>
        <el-button size="small" :disabled="!content" @click="auditStatus = 'confirmed'">确认审核</el-button>
      </div>
    </div>

    <div class="draft-card">
      <div class="draft-head">
        <span class="card-title">短信草稿</span>
        <div class="draft-meta">
          <el-tag size="small" :type="auditTagType" effect="plain">
            {{ statusLabel[auditStatus] }}
          </el-tag>
          <span class="char-count">字数 {{ charCount }}</span>
        </div>
      </div>
      <el-input
        v-model="content"
        type="textarea"
        :rows="6"
        placeholder="短信草稿将在此显示，支持人工编辑"
        @input="onContentInput"
      />
    </div>
  </div>
</template>

<style scoped>
.sms-panel {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.form-card,
.draft-card {
  padding: 14px 16px;
  border-radius: var(--agent-radius);
  background: var(--agent-card);
  border: 1px solid var(--agent-border);
}

.card-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--agent-text);
  margin-bottom: 12px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0 12px;
}

.span-2 {
  grid-column: 1 / -1;
}

.form-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--agent-border);
}

.draft-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  gap: 12px;
}

.draft-head .card-title {
  margin-bottom: 0;
}

.draft-meta {
  display: flex;
  align-items: center;
  gap: 10px;
}

.char-count {
  font-size: 12px;
  color: var(--agent-text-secondary);
}
</style>
