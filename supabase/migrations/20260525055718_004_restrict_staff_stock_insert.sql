/*
  # Restrict Stock Item Creation to Managers and Admins

  1. Changes
    - Replace the "Managers and staff can insert stock items" policy
    - New policy restricts INSERT on stock_items to managers and admins only
    - Staff can still read and update stock items (for stock adjustments)
    - Only managers can delete stock items (unchanged)

  2. Security
    - Staff: SELECT, UPDATE on stock_items (view and adjust stock)
    - Managers: SELECT, INSERT, UPDATE, DELETE on stock_items
    - Admins: Full access via is_admin() function
*/

-- Drop the old permissive insert policy
DROP POLICY IF EXISTS "Managers and staff can insert stock items" ON stock_items;

-- New policy: only managers and admins can create stock items
CREATE POLICY "Managers and admins can insert stock items"
  ON stock_items FOR INSERT
  TO authenticated
  WITH CHECK (
    branch_id IN (SELECT get_user_branches())
    AND (
      (SELECT is_admin())
      OR EXISTS (
        SELECT 1 FROM branch_users
        WHERE user_id = auth.uid()
        AND branch_id = stock_items.branch_id
        AND role = 'manager'
      )
    )
  );
