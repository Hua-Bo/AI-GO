<template>
  <div class="page">
    <div class="title">成本与利润计算</div>

    <el-form inline class="toolbar" label-width="96px">
      <el-form-item label="平台费率">
        <el-input-number
          v-model="global.feeRate"
          :min="0"
          :max="0.5"
          :step="0.01"
          controls-position="right"
          :precision="2"
        />
        <span class="suffix">（按比例，示例 0.17）</span>
      </el-form-item>
      <el-form-item label="售后扣减">
        <el-input-number
          v-model="global.afterSales"
          :min="0"
          :max="99"
          :step="0.5"
          controls-position="right"
          :precision="2"
        />
        <span class="suffix">（按单固定金额）</span>
      </el-form-item>
      <el-form-item label="统计日期">
        <el-date-picker
          v-model="current.date"
          type="date"
          value-format="YYYY-MM-DD"
          format="YYYY-MM-DD"
          placeholder="选择日期"
        />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="addRow">新增一行</el-button>
        <el-button @click="resetSamples">重置为示例</el-button>
        <el-button type="success" @click="saveDailyRecord">保存今日记录</el-button>
        <el-button type="warning" @click="clearQtys">清空数量</el-button>
      </el-form-item>
    </el-form>

    <el-table :data="rows" border class="table">
      <el-table-column prop="label" label="规格">
        <template #default="{ row }">
          <el-input v-model="row.label" placeholder="如 8-9斤" />
        </template>
      </el-table-column>

      <el-table-column label="售价(元)">
        <template #default="{ row }">
          <el-input-number
            v-model="row.price"
            :min="0"
            :step="0.1"
            controls-position="right"
            :precision="2"
          />
        </template>
      </el-table-column>

      <el-table-column label="成本(元)">
        <template #default="{ row }">
          <el-input-number
            v-model="row.cost"
            :min="0"
            :step="0.1"
            controls-position="right"
            :precision="2"
          />
        </template>
      </el-table-column>

      <el-table-column label="净入(售价-平台费)">
        <template #default="{ row }">
          <span>{{ format2(netIncome(row.price)) }}</span>
          <div class="sub">
            {{ row.price }} - {{ format2(row.price * global.feeRate) }} = {{ format2(netIncome(row.price)) }}
          </div>
        </template>
      </el-table-column>

      <el-table-column label="一单利润(净入-成本)">
        <template #default="{ row }">
          <span :class="profitClass(row)">{{ format2(profit(row)) }}</span>
          <div class="sub">
            {{ format2(netIncome(row.price)) }} - {{ format2(row.cost) }} = {{ format2(profit(row)) }}
          </div>
        </template>
      </el-table-column>

      <el-table-column label="实际到手(利润-售后)">
        <template #default="{ row }">
          <span :class="takeHomeClass(row)">{{ format2(takeHome(row)) }}</span>
          <div class="sub">
            {{ format2(profit(row)) }} - {{ format2(global.afterSales) }} = {{ format2(takeHome(row)) }}
          </div>
        </template>
      </el-table-column>

      <el-table-column label="操作" width="86">
        <template #default="{ $index }">
          <el-button text type="danger" @click="removeRow($index)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="hint">
      公式：净入 = 售价 × (1 - 平台费率)；利润 = 净入 - 成本；实际到手 = 利润 - 售后扣减。
    </div>

    <el-divider />
    <div class="subTitle">销量与总成本统计</div>
    <el-table :data="rows" border class="table" show-summary :summary-method="summaryStats">
      <el-table-column prop="label" label="规格" min-width="140" />
      <el-table-column prop="qty" label="售出数量" min-width="130">
        <template #default="{ row }">
          <el-input-number
            v-model="row.qty"
            :min="0"
            :step="1"
            controls-position="right"
            :precision="0"
          />
        </template>
      </el-table-column>
      <el-table-column prop="cost" label="成本单价(元)" min-width="130">
        <template #default="{ row }">
          <el-input-number
            v-model="row.cost"
            :min="0"
            :step="0.1"
            controls-position="right"
            :precision="2"
          />
        </template>
      </el-table-column>
      <el-table-column prop="totalCost" label="合计成本(元)" min-width="140">
        <template #default="{ row }">
          {{ format2((Number(row.qty) || 0) * (Number(row.cost) || 0)) }}
        </template>
      </el-table-column>
    </el-table>

    <div class="totals">
      总售出：{{ totalQty }} 单；总成本：{{ format2(totalCost) }} 元
    </div>
    <el-divider />
    <div class="subTitle">每日销量记录</div>
    <el-table :data="history" border class="table">
      <el-table-column prop="date" label="日期" min-width="140" />
      <el-table-column prop="totalQty" label="总售出(单)" min-width="120" />
      <el-table-column prop="totalCost" label="总成本(元)" min-width="140">
        <template #default="{ row }">
          {{ format2(row.totalCost) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="86">
        <template #default="{ $index }">
          <el-button text type="danger" @click="removeRecord($index)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup lang="ts">
import { reactive, computed, onMounted } from "vue";

interface Row {
  label: string;
  price: number;
  cost: number;
  qty: number;
}

interface DailyRecord {
  date: string;
  totalQty: number;
  totalCost: number;
}

const global = reactive({
  feeRate: 0.17, // 平台费率（比例）
  afterSales: 1.0, // 售后扣减（固定金额）
});

const current = reactive({
  date: getTodayLocal(),
});

const rows = reactive<Row[]>([
  // 示例来自用户给定的数据
  { label: "8-9斤", price: 21.9, cost: 18, qty: 0 },
  { label: "4.5-5斤", price: 16.9, cost: 11, qty: 0 },
  { label: "4.5-5斤", price: 9.8, cost: 6, qty: 0 },
]);

function resetSamples() {
  rows.splice(
    0,
    rows.length,
    { label: "8-9斤", price: 21.9, cost: 18, qty: 0 },
    { label: "4.5-5斤", price: 16.9, cost: 11, qty: 0 },
    { label: "4.5-5斤", price: 9.8, cost: 6, qty: 0 }
  );
  global.feeRate = 0.17;
  global.afterSales = 1.0;
}

function addRow() {
  rows.push({ label: "", price: 0, cost: 0, qty: 0 });
}
function removeRow(idx: number) {
  rows.splice(idx, 1);
}

function netIncome(price: number) {
  return price * (1 - global.feeRate);
}
function profit(row: Row) {
  return netIncome(row.price) - row.cost;
}
function takeHome(row: Row) {
  return profit(row) - global.afterSales;
}

function profitClass(row: Row) {
  const v = profit(row);
  return v < 0 ? "neg" : v === 0 ? "zero" : "pos";
}
function takeHomeClass(row: Row) {
  const v = takeHome(row);
  return v < 0 ? "neg" : v === 0 ? "zero" : "pos";
}

function format2(n: number) {
  return Number.isFinite(n) ? n.toFixed(3).replace(/\.?0+$/, (m) => (m.startsWith(".") ? m : "")) : "-";
}

// 销量与总成本统计
const totalQty = computed(() => rows.reduce((s, r) => s + (Number(r.qty) || 0), 0));
const totalCost = computed(() => rows.reduce((s, r) => s + (Number(r.qty) || 0) * (Number(r.cost) || 0), 0));

function summaryStats(param: { columns: any[]; data: Row[] }) {
  const { columns } = param;
  return columns.map((col) => {
    if (col.property === "label") return "合计";
    if (col.property === "qty") return totalQty.value;
    if (col.property === "totalCost") return format2(totalCost.value);
    return "";
  });
}

// 每日记录（持久化到 localStorage）
const HISTORY_KEY = "sales-history-v1";
const history = reactive<DailyRecord[]>([]);

function getTodayLocal() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function persistHistory() {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch {}
}
function loadHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (raw) {
      const arr = JSON.parse(raw) as DailyRecord[];
      history.splice(0, history.length, ...arr);
    }
  } catch {}
}
function saveDailyRecord() {
  const date = current.date || getTodayLocal();
  const rec: DailyRecord = {
    date,
    totalQty: totalQty.value,
    totalCost: Number(Number(totalCost.value).toFixed(3)),
  };
  const idx = history.findIndex((r) => r.date === date);
  if (idx >= 0) {
    history.splice(idx, 1, rec);
  } else {
    history.unshift(rec);
  }
  persistHistory();
}
function removeRecord(index: number) {
  history.splice(index, 1);
  persistHistory();
}
function clearQtys() {
  rows.forEach((r) => {
    r.qty = 0;
  });
}

onMounted(() => {
  loadHistory();
});
</script>

<style scoped>
.page {
  padding: 12px;
}
.title {
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 12px;
}
.subTitle {
  font-size: 14px;
  font-weight: 700;
  margin: 12px 0 8px;
}
.toolbar :deep(.el-form-item) {
  margin-right: 16px;
  margin-bottom: 8px;
}
.suffix {
  margin-left: 6px;
  color: #888;
  font-size: 12px;
}
.table {
  margin-top: 8px;
}
.sub {
  color: #909399;
  font-size: 12px;
  line-height: 1.3;
}
.neg {
  color: #f56c6c;
  font-weight: 600;
}
.pos {
  color: #67c23a;
  font-weight: 600;
}
.zero {
  color: #e6a23c;
  font-weight: 600;
}
.hint {
  margin-top: 8px;
  color: #909399;
  font-size: 12px;
}
.totals {
  margin-top: 8px;
  color: #eaf0ff;
  font-size: 13px;
  font-weight: 600;
}
</style>