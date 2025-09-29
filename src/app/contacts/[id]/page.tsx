import { Contact } from '@/types/database'
import { ContactService } from '@/services/ContactService'
import ContactDetailClient from '@/components/ContactDetailClient'

// Generate static params for all contacts
export async function generateStaticParams() {
  try {
    const contacts = await ContactService.getAll()
    return contacts.map((contact) => ({
      id: contact.id,
    }))
  } catch (error) {
    console.error('Error generating static params:', error)
    return []
  }
}

interface Props {
  params: { id: string }
}

export default async function ContactDetailPage({ params }: Props) {
  const contactId = params.id

  try {
    const contact = await ContactService.getById(contactId)

    if (!contact) {
      return (
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-card p-6 rounded-card shadow-card">
            <div className="text-center py-8">
              <div className="text-destructive mb-4">Contact not found</div>
              <a
                href="/contacts"
                className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/80"
              >
                Go Back
              </a>
            </div>
          </div>
        </div>
      )
    }

    return <ContactDetailClient contact={contact} />
  } catch (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-card p-6 rounded-card shadow-card">
          <div className="text-center py-8">
            <div className="text-destructive mb-4">
              Failed to load contact
            </div>
            <a
              href="/contacts"
              className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/80"
            >
              Go Back
            </a>
          </div>
        </div>
      </div>
    )
  }
}