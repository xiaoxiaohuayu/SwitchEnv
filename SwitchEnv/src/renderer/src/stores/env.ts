import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { EnvProfile, EnvVariable, Tag } from '../types'

export const useEnvStore = defineStore('env', () => {
  // 状态
  const profiles = ref<EnvProfile[]>([])
  const currentProfileId = ref<string | null>(null)
  const loading = ref(false)
  const tags = ref<Tag[]>([])  // 标签列表
  const selectedTags = ref<string[]>([])  // 选中的标签筛选
  const selectedGroup = ref<string | null>(null)  // 选中的分组

  // 计算属性
  const currentProfile = computed(() => 
    profiles.value.find(p => p.id === currentProfileId.value) || null
  )

  const activeProfile = computed(() =>
    profiles.value.find(p => p.isActive) || null
  )

  // 按标签和分组筛选后的配置列表
  const filteredProfiles = computed(() => {
    let filtered = profiles.value

    // 按分组筛选
    if (selectedGroup.value) {
      filtered = filtered.filter(p => p.group === selectedGroup.value)
    }

    // 按标签筛选
    if (selectedTags.value.length > 0) {
      filtered = filtered.filter(p => 
        p.tags && p.tags.some(tag => selectedTags.value.includes(tag))
      )
    }

    return filtered
  })

  // 所有分组列表
  const allGroups = computed(() => {
    const groups = new Set<string>()
    profiles.value.forEach(p => {
      if (p.group) groups.add(p.group)
    })
    return Array.from(groups).sort()
  })

  // 方法
  const loadProfiles = async () => {
    loading.value = true
    try {
      const data = await window.api.loadProfiles()
      profiles.value = data
      const active = data.find(p => p.isActive)
      if (active) {
        currentProfileId.value = active.id
      }
    } catch (error) {
      console.error('Failed to load profiles:', error)
    } finally {
      loading.value = false
    }
  }

  const saveProfiles = async () => {
    loading.value = true
    try {
      await window.api.saveProfiles(profiles.value)
    } catch (error) {
      console.error('Failed to save profiles:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  const createProfile = async (name: string, description?: string) => {
    const newProfile: EnvProfile = {
      id: Date.now().toString(),
      name,
      description,
      variables: [],
      isActive: false,
      createdAt: Date.now(),
      updatedAt: Date.now()
    }
    profiles.value.push(newProfile)
    await saveProfiles()
    return newProfile
  }

  const updateProfile = async (id: string, updates: Partial<EnvProfile>) => {
    const index = profiles.value.findIndex(p => p.id === id)
    if (index !== -1) {
      profiles.value[index] = {
        ...profiles.value[index],
        ...updates,
        updatedAt: Date.now()
      }
      await saveProfiles()
    }
  }

  const deleteProfile = async (id: string) => {
    const index = profiles.value.findIndex(p => p.id === id)
    if (index !== -1) {
      profiles.value.splice(index, 1)
      if (currentProfileId.value === id) {
        currentProfileId.value = null
      }
      await saveProfiles()
    }
  }

  const activateProfile = async (id: string) => {
    const profile = profiles.value.find(p => p.id === id)
    if (!profile) return

    // 取消所有配置的激活状态
    profiles.value.forEach(p => {
      p.isActive = false
    })

    // 激活选中的配置
    profile.isActive = true
    currentProfileId.value = id

    // 应用环境变量
    await window.api.applyProfile(profile)
    await saveProfiles()
  }

  const addVariable = async (profileId: string, variable: EnvVariable) => {
    const profile = profiles.value.find(p => p.id === profileId)
    if (profile) {
      profile.variables.push(variable)
      profile.updatedAt = Date.now()
      await saveProfiles()
    }
  }

  const updateVariable = async (profileId: string, index: number, variable: EnvVariable) => {
    const profile = profiles.value.find(p => p.id === profileId)
    if (profile && profile.variables[index]) {
      profile.variables[index] = variable
      profile.updatedAt = Date.now()
      await saveProfiles()
    }
  }

  const deleteVariable = async (profileId: string, index: number) => {
    const profile = profiles.value.find(p => p.id === profileId)
    if (profile) {
      profile.variables.splice(index, 1)
      profile.updatedAt = Date.now()
      await saveProfiles()
    }
  }

  const importProfile = async (format: 'json' | 'env') => {
    try {
      const result = await window.api.importFromFile(format)
      if (result) {
        if (result.profiles) {
          // 导入完整配置
          profiles.value.push(...result.profiles)
        } else if (result.variables) {
          // 创建新配置
          const newProfile = await createProfile('导入的配置')
          newProfile.variables = result.variables
        }
        await saveProfiles()
        return true
      }
      return false
    } catch (error) {
      console.error('Failed to import:', error)
      return false
    }
  }

  const exportProfile = async (profileId: string, format: 'json' | 'env') => {
    const profile = profiles.value.find(p => p.id === profileId)
    if (!profile) return false

    try {
      return await window.api.exportToFile(profile, format)
    } catch (error) {
      console.error('Failed to export:', error)
      return false
    }
  }

  // 标签管理
  const addTag = (tag: Tag) => {
    tags.value.push(tag)
    saveTags()
  }

  const updateTag = (tag: Tag) => {
    const index = tags.value.findIndex(t => t.id === tag.id)
    if (index !== -1) {
      tags.value[index] = tag
      saveTags()
    }
  }

  const deleteTag = (tagId: string) => {
    tags.value = tags.value.filter(t => t.id !== tagId)
    // 从所有配置中移除该标签
    profiles.value.forEach(p => {
      if (p.tags) {
        p.tags = p.tags.filter(t => t !== tagId)
      }
    })
    saveTags()
    saveProfiles()
  }

  const saveTags = () => {
    // 保存标签到 localStorage
    localStorage.setItem('env-tags', JSON.stringify(tags.value))
  }

  const loadTags = () => {
    const saved = localStorage.getItem('env-tags')
    if (saved) {
      tags.value = JSON.parse(saved)
    }
  }

  // 为配置添加/移除标签
  const addTagToProfile = async (profileId: string, tagId: string) => {
    const profile = profiles.value.find(p => p.id === profileId)
    if (profile) {
      if (!profile.tags) profile.tags = []
      if (!profile.tags.includes(tagId)) {
        profile.tags.push(tagId)
        await saveProfiles()
      }
    }
  }

  const removeTagFromProfile = async (profileId: string, tagId: string) => {
    const profile = profiles.value.find(p => p.id === profileId)
    if (profile && profile.tags) {
      profile.tags = profile.tags.filter(t => t !== tagId)
      await saveProfiles()
    }
  }

  // 设置配置分组
  const setProfileGroup = async (profileId: string, group: string | null) => {
    const profile = profiles.value.find(p => p.id === profileId)
    if (profile) {
      profile.group = group || undefined
      await saveProfiles()
    }
  }

  return {
    profiles,
    currentProfileId,
    currentProfile,
    activeProfile,
    filteredProfiles,
    tags,
    selectedTags,
    selectedGroup,
    allGroups,
    loading,
    loadProfiles,
    saveProfiles,
    createProfile,
    updateProfile,
    deleteProfile,
    activateProfile,
    addVariable,
    updateVariable,
    deleteVariable,
    importProfile,
    exportProfile,
    addTag,
    updateTag,
    deleteTag,
    loadTags,
    addTagToProfile,
    removeTagFromProfile,
    setProfileGroup
  }
})
