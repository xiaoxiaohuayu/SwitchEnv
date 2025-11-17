<template>
  <el-dialog
    v-model="dialogVisible"
    :title="isEdit ? '编辑配置' : '新建配置'"
    width="600px"
    @close="handleClose"
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
      <el-form-item label="配置名称" prop="name">
        <el-input 
          v-model="form.name" 
          placeholder="请输入配置名称，如：开发环境、测试环境"
          maxlength="50"
          show-word-limit
        />
      </el-form-item>
      
      <el-form-item label="描述" prop="description">
        <el-input 
          v-model="form.description" 
          type="textarea"
          :rows="3"
          placeholder="请输入配置描述（可选）"
          maxlength="200"
          show-word-limit
        />
      </el-form-item>
    </el-form>
    
    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" @click="handleSubmit">确定</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import type { EnvProfile } from '../types'

const props = defineProps<{
  visible: boolean
  profile?: EnvProfile | null
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  submit: [data: { name: string; description?: string }]
}>()

const dialogVisible = ref(props.visible)
const formRef = ref<FormInstance>()

const form = reactive({
  name: '',
  description: ''
})

const rules: FormRules = {
  name: [
    { required: true, message: '请输入配置名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
  ]
}

const isEdit = ref(false)

watch(() => props.visible, (val) => {
  dialogVisible.value = val
  if (val && props.profile) {
    isEdit.value = true
    form.name = props.profile.name
    form.description = props.profile.description || ''
  } else {
    isEdit.value = false
    form.name = ''
    form.description = ''
  }
})

watch(dialogVisible, (val) => {
  emit('update:visible', val)
})

const handleClose = () => {
  dialogVisible.value = false
  formRef.value?.resetFields()
}

const handleSubmit = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate((valid) => {
    if (valid) {
      emit('submit', {
        name: form.name,
        description: form.description
      })
      handleClose()
    }
  })
}
</script>
