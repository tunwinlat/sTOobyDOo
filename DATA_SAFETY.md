# sTOobyDOo - Data Safety During Deployments

## Quick Answer

**Your data is safe during redeploys.** The app uses a smart initialization script that:

1. ✅ **Checks if database exists** before making changes
2. ✅ **Skips schema updates** if tables already exist
3. ✅ **Never deletes existing data** during normal updates

## How It Works

### First Deploy
```
Build starts
    ↓
Check: Does "Family" table exist?
    ↓ NO
Run "prisma db push" to create tables
    ↓
Complete setup wizard
    ↓
Add tasks, lists, etc.
```

### Redeploy (Update)
```
Build starts
    ↓
Check: Does "Family" table exist?
    ↓ YES ✅
Skip database changes
    ↓
Build continues
    ↓
All your data is preserved!
```

## What `prisma db push` Actually Does

| Operation | Effect on Data |
|-----------|----------------|
| Add new table | ✅ Safe - creates empty table |
| Add new column | ✅ Safe - adds empty column |
| Modify column type | ⚠️ Safe in most cases |
| Drop column/table | ⚠️ Only with `--accept-data-loss` |

### The `--accept-data-loss` Flag

This flag only affects **destructive operations** like:
- Removing a column
- Deleting a table
- Changing column types that lose data

**In normal operations:**
- Adding tables/columns = ✅ No data loss
- Your existing tasks, lists, users remain intact

## When Is Data at Risk?

Data loss **only** occurs if you:

1. **Manually delete the database** in Turso dashboard
2. **Reset the database** using `turso db destroy`
3. **Change schema** to remove columns (we don't do this in updates)
4. **Use wrong database URL** (connects to empty database)

## Best Practices

### Before Major Updates

If you're worried about a big update:

```bash
# Export your data (optional safety)
turso db shell stoobydoo ".dump" > backup.sql

# Or use Turso's built-in backups
# Turso automatically backs up every 24 hours
```

### Verify Your Database

Visit `/api/health` on your deployed app:

```json
{
  "status": "healthy",
  "database": "connected",
  "setup": {
    "complete": true,
    "familyName": "My Family"
  }
}
```

### Check in Turso Dashboard

```bash
# List your data
turso db shell stoobydoo

# Then run SQL:
SELECT COUNT(*) FROM Family;
SELECT COUNT(*) FROM FamilyMember;
SELECT COUNT(*) FROM List;
SELECT COUNT(*) FROM Task;
```

## Recovery Options

### If Something Goes Wrong

1. **Turso Automatic Backups**
   - Turso keeps 7 days of backups
   - Contact Turso support to restore

2. **Manual Export/Import**
   ```bash
   # Export
   turso db shell stoobydoo ".dump" > backup.sql
   
   # Import to new database
   turso db create stoobydoo-new
   turso db shell stoobydoo-new < backup.sql
   ```

3. **Redeploy with Fresh DB**
   - Create new Turso database
   - Update Vercel env vars
   - Redeploy
   - Complete setup wizard again

## FAQ

### Q: Will updating the app code delete my tasks?
**A:** No. Code updates don't affect database data.

### Q: What if I change the schema in prisma/schema.prisma?
**A:** `db push` will add new tables/columns but won't delete existing ones unless you use `--accept-data-loss`.

### Q: Can I use `prisma migrate` instead?
**A:** Yes, but it requires more setup. `db push` is simpler for this use case.

### Q: What happens if the build fails?
**A:** Vercel won't deploy the failed build, so your running app stays unchanged.

### Q: Should I backup before every deploy?
**A:** Not necessary for normal updates. Turso's automatic backups are sufficient. Only backup before major schema changes.

## Configuration

The safety mechanism is in `scripts/ensure-db.js`:

```javascript
// Check if Family table exists
await client.execute('SELECT 1 FROM Family LIMIT 1');
// If YES → Skip db push
// If NO  → Run db push (first deploy only)
```

This ensures `prisma db push` only runs on **fresh databases**.

## Summary

| Action | Data Loss Risk |
|--------|----------------|
| Normal code update | ✅ None |
| Schema additions | ✅ None |
| Redeploy same version | ✅ None |
| Delete Turso database | ⚠️ Yes (complete loss) |
| Manual SQL "DROP TABLE" | ⚠️ Yes (be careful!) |
| Wrong DATABASE_URL | ⚠️ Connects to wrong DB |

**Your data is safe during normal operations!** 🛡️
