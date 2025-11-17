import type { EnvVariable, ValidationError } from '../types'

/**
 * 环境变量验证器
 */
export class VariableValidator {
  /**
   * 验证变量名
   */
  static validateKey(key: string): ValidationError | null {
    // 空值检查
    if (!key || key.trim() === '') {
      return {
        key,
        message: '变量名不能为空',
        type: 'error'
      }
    }

    // 变量名格式检查（只允许字母、数字、下划线）
    const keyPattern = /^[A-Z_][A-Z0-9_]*$/
    if (!keyPattern.test(key)) {
      return {
        key,
        message: '变量名应使用大写字母、数字和下划线，且以字母或下划线开头',
        type: 'warning'
      }
    }

    // 保留关键字检查
    const reservedKeys = ['PATH', 'HOME', 'USER', 'SHELL']
    if (reservedKeys.includes(key)) {
      return {
        key,
        message: '此变量名为系统保留，修改可能影响系统运行',
        type: 'warning'
      }
    }

    return null
  }

  /**
   * 验证变量值
   */
  static validateValue(key: string, value: string, required: boolean = false): ValidationError | null {
    // 必填检查
    if (required && (!value || value.trim() === '')) {
      return {
        key,
        message: '此变量为必填项，不能为空',
        type: 'error'
      }
    }

    // 值长度检查
    if (value && value.length > 10000) {
      return {
        key,
        message: '变量值过长（超过10000字符）',
        type: 'warning'
      }
    }

    // 特殊字符检查（某些特殊字符可能导致问题）
    const dangerousChars = /[\x00-\x08\x0B\x0C\x0E-\x1F]/
    if (dangerousChars.test(value)) {
      return {
        key,
        message: '变量值包含特殊控制字符，可能导致问题',
        type: 'warning'
      }
    }

    // 路径格式检查（如果变量名包含 PATH）
    if (key.includes('PATH') && value) {
      const separator = process.platform === 'win32' ? ';' : ':'
      const paths = value.split(separator)
      
      // 检查是否有空路径
      if (paths.some(p => !p.trim())) {
        return {
          key,
          message: 'PATH 变量包含空路径',
          type: 'warning'
        }
      }
    }

    // URL 格式检查（如果变量名包含 URL）
    if (key.includes('URL') && value) {
      try {
        new URL(value)
      } catch {
        return {
          key,
          message: 'URL 格式可能不正确',
          type: 'warning'
        }
      }
    }

    // 端口号检查（如果变量名包含 PORT）
    if (key.includes('PORT') && value) {
      const port = parseInt(value)
      if (isNaN(port) || port < 0 || port > 65535) {
        return {
          key,
          message: '端口号应为 0-65535 之间的数字',
          type: 'error'
        }
      }
    }

    return null
  }

  /**
   * 检查重复的变量名
   */
  static checkDuplicates(variables: EnvVariable[]): ValidationError[] {
    const errors: ValidationError[] = []
    const keyCount = new Map<string, number>()

    variables.forEach(v => {
      const count = keyCount.get(v.key) || 0
      keyCount.set(v.key, count + 1)
    })

    keyCount.forEach((count, key) => {
      if (count > 1) {
        errors.push({
          key,
          message: `变量名重复出现 ${count} 次`,
          type: 'error'
        })
      }
    })

    return errors
  }

  /**
   * 验证整个配置
   */
  static validateProfile(variables: EnvVariable[]): ValidationError[] {
    const errors: ValidationError[] = []

    // 检查重复
    errors.push(...this.checkDuplicates(variables))

    // 检查每个变量
    variables.forEach(v => {
      const keyError = this.validateKey(v.key)
      if (keyError) {
        errors.push(keyError)
      }

      const valueError = this.validateValue(v.key, v.value, v.required)
      if (valueError) {
        errors.push(valueError)
      }
    })

    return errors
  }

  /**
   * 获取验证摘要
   */
  static getValidationSummary(variables: EnvVariable[]): {
    totalErrors: number
    totalWarnings: number
    isValid: boolean
  } {
    const errors = this.validateProfile(variables)
    const totalErrors = errors.filter(e => e.type === 'error').length
    const totalWarnings = errors.filter(e => e.type === 'warning').length

    return {
      totalErrors,
      totalWarnings,
      isValid: totalErrors === 0
    }
  }
}
