// category mapping between main categories and subcategories

export const CATEGORY_MAP = {
  'School Supplies': ['Notebooks', 'Pens & Pencils', 'Paper', 'Binders', 'Other Supplies'],
  'Electronics': ['Laptops', 'Phones', 'Accessories', 'Chargers', 'Other Electronics'],
  'Books': ['Textbooks', 'Novels', 'Study Guides', 'Reference', 'Other Books'],
  'Clothing': ['Shirts', 'Pants', 'Shoes', 'Other Clothing'],
  'Food & Beverages': ['Snacks', 'Drinks', 'Meal Prep', 'Other Food'],
  'Sports Equipment': ['Gym Equipment', 'Sports Gear', 'Outdoor', 'Other Sports'],
  'Others': ['Others']
};


export const isMainCategory = (categoryName) => {
  return Object.keys(CATEGORY_MAP).includes(categoryName);
};

export const getSubcategoriesForMainCategory = (mainCategory) => {
  return CATEGORY_MAP[mainCategory] || [];
};

export const getMainCategoryForSubcategory = (subcategory) => {
  for (const [mainCat, subs] of Object.entries(CATEGORY_MAP)) {
    if (subs.includes(subcategory)) {
      return mainCat;
    }
  }
  return null;
};

export const getAllValidSubcategories = () => {
  return Object.values(CATEGORY_MAP).flat();
};

export const getAllMainCategories = () => {
  return Object.keys(CATEGORY_MAP);
};

export const isValidSubcategory = (category) => {
  return getAllValidSubcategories().includes(category);
};

export const getCategoryFilterQuery = (categoryParam) => {
  if (!categoryParam) {
    return null;
  }

  // check if it's a main category
  if (isMainCategory(categoryParam)) {

    const subcategories = getSubcategoriesForMainCategory(categoryParam);
    return { $in: subcategories };
  }

  // valid subcat validation
  if (isValidSubcategory(categoryParam)) {

    // if valid, return it
    return categoryParam;
  }

  // else, return null
  return null;
};

export default {
  CATEGORY_MAP,
  isMainCategory,
  getSubcategoriesForMainCategory,
  getMainCategoryForSubcategory,
  getAllValidSubcategories,
  getAllMainCategories,
  isValidSubcategory,
  getCategoryFilterQuery,
};