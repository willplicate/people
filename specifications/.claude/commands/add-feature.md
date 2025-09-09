## 4. .claude/commands/add-feature.md

```markdown
Please add a new feature to the Personal CRM following this process:

1. **Analyze Requirements**: Review @docs/requirements.md to understand how this feature fits
2. **Database Impact**: Check if @docs/database-schema.md needs updates
3. **Create Components**: Build React components with TypeScript
4. **Backend Integration**: Add necessary API endpoints
5. **Mobile Optimization**: Ensure feature works well on mobile devices
6. **Testing**: Create basic test cases for the new functionality
7. **Documentation**: Update relevant docs with the new feature

## Guidelines:
- Maintain mobile-first design principles
- Use existing TypeScript types where possible
- Follow the established file structure
- Consider accessibility in UI components
- Test on mobile viewport (375px width minimum)

Feature to implement: $ARGUMENTS
