export const metadata = {
  title: 'Life Coach MVP',
  description: 'Vercel deployment test for Life Coach app',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
