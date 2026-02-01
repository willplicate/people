'use client'

import { useState, useEffect } from 'react'
import { Contact, CreateContactInput, UpdateContactInput, ContactInfo, CreateContactInfoInput } from '@/types/database'
import { ContactService } from '@/services/ContactService'
import { ContactInfoService } from '@/services/ContactInfoService'

interface ContactFormProps {
  contact?: Contact
  onSave: (contact: Contact) => void
  onCancel: () => void
  isLoading?: boolean
}

export default function ContactForm({ contact, onSave, onCancel, isLoading: externalLoading = false }: ContactFormProps) {
  const [internalLoading, setInternalLoading] = useState(false)
  const isLoading = externalLoading || internalLoading
  const [formData, setFormData] = useState<CreateContactInput>({
    first_name: '',
    last_name: '',
    nickname: '',
    birthday: '',
    communication_frequency: 'monthly',
    last_contacted_at: '',
    reminders_paused: false,
    is_emergency: false,
    christmas_list: false,
    notes: ''
  })
  const [contactInfo, setContactInfo] = useState({
    phone: '',
    email: '',
    address: ''
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (contact) {
      setFormData({
        first_name: contact.first_name,
        last_name: contact.last_name || '',
        nickname: contact.nickname || '',
        birthday: contact.birthday || '',
        communication_frequency: contact.communication_frequency || 'monthly',
        last_contacted_at: contact.last_contacted_at || '',
        reminders_paused: contact.reminders_paused,
        is_emergency: contact.is_emergency,
        christmas_list: contact.christmas_list,
        notes: contact.notes || ''
      })

      // Load existing contact info
      loadContactInfo(contact.id)
    }
  }, [contact])

  const loadContactInfo = async (contactId: string) => {
    try {
      const contactInfoData = await ContactInfoService.getByContactId(contactId)

      // Find primary contact info for each type
      const primaryPhone = contactInfoData.find(ci => ci.type === 'phone' && ci.is_primary)
      const primaryEmail = contactInfoData.find(ci => ci.type === 'email' && ci.is_primary)
      const primaryAddress = contactInfoData.find(ci => ci.type === 'address' && ci.is_primary)

      // If no primary, use the first one of each type
      const phone = primaryPhone || contactInfoData.find(ci => ci.type === 'phone')
      const email = primaryEmail || contactInfoData.find(ci => ci.type === 'email')
      const address = primaryAddress || contactInfoData.find(ci => ci.type === 'address')

      setContactInfo({
        phone: phone?.value || '',
        email: email?.value || '',
        address: address?.value || ''
      })
    } catch (error) {
      console.error('Error loading contact info:', error)
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.first_name.trim()) {
      newErrors.first_name = 'First name is required'
    }

    if (formData.birthday && !isValidBirthday(formData.birthday)) {
      newErrors.birthday = 'Birthday must be in MM-DD format'
    }

    if (formData.last_contacted_at && !isValidDate(formData.last_contacted_at)) {
      newErrors.last_contacted_at = 'Invalid date format'
    }

    // Validate contact info
    if (contactInfo.email && !isValidEmail(contactInfo.email)) {
      newErrors.email = 'Invalid email format'
    }

    if (contactInfo.phone && !isValidPhone(contactInfo.phone)) {
      newErrors.phone = 'Invalid phone number format'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const isValidBirthday = (birthday: string) => {
    const regex = /^(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/
    return regex.test(birthday)
  }

  const isValidDate = (dateString: string) => {
    const date = new Date(dateString)
    return date instanceof Date && !isNaN(date.getTime())
  }

  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const isValidPhone = (phone: string) => {
    // Accept various phone formats: +1234567890, (123) 456-7890, 123-456-7890, etc.
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$|^[\(\d\)\-\s\+\.]{7,}$/
    return phoneRegex.test(phone.replace(/[\s\(\)\-\.]/g, ''))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    try {
      setInternalLoading(true)
      setErrors({}) // Clear any previous errors

      let savedContact: Contact

      if (contact) {
        // Update existing contact
        console.log('Updating contact with data:', formData)
        savedContact = await ContactService.update(contact.id, formData as UpdateContactInput)
      } else {
        // Create new contact
        console.log('Creating contact with data:', formData)
        savedContact = await ContactService.create(formData)
      }

      // Save contact info
      console.log('Saving contact info:', contactInfo)
      await saveContactInfo(savedContact.id)

      console.log('Contact saved successfully:', savedContact)
      onSave(savedContact)
    } catch (error) {
      console.error('Error saving contact:', error)
      setErrors({ submit: error instanceof Error ? error.message : 'Failed to save contact' })
    } finally {
      setInternalLoading(false)
    }
  }

  const saveContactInfo = async (contactId: string) => {
    const contactInfoPromises = []

    // Save phone if provided
    if (contactInfo.phone.trim()) {
      contactInfoPromises.push(
        saveContactInfoItem(contactId, 'phone', contactInfo.phone, 'mobile')
      )
    }

    // Save email if provided
    if (contactInfo.email.trim()) {
      contactInfoPromises.push(
        saveContactInfoItem(contactId, 'email', contactInfo.email, 'home')
      )
    }

    // Save address if provided
    if (contactInfo.address.trim()) {
      contactInfoPromises.push(
        saveContactInfoItem(contactId, 'address', contactInfo.address, 'home')
      )
    }

    if (contactInfoPromises.length > 0) {
      await Promise.all(contactInfoPromises)
    }
  }

  const saveContactInfoItem = async (
    contactId: string,
    type: 'phone' | 'email' | 'address',
    value: string,
    label: 'home' | 'work' | 'mobile' | 'other'
  ) => {
    // First, try to update existing contact info of this type, or create new if not exists
    const existingContactInfo = await ContactInfoService.getByContactId(contactId)
    const existingItem = existingContactInfo.find(ci => ci.type === type)

    if (existingItem) {
      // Update existing contact info
      return await ContactInfoService.update(existingItem.id, {
        value,
        label,
        is_primary: true
      })
    } else {
      // Create new contact info
      return await ContactInfoService.create({
        contact_id: contactId,
        type,
        value,
        label,
        is_primary: true
      })
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }))

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handleContactInfoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setContactInfo(prev => ({
      ...prev,
      [name]: value
    }))

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="first_name" className="block text-sm font-medium text-gray-700">
            First Name *
          </label>
          <input
            type="text"
            id="first_name"
            name="first_name"
            value={formData.first_name}
            onChange={handleInputChange}
            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
              errors.first_name ? 'border-red-300' : ''
            }`}
            disabled={isLoading}
          />
          {errors.first_name && (
            <p className="mt-1 text-sm text-red-600">{errors.first_name}</p>
          )}
        </div>

        <div>
          <label htmlFor="last_name" className="block text-sm font-medium text-gray-700">
            Last Name
          </label>
          <input
            type="text"
            id="last_name"
            name="last_name"
            value={formData.last_name}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            disabled={isLoading}
          />
        </div>

        <div>
          <label htmlFor="nickname" className="block text-sm font-medium text-gray-700">
            Nickname
          </label>
          <input
            type="text"
            id="nickname"
            name="nickname"
            value={formData.nickname}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            disabled={isLoading}
          />
        </div>

        <div>
          <label htmlFor="birthday" className="block text-sm font-medium text-gray-700">
            Birthday (MM-DD)
          </label>
          <input
            type="text"
            id="birthday"
            name="birthday"
            value={formData.birthday}
            onChange={handleInputChange}
            placeholder="MM-DD"
            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
              errors.birthday ? 'border-red-300' : ''
            }`}
            disabled={isLoading}
          />
          {errors.birthday && (
            <p className="mt-1 text-sm text-red-600">{errors.birthday}</p>
          )}
        </div>

        <div>
          <label htmlFor="communication_frequency" className="block text-sm font-medium text-gray-700">
            Communication Frequency
          </label>
          <select
            id="communication_frequency"
            name="communication_frequency"
            value={formData.communication_frequency}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            disabled={isLoading}
          >
            <option value="">No frequency set</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
            <option value="biannually">Biannually</option>
            <option value="annually">Annually</option>
          </select>
        </div>

        <div>
          <label htmlFor="last_contacted_at" className="block text-sm font-medium text-gray-700">
            Last Contacted
          </label>
          <input
            type="date"
            id="last_contacted_at"
            name="last_contacted_at"
            value={formData.last_contacted_at ? formData.last_contacted_at.split('T')[0] : ''}
            onChange={handleInputChange}
            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
              errors.last_contacted_at ? 'border-red-300' : ''
            }`}
            disabled={isLoading}
          />
          {errors.last_contacted_at && (
            <p className="mt-1 text-sm text-red-600">{errors.last_contacted_at}</p>
          )}
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
            Phone Number
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={contactInfo.phone}
            onChange={handleContactInfoChange}
            placeholder="(555) 123-4567"
            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
              errors.phone ? 'border-red-300' : ''
            }`}
            disabled={isLoading}
          />
          {errors.phone && (
            <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
          )}
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email Address
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={contactInfo.email}
            onChange={handleContactInfoChange}
            placeholder="example@email.com"
            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
              errors.email ? 'border-red-300' : ''
            }`}
            disabled={isLoading}
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email}</p>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="address" className="block text-sm font-medium text-gray-700">
          Address
        </label>
        <textarea
          id="address"
          name="address"
          rows={3}
          value={contactInfo.address}
          onChange={handleContactInfoChange}
          placeholder="123 Main St, City, State 12345"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          disabled={isLoading}
        />
      </div>

      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
          Notes
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          value={formData.notes}
          onChange={handleInputChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          disabled={isLoading}
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center">
          <input
            type="checkbox"
            id="reminders_paused"
            name="reminders_paused"
            checked={formData.reminders_paused}
            onChange={handleInputChange}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            disabled={isLoading}
          />
          <label htmlFor="reminders_paused" className="ml-2 block text-sm text-gray-900">
            Pause reminders for this contact
          </label>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="is_emergency"
            name="is_emergency"
            checked={formData.is_emergency}
            onChange={handleInputChange}
            className="h-4 w-4 text-destructive focus:ring-destructive border-gray-300 rounded"
            disabled={isLoading}
          />
          <label htmlFor="is_emergency" className="ml-2 block text-sm font-medium text-destructive">
            🚨 Mark as Emergency Contact
          </label>
          <span className="ml-2 text-xs text-gray-500">
            (Appears in Emergency Contacts tab for quick access)
          </span>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="christmas_list"
            name="christmas_list"
            checked={formData.christmas_list}
            onChange={handleInputChange}
            className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
            disabled={isLoading}
          />
          <label htmlFor="christmas_list" className="ml-2 block text-sm font-medium text-green-700">
            🎄 Include in Christmas List
          </label>
          <span className="ml-2 text-xs text-gray-500">
            (Will be included in Christmas card/letter recipients)
          </span>
        </div>
      </div>

      {errors.submit && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-card p-3 text-destructive text-sm">
          <strong>Error:</strong> {errors.submit}
        </div>
      )}

      {Object.keys(errors).length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-card p-3 text-yellow-800 text-sm">
          Please fix the following errors before saving:
          <ul className="mt-1 list-disc list-inside">
            {Object.entries(errors).filter(([key]) => key !== 'submit').map(([field, error]) => (
              <li key={field}>{field.replace('_', ' ')}: {error}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3 pt-4 border-t border-border">
        <button
          type="button"
          onClick={onCancel}
          className="w-full sm:w-auto px-6 py-3 text-sm font-medium text-muted-foreground bg-background border border-border rounded-card hover:bg-muted focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
          disabled={isLoading}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="w-full sm:w-auto px-6 py-3 text-sm font-medium text-primary-foreground bg-primary border border-transparent rounded-card hover:bg-primary/80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 transition-colors"
          disabled={isLoading}
        >
          {isLoading ? 'Saving...' : contact ? 'Update Contact' : 'Create Contact'}
        </button>
      </div>
    </form>
  )
}