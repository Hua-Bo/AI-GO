<template>
    <div class="upload-container">
      <!-- 标题 -->
      <h2 class="title">海温评估图片展示</h2>
  
      <!-- 上传文件区域 -->
      <div class="upload-content">
        <div class="upload-label">评估文件</div>
        <div class="upload-input">
          <el-input
            v-model="fileName"
            placeholder="请选择文件"
            readonly
            class="file-input"
          >
            <!-- 搜索按钮 -->
            <template #append>
              <el-button @click="triggerFileUpload">
                <el-icon><el-icon-search /></el-icon>
              </el-button>
            </template>
          </el-input>
          <!-- 隐藏的文件上传 input -->
          <input
            ref="fileInput"
            type="file"
            accept=".xlsx, .xls"
            style="display: none"
            @change="handleFileUpload"
          />
        </div>
      </div>
  
      <!-- 生成按钮 -->
      <el-button type="primary" class="generate-btn" @click="emitGenerate">
        生成
      </el-button>
    </div>
  </template>
  
  <script lang="ts" setup>
  import { ref, defineProps, defineEmits } from "vue";
  
  // Props & Emits
  defineProps({
    fileName: {
      type: String,
      required: true,
    },
  });
  const emit = defineEmits(["update:fileName", "generate"]);
  
  const fileInput = ref<HTMLInputElement | null>(null);
  
  // 文件上传触发
  const triggerFileUpload = () => {
    fileInput.value?.click();
  };
  
  // 处理文件上传
  const handleFileUpload = (event: Event) => {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
  
    emit("update:fileName", file.name.replace(/\.[^/.]+$/, "")); // 提取文件名
    const reader = new FileReader();
    reader.onload = (e: ProgressEvent<FileReader>) => {
      if (e.target?.result) {
        emit("generate", new Uint8Array(e.target.result as ArrayBuffer));
      }
    };
    reader.readAsArrayBuffer(file);
  };
  
  // 发射生成事件
  const emitGenerate = () => {
    emit("generate");
  };
  </script>
  
  <style scoped>
  .upload-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100vh;
    background-color: #f3f3f3;
  }
  
  .title {
    font-size: 24px;
    color: #5e6d82;
    margin-bottom: 40px;
    font-weight: 600;
  }
  
  .upload-content {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 20px;
    gap: 10px;
  }
  
  .upload-label {
    font-size: 16px;
    color: #333;
    width: 80px;
    text-align: right;
  }
  
  .upload-input {
    width: 400px;
  }
  
  .file-input {
    width: 100%;
  }
  
  .generate-btn {
    margin-top: 20px;
    width: 100px;
    height: 40px;
    font-size: 16px;
  }
  </style>