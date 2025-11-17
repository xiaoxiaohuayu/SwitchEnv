<template>
  <el-dialog
    v-model="dialogVisible"
    title="标签管理"
    width="600px"
    @close="handleClose"
  >
    <div class="tag-manager">
      <div class="add-tag-section">
        <el-input
          v-model="newTagName"
          placeholder="输入新标签名称"
          style="width: 200px"
          @keyup.enter="handleAddTag"
        />
        <el-color-picker v-model="newTagColor" />
        <el-button type="primary" @click="handleAddTag">
          <el-icon><Plus /></el-icon>
          添加标签
        </el-button>
      </div>

      <el-divider />

      <div class="tags-list">
        <div v-if="tags.length === 0" class="empty-tags">
          <el-empty description="还没有标签，创建第一个吧！" />
        </div>

        <div v-else class="tag-items">
          <div v-for="tag in tags" :key="tag.id" class="tag-item">
            <el-tag
              :color="tag.color"
              :style="{ borderColor: tag.color }"
              closable
              @close="handleDeleteTag(tag.id)"
            >
              {{ tag.name }}
            </el-tag>
            <div class="tag-actions">
              <el-button
                type="primary"
                size="small"
                link
                @click="handleEditTag(tag)"
              >
                编辑
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <el-button @click="handleClose">关闭</el-button>
    </template>
  </el-dialog>

  <!-- 编辑标签对话框 -->
  <el-dialog
    v-model="showEditDialog"
    title="编辑标签"
    width="400px"
  >
    <el-form label-width="80px">
      <el-form-item label="标签名称">
        <el-input v-model="editingTag.name" />
      </el-form-item>
      <el-form-item label="标签颜色">
        <el-color-picker v-model="editingTag.color" />
      </el-form-item>
    </el-form>
    
    <template #footer>
      <el-button @click="showEditDialog = false">取消</el-button>
      <el-button type="primary" @click="handleSaveEdit">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import type { Tag } from '../types'

const props = defineProps<{
  visible: boolean
  tags: Tag[]
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  'add-tag': [tag: Tag]
  'update-tag': [tag: Tag]
  'delete-tag': [id: string]
}>()

const dialogVisible = ref(props.visible)
const newTagName = ref('')
const newTagColor = ref('#409EFF')
const showEditDialog = ref(false)
const editingTag = ref<Tag>({
  id: '',
  name: '',
  color: ''
})

watch(() => props.visible, (val) => {
  dialogVisible.value = val
})

watch(dialogVisible, (val) => {
  emit('update:visible', val)
})

const handleClose = () => {
  dialogVisible.value = false
  newTagName.value = ''
  newTagColor.value = '#409EFF'
}

const handleAddTag = () => {
  if (!newTagName.value.trim()) {
    return
  }

  const newTag: Tag = {
    id: Date.now().toString(),
    name: newTagName.value.trim(),
    color: newTagColor.value
  }

  emit('add-tag', newTag)
  newTagName.value = ''
  newTagColor.value = '#409EFF'
}

const handleEditTag = (tag: Tag) => {
  editingTag.value = { ...tag }
  showEditDialog.value = true
}

const handleSaveEdit = () => {
  emit('update-tag', editingTag.value)
  showEditDialog.value = false
}

const handleDeleteTag = (id: string) => {
  emit('delete-tag', id)
}
</script>

<style scoped>
.tag-manager {
  padding: 0;
}

.add-tag-section {
  display: flex;
  gap: 12px;
  align-items: center;
}

.tags-list {
  min-height: 200px;
  max-height: 400px;
  overflow-y: auto;
}

.empty-tags {
  padding: 40px 0;
}

.tag-items {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.tag-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  border-radius: 6px;
  background: var(--el-fill-color-light);
  transition: all 0.3s;
}

.tag-item:hover {
  background: var(--el-fill-color);
}

.tag-actions {
  display: flex;
  gap: 8px;
}

:deep(.el-tag) {
  font-size: 14px;
  padding: 6px 12px;
  font-weight: 500;
}
</style>
