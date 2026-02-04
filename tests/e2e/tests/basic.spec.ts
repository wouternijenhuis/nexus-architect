import { test, expect } from '@playwright/test'

test.describe('Nexus Architect E2E Tests', () => {
  test('should display home page', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('h1')).toContainText('Nexus Architect')
  })

  test('should create a new project', async ({ page }) => {
    await page.goto('/')
    
    // Click new project button
    await page.getByRole('button', { name: /New Project/i }).click()
    
    // Fill in project details
    await page.getByPlaceholder(/My XSD Project/i).fill('Test Project')
    await page.getByPlaceholder(/Describe your project/i).fill('A test project')
    
    // Create project
    await page.getByRole('button', { name: /Create$/i }).click()
    
    // Verify project appears
    await expect(page.locator('text=Test Project')).toBeVisible()
  })

  test('should create a schema within a project', async ({ page }) => {
    await page.goto('/')
    
    // Create project first
    await page.getByRole('button', { name: /New Project/i }).click()
    await page.getByPlaceholder(/My XSD Project/i).fill('Schema Test Project')
    await page.getByRole('button', { name: /Create$/i }).click()
    
    // Open project
    await page.getByRole('button', { name: /Open/i }).click()
    
    // Create schema
    await page.getByRole('button', { name: /New Schema/i }).click()
    await page.getByPlaceholder(/my-schema/i).fill('test-schema')
    await page.getByRole('button', { name: /Create$/i }).click()
    
    // Verify schema appears
    await expect(page.locator('text=test-schema')).toBeVisible()
  })

  test('should add elements to schema', async ({ page }) => {
    await page.goto('/')
    
    // Create project and schema
    await page.getByRole('button', { name: /New Project/i }).click()
    await page.getByPlaceholder(/My XSD Project/i).fill('Element Test Project')
    await page.getByRole('button', { name: /Create$/i }).click()
    await page.getByRole('button', { name: /Open/i }).click()
    
    await page.getByRole('button', { name: /New Schema/i }).click()
    await page.getByPlaceholder(/my-schema/i).fill('element-schema')
    await page.getByRole('button', { name: /Create$/i }).click()
    
    // Open schema editor
    await page.getByRole('button', { name: /Edit Schema/i }).click()
    
    // Add element
    await page.getByRole('button', { name: /Add Element/i }).click()
    
    // Verify element appears
    await expect(page.locator('text=newElement')).toBeVisible()
  })

  test('should export XSD schema', async ({ page }) => {
    await page.goto('/')
    
    // Create minimal project/schema
    await page.getByRole('button', { name: /New Project/i }).click()
    await page.getByPlaceholder(/My XSD Project/i).fill('Export Test')
    await page.getByRole('button', { name: /Create$/i }).click()
    await page.getByRole('button', { name: /Open/i }).click()
    
    await page.getByRole('button', { name: /New Schema/i }).click()
    await page.getByPlaceholder(/my-schema/i).fill('export-schema')
    await page.getByRole('button', { name: /Create$/i }).click()
    await page.getByRole('button', { name: /Edit Schema/i }).click()
    
    // Setup download handler
    const downloadPromise = page.waitForEvent('download')
    
    // Click export button
    await page.getByRole('button', { name: /Export XSD/i }).click()
    
    const download = await downloadPromise
    expect(download.suggestedFilename()).toContain('.xsd')
  })
})
