import { describe, it, expect } from 'vitest'

// Validation utilities that would be extracted from components
export const validateBirthday = (birthday: string): boolean => {
  const regex = /^(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/
  return regex.test(birthday)
}

export const validateEmail = (email: string): boolean => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return regex.test(email)
}

export const validatePhone = (phone: string): boolean => {
  // Remove all non-digits
  const cleanPhone = phone.replace(/\D/g, '')
  // Check if it's 10 or 11 digits (with country code)
  return cleanPhone.length === 10 || cleanPhone.length === 11
}

export const validateContactName = (firstName: string, lastName?: string): { isValid: boolean; error?: string } => {
  if (!firstName || firstName.trim().length === 0) {
    return { isValid: false, error: 'First name is required' }
  }

  if (firstName.trim().length < 2) {
    return { isValid: false, error: 'First name must be at least 2 characters' }
  }

  if (lastName && lastName.trim().length > 0 && lastName.trim().length < 2) {
    return { isValid: false, error: 'Last name must be at least 2 characters' }
  }

  return { isValid: true }
}

export const validateCommunicationFrequency = (frequency: string): boolean => {
  const validFrequencies = ['weekly', 'monthly', 'quarterly', 'biannually', 'annually']
  return validFrequencies.includes(frequency)
}

export const validateInteractionType = (type: string): boolean => {
  const validTypes = ['call', 'text', 'email', 'meetup', 'other']
  return validTypes.includes(type)
}

export const validateContactInfoType = (type: string): boolean => {
  const validTypes = ['phone', 'email', 'address']
  return validTypes.includes(type)
}

export const validateContactInfoLabel = (label: string): boolean => {
  const validLabels = ['home', 'work', 'mobile', 'other']
  return validLabels.includes(label)
}

describe('Validation Utilities', () => {
  describe('validateBirthday', () => {
    it('should validate correct MM-DD format', () => {
      expect(validateBirthday('01-15')).toBe(true)
      expect(validateBirthday('12-31')).toBe(true)
      expect(validateBirthday('06-30')).toBe(true)
      expect(validateBirthday('02-29')).toBe(true) // Leap year handling at higher level
    })

    it('should reject invalid formats', () => {
      expect(validateBirthday('1-15')).toBe(false) // Single digit month
      expect(validateBirthday('01-1')).toBe(false) // Single digit day
      expect(validateBirthday('13-15')).toBe(false) // Invalid month
      expect(validateBirthday('01-32')).toBe(false) // Invalid day
      expect(validateBirthday('2023-01-15')).toBe(false) // Full date format
      expect(validateBirthday('01/15')).toBe(false) // Wrong separator
      expect(validateBirthday('invalid')).toBe(false) // Not a date
      expect(validateBirthday('')).toBe(false) // Empty string
    })
  })

  describe('validateEmail', () => {
    it('should validate correct email formats', () => {
      expect(validateEmail('test@example.com')).toBe(true)
      expect(validateEmail('user.name+tag@domain.co.uk')).toBe(true)
      expect(validateEmail('user123@domain123.com')).toBe(true)
    })

    it('should reject invalid email formats', () => {
      expect(validateEmail('invalid-email')).toBe(false)
      expect(validateEmail('@domain.com')).toBe(false)
      expect(validateEmail('user@')).toBe(false)
      expect(validateEmail('user@domain')).toBe(false)
      expect(validateEmail('')).toBe(false)
      expect(validateEmail('user name@domain.com')).toBe(false) // Space in local part
    })
  })

  describe('validatePhone', () => {
    it('should validate correct phone number formats', () => {
      expect(validatePhone('1234567890')).toBe(true)
      expect(validatePhone('11234567890')).toBe(true) // With country code
      expect(validatePhone('(123) 456-7890')).toBe(true)
      expect(validatePhone('123-456-7890')).toBe(true)
      expect(validatePhone('123.456.7890')).toBe(true)
      expect(validatePhone('+1 (123) 456-7890')).toBe(true)
    })

    it('should reject invalid phone number formats', () => {
      expect(validatePhone('123456789')).toBe(false) // Too short
      expect(validatePhone('123456789012')).toBe(false) // Too long
      expect(validatePhone('abcdefghij')).toBe(false) // Letters
      expect(validatePhone('')).toBe(false) // Empty
      expect(validatePhone('123')).toBe(false) // Way too short
    })
  })

  describe('validateContactName', () => {
    it('should validate correct names', () => {
      expect(validateContactName('John')).toEqual({ isValid: true })
      expect(validateContactName('John', 'Doe')).toEqual({ isValid: true })
      expect(validateContactName('Mary-Jane')).toEqual({ isValid: true })
      expect(validateContactName('José')).toEqual({ isValid: true })
    })

    it('should reject invalid first names', () => {
      expect(validateContactName('')).toEqual({
        isValid: false,
        error: 'First name is required'
      })
      expect(validateContactName('  ')).toEqual({
        isValid: false,
        error: 'First name is required'
      })
      expect(validateContactName('J')).toEqual({
        isValid: false,
        error: 'First name must be at least 2 characters'
      })
    })

    it('should reject invalid last names when provided', () => {
      expect(validateContactName('John', 'D')).toEqual({
        isValid: false,
        error: 'Last name must be at least 2 characters'
      })
      expect(validateContactName('John', '  ')).toEqual({
        isValid: false,
        error: 'Last name must be at least 2 characters'
      })
    })

    it('should allow empty last name', () => {
      expect(validateContactName('John', '')).toEqual({ isValid: true })
      expect(validateContactName('John', undefined)).toEqual({ isValid: true })
    })
  })

  describe('validateCommunicationFrequency', () => {
    it('should validate correct frequencies', () => {
      expect(validateCommunicationFrequency('weekly')).toBe(true)
      expect(validateCommunicationFrequency('monthly')).toBe(true)
      expect(validateCommunicationFrequency('quarterly')).toBe(true)
      expect(validateCommunicationFrequency('biannually')).toBe(true)
      expect(validateCommunicationFrequency('annually')).toBe(true)
    })

    it('should reject invalid frequencies', () => {
      expect(validateCommunicationFrequency('daily')).toBe(false)
      expect(validateCommunicationFrequency('yearly')).toBe(false)
      expect(validateCommunicationFrequency('never')).toBe(false)
      expect(validateCommunicationFrequency('')).toBe(false)
      expect(validateCommunicationFrequency('Weekly')).toBe(false) // Case sensitive
    })
  })

  describe('validateInteractionType', () => {
    it('should validate correct interaction types', () => {
      expect(validateInteractionType('call')).toBe(true)
      expect(validateInteractionType('text')).toBe(true)
      expect(validateInteractionType('email')).toBe(true)
      expect(validateInteractionType('meetup')).toBe(true)
      expect(validateInteractionType('other')).toBe(true)
    })

    it('should reject invalid interaction types', () => {
      expect(validateInteractionType('phone')).toBe(false)
      expect(validateInteractionType('sms')).toBe(false)
      expect(validateInteractionType('meeting')).toBe(false)
      expect(validateInteractionType('')).toBe(false)
      expect(validateInteractionType('Call')).toBe(false) // Case sensitive
    })
  })

  describe('validateContactInfoType', () => {
    it('should validate correct contact info types', () => {
      expect(validateContactInfoType('phone')).toBe(true)
      expect(validateContactInfoType('email')).toBe(true)
      expect(validateContactInfoType('address')).toBe(true)
    })

    it('should reject invalid contact info types', () => {
      expect(validateContactInfoType('mobile')).toBe(false)
      expect(validateContactInfoType('mail')).toBe(false)
      expect(validateContactInfoType('')).toBe(false)
      expect(validateContactInfoType('Phone')).toBe(false) // Case sensitive
    })
  })

  describe('validateContactInfoLabel', () => {
    it('should validate correct contact info labels', () => {
      expect(validateContactInfoLabel('home')).toBe(true)
      expect(validateContactInfoLabel('work')).toBe(true)
      expect(validateContactInfoLabel('mobile')).toBe(true)
      expect(validateContactInfoLabel('other')).toBe(true)
    })

    it('should reject invalid contact info labels', () => {
      expect(validateContactInfoLabel('personal')).toBe(false)
      expect(validateContactInfoLabel('business')).toBe(false)
      expect(validateContactInfoLabel('')).toBe(false)
      expect(validateContactInfoLabel('Home')).toBe(false) // Case sensitive
    })
  })
})