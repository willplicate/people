/**
 * Main Learning Page - Redirects to intro
 *
 * When user visits /learning, redirect them to /learning/intro
 */

import { redirect } from 'next/navigation'

export default async function LearningPage() {
  redirect('/learning/intro')
}
