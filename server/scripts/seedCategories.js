import Category from '../models/Category.js';

const defaults = [
  { name: 'Tithes', slug: 'tithes', type: 'expense', defaultAllocation: 0, order: 1, isSystem: true },
  { name: 'Bills', slug: 'bills', type: 'expense', defaultAllocation: 0, order: 2, isSystem: true },
  { name: 'Expenses', slug: 'expenses', type: 'expense', defaultAllocation: 0, order: 3, isSystem: true },
  { name: 'Debt', slug: 'debt', type: 'expense', defaultAllocation: 0, order: 4, isSystem: true },
  { name: 'Savings', slug: 'savings', type: 'expense', defaultAllocation: 0, order: 5, isSystem: true },
  { name: 'Emergency Fund', slug: 'emergency-fund', type: 'expense', defaultAllocation: 0, order: 6, isSystem: true },
  { name: 'Salary', slug: 'salary', type: 'income', defaultAllocation: 0, order: 1, isSystem: true },
  { name: 'Other Income', slug: 'other-income', type: 'income', defaultAllocation: 0, order: 2, isSystem: true },
];

export async function seedCategories() {
  for (const d of defaults) {
    try {
      const existing = await Category.findOne({ slug: d.slug });
      if (existing) continue;
      await Category.create(d);
    } catch (err) {
      if (err.code === 11000) {
        console.warn('Category seed: duplicate key for slug', d.slug, '- skipping (collection may have a different schema/index).');
        continue;
      }
      throw err;
    }
  }
  console.log('Default categories seeded');
}