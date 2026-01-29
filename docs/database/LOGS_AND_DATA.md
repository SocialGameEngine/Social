# Logs and Data Files

## Overview

This section contains various data files, logs, and utilities used for development, debugging, and data management in the Social Game Engine platform.

## Files

### 1. supabase-logs-dtudipmqfrknkrsahlst.csv.csv
**Purpose**: Supabase function logs for debugging and monitoring
**Size**: 25KB
**Usage**: Analyzing edge function performance and errors

**Contains**:
- Edge function execution logs
- Performance metrics
- Error messages and stack traces
- Request/response data

**Usage**:
```bash
# Analyze error patterns
grep "ERROR" supabase-logs-dtudipmqfrknkrsahlst.csv.csv

# Check performance
grep "duration" supabase-logs-dtudipmqfrknkrsahlst.csv.csv
```

### 2. figmar.html
**Purpose**: HTML file for UI design and prototyping
**Size**: 12KB
**Usage**: Frontend design reference and component testing

**Contains**:
- UI component prototypes
- Design system elements
- Layout templates
- Interactive demos

### 3. Scripts Directory
**Purpose**: Development and maintenance scripts
**Location**: `scripts/`

#### Available Scripts
- Database migration utilities
- Data validation tools
- Deployment helpers
- Testing automation

## Data Management

### Prompt Data
**Related Files**:
- `COMPLETE_PROMPT_SEED.sql` - Database seed script
- `prompt_data.json` - Source JSON data
- `generate_prompt_sql.py` - Data conversion script

**Usage**: See [PROMPT_DATA_MANAGEMENT.md](./PROMPT_DATA_MANAGEMENT.md)

### Music Metadata
**Related Files**:
- `tracks-metadata.json` - Track information
- `vibes-hierarchical.json` - Vibe classifications

**Usage**: See [MUSIC_METADATA.md](../vibox/MUSIC_METADATA.md)

### Database Scripts
**Related Files**:
- `disable_venue_accounts_rls.sql` - RLS debugging
- `fix_venue_accounts_rls.sql` - RLS fixes
- `test_venue_accounts_rls.sql` - RLS testing

**Usage**: See [RLS_DEBUG_SCRIPTS.md](./RLS_DEBUG_SCRIPTS.md)

## Debugging and Monitoring

### Log Analysis
```bash
# Filter for specific function logs
grep "function-name" supabase-logs-*.csv

# Check error rates
grep "ERROR" supabase-logs-*.csv | wc -l

# Monitor performance
grep "duration" supabase-logs-*.csv | awk '{print $NF}' | sort -n
```

### Data Validation
```python
# Validate prompt data structure
python scripts/validate_prompt_data.py

# Check music metadata consistency
python scripts/validate_music_metadata.py
```

### Performance Monitoring
```javascript
// Frontend performance monitoring
console.time('function-name');
// ... code to measure
console.timeEnd('function-name');
```

## File Organization

### Current Structure
```
a:/Social/
├── COMPLETE_PROMPT_SEED.sql     # Database seed data
├── disable_venue_accounts_rls.sql  # RLS debugging
├── fix_venue_accounts_rls.sql      # RLS fixes
├── figmar.html                  # UI prototypes
├── generate_prompt_sql.py       # Data conversion
├── PAUSE_RESUME_DEBUG_GUIDE.md  # Debugging guide
├── prompt_data.json             # Prompt source data
├── supabase-logs-*.csv         # Function logs
├── test_venue_accounts_rls.sql  # RLS testing
├── tracks-metadata.json         # Music metadata
├── vibes-hierarchical.json      # Vibe classifications
└── scripts/                     # Utility scripts
```

### Recommended Organization
```
Social/docs/
├── database/
│   ├── PROMPT_DATA_MANAGEMENT.md
│   ├── RLS_DEBUG_SCRIPTS.md
│   ├── LOGS_AND_DATA.md
│   └── logs/
│       └── supabase-logs-*.csv
├── vibox/
│   └── MUSIC_METADATA.md
├── implementation/
│   └── PAUSE_RESUME_DEBUG_GUIDE.md
└── data/
    ├── prompt_data.json
    ├── tracks-metadata.json
    ├── vibes-hierarchical.json
    └── COMPLETE_PROMPT_SEED.sql
```

## Maintenance Procedures

### Regular Cleanup
- **Log Rotation**: Remove logs older than 30 days
- **Data Validation**: Weekly checks of data integrity
- **File Organization**: Monthly review of file locations

### Backup Strategies
- **Database Backups**: Daily automated backups
- **Configuration Files**: Version control all config files
- **Data Files**: Regular backups of JSON data files

### Security Considerations
- **Log Sanitization**: Remove sensitive data from logs
- **Access Control**: Limit access to production logs
- **Data Encryption**: Encrypt sensitive data files

## Development Workflow

### Adding New Data Files
1. **Create appropriate documentation** for the data
2. **Add validation scripts** for data integrity
3. **Update this index** with new file information
4. **Consider file organization** and proper placement

### Debugging with Logs
1. **Identify the time range** of the issue
2. **Filter relevant logs** using grep or similar tools
3. **Analyze error patterns** and performance metrics
4. **Document findings** for future reference

### Data Updates
1. **Validate data structure** before updates
2. **Create backup** of existing data
3. **Test changes** in development environment
4. **Deploy updates** with proper monitoring

---

*Last updated: January 2026*
