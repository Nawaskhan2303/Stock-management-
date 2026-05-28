/*
  # Seed Demo Data for Testing

  This migration creates a demo branch and sets up sample data for testing.
  The first user who signs up will be automatically assigned as an admin.
*/

-- Create a demo branch
INSERT INTO branches (name, address, phone, is_active)
VALUES (
  'Main Restaurant',
  '123 Main Street, Downtown',
  '555-0100',
  true
) ON CONFLICT DO NOTHING;

-- Create additional demo branches
INSERT INTO branches (name, address, phone, is_active)
VALUES 
  ('Downtown Branch', '456 Oak Avenue, Downtown', '555-0200', true),
  ('Westside Branch', '789 Elm Road, Westside', '555-0300', true)
ON CONFLICT DO NOTHING;

-- Function to auto-assign first user as admin
CREATE OR REPLACE FUNCTION auto_assign_first_user_as_admin()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  branch_id uuid;
  user_count integer;
BEGIN
  -- Check if this is the first user
  SELECT COUNT(*) INTO user_count FROM profiles;
  
  IF user_count = 0 THEN
    -- Make first user an admin
    NEW.role := 'admin';
    
    -- Assign to all active branches as manager
    FOR branch_id IN SELECT id FROM branches WHERE is_active = true
    LOOP
      INSERT INTO branch_users (user_id, branch_id, role)
      VALUES (NEW.id, branch_id, 'manager');
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger to auto-assign admin role to first user
DROP TRIGGER IF EXISTS auto_assign_admin_trigger ON profiles;
CREATE TRIGGER auto_assign_admin_trigger
  BEFORE INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION auto_assign_first_user_as_admin();

-- Add sample stock items for the main branch (will be accessible once user is assigned)
DO $$
DECLARE
  main_branch_id uuid;
  veg_cat_id uuid;
  meat_cat_id uuid;
  dairy_cat_id uuid;
  dry_cat_id uuid;
BEGIN
  SELECT id INTO main_branch_id FROM branches WHERE name = 'Main Restaurant' LIMIT 1;
  SELECT id INTO veg_cat_id FROM categories WHERE name = 'Vegetables' LIMIT 1;
  SELECT id INTO meat_cat_id FROM categories WHERE name = 'Meat & Poultry' LIMIT 1;
  SELECT id INTO dairy_cat_id FROM categories WHERE name = 'Dairy' LIMIT 1;
  SELECT id INTO dry_cat_id FROM categories WHERE name = 'Dry Goods' LIMIT 1;
  
  IF main_branch_id IS NOT NULL THEN
    -- Sample vegetables
    INSERT INTO stock_items (branch_id, category_id, name, description, unit, current_quantity, minimum_quantity, unit_cost)
    VALUES
      (main_branch_id, veg_cat_id, 'Tomatoes', 'Fresh red tomatoes', 'kg', 25.5, 10, 3.50),
      (main_branch_id, veg_cat_id, 'Onions', 'Yellow onions', 'kg', 30, 15, 2.00),
      (main_branch_id, veg_cat_id, 'Lettuce', 'Fresh lettuce heads', 'pieces', 40, 20, 1.50),
      (main_branch_id, veg_cat_id, 'Bell Peppers', 'Mixed colors', 'kg', 8, 5, 4.00)
    ON CONFLICT DO NOTHING;
    
    -- Sample meat
    INSERT INTO stock_items (branch_id, category_id, name, description, unit, current_quantity, minimum_quantity, unit_cost)
    VALUES
      (main_branch_id, meat_cat_id, 'Chicken Breast', 'Boneless chicken breast', 'kg', 15, 8, 8.00),
      (main_branch_id, meat_cat_id, 'Ground Beef', 'Fresh ground beef', 'kg', 12, 6, 9.50),
      (main_branch_id, meat_cat_id, 'Bacon', 'Smoked bacon strips', 'kg', 5, 3, 12.00)
    ON CONFLICT DO NOTHING;
    
    -- Sample dairy
    INSERT INTO stock_items (branch_id, category_id, name, description, unit, current_quantity, minimum_quantity, unit_cost)
    VALUES
      (main_branch_id, dairy_cat_id, 'Milk', 'Whole milk', 'liters', 20, 10, 1.20),
      (main_branch_id, dairy_cat_id, 'Cheddar Cheese', 'Aged cheddar block', 'kg', 4, 2, 15.00),
      (main_branch_id, dairy_cat_id, 'Butter', 'Unsalted butter', 'kg', 3, 2, 8.00)
    ON CONFLICT DO NOTHING;
    
    -- Sample dry goods
    INSERT INTO stock_items (branch_id, category_id, name, description, unit, current_quantity, minimum_quantity, unit_cost)
    VALUES
      (main_branch_id, dry_cat_id, 'All-Purpose Flour', 'Premium flour', 'kg', 50, 20, 1.00),
      (main_branch_id, dry_cat_id, 'Rice', 'Long grain rice', 'kg', 40, 15, 2.50),
      (main_branch_id, dry_cat_id, 'Olive Oil', 'Extra virgin olive oil', 'liters', 10, 4, 12.00),
      (main_branch_id, dry_cat_id, 'Pasta', 'Spaghetti', 'kg', 25, 10, 3.00)
    ON CONFLICT DO NOTHING;
  END IF;
END $$;
