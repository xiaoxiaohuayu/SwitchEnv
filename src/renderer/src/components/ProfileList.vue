<template>
  <div class="profile-list">
    <div class="list-header">
      <h3>环境配置</h3>
      <div class="header-actions">
        <el-button type="info" size="small" @click="$emit('manage-tags')">
          <el-icon><PriceTag /></el-icon>
          标签
        </el-button>
        <el-button type="primary" @click="$emit('create')">
          <el-icon><Plus /></el-icon>
          新建
        </el-button>
      </div>
    </div>
    
    <!-- 筛选区域 -->
    <div class="filter-section">
      <el-input
        v-model="localSearch"
        placeholder="搜索配置名称或描述"
        clearable
        size="small"
        style="width: 100%; margin-bottom: 8px"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>

      <el-select
        v-model="selectedGroup"
        placeholder="所有分组"
        clearable
        size="small"
        style="width: 100%"
        @change="$emit('filter-group', selectedGroup)"
      >
        <el-option label="所有分组" :value="null" />
        <el-option
          v-for="group in groups"
          :key="group"
          :label="group"
          :value="group"
        />
      </el-select>
      
      <el-select
        v-model="selectedTagsLocal"
        placeholder="按标签筛选"
        multiple
        clearable
        size="small"
        style="width: 100%; margin-top: 8px"
        @change="$emit('filter-tags', selectedTagsLocal)"
      >
        <el-option
          v-for="tag in tags"
          :key="tag.id"
          :label="tag.name"
          :value="tag.id"
        >
          <el-tag :color="tag.color" size="small">
            {{ tag.name }}
          </el-tag>
        </el-option>
      </el-select>
    </div>
    
    <el-scrollbar class="list-content">
      <div v-if="profiles.length === 0" class="empty-state">
        <el-empty description="暂无配置，点击上方按钮创建">
          <el-button type="primary" @click="$emit('create')">创建第一个配置</el-button>
        </el-empty>
      </div>
      
      <div 
        v-for="profile in profiles" 
        :key="profile.id"
        :class="['profile-item', { active: profile.isActive, selected: selectedId === profile.id }]"
        @click="$emit('select', profile.id)"
      >
        <div class="profile-header">
          <div class="profile-info">
            <el-icon v-if="profile.isActive" class="active-icon"><Check /></el-icon>
            <span class="profile-name">{{ profile.name }}</span>
          </div>
          <div class="profile-actions">
            <el-button 
              v-if="!profile.isActive"
              type="success" 
              size="small" 
              @click.stop="$emit('activate', profile.id)"
            >
              启用
            </el-button>
            <el-button 
              type="primary" 
              size="small" 
              @click.stop="$emit('edit', profile.id)"
            >
              编辑
            </el-button>
            <el-button 
              type="danger" 
              size="small" 
              @click.stop="$emit('delete', profile.id)"
            >
              删除
            </el-button>
          </div>
        </div>
        
        <div v-if="profile.description" class="profile-description">
          {{ profile.description }}
        </div>
        
        <!-- 标签显示 -->
        <div v-if="profile.tags && profile.tags.length > 0" class="profile-tags">
          <el-tag
            v-for="tagId in profile.tags"
            :key="tagId"
            :color="getTagColor(tagId)"
            size="small"
            closable
            @close.stop="emit('remove-tag-from-profile', profile.id, tagId)"
          >
            {{ getTagName(tagId) }}
          </el-tag>
        </div>
        
        <!-- 分组显示 -->
        <div v-if="profile.group" class="profile-group">
          <el-icon><FolderOpened /></el-icon>
          <span>{{ profile.group }}</span>
        </div>
        
        <div class="profile-meta">
          <span>变量数: {{ profile.variables.length }}</span>
          <span>更新时间: {{ formatDate(profile.updatedAt) }}</span>
        </div>
      </div>
    </el-scrollbar>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { Plus, Check, PriceTag, FolderOpened, Search } from '@element-plus/icons-vue'
import type { EnvProfile, Tag } from '../types'

const props = defineProps<{
  profiles: EnvProfile[]
  selectedId: string | null
  tags: Tag[]
  groups: string[]
  searchKeyword: string
}>()

const emit = defineEmits<{
  create: []
  select: [id: string]
  activate: [id: string]
  edit: [id: string]
  delete: [id: string]
  'manage-tags': []
  'filter-group': [group: string | null]
  'filter-tags': [tags: string[]]
  'add-tag-to-profile': [profileId: string, tagId: string]
  'remove-tag-from-profile': [profileId: string, tagId: string]
  'set-group': [profileId: string, group: string | null]
  'update:search-keyword': [value: string]
}>()

const selectedGroup = ref<string | null>(null)
const selectedTagsLocal = ref<string[]>([])
const localSearch = ref(props.searchKeyword || '')

watch(() => props.searchKeyword, (val) => {
  if (val !== localSearch.value) {
    localSearch.value = val
  }
})

watch(localSearch, (val) => {
  emit('update:search-keyword', val)
})

// 获取标签名称
const getTagName = (tagId: string): string => {
  const tag = props.tags.find(t => t.id === tagId)
  return tag ? tag.name : '未知标签'
}

// 获取标签颜色
const getTagColor = (tagId: string): string => {
  const tag = props.tags.find(t => t.id === tagId)
  return tag ? tag.color : '#909399'
}

const formatDate = (timestamp: number) => {
  const date = new Date(timestamp)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>

<style scoped>
.profile-list {
  display: flex;
  flex-direction: column;
  height: 100%;
  border-right: 1px solid var(--app-border-color);
  background: var(--app-card-bg);
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid var(--app-border-color);
}

.list-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.list-content {
  flex: 1;
  padding: 8px;
}

.empty-state {
  padding: 40px 20px;
  text-align: center;
}

.profile-item {
  padding: 12px;
  margin-bottom: 8px;
  border-radius: 8px;
  border: 1px solid var(--app-border-color);
  cursor: pointer;
  transition: all 0.3s;
}

.profile-item:hover {
  border-color: var(--el-color-primary);
  background: var(--el-fill-color-light);
}

.profile-item.selected {
  border-color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}

.profile-item.active {
  border-color: var(--el-color-success);
}

.profile-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.profile-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.active-icon {
  color: var(--el-color-success);
  font-size: 18px;
}

.profile-name {
  font-weight: 600;
  font-size: 14px;
}

.profile-actions {
  display: flex;
  gap: 4px;
}

.profile-description {
  color: var(--el-text-color-secondary);
  font-size: 12px;
  margin-bottom: 8px;
}

.profile-meta {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}

.header-actions {
  display: flex;
  gap: 8px;
}

.filter-section {
  padding: 8px 16px;
  border-bottom: 1px solid var(--app-border-color);
  background: var(--color-background-mute);
}

.profile-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 8px;
}

.profile-tags :deep(.el-tag) {
  font-size: 11px;
}

.profile-group {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 8px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.profile-group .el-icon {
  font-size: 14px;
}
</style>
