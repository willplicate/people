const fs = require('fs')
const path = require('path')

// Files that need fixing
const files = [
  'src/app/api/contacts/[id]/contact-info/route.ts',
  'src/app/api/contacts/[id]/interactions/route.ts',
  'src/app/api/contact-info/[id]/route.ts',
  'src/app/api/interactions/[id]/route.ts',
  'src/app/api/reminders/[id]/dismiss/route.ts'
]

files.forEach(filePath => {
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8')

    // Fix params type declaration
    content = content.replace(
      /{ params }: { params: { id: string } }/g,
      '{ params }: { params: Promise<{ id: string }> }'
    )

    // Fix params.id usage - add await
    content = content.replace(
      /params\.id/g,
      '(await params).id'
    )

    // Better fix - extract id first
    content = content.replace(
      /\) \{\s*try \{\s*(.*?)(await params)\.id/gs,
      ') {\n  try {\n    const { id } = await params\n    $1id'
    )

    fs.writeFileSync(filePath, content)
    console.log(`Fixed: ${filePath}`)
  } else {
    console.log(`Not found: ${filePath}`)
  }
})

console.log('All files processed!')