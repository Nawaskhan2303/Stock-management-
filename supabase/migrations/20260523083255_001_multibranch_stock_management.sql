/*
  # Multi-Branch Restaurant Stock Management System

  1. New Tables
    - `branches` - Restaurant branch locations
    - `profiles` - User profiles extending auth.users
    - `branch_users` - Junction table for user-branch membership
    - `categories` - Stock item categories
    - `stock_items` - Inventory items
    - `stock_transactions` - Stock change history

  2. Security
    - Enable RLS on all tables
    - Admins can access all branches
    - Managers/staff can access their assigned branches only
*/

-- Branches table
CREATE TABLE IF NOT EXISTS branches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address text NOT NULL DEFAULT '',
  phone text DEFAULT '',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text DEFAULT '',
  role text NOT NULL DEFAULT 'staff' CHECK (role IN ('admin', 'manager', 'staff')),
  created_at timestamptz DEFAULT now()
);

-- Branch users junction table
CREATE TABLE IF NOT EXISTS branch_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  branch_id uuid NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'staff' CHECK (role IN ('manager', 'staff')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, branch_id)
);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Stock items table
CREATE TABLE IF NOT EXISTS stock_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id uuid NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  name text NOT NULL,
  description text DEFAULT '',
  unit text NOT NULL DEFAULT 'pieces',
  current_quantity decimal(12,3) NOT NULL DEFAULT 0,
  minimum_quantity decimal(12,3) NOT NULL DEFAULT 0,
  unit_cost decimal(12,2) DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Stock transactions table
CREATE TABLE IF NOT EXISTS stock_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stock_item_id uuid NOT NULL REFERENCES stock_items(id) ON DELETE CASCADE,
  branch_id uuid NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  transaction_type text NOT NULL CHECK (transaction_type IN ('purchase', 'usage', 'adjustment', 'transfer')),
  quantity_change decimal(12,3) NOT NULL,
  previous_quantity decimal(12,3) NOT NULL,
  new_quantity decimal(12,3) NOT NULL,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE branch_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_transactions ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- Helper function to get user's branches
CREATE OR REPLACE FUNCTION get_user_branches()
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT branch_id FROM branch_users WHERE user_id = auth.uid()
  UNION
  SELECT id FROM branches WHERE (SELECT is_admin());
$$;

-- Branches policies
CREATE POLICY "Admins can manage all branches"
  ON branches FOR ALL
  TO authenticated
  USING ((SELECT is_admin()))
  WITH CHECK ((SELECT is_admin()));

CREATE POLICY "Users can view their branches"
  ON branches FOR SELECT
  TO authenticated
  USING (id IN (SELECT get_user_branches()));

-- Profiles policies
CREATE POLICY "Users can read all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Branch users policies
CREATE POLICY "Admins can manage branch users"
  ON branch_users FOR ALL
  TO authenticated
  USING ((SELECT is_admin()))
  WITH CHECK ((SELECT is_admin()));

CREATE POLICY "Users can view branch memberships"
  ON branch_users FOR SELECT
  TO authenticated
  USING (
    branch_id IN (SELECT get_user_branches())
    OR user_id = auth.uid()
  );

-- Categories policies
CREATE POLICY "All authenticated users can read categories"
  ON categories FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins and managers can manage categories"
  ON categories FOR ALL
  TO authenticated
  USING ((SELECT is_admin()) OR EXISTS (
    SELECT 1 FROM branch_users WHERE user_id = auth.uid() AND role = 'manager'
  ))
  WITH CHECK ((SELECT is_admin()) OR EXISTS (
    SELECT 1 FROM branch_users WHERE user_id = auth.uid() AND role = 'manager'
  ));

-- Stock items policies
CREATE POLICY "Users can read stock items in their branches"
  ON stock_items FOR SELECT
  TO authenticated
  USING (branch_id IN (SELECT get_user_branches()));

CREATE POLICY "Managers and staff can insert stock items"
  ON stock_items FOR INSERT
  TO authenticated
  WITH CHECK (
    branch_id IN (SELECT get_user_branches())
    AND EXISTS (SELECT 1 FROM branch_users WHERE user_id = auth.uid() AND branch_id = stock_items.branch_id)
  );

CREATE POLICY "Managers and staff can update stock items"
  ON stock_items FOR UPDATE
  TO authenticated
  USING (
    branch_id IN (SELECT get_user_branches())
    AND EXISTS (SELECT 1 FROM branch_users WHERE user_id = auth.uid() AND branch_id = stock_items.branch_id)
  )
  WITH CHECK (
    branch_id IN (SELECT get_user_branches())
    AND EXISTS (SELECT 1 FROM branch_users WHERE user_id = auth.uid() AND branch_id = stock_items.branch_id)
  );

CREATE POLICY "Managers can delete stock items"
  ON stock_items FOR DELETE
  TO authenticated
  USING (
    branch_id IN (SELECT get_user_branches())
    AND EXISTS (SELECT 1 FROM branch_users WHERE user_id = auth.uid() AND branch_id = stock_items.branch_id AND role = 'manager')
  );

-- Stock transactions policies
CREATE POLICY "Users can read transactions in their branches"
  ON stock_transactions FOR SELECT
  TO authenticated
  USING (branch_id IN (SELECT get_user_branches()));

CREATE POLICY "Users can insert transactions in their branches"
  ON stock_transactions FOR INSERT
  TO authenticated
  WITH CHECK (
    branch_id IN (SELECT get_user_branches())
    AND user_id = auth.uid()
    AND EXISTS (SELECT 1 FROM branch_users WHERE user_id = auth.uid() AND branch_id = stock_transactions.branch_id)
  );

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_stock_items_branch_id ON stock_items(branch_id);
CREATE INDEX IF NOT EXISTS idx_stock_items_category_id ON stock_items(category_id);
CREATE INDEX IF NOT EXISTS idx_stock_transactions_stock_item_id ON stock_transactions(stock_item_id);
CREATE INDEX IF NOT EXISTS idx_stock_transactions_branch_id ON stock_transactions(branch_id);
CREATE INDEX IF NOT EXISTS idx_stock_transactions_created_at ON stock_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_branch_users_user_id ON branch_users(user_id);
CREATE INDEX IF NOT EXISTS idx_branch_users_branch_id ON branch_users(branch_id);

-- Trigger to update updated_at timestamp on stock_items
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_stock_items_updated_at
  BEFORE UPDATE ON stock_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default categories
INSERT INTO categories (name, description) VALUES
  ('Vegetables', 'Fresh vegetables and produce'),
  ('Meat & Poultry', 'Fresh and frozen meat products'),
  ('Dairy', 'Milk, cheese, and dairy products'),
  ('Dry Goods', 'Flour, rice, pasta, and other dry ingredients'),
  ('Beverages', 'Drinks and beverages'),
  ('Spices & Condiments', 'Spices, sauces, and seasoning'),
  ('Cleaning Supplies', 'Cleaning and maintenance supplies'),
  ('Packaging', 'Packaging materials and containers')
ON CONFLICT DO NOTHING;
